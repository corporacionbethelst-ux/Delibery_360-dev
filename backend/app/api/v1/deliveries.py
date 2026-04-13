"""
Delivery360 - API Endpoints para Entregas
"""

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, and_
from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime, timezone
import uuid

from app.core.database import get_db
from app.models.delivery import Delivery, DeliveryStatus, ProofOfDelivery, TrackingEvent
from app.models.rider import Rider
from app.models.order import Order
from app.api.v1.auth import get_current_user, require_role
from app.models.user import User, UserRole

router = APIRouter(prefix="/deliveries")


# ── Schemas ───────────────────────────────────────────────────────────────────
class DeliveryAssign(BaseModel):
    rider_id: str


class DeliveryProof(BaseModel):
    recipient_name: str
    recipient_signature: Optional[str] = None
    photo_url: Optional[str] = None
    notes: Optional[str] = None


class DeliveryCancel(BaseModel):
    reason: str


def _delivery_to_dict(d: Delivery) -> dict:
    return {
        "id": str(d.id),
        "order_id": str(d.order_id) if d.order_id else None,
        "rider_id": str(d.rider_id) if d.rider_id else None,
        "rider_name": d.rider_name,
        "customer_name": d.customer_name,
        "status": d.status.value,
        "priority": d.priority.value if d.priority else None,
        "address": {
            "street": d.street,
            "city": d.city,
            "state": d.state,
            "zip_code": d.zip_code,
            "latitude": d.latitude,
            "longitude": d.longitude,
        },
        "current_location": {
            "latitude": d.current_lat,
            "longitude": d.current_lng,
            "last_update": d.last_location_update.isoformat() if d.last_location_update else None,
        } if d.current_lat and d.current_lng else None,
        "tracking": [
            {
                "id": str(t.id),
                "event_type": t.event_type,
                "description": t.description,
                "timestamp": t.timestamp.isoformat() if t.timestamp else None,
                "location": {
                    "latitude": t.latitude,
                    "longitude": t.longitude,
                } if t.latitude and t.longitude else None,
            }
            for t in (d.tracking or [])
        ],
        "proof_of_delivery": {
            "recipient_name": d.recipient_name,
            "recipient_signature": d.recipient_signature,
            "photo_url": d.photo_url,
            "notes": d.notes,
            "timestamp": d.proof_timestamp.isoformat() if d.proof_timestamp else None,
        } if d.recipient_name else None,
        "sla_deadline": d.sla_deadline.isoformat() if d.sla_deadline else None,
        "created_at": d.created_at.isoformat() if d.created_at else None,
        "assigned_at": d.assigned_at.isoformat() if d.assigned_at else None,
        "started_at": d.started_at.isoformat() if d.started_at else None,
        "finished_at": d.finished_at.isoformat() if d.finished_at else None,
        "cancelled_at": d.cancelled_at.isoformat() if d.cancelled_at else None,
        "cancel_reason": d.cancel_reason,
    }


