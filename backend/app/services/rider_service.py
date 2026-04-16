"""
Rider Service - Gestión de repartidores y aprobaciones
"""
from typing import List, Optional
from datetime import datetime
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.models.rider import Rider, RiderStatus, RiderDocument
from app.models.user import User
from app.schemas.rider import RiderCreate, RiderUpdate, RiderApprovalRequest
import logging

logger = logging.getLogger(__name__)


class RiderService:
    
    def __init__(self, db: AsyncSession):
        self.db = db
    
    async def create_rider(self, rider_data: RiderCreate, user_id: int) -> Rider:
        try:
            # Crear documento de repartidor
            rider = Rider(
                user_id=user_id,
                document_number=rider_data.document_number,
                document_type=rider_data.document_type,
                vehicle_type=rider_data.vehicle_type,
                vehicle_plate=rider_data.vehicle_plate,
                status=RiderStatus.PENDING_APPROVAL,
                approval_status="pending",
                rating=0.0,
                total_deliveries=0,
                completed_deliveries=0,
                failed_deliveries=0
            )
            
            self.db.add(rider)
            await self.db.flush()
            await self.db.refresh(rider)
            
            logger.info(f"Repartidor creado: {rider.id} para usuario {user_id}")
            return rider
            
        except Exception as e:
            logger.error(f"Error creando repartidor: {e}")
            raise
    
    async def get_rider_by_user_id(self, user_id: int) -> Optional[Rider]:
        result = await self.db.execute(
            select(Rider).where(Rider.user_id == user_id)
        )
        return result.scalar_one_or_none()
    
    async def get_rider_by_id(self, rider_id: int) -> Optional[Rider]:
        result = await self.db.execute(
            select(Rider).where(Rider.id == rider_id)
        )
        return result.scalar_one_or_none()
    
    async def update_rider(self, rider_id: int, rider_data: RiderUpdate) -> Rider:
        rider = await self.get_rider_by_id(rider_id)
        if not rider:
            raise ValueError(f"Repartidor {rider_id} no encontrado")
        
        update_data = rider_data.model_dump(exclude_unset=True)
        for field, value in update_data.items():
            setattr(rider, field, value)
        
        rider.updated_at = datetime.utcnow()
        await self.db.commit()
        await self.db.refresh(rider)
        return rider
    
    async def approve_rider(self, rider_id: int, approval_data: RiderApprovalRequest, approver_id: int) -> Rider:
        rider = await self.get_rider_by_id(rider_id)
        if not rider:
            raise ValueError(f"Repartidor {rider_id} no encontrado")
        
        if rider.approval_status != "pending":
            raise ValueError(f"Repartidor {rider_id} ya fue procesado")
        
        # Actualizar estado
        rider.approval_status = "approved" if approval_data.approved else "rejected"
        rider.approved_by = approver_id
        rider.approval_date = datetime.utcnow()
        rider.rejection_reason = approval_data.rejection_reason
        
        if approval_data.approved:
            rider.status = RiderStatus.ACTIVE
            # Activar usuario asociado
            user_result = await self.db.execute(select(User).where(User.id == rider.user_id))
            user = user_result.scalar_one_or_none()
            if user:
                user.is_active = True
        else:
            rider.status = RiderStatus.INACTIVE
            # Desactivar usuario asociado
            user_result = await self.db.execute(select(User).where(User.id == rider.user_id))
            user = user_result.scalar_one_or_none()
            if user:
                user.is_active = False
        
        rider.updated_at = datetime.utcnow()
        await self.db.commit()
        await self.db.refresh(rider)
        
        logger.info(f"Repartidor {rider_id} {'aprobado' if approval_data.approved else 'rechazado'} por usuario {approver_id}")
        return rider
    
    async def upload_document(self, rider_id: int, document_type: str, document_url: str, description: Optional[str] = None) -> RiderDocument:
        rider = await self.get_rider_by_id(rider_id)
        if not rider:
            raise ValueError(f"Repartidor {rider_id} no encontrado")
        
        document = RiderDocument(
            rider_id=rider_id,
            document_type=document_type,
            document_url=document_url,
            description=description,
            status="pending_review"
        )
        
        self.db.add(document)
        await self.db.commit()
        await self.db.refresh(document)
        
        logger.info(f"Documento subido para repartidor {rider_id}: {document_type}")
        return document
    
    async def get_pending_approvals(self) -> List[Rider]:
        result = await self.db.execute(
            select(Rider).where(Rider.approval_status == "pending")
        )
        return result.scalars().all()
    
    async def get_active_riders(self) -> List[Rider]:
        result = await self.db.execute(
            select(Rider).where(Rider.status == RiderStatus.ACTIVE)
        )
        return result.scalars().all()
    
    async def update_status(self, rider_id: int, status: RiderStatus) -> Rider:
        rider = await self.get_rider_by_id(rider_id)
        if not rider:
            raise ValueError(f"Repartidor {rider_id} no encontrado")
        
        rider.status = status
        rider.updated_at = datetime.utcnow()
        
        if status == RiderStatus.INACTIVE:
            # Desactivar usuario asociado
            user_result = await self.db.execute(select(User).where(User.id == rider.user_id))
            user = user_result.scalar_one_or_none()
            if user:
                user.is_active = False
        
        await self.db.commit()
        await self.db.refresh(rider)
        return rider
    
    async def get_riders_by_status(self, status: RiderStatus) -> List[Rider]:
        result = await self.db.execute(
            select(Rider).where(Rider.status == status)
        )
        return result.scalars().all()
    
    async def increment_delivery_count(self, rider_id: int, success: bool = True) -> None:
        rider = await self.get_rider_by_id(rider_id)
        if not rider:
            return
        
        rider.total_deliveries += 1
        if success:
            rider.completed_deliveries += 1
        else:
            rider.failed_deliveries += 1
        
        rider.updated_at = datetime.utcnow()
        await self.db.commit()
    
    async def update_rating(self, rider_id: int, new_rating: float) -> Rider:
        rider = await self.get_rider_by_id(rider_id)
        if not rider:
            raise ValueError(f"Repartidor {rider_id} no encontrado")
        
        # Calcular nuevo promedio
        total_ratings = rider.completed_deliveries
        if total_ratings > 0:
            current_total = rider.rating * (total_ratings - 1)
            rider.rating = (current_total + new_rating) / total_ratings
        
        rider.updated_at = datetime.utcnow()
        await self.db.commit()
        await self.db.refresh(rider)
        return rider
