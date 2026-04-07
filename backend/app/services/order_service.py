"""
Servicio de Gestión de Pedidos
"""
from typing import Optional, List
from datetime import datetime
from sqlalchemy.ext.asyncio import AsyncSession
from fastapi import HTTPException, status

from app.models.order import Order, OrderStatus, OrderType
from app.schemas.order import OrderCreate, OrderUpdate
from app.crud.order import order as order_crud


class OrderService:
    """Servicio para gestión de pedidos"""
    
    async def get_order(self, db: AsyncSession, order_id: int) -> Order:
        """Obtiene pedido por ID"""
        order = await order_crud.get(db, order_id)
        if not order:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Pedido no encontrado"
            )
        return order
    
    async def create_order(
        self, 
        db: AsyncSession, 
        order_data: OrderCreate,
        created_by: int
    ) -> Order:
        """Crea un nuevo pedido"""
        order = await order_crud.create(
            db,
            obj_in={
                "customer_name": order_data.customer_name,
                "customer_phone": order_data.customer_phone,
                "pickup_address": order_data.pickup_address,
                "pickup_latitude": order_data.pickup_latitude,
                "pickup_longitude": order_data.pickup_longitude,
                "delivery_address": order_data.delivery_address,
                "delivery_latitude": order_data.delivery_latitude,
                "delivery_longitude": order_data.delivery_longitude,
                "order_type": order_data.order_type,
                "total_amount": order_data.total_amount,
                "items": order_data.items,
                "status": OrderStatus.PENDING,
                "created_by": created_by
            }
        )
        return order
    
    async def update_order(
        self, 
        db: AsyncSession, 
        order_id: int, 
        order_data: OrderUpdate,
        updated_by: int
    ) -> Order:
        """Actualiza pedido existente"""
        order = await self.get_order(db, order_id)
        
        update_data = order_data.model_dump(exclude_unset=True)
        update_data["updated_by"] = updated_by
        
        order = await order_crud.update(db, db_obj=order, obj_in=update_data)
        return order
    
    async def assign_rider_to_order(
        self, 
        db: AsyncSession, 
        order_id: int, 
        rider_id: int,
        assigned_by: int
    ) -> Order:
        """Asigna repartidor a pedido"""
        order = await self.get_order(db, order_id)
        
        if order.status != OrderStatus.PENDING:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"No se puede asignar repartidor. Estado actual: {order.status.value}"
            )
        
        order = await order_crud.update(
            db,
            db_obj=order,
            obj_in={
                "rider_id": rider_id,
                "status": OrderStatus.ASSIGNED,
                "assigned_at": datetime.utcnow(),
                "updated_by": assigned_by
            }
        )
        return order
    
    async def update_status(
        self, 
        db: AsyncSession, 
        order_id: int, 
        new_status: OrderStatus,
        updated_by: int
    ) -> Order:
        """Actualiza estado del pedido"""
        order = await self.get_order(db, order_id)
        
        # Validar transición de estados
        valid_transitions = {
            OrderStatus.PENDING: [OrderStatus.ASSIGNED, OrderStatus.CANCELLED],
            OrderStatus.ASSIGNED: [OrderStatus.PICKING_UP, OrderStatus.CANCELLED],
            OrderStatus.PICKING_UP: [OrderStatus.IN_TRANSIT],
            OrderStatus.IN_TRANSIT: [OrderStatus.DELIVERING, OrderStatus.CANCELLED],
            OrderStatus.DELIVERING: [OrderStatus.DELIVERED, OrderStatus.FAILED],
        }
        
        if order.status not in valid_transitions:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Estado {order.status.value} no permite transiciones"
            )
        
        if new_status not in valid_transitions.get(order.status, []):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Transición inválida de {order.status.value} a {new_status.value}"
            )
        
        order = await order_crud.update(
            db,
            db_obj=order,
            obj_in={
                "status": new_status,
                "updated_by": updated_by
            }
        )
        return order
    
    async def cancel_order(
        self, 
        db: AsyncSession, 
        order_id: int, 
        cancellation_reason: str,
        cancelled_by: int
    ) -> Order:
        """Cancela pedido"""
        order = await self.get_order(db, order_id)
        
        if order.status in [OrderStatus.DELIVERED, OrderStatus.FAILED, OrderStatus.CANCELLED]:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"No se puede cancelar pedido en estado {order.status.value}"
            )
        
        order = await order_crud.update(
            db,
            db_obj=order,
            obj_in={
                "status": OrderStatus.CANCELLED,
                "cancellation_reason": cancellation_reason,
                "cancelled_at": datetime.utcnow(),
                "updated_by": cancelled_by
            }
        )
        return order
    
    async def list_orders(
        self, 
        db: AsyncSession, 
        skip: int = 0, 
        limit: int = 100,
        status_filter: Optional[OrderStatus] = None,
        rider_id: Optional[int] = None,
        date_from: Optional[datetime] = None,
        date_to: Optional[datetime] = None
    ) -> List[Order]:
        """Lista pedidos con filtros"""
        filters = {}
        if status_filter:
            filters["status"] = status_filter
        if rider_id:
            filters["rider_id"] = rider_id
        if date_from:
            filters["created_at_gte"] = date_from
        if date_to:
            filters["created_at_lte"] = date_to
        
        return await order_crud.get_multi(db, skip=skip, limit=limit, **filters)
    
    async def get_orders_by_rider(
        self, 
        db: AsyncSession, 
        rider_id: int,
        status_filter: Optional[OrderStatus] = None
    ) -> List[Order]:
        """Obtiene pedidos de un repartidor"""
        filters = {"rider_id": rider_id}
        if status_filter:
            filters["status"] = status_filter
        
        return await order_crud.get_multi(db, skip=0, limit=1000, **filters)


order_service = OrderService()