# ── Endpoints ─────────────────────────────────────────────────────────────────
@router.get("")
async def list_deliveries(
    status: Optional[str] = Query(None),
    rider_id: Optional[str] = Query(None),
    order_id: Optional[str] = Query(None),
    zone: Optional[str] = Query(None),
    priority: Optional[str] = Query(None),
    date_from: Optional[str] = Query(None),
    date_to: Optional[str] = Query(None),
    search: Optional[str] = Query(None),
    limit: int = Query(50, le=200),
    offset: int = Query(0),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Listar entregas con filtros"""
    q = select(Delivery)
    
    # Repartidor solo ve sus entregas
    if current_user.role == UserRole.REPARTIDOR:
        result = await db.execute(select(Rider).where(Rider.user_id == current_user.id))
        rider = result.scalar_one_or_none()
        if rider:
            q = q.where(Delivery.rider_id == rider.id)
    
    if status:
        try:
            q = q.where(Delivery.status == DeliveryStatus(status))
        except ValueError:
            pass
    if rider_id:
        q = q.where(Delivery.rider_id == uuid.UUID(rider_id))
    if order_id:
        q = q.where(Delivery.order_id == uuid.UUID(order_id))
    if zone:
        q = q.where(Delivery.zone == zone)
    if priority:
        try:
            q = q.where(Delivery.priority == priority)
        except ValueError:
            pass
    
    q = q.order_by(Delivery.created_at.desc()).limit(limit).offset(offset)
    result = await db.execute(q)
    deliveries = result.scalars().all()
    
    # Count total
    count_q = select(Delivery)
    if status:
        try:
            count_q = count_q.where(Delivery.status == DeliveryStatus(status))
        except ValueError:
            pass
    if rider_id:
        count_q = count_q.where(Delivery.rider_id == uuid.UUID(rider_id))
    if order_id:
        count_q = count_q.where(Delivery.order_id == uuid.UUID(order_id))
    
    count_result = await db.execute(count_q)
    total = len(count_result.scalars().all())
    
    return {"items": [_delivery_to_dict(d) for d in deliveries], "total": total}


@router.get("/active")
async def list_active_deliveries(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Obtener entregas activas (EN_CAMINO, RECOGIDO)"""
    q = select(Delivery).where(
        Delivery.status.in_([DeliveryStatus.EN_CAMINO, DeliveryStatus.RECOGIDO])
    )
    
    if current_user.role == UserRole.REPARTIDOR:
        result = await db.execute(select(Rider).where(Rider.user_id == current_user.id))
        rider = result.scalar_one_or_none()
        if rider:
            q = q.where(Delivery.rider_id == rider.id)
    
    result = await db.execute(q)
    deliveries = result.scalars().all()
    return [_delivery_to_dict(d) for d in deliveries]


@router.get("/pending")
async def list_pending_deliveries(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Obtener entregas pendientes de asignación"""
    q = select(Delivery).where(Delivery.status == DeliveryStatus.PENDIENTE)
    
    result = await db.execute(q)
    deliveries = result.scalars().all()
    return [_delivery_to_dict(d) for d in deliveries]


@router.get("/{delivery_id}")
async def get_delivery(
    delivery_id: str,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Obtener detalles de una entrega"""
    result = await db.execute(select(Delivery).where(Delivery.id == uuid.UUID(delivery_id)))
    delivery = result.scalar_one_or_none()
    if not delivery:
        raise HTTPException(status_code=404, detail="Entrega no encontrada")
    return _delivery_to_dict(delivery)


@router.post("/{delivery_id}/assign")
async def assign_delivery(
    delivery_id: str,
    body: DeliveryAssign,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_role(UserRole.SUPERADMIN, UserRole.GERENTE, UserRole.OPERADOR)),
):
    """Asignar entrega a un repartidor"""
    result = await db.execute(select(Delivery).where(Delivery.id == uuid.UUID(delivery_id)))
    delivery = result.scalar_one_or_none()
    if not delivery:
        raise HTTPException(status_code=404, detail="Entrega no encontrada")
    if delivery.status != DeliveryStatus.PENDIENTE:
        raise HTTPException(status_code=400, detail=f"No se puede asignar una entrega en estado {delivery.status.value}")
    
    rider_result = await db.execute(select(Rider).where(Rider.id == uuid.UUID(body.rider_id)))
    rider = rider_result.scalar_one_or_none()
    if not rider or rider.status != RiderStatus.ACTIVO:
        raise HTTPException(status_code=400, detail="Repartidor no disponible")
    
    delivery.rider_id = rider.id
    delivery.rider_name = rider.user.full_name if rider.user else None
    delivery.status = DeliveryStatus.ASIGNADO
    delivery.assigned_at = datetime.now(timezone.utc)
    
    # Agregar evento de tracking
    tracking_event = TrackingEvent(
        event_type="ASIGNADO",
        description=f"Entrega asignada a {rider.user.full_name if rider.user else 'Repartidor'}",
        timestamp=datetime.now(timezone.utc),
    )
    if not delivery.tracking:
        delivery.tracking = []
    delivery.tracking.append(tracking_event)
    
    await db.commit()
    await db.refresh(delivery)
    return _delivery_to_dict(delivery)


@router.post("/{delivery_id}/unassign")
async def unassign_delivery(
    delivery_id: str,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_role(UserRole.SUPERADMIN, UserRole.GERENTE, UserRole.OPERADOR)),
):
    """Desasignar entrega"""
    result = await db.execute(select(Delivery).where(Delivery.id == uuid.UUID(delivery_id)))
    delivery = result.scalar_one_or_none()
    if not delivery:
        raise HTTPException(status_code=404, detail="Entrega no encontrada")
    if delivery.status not in [DeliveryStatus.ASIGNADO, DeliveryStatus.PENDIENTE]:
        raise HTTPException(status_code=400, detail=f"No se puede desasignar una entrega en estado {delivery.status.value}")
    
    delivery.rider_id = None
    delivery.rider_name = None
    delivery.status = DeliveryStatus.PENDIENTE
    
    await db.commit()
    await db.refresh(delivery)
    return _delivery_to_dict(delivery)


