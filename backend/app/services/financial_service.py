"""Servicio para operaciones financieras del sistema Delivery360."""

from typing import List, Optional, Dict, Any
from datetime import datetime, date
from decimal import Decimal
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, and_
from app.models.financial import FinancialTransaction, TransactionType, PaymentRule, DailyLiquidation as Liquidation
import logging

logger = logging.getLogger(__name__)


class FinancialService:
    
    def __init__(self, db: AsyncSession):
        self.db = db
    
    async def create_transaction(
        self,
        rider_id: int,
        amount: Decimal,
        transaction_type: TransactionType,
        description: Optional[str] = None,
        order_id: Optional[int] = None,
        reference_id: Optional[str] = None
    ) -> FinancialTransaction:
        transaction = FinancialTransaction(
            rider_id=rider_id,
            amount=amount,
            transaction_type=transaction_type,
            description=description,
            order_id=order_id,
            reference_id=reference_id
        )
        self.db.add(transaction)
        await self.db.commit()
        await self.db.refresh(transaction)
        logger.info(f"Transacción creada: {transaction.id} para rider {rider_id}")
        return transaction
    
    async def calculate_delivery_earnings(
        self,
        payment_rule_id: int,
        distance_km: float,
        is_sla_compliant: bool,
        is_night_shift: bool,
        is_rainy_day: bool
    ) -> Dict[str, Any]:
        result = await self.db.execute(
            select(PaymentRule).where(PaymentRule.id == payment_rule_id)
        )
        rule = result.scalar_one_or_none()
        
        if not rule:
            raise ValueError("Regla de pago no encontrada")
        
        base_amount = float(rule.base_value)
        variables = rule.variables or {}
        deductions = rule.deductions or {}
        
        total = base_amount
        
        if 'distance_bonus' in variables and distance_km > 0:
            per_km = float(variables['distance_bonus'].get('per_km', 0))
            max_km = variables['distance_bonus'].get('max_km', distance_km)
            bonus = per_km * min(distance_km, max_km)
            total += bonus
        
        if is_night_shift and 'night_bonus' in variables:
            total += float(variables['night_bonus'])
        
        if is_rainy_day and 'rainy_bonus' in variables:
            total += float(variables['rainy_bonus'])
        
        if is_sla_compliant and 'sla_bonus' in variables:
            total += float(variables['sla_bonus'])
        
        if not is_sla_compliant and 'late_penalty' in deductions:
            total -= float(deductions['late_penalty'])
        
        final_amount = Decimal(str(max(0, total)))
        
        return {
            "base_amount": Decimal(str(base_amount)),
            "bonuses": Decimal(str(total - base_amount)),
            "deductions": Decimal(str(0)) if total >= base_amount else Decimal(str(base_amount - total)),
            "total": final_amount
        }
    
    async def create_daily_liquidation(self, rider_id: int, liquidation_date: date) -> Optional[Liquidation]:
        existing = await self.db.execute(
            select(Liquidation).where(
                and_(
                    Liquidation.rider_id == rider_id,
                    func.date(Liquidation.period_start) == liquidation_date
                )
            )
        )
        if existing.scalar_one_or_none():
            logger.warning(f"Liquidación ya existe para rider {rider_id} en {liquidation_date}")
            return None
        
        result = await self.db.execute(
            select(
                func.sum(FinancialTransaction.amount).label('total'),
                func.count(FinancialTransaction.id).label('count')
            ).where(
                and_(
                    FinancialTransaction.rider_id == rider_id,
                    func.date(FinancialTransaction.created_at) == liquidation_date,
                    FinancialTransaction.transaction_type.in_([
                        TransactionType.PAYMENT,
                        TransactionType.REWARD
                    ])
                )
            )
        )
        row = result.first()
        total_amount = row.total or Decimal('0')
        transaction_count = row.count or 0
        
        liquidation = Liquidation(
            rider_id=rider_id,
            total_amount=total_amount,
            period_start=datetime.combine(liquidation_date, datetime.min.time()),
            period_end=datetime.combine(liquidation_date, datetime.max.time()),
            status="pending",
            transaction_count=transaction_count
        )
        
        self.db.add(liquidation)
        await self.db.commit()
        await self.db.refresh(liquidation)
        
        logger.info(f"Liquidación creada: {liquidation.id} para rider {rider_id}")
        return liquidation
    
    async def get_rider_earnings(
        self,
        rider_id: int,
        start_date: datetime,
        end_date: datetime
    ) -> Dict[str, Any]:
        result = await self.db.execute(
            select(
                func.sum(FinancialTransaction.amount).label('total_earnings'),
                func.count(FinancialTransaction.id).label('transaction_count'),
                func.avg(FinancialTransaction.amount).label('avg_transaction')
            ).where(
                and_(
                    FinancialTransaction.rider_id == rider_id,
                    FinancialTransaction.created_at >= start_date,
                    FinancialTransaction.created_at <= end_date,
                    FinancialTransaction.transaction_type.in_([
                        TransactionType.PAYMENT,
                        TransactionType.REWARD
                    ])
                )
            )
        )
        row = result.first()
        
        return {
            "total_earnings": row.total_earnings or Decimal('0'),
            "transaction_count": row.transaction_count or 0,
            "avg_transaction": row.avg_transaction or Decimal('0'),
            "period_start": start_date,
            "period_end": end_date
        }
    
    async def consolidate_financial_period(
        self,
        start_date: date,
        end_date: date
    ) -> Dict[str, Any]:
        result = await self.db.execute(
            select(
                func.sum(FinancialTransaction.amount).label('total_amount'),
                func.count(FinancialTransaction.id).label('total_transactions'),
                func.count(func.distinct(FinancialTransaction.rider_id)).label('active_riders')
            ).where(
                and_(
                    func.date(FinancialTransaction.created_at) >= start_date,
                    func.date(FinancialTransaction.created_at) <= end_date
                )
            )
        )
        row = result.first()
        
        by_type = {}
        for t_type in TransactionType:
            type_result = await self.db.execute(
                select(func.sum(FinancialTransaction.amount)).where(
                    and_(
                        FinancialTransaction.transaction_type == t_type,
                        func.date(FinancialTransaction.created_at) >= start_date,
                        func.date(FinancialTransaction.created_at) <= end_date
                    )
                )
            )
            amount = type_result.scalar() or Decimal('0')
            by_type[t_type.value] = amount
        
        return {
            "total_amount": row.total_amount or Decimal('0'),
            "total_transactions": row.total_transactions or 0,
            "active_riders": row.active_riders or 0,
            "by_transaction_type": by_type,
            "period_start": start_date,
            "period_end": end_date
        }
