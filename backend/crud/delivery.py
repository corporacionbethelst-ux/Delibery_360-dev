"""
CRUD Operations for Delivery
"""
from typing import Optional, List
from datetime import datetime
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.models.delivery import Delivery, DeliveryStatus


class CRUDDelivery:
    async def get(self, db: AsyncSession, delivery_id: int) -> Optional[Delivery]:
        result = await db.execute(select(Delivery).where(Delivery.id == delivery_id))
        return result.scalar_one_or_none()

    async def get_by_order_id(self, db: AsyncSession, order_id: int) -> Optional[Delivery]:
        result = await db.execute(select(Delivery).where(Delivery.order_id == order_id))
        return result.scalar_one_or_none()

    async def get_multi(
        self,
        db: AsyncSession,
        skip: int = 0,
        limit: int = 100,
        rider_id: Optional[int] = None,
        status: Optional[DeliveryStatus] = None
    ) -> List[Delivery]:
        query = select(Delivery)
        filters = []
        
        if rider_id:
            filters.append(Delivery.rider_id == rider_id)
        if status:
            filters.append(Delivery.status == status)
        
        if filters:
            from sqlalchemy import and_
            query = query.where(and_(*filters))
        
        query = query.order_by(Delivery.created_at.desc())
        query = query.offset(skip).limit(limit)
        result = await db.execute(query)
        return result.scalars().all()

    async def create(self, db: AsyncSession, order_id: int, rider_id: int,
                     pickup_address: str, delivery_address: str,
                     estimated_distance: float, estimated_duration: int) -> Delivery:
        db_obj = Delivery(
            order_id=order_id,
            rider_id=rider_id,
            pickup_address=pickup_address,
            delivery_address=delivery_address,
            estimated_distance=estimated_distance,
            estimated_duration=estimated_duration,
            status=DeliveryStatus.ASSIGNED
        )
        db.add(db_obj)
        await db.commit()
        await db.refresh(db_obj)
        return db_obj

    async def start_delivery(self, db: AsyncSession, delivery: Delivery,
                            current_location: tuple) -> Delivery:
        delivery.status = DeliveryStatus.IN_PROGRESS
        delivery.started_at = datetime.utcnow()
        delivery.start_location_lat = current_location[0]
        delivery.start_location_lng = current_location[1]
        
        db.add(delivery)
        await db.commit()
        await db.refresh(delivery)
        return delivery

    async def complete_delivery(self, db: AsyncSession, delivery: Delivery,
                               proof_photo_url: Optional[str] = None,
                               customer_signature: Optional[str] = None,
                               notes: Optional[str] = None,
                               final_location: Optional[tuple] = None) -> Delivery:
        delivery.status = DeliveryStatus.COMPLETED
        delivery.completed_at = datetime.utcnow()
        delivery.proof_photo_url = proof_photo_url
        delivery.customer_signature = customer_signature
        delivery.delivery_notes = notes
        
        if final_location:
            delivery.end_location_lat = final_location[0]
            delivery.end_location_lng = final_location[1]
        
        db.add(delivery)
        await db.commit()
        await db.refresh(delivery)
        return delivery

    async def fail_delivery(self, db: AsyncSession, delivery: Delivery,
                           failure_reason: str, notes: Optional[str] = None) -> Delivery:
        delivery.status = DeliveryStatus.FAILED
        delivery.failure_reason = failure_reason
        delivery.delivery_notes = notes
        delivery.failed_at = datetime.utcnow()
        
        db.add(delivery)
        await db.commit()
        await db.refresh(delivery)
        return delivery

    async def get_by_rider(self, db: AsyncSession, rider_id: int,
                          skip: int = 0, limit: int = 100) -> List[Delivery]:
        result = await db.execute(
            select(Delivery)
            .where(Delivery.rider_id == rider_id)
            .order_by(Delivery.created_at.desc())
            .offset(skip)
            .limit(limit)
        )
        return result.scalars().all()


delivery = CRUDDelivery()