@router.post("/{delivery_id}/start")
async def start_delivery(
    delivery_id: str,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Iniciar entrega (repartidor marca como iniciada)"""
    result = await db.execute(select(Delivery).where(Delivery.id == uuid.UUID(delivery_id)))
    delivery = result.scalar_one_or_none()
    if not delivery:
        raise HTTPException(status_code=404, detail="Entrega no encontrada")
    if delivery.status != DeliveryStatus.ASIGNADO:
        raise HTTPException(status_code=400, detail=f"No se puede iniciar una entrega en estado {delivery.status.value}")
    
    delivery.status = DeliveryStatus.EN_CAMINO
    delivery.started_at = datetime.now(timezone.utc)
    
    # Agregar evento de tracking
    tracking_event = TrackingEvent(
        event_type="INICIADA",
        description="Entrega iniciada - En camino al destino",
        timestamp=datetime.now(timezone.utc),
    )
    if not delivery.tracking:
        delivery.tracking = []
    delivery.tracking.append(tracking_event)
    
    await db.commit()
    await db.refresh(delivery)
    return _delivery_to_dict(delivery)


@router.post("/{delivery_id}/finish")
async def finish_delivery(
    delivery_id: str,
    proof: DeliveryProof,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Finalizar entrega con prueba de entrega"""
    result = await db.execute(select(Delivery).where(Delivery.id == uuid.UUID(delivery_id)))
    delivery = result.scalar_one_or_none()
    if not delivery:
        raise HTTPException(status_code=404, detail="Entrega no encontrada")
    if delivery.status != DeliveryStatus.EN_CAMINO:
        raise HTTPException(status_code=400, detail=f"No se puede finalizar una entrega en estado {delivery.status.value}")
    
    delivery.status = DeliveryStatus.FINALIZADO
    delivery.finished_at = datetime.now(timezone.utc)
    delivery.recipient_name = proof.recipient_name
    delivery.recipient_signature = proof.recipient_signature
    delivery.photo_url = proof.photo_url
    delivery.notes = proof.notes
    delivery.proof_timestamp = datetime.now(timezone.utc)
    
    # Agregar evento de tracking
    tracking_event = TrackingEvent(
        event_type="ENTREGADO",
        description=f"Entrega finalizada - Recibido por {proof.recipient_name}",
        timestamp=datetime.now(timezone.utc),
    )
    if not delivery.tracking:
        delivery.tracking = []
    delivery.tracking.append(tracking_event)
    
    await db.commit()
    await db.refresh(delivery)
    return _delivery_to_dict(delivery)


@router.post("/{delivery_id}/cancel")
async def cancel_delivery(
    delivery_id: str,
    body: DeliveryCancel,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_role(UserRole.SUPERADMIN, UserRole.GERENTE, UserRole.OPERADOR, UserRole.REPARTIDOR)),
):
    """Cancelar entrega"""
    result = await db.execute(select(Delivery).where(Delivery.id == uuid.UUID(delivery_id)))
    delivery = result.scalar_one_or_none()
    if not delivery:
        raise HTTPException(status_code=404, detail="Entrega no encontrada")
    if delivery.status in [DeliveryStatus.FINALIZADO, DeliveryStatus.CANCELADO]:
        raise HTTPException(status_code=400, detail=f"No se puede cancelar una entrega {delivery.status.value}")
    
    delivery.status = DeliveryStatus.CANCELADO
    delivery.cancelled_at = datetime.now(timezone.utc)
    delivery.cancel_reason = body.reason
    
    # Agregar evento de tracking
    tracking_event = TrackingEvent(
        event_type="CANCELADO",
        description=f"Entrega cancelada: {body.reason}",
        timestamp=datetime.now(timezone.utc),
    )
    if not delivery.tracking:
        delivery.tracking = []
    delivery.tracking.append(tracking_event)
    
    await db.commit()
    await db.refresh(delivery)
    return _delivery_to_dict(delivery)
