"""
Servicio de Gestión de Entregas
"""
from typing import Optional, List
from datetime import datetime
from sqlalchemy.ext.asyncio import AsyncSession
from fastapi import HTTPException, status

from app.models.delivery import Delivery, DeliveryStatus
from app.models.order import Order, OrderStatus
from app.schemas.delivery import DeliveryCreate, DeliveryUpdate, ProofOfDeliveryCreate
from app.crud.delivery import delivery as delivery_crud
from app.crud.order import order as order_crud


class DeliveryService:
    """Servicio para gestión de entregas"""
    
    async def get_delivery(self, db: AsyncSession, delivery_id: int) -> Delivery:
        """Obtiene entrega por ID"""
        delivery = await delivery_crud.get(db, delivery_id)
        if not delivery:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Entrega no encontrada"
            )
        return delivery
    
    async def create_delivery(
        self, 
        db: AsyncSession, 
        order_id: int,
        created_by: int
    ) -> Delivery:
        """Crea una nueva entrega vinculada a un pedido"""
        order = await order_crud.get(db, order_id)
        if not order:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Pedido no encontrado"
            )
        
        if order.status not in [OrderStatus.ASSIGNED, OrderStatus.PICKING_UP]:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"No se puede crear entrega. Estado del pedido: {order.status.value}"
            )
        
        delivery = await delivery_crud.create(
            db,
            obj_in={
                "order_id": order_id,
                "rider_id": order.rider_id,
                "status": DeliveryStatus.PENDING,
                "created_by": created_by
            }
        )
        return delivery
    
    async def start_delivery(
        self, 
        db: AsyncSession, 
        delivery_id: int,
        rider_id: int,
        started_by: int
    ) -> Delivery:
        """Inicia entrega (marcado de salida)"""
        delivery = await self.get_delivery(db, delivery_id)
        
        if delivery.status != DeliveryStatus.PENDING:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"No se puede iniciar entrega. Estado actual: {delivery.status.value}"
            )
        
        if delivery.rider_id != rider_id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="No tienes permiso para iniciar esta entrega"
            )
        
        delivery = await delivery_crud.update(
            db,
            db_obj=delivery,
            obj_in={
                "status": DeliveryStatus.IN_PROGRESS,
                "started_at": datetime.utcnow(),
                "updated_by": started_by
            }
        )
        return delivery
    
    async def complete_delivery(
        self, 
        db: AsyncSession, 
        delivery_id: int,
        proof_data: ProofOfDeliveryCreate,
        completed_by: int
    ) -> Delivery:
        """Completa entrega con prueba de entrega"""
        delivery = await self.get_delivery(db, delivery_id)
        
        if delivery.status != DeliveryStatus.IN_PROGRESS:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"No se puede completar entrega. Estado actual: {delivery.status.value}"
            )
        
        delivery = await delivery_crud.update(
            db,
            db_obj=delivery,
            obj_in={
                "status": DeliveryStatus.COMPLETED,
                "completed_at": datetime.utcnow(),
                "proof_photo_url": proof_data.photo_url,
                "proof_signature": proof_data.signature,
                "proof_notes": proof_data.notes,
                "delivery_latitude": proof_data.latitude,
                "delivery_longitude": proof_data.longitude,
                "updated_by": completed_by
            }
        )
        
        # Actualizar estado del pedido asociado
        order = await order_crud.get(db, delivery.order_id)
        if order:
            await order_crud.update(
                db,
                db_obj=order,
                obj_in={
                    "status": OrderStatus.DELIVERED,
                    "delivered_at": datetime.utcnow(),
                    "updated_by": completed_by
                }
            )
        
        return delivery
    
    async def fail_delivery(
        self, 
        db: AsyncSession, 
        delivery_id: int,
        failure_reason: str,
        failed_by: int
    ) -> Delivery:
        """Marca entrega como fallida"""
        delivery = await self.get_delivery(db, delivery_id)
        
        if delivery.status != DeliveryStatus.IN_PROGRESS:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"No se puede fallar entrega. Estado actual: {delivery.status.value}"
            )
        
        delivery = await delivery_crud.update(
            db,
            db_obj=delivery,
            obj_in={
                "status": DeliveryStatus.FAILED,
                "failure_reason": failure_reason,
                "failed_at": datetime.utcnow(),
                "updated_by": failed_by
            }
        )
        
        # Actualizar estado del pedido asociado
        order = await order_crud.get(db, delivery.order_id)
        if order:
            await order_crud.update(
                db,
                db_obj=order,
                obj_in={
                    "status": OrderStatus.FAILED,
                    "failure_reason": failure_reason,
                    "updated_by": failed_by
                }
            )
        
        return delivery
    
    async def list_deliveries(
        self, 
        db: AsyncSession, 
        skip: int = 0, 
        limit: int = 100,
        status_filter: Optional[DeliveryStatus] = None,
        rider_id: Optional[int] = None,
        date_from: Optional[datetime] = None,
        date_to: Optional[datetime] = None
    ) -> List[Delivery]:
        """Lista entregas con filtros"""
        filters = {}
        if status_filter:
            filters["status"] = status_filter
        if rider_id:
            filters["rider_id"] = rider_id
        if date_from:
            filters["created_at_gte"] = date_from
        if date_to:
            filters["created_at_lte"] = date_to
        
        return await delivery_crud.get_multi(db, skip=skip, limit=limit, **filters)
    
    async def get_deliveries_by_rider(
        self, 
        db: AsyncSession, 
        rider_id: int,
        status_filter: Optional[DeliveryStatus] = None
    ) -> List[Delivery]:
        """Obtiene entregas de un repartidor"""
        filters = {"rider_id": rider_id}
        if status_filter:
            filters["status"] = status_filter
        
        return await delivery_crud.get_multi(db, skip=0, limit=1000, **filters)
    
    async def get_delivery_history(
        self, 
        db: AsyncSession, 
        rider_id: int,
        limit: int = 50
    ) -> List[Delivery]:
        """Obtiene histórico de entregas completadas de un repartidor"""
        return await delivery_crud.get_multi(
            db, 
            skip=0, 
            limit=limit,
            rider_id=rider_id,
            status=DeliveryStatus.COMPLETED
        )


delivery_service = DeliveryService()
