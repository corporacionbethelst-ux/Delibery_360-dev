"""Servicio para dashboards y reportes del sistema Delivery360."""

from typing import List, Dict, Any, Optional
from datetime import datetime, timedelta
from decimal import Decimal
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, and_, distinct
from app.models.order import Order, OrderStatus
from app.models.delivery import Delivery, DeliveryStatus
from app.models.rider import Rider
from app.models.shift import Shift, ShiftStatus
from app.models.financial import FinancialTransaction, TransactionType
from app.models.productivity import ProductivityMetrics, SLARecord
import logging

logger = logging.getLogger(__name__)


class DashboardService:
    """Servicio para obtención de datos de dashboards"""
    
    def __init__(self, db: AsyncSession):
        self.db = db
    
    async def get_manager_dashboard(self, start_date: datetime, end_date: datetime) -> Dict[str, Any]:
        """Obtener datos para dashboard de gerente"""
        # Total de pedidos
        result = await self.db.execute(
            select(func.count(Order.id))
            .where(
                and_(
                    Order.created_at >= start_date,
                    Order.created_at <= end_date
                )
            )
        )
        total_orders = result.scalar() or 0
        
        # Pedidos entregados
        result = await self.db.execute(
            select(func.count(Order.id))
            .where(
                and_(
                    Order.status == OrderStatus.DELIVERED,
                    Order.updated_at >= start_date,
                    Order.updated_at <= end_date
                )
            )
        )
        delivered_orders = result.scalar() or 0
        
        # Tiempo promedio de entrega (en minutos)
        result = await self.db.execute(
            select(func.avg(Delivery.duration_minutes))
            .join(Order, Delivery.order_id == Order.id)
            .where(
                and_(
                    Delivery.status == DeliveryStatus.DELIVERED,
                    Delivery.completed_at >= start_date,
                    Delivery.completed_at <= end_date
                )
            )
        )
        avg_delivery_time = float(result.scalar() or 0)
        
        # % Entregas a tiempo (SLA)
        result = await self.db.execute(
            select(func.count(SLARecord.id))
            .where(
                and_(
                    SLARecord.sla_met == True,
                    SLARecord.created_at >= start_date,
                    SLARecord.created_at <= end_date
                )
            )
        )
        sla_met_count = result.scalar() or 0
        
        result = await self.db.execute(
            select(func.count(SLARecord.id))
            .where(
                and_(
                    SLARecord.created_at >= start_date,
                    SLARecord.created_at <= end_date
                )
            )
        )
        total_sla_records = result.scalar() or 1
        
        sla_percentage = (sla_met_count / total_sla_records * 100) if total_sla_records > 0 else 0
        
        # Costo promedio por pedido
        result = await self.db.execute(
            select(func.sum(FinancialTransaction.amount))
            .where(
                and_(
                    FinancialTransaction.transaction_type == TransactionType.PAYMENT,
                    FinancialTransaction.created_at >= start_date,
                    FinancialTransaction.created_at <= end_date
                )
            )
        )
        total_costs = result.scalar() or Decimal('0')
        
        avg_cost_per_order = total_costs / total_orders if total_orders > 0 else Decimal('0')
        
        # Repartidores activos
        result = await self.db.execute(
            select(func.count(distinct(Rider.id)))
            .where(Rider.is_active == True)
        )
        active_riders = result.scalar() or 0
        
        return {
            "total_orders": total_orders,
            "delivered_orders": delivered_orders,
            "delivery_rate": round(delivered_orders / total_orders * 100, 2) if total_orders > 0 else 0,
            "avg_delivery_time_minutes": round(avg_delivery_time, 2),
            "sla_percentage": round(sla_percentage, 2),
            "avg_cost_per_order": float(avg_cost_per_order),
            "active_riders": active_riders,
            "period_start": start_date,
            "period_end": end_date
        }
    
    async def get_operator_dashboard(self, shift_id: Optional[int] = None) -> Dict[str, Any]:
        """Obtener datos para dashboard de operador"""
        # Pedidos pendientes
        result = await self.db.execute(
            select(func.count(Order.id))
            .where(Order.status == OrderStatus.PENDING)
        )
        pending_orders = result.scalar() or 0
        
        # Pedidos en curso
        result = await self.db.execute(
            select(func.count(Order.id))
            .where(Order.status == OrderStatus.IN_PROGRESS)
        )
        in_progress_orders = result.scalar() or 0
        
        # Repartidores disponibles
        result = await self.db.execute(
            select(func.count(Rider.id))
            .where(
                and_(
                    Rider.is_active == True,
                    Rider.available == True
                )
            )
        )
        available_riders = result.scalar() or 0
        
        # Turnos activos
        query = select(func.count(Shift.id)).where(Shift.status == ShiftStatus.ACTIVE)
        if shift_id:
            query = query.where(Shift.id == shift_id)
        
        result = await self.db.execute(query)
        active_shifts = result.scalar() or 0
        
        # Alertas activas (entregas con riesgo de SLA)
        result = await self.db.execute(
            select(func.count(Delivery.id))
            .where(
                and_(
                    Delivery.status == DeliveryStatus.IN_PROGRESS,
                    Delivery.sla_deadline != None,
                    Delivery.sla_deadline < datetime.utcnow() + timedelta(minutes=15)
                )
            )
        )
        at_risk_deliveries = result.scalar() or 0
        
        return {
            "pending_orders": pending_orders,
            "in_progress_orders": in_progress_orders,
            "available_riders": available_riders,
            "active_shifts": active_shifts,
            "at_risk_deliveries": at_risk_deliveries,
            "timestamp": datetime.utcnow()
        }
    
    async def get_rider_dashboard(self, rider_id: int, date: Optional[datetime] = None) -> Dict[str, Any]:
        """Obtener datos para dashboard de repartidor"""
        if not date:
            date = datetime.utcnow().date()
        
        start_of_day = datetime.combine(date, datetime.min.time())
        end_of_day = datetime.combine(date, datetime.max.time())
        
        # Entregas completadas hoy
        result = await self.db.execute(
            select(func.count(Delivery.id))
            .where(
                and_(
                    Delivery.rider_id == rider_id,
                    Delivery.status == DeliveryStatus.DELIVERED,
                    Delivery.completed_at >= start_of_day,
                    Delivery.completed_at <= end_of_day
                )
            )
        )
        completed_deliveries = result.scalar() or 0
        
        # Ganancias del día
        result = await self.db.execute(
            select(func.sum(FinancialTransaction.amount))
            .where(
                and_(
                    FinancialTransaction.rider_id == rider_id,
                    FinancialTransaction.created_at >= start_of_day,
                    FinancialTransaction.created_at <= end_of_day
                )
            )
        )
        daily_earnings = float(result.scalar() or Decimal('0'))
        
        # Tiempo trabajado hoy
        result = await self.db.execute(
            select(func.sum(Shift.total_hours))
            .where(
                and_(
                    Shift.rider_id == rider_id,
                    Shift.start_time >= start_of_day,
                    Shift.end_time <= end_of_day,
                    Shift.status == ShiftStatus.COMPLETED
                )
            )
        )
        total_hours = float(result.scalar() or 0)
        
        # SLA personal
        result = await self.db.execute(
            select(func.count(SLARecord.id))
            .where(
                and_(
                    SLARecord.rider_id == rider_id,
                    SLARecord.sla_met == True,
                    SLARecord.created_at >= start_of_day,
                    SLARecord.created_at <= end_of_day
                )
            )
        )
        sla_met = result.scalar() or 0
        
        result = await self.db.execute(
            select(func.count(SLARecord.id))
            .where(
                and_(
                    SLARecord.rider_id == rider_id,
                    SLARecord.created_at >= start_of_day,
                    SLARecord.created_at <= end_of_day
                )
            )
        )
        total_sla = result.scalar() or 1
        
        personal_sla = (sla_met / total_sla * 100) if total_sla > 0 else 0
        
        return {
            "completed_deliveries": completed_deliveries,
            "daily_earnings": round(daily_earnings, 2),
            "total_hours_worked": round(total_hours, 2),
            "personal_sla_percentage": round(personal_sla, 2),
            "date": date,
            "timestamp": datetime.utcnow()
        }
    
    async def get_productivity_comparison(
        self,
        start_date: datetime,
        end_date: datetime,
        group_by: str = "day"
    ) -> List[Dict[str, Any]]:
        """Obtener comparación de productividad por período"""
        # Implementación básica agrupando por día
        result = await self.db.execute(
            select(
                func.date(ProductivityMetrics.created_at).label('date'),
                func.avg(ProductivityMetrics.deliveries_per_hour).label('avg_deliveries_per_hour'),
                func.avg(ProductivityMetrics.sla_compliance_rate).label('avg_sla_compliance'),
                func.sum(ProductivityMetrics.total_deliveries).label('total_deliveries')
            )
            .where(
                and_(
                    ProductivityMetrics.created_at >= start_date,
                    ProductivityMetrics.created_at <= end_date
                )
            )
            .group_by(func.date(ProductivityMetrics.created_at))
            .order_by(func.date(ProductivityMetrics.created_at))
        )
        
        rows = result.all()
        return [
            {
                "date": row[0],
                "avg_deliveries_per_hour": float(row[1]) if row[1] else 0,
                "avg_sla_compliance": float(row[2]) if row[2] else 0,
                "total_deliveries": row[3] or 0
            }
            for row in rows
        ]
