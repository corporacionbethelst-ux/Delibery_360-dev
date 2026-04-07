"""
CRUD Operations for Productivity
"""
from typing import Optional, List
from datetime import datetime, timedelta
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, and_, avg
from app.models.productivity import ProductivityMetrics, SLARecord


class CRUDProductivity:
    async def get_metrics(self, db: AsyncSession, metrics_id: int) -> Optional[ProductivityMetrics]:
        result = await db.execute(select(ProductivityMetrics).where(ProductivityMetrics.id == metrics_id))
        return result.scalar_one_or_none()

    async def get_metrics_by_rider(
        self, db: AsyncSession, rider_id: int,
        skip: int = 0, limit: int = 100
    ) -> List[ProductivityMetrics]:
        result = await db.execute(
            select(ProductivityMetrics)
            .where(ProductivityMetrics.rider_id == rider_id)
            .order_by(ProductivityMetrics.date.desc())
            .offset(skip)
            .limit(limit)
        )
        return result.scalars().all()

    async def create_metrics(
        self, db: AsyncSession, rider_id: int, date: datetime,
        total_deliveries: int, on_time_deliveries: int,
        average_delivery_time: float, total_hours: float
    ) -> ProductivityMetrics:
        sla_percentage = (on_time_deliveries / total_deliveries * 100) if total_deliveries > 0 else 0
        deliveries_per_hour = total_deliveries / total_hours if total_hours > 0 else 0
        
        db_obj = ProductivityMetrics(
            rider_id=rider_id,
            date=date,
            total_deliveries=total_deliveries,
            on_time_deliveries=on_time_deliveries,
            sla_percentage=sla_percentage,
            average_delivery_time=average_delivery_time,
            deliveries_per_hour=deliveries_per_hour,
            total_hours=total_hours
        )
        db.add(db_obj)
        await db.commit()
        await db.refresh(db_obj)
        return db_obj

    async def get_sla_record(self, db: AsyncSession, record_id: int) -> Optional[SLARecord]:
        result = await db.execute(select(SLARecord).where(SLARecord.id == record_id))
        return result.scalar_one_or_none()

    async def create_sla_record(
        self, db: AsyncSession, delivery_id: int, rider_id: int,
        expected_duration: int, actual_duration: int,
        is_on_time: bool
    ) -> SLARecord:
        db_obj = SLARecord(
            delivery_id=delivery_id,
            rider_id=rider_id,
            expected_duration=expected_duration,
            actual_duration=actual_duration,
            is_on_time=is_on_time
        )
        db.add(db_obj)
        await db.commit()
        await db.refresh(db_obj)
        return db_obj

    async def get_rider_ranking(
        self, db: AsyncSession, start_date: datetime, end_date: datetime,
        limit: int = 10
    ) -> List[dict]:
        query = select(
            ProductivityMetrics.rider_id,
            func.avg(ProductivityMetrics.sla_percentage).label('avg_sla'),
            func.avg(ProductivityMetrics.deliveries_per_hour).label('avg_deliveries_per_hour'),
            func.sum(ProductivityMetrics.total_deliveries).label('total_deliveries')
        ).where(
            and_(
                ProductivityMetrics.date >= start_date.date(),
                ProductivityMetrics.date <= end_date.date()
            )
        ).group_by(ProductivityMetrics.rider_id).order_by(
            func.avg(ProductivityMetrics.sla_percentage).desc()
        ).limit(limit)
        
        result = await db.execute(query)
        return [
            {
                'rider_id': row.rider_id,
                'avg_sla': float(row.avg_sla) if row.avg_sla else 0,
                'avg_deliveries_per_hour': float(row.avg_deliveries_per_hour) if row.avg_deliveries_per_hour else 0,
                'total_deliveries': row.total_deliveries or 0
            }
            for row in result.all()
        ]

    async def get_productivity_summary(
        self, db: AsyncSession, rider_id: Optional[int] = None,
        start_date: Optional[datetime] = None, end_date: Optional[datetime] = None
    ) -> dict:
        filters = []
        if rider_id:
            filters.append(ProductivityMetrics.rider_id == rider_id)
        if start_date:
            filters.append(ProductivityMetrics.date >= start_date.date())
        if end_date:
            filters.append(ProductivityMetrics.date <= end_date.date())
        
        query = select(
            func.sum(ProductivityMetrics.total_deliveries).label('total_deliveries'),
            func.avg(ProductivityMetrics.sla_percentage).label('avg_sla'),
            func.avg(ProductivityMetrics.average_delivery_time).label('avg_delivery_time'),
            func.avg(ProductivityMetrics.deliveries_per_hour).label('avg_deliveries_per_hour')
        )
        
        if filters:
            query = query.where(and_(*filters))
        
        result = await db.execute(query)
        row = result.first()
        
        return {
            'total_deliveries': row.total_deliveries or 0,
            'avg_sla': float(row.avg_sla) if row.avg_sla else 0,
            'avg_delivery_time': float(row.avg_delivery_time) if row.avg_delivery_time else 0,
            'avg_deliveries_per_hour': float(row.avg_deliveries_per_hour) if row.avg_deliveries_per_hour else 0
        } if row else {
            'total_deliveries': 0,
            'avg_sla': 0,
            'avg_delivery_time': 0,
            'avg_deliveries_per_hour': 0
        }


productivity = CRUDProductivity()
