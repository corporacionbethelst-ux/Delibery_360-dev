"""
CRUD Operations for Financial
"""
from typing import Optional, List
from datetime import datetime, date
from decimal import Decimal
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, and_
from app.models.financial import FinancialTransaction, TransactionType, PaymentRule, DailyLiquidation


class CRUDFinancial:
    async def get_transaction(self, db: AsyncSession, transaction_id: int) -> Optional[FinancialTransaction]:
        result = await db.execute(select(FinancialTransaction).where(FinancialTransaction.id == transaction_id))
        return result.scalar_one_or_none()

    async def get_transactions_by_rider(
        self, db: AsyncSession, rider_id: int,
        skip: int = 0, limit: int = 100
    ) -> List[FinancialTransaction]:
        result = await db.execute(
            select(FinancialTransaction)
            .where(FinancialTransaction.rider_id == rider_id)
            .order_by(FinancialTransaction.created_at.desc())
            .offset(skip)
            .limit(limit)
        )
        return result.scalars().all()

    async def create_transaction(
        self, db: AsyncSession, rider_id: int, amount: Decimal,
        transaction_type: TransactionType, order_id: Optional[int] = None,
        description: Optional[str] = None, reference_id: Optional[str] = None
    ) -> FinancialTransaction:
        db_obj = FinancialTransaction(
            rider_id=rider_id,
            amount=amount,
            transaction_type=transaction_type,
            order_id=order_id,
            description=description,
            reference_id=reference_id
        )
        db.add(db_obj)
        await db.commit()
        await db.refresh(db_obj)
        return db_obj

    async def get_payment_rule(self, db: AsyncSession, rule_id: int) -> Optional[PaymentRule]:
        result = await db.execute(select(PaymentRule).where(PaymentRule.id == rule_id))
        return result.scalar_one_or_none()

    async def get_active_payment_rule(self, db: AsyncSession) -> Optional[PaymentRule]:
        result = await db.execute(
            select(PaymentRule)
            .where(PaymentRule.is_active.is_(True))
        )
        return result.scalar_one_or_none()

    async def create_payment_rule(
        self, db: AsyncSession, name: str, commission_rate: Decimal,
        min_amount: Decimal, description: Optional[str] = None,
        max_amount: Optional[Decimal] = None
    ) -> PaymentRule:
        db_obj = PaymentRule(
            name=name,
            description=description,
            commission_rate=commission_rate,
            min_amount=min_amount,
            max_amount=max_amount,
            is_active=True
        )
        db.add(db_obj)
        await db.commit()
        await db.refresh(db_obj)
        return db_obj

    async def get_liquidation(self, db: AsyncSession, liquidation_id: int) -> Optional[DailyLiquidation]:
        result = await db.execute(select(DailyLiquidation).where(DailyLiquidation.id == liquidation_id))
        return result.scalar_one_or_none()

    async def get_liquidations_by_rider(
        self, db: AsyncSession, rider_id: int,
        skip: int = 0, limit: int = 100
    ) -> List[DailyLiquidation]:
        result = await db.execute(
            select(DailyLiquidation)
            .where(DailyLiquidation.rider_id == rider_id)
            .order_by(DailyLiquidation.period_end.desc())
            .offset(skip)
            .limit(limit)
        )
        return result.scalars().all()

    async def create_liquidation(
        self, db: AsyncSession, rider_id: int, total_amount: Decimal,
        period_start: datetime, period_end: datetime,
        status: str = "pending"
    ) -> DailyLiquidation:
        db_obj = DailyLiquidation(
            rider_id=rider_id,
            total_amount=total_amount,
            period_start=period_start,
            period_end=period_end,
            status=status
        )
        db.add(db_obj)
        await db.commit()
        await db.refresh(db_obj)
        return db_obj

    async def get_consolidated(
        self, db: AsyncSession, rider_id: Optional[int] = None,
        start_date: Optional[date] = None, end_date: Optional[date] = None
    ) -> dict:
        filters = []
        if rider_id:
            filters.append(FinancialTransaction.rider_id == rider_id)
        if start_date:
            filters.append(func.date(FinancialTransaction.created_at) >= start_date)
        if end_date:
            filters.append(func.date(FinancialTransaction.created_at) <= end_date)
        
        query = select(
            func.sum(FinancialTransaction.amount).label('total_amount'),
            func.count(FinancialTransaction.id).label('transaction_count')
        )
        
        if filters:
            query = query.where(and_(*filters))
        
        result = await db.execute(query)
        row = result.first()
        
        return {
            'total_amount': row.total_amount or Decimal('0'),
            'transaction_count': row.transaction_count or 0
        } if row else {'total_amount': Decimal('0'), 'transaction_count': 0}


financial = CRUDFinancial()
