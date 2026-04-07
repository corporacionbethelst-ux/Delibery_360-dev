"""
CRUD Operations for Order
"""
from typing import Optional, List
from datetime import datetime
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, and_
from app.models.order import Order, OrderStatus


class CRUDOrder:
    async def get(self, db: AsyncSession, order_id: int) -> Optional[Order]:
        result = await db.execute(select(Order).where(Order.id == order_id))
        return result.scalar_one_or_none()

    async def get_multi(
        self,
        db: AsyncSession,
        skip: int = 0,
        limit: int = 100,
        status: Optional[OrderStatus] = None,
        customer_id: Optional[int] = None,
        restaurant_id: Optional[int] = None
    ) -> List[Order]:
        filters = []
        if status:
            filters.append(Order.status == status)
        if customer_id:
            filters.append(Order.customer_id == customer_id)
        if restaurant_id:
            filters.append(Order.restaurant_id == restaurant_id)
        
        query = select(Order)
        if filters:
            query = query.where(and_(*filters))
        
        query = query.order_by(Order.created_at.desc())
        query = query.offset(skip).limit(limit)
        result = await db.execute(query)
        return result.scalars().all()

    async def create(self, db: AsyncSession, customer_id: int, restaurant_id: int, 
                     items: dict, total_amount: float, delivery_address: str,
                     notes: Optional[str] = None) -> Order:
        db_obj = Order(
            customer_id=customer_id,
            restaurant_id=restaurant_id,
            items=items,
            total_amount=total_amount,
            delivery_address=delivery_address,
            notes=notes,
            status=OrderStatus.PENDING
        )
        db.add(db_obj)
        await db.commit()
        await db.refresh(db_obj)
        return db_obj

    async def update_status(self, db: AsyncSession, order: Order, new_status: OrderStatus) -> Order:
        order.status = new_status
        if new_status == OrderStatus.CONFIRMED:
            order.confirmed_at = datetime.utcnow()
        elif new_status == OrderStatus.PREPARING:
            order.preparing_at = datetime.utcnow()
        elif new_status == OrderStatus.READY_FOR_PICKUP:
            order.ready_at = datetime.utcnow()
        elif new_status == OrderStatus.IN_DELIVERY:
            order.in_delivery_at = datetime.utcnow()
        elif new_status == OrderStatus.DELIVERED:
            order.delivered_at = datetime.utcnow()
        elif new_status == OrderStatus.CANCELLED:
            order.cancelled_at = datetime.utcnow()
        
        db.add(order)
        await db.commit()
        await db.refresh(order)
        return order

    async def assign_rider(self, db: AsyncSession, order: Order, rider_id: int) -> Order:
        order.rider_id = rider_id
        db.add(order)
        await db.commit()
        await db.refresh(order)
        return order

    async def get_by_rider(self, db: AsyncSession, rider_id: int, 
                           skip: int = 0, limit: int = 100) -> List[Order]:
        result = await db.execute(
            select(Order)
            .where(Order.rider_id == rider_id)
            .order_by(Order.created_at.desc())
            .offset(skip)
            .limit(limit)
        )
        return result.scalars().all()

    async def cancel(self, db: AsyncSession, order: Order, 
                     cancellation_reason: str, cancelled_by: int) -> Order:
        order.status = OrderStatus.CANCELLED
        order.cancellation_reason = cancellation_reason
        order.cancelled_by = cancelled_by
        order.cancelled_at = datetime.utcnow()
        
        db.add(order)
        await db.commit()
        await db.refresh(order)
        return order


order = CRUDOrder()
