"""
Delivery360 - API Endpoints para Entregas (alineado al contrato de dominio actual)
"""

from datetime import datetime, timezone
import uuid
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, Query
from pydantic import BaseModel
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.v1.auth import get_current_user, require_role
from app.core.database import get_db
from app.models.delivery import Delivery, DeliveryStatus
from app.models.order import Order, OrderStatus
from app.models.rider import Rider, RiderStatus
from app.models.user import User, UserRole

router = APIRouter(prefix="/deliveries")


class DeliveryAssign(BaseModel):
    rider_id: str


class DeliveryStart(BaseModel):
    lat: Optional[float] = None
    lng: Optional[float] = None


class DeliveryComplete(BaseModel):
    otp_code: Optional[str] = None
    notes: Optional[str] = None
    customer_name_received: Optional[str] = None
    lat: Optional[float] = None
    lng: Optional[float] = None


class DeliveryFail(BaseModel):
    issue_type: str
    issue_description: Optional[str] = None


def _parse_uuid(value: str, field_name: str) -> uuid.UUID:
    try:
        return uuid.UUID(value)
    except ValueError:
        raise HTTPException(status_code=400, detail=f"{field_name} inválido")


def _ensure_status_transition(
    delivery: Delivery,
    *,
    allowed_from: tuple[DeliveryStatus, ...],
    action: str,
) -> None:
    if delivery.status not in allowed_from:
        allowed = ", ".join(state.value for state in allowed_from)
        raise HTTPException(
            status_code=400,
            detail=f"No se puede {action} en estado {delivery.status.value}. Estados permitidos: {allowed}",
        )


def _delivery_to_dict(d: Delivery) -> dict:
    return {
        "id": str(d.id),
        "order_id": str(d.order_id),
        "rider_id": str(d.rider_id),
        "status": d.status.value if hasattr(d.status, "value") else str(d.status),
        "started_at": d.started_at.isoformat() if d.started_at else None,
        "completed_at": d.completed_at.isoformat() if d.completed_at else None,
        "current_latitude": d.current_latitude,
        "current_longitude": d.current_longitude,
        "proof_otp": d.proof_otp,
        "proof_notes": d.proof_notes,
        "customer_name_received": d.customer_name_received,
        "sla_expected_minutes": d.sla_expected_minutes,
        "sla_actual_minutes": d.sla_actual_minutes,
        "sla_compliant": d.sla_compliant,
        "created_at": d.created_at.isoformat() if d.created_at else None,
    }


async def _get_rider_for_user(db: AsyncSession, user_id) -> Optional[Rider]:
    result = await db.execute(select(Rider).where(Rider.user_id == user_id))
    return result.scalar_one_or_none()


async def _ensure_rider_delivery_access(db: AsyncSession, current_user: User, delivery: Delivery) -> None:
    if current_user.role != UserRole.REPARTIDOR:
        return
    rider = await _get_rider_for_user(db, current_user.id)
    if not rider or delivery.rider_id != rider.id:
        raise HTTPException(status_code=403, detail="No tienes permiso para acceder a esta entrega")


@router.get("")
async def list_deliveries(
    status: Optional[str] = Query(None),
    rider_id: Optional[str] = Query(None),
    order_id: Optional[str] = Query(None),
    limit: int = Query(50, le=200),
    offset: int = Query(0),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    q = select(Delivery)

    if current_user.role == UserRole.REPARTIDOR:
        rider = await _get_rider_for_user(db, current_user.id)
        if not rider:
            raise HTTPException(status_code=404, detail="Perfil de repartidor no encontrado")
        q = q.where(Delivery.rider_id == rider.id)

    if status:
        try:
            q = q.where(Delivery.status == DeliveryStatus(status))
        except ValueError:
            raise HTTPException(status_code=400, detail=f"Estado inválido: {status}")
    if rider_id:
        rider_uuid = _parse_uuid(rider_id, "rider_id")
        if current_user.role == UserRole.REPARTIDOR:
            rider = await _get_rider_for_user(db, current_user.id)
            if not rider or rider.id != rider_uuid:
                raise HTTPException(status_code=403, detail="No tienes permiso para filtrar por ese rider_id")
        q = q.where(Delivery.rider_id == rider_uuid)
    if order_id:
        q = q.where(Delivery.order_id == _parse_uuid(order_id, "order_id"))

    q = q.order_by(Delivery.created_at.desc()).limit(limit).offset(offset)
    rows = await db.execute(q)
    items = rows.scalars().all()
    return [_delivery_to_dict(d) for d in items]


@router.get("/{delivery_id}")
async def get_delivery(
    delivery_id: str,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    result = await db.execute(select(Delivery).where(Delivery.id == _parse_uuid(delivery_id, "delivery_id")))
    delivery = result.scalar_one_or_none()
    if not delivery:
        raise HTTPException(status_code=404, detail="Entrega no encontrada")
    await _ensure_rider_delivery_access(db, current_user, delivery)
    return _delivery_to_dict(delivery)


@router.post("/{delivery_id}/assign")
async def assign_delivery(
    delivery_id: str,
    body: DeliveryAssign,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_role(UserRole.SUPERADMIN, UserRole.GERENTE, UserRole.OPERADOR)),
):
    result = await db.execute(select(Delivery).where(Delivery.id == _parse_uuid(delivery_id, "delivery_id")))
    delivery = result.scalar_one_or_none()
    if not delivery:
        raise HTTPException(status_code=404, detail="Entrega no encontrada")
    if delivery.status != DeliveryStatus.PENDIENTE:
        raise HTTPException(status_code=400, detail=f"No se puede asignar en estado {delivery.status.value}")

    rider_result = await db.execute(select(Rider).where(Rider.id == _parse_uuid(body.rider_id, "rider_id")))
    rider = rider_result.scalar_one_or_none()
    if not rider or rider.status != RiderStatus.ACTIVO:
        raise HTTPException(status_code=400, detail="Repartidor no disponible")

    delivery.rider_id = rider.id
    delivery.status = DeliveryStatus.INICIADA
    delivery.started_at = datetime.now(timezone.utc)

    order_result = await db.execute(select(Order).where(Order.id == delivery.order_id))
    order = order_result.scalar_one_or_none()
    if order:
        order.assigned_rider_id = rider.id
        order.status = OrderStatus.ASIGNADO
        order.accepted_at = datetime.now(timezone.utc)

    await db.commit()
    await db.refresh(delivery)
    return _delivery_to_dict(delivery)


@router.post("/{delivery_id}/start")
async def start_delivery(
    delivery_id: str,
    body: DeliveryStart,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    result = await db.execute(select(Delivery).where(Delivery.id == _parse_uuid(delivery_id, "delivery_id")))
    delivery = result.scalar_one_or_none()
    if not delivery:
        raise HTTPException(status_code=404, detail="Entrega no encontrada")

    await _ensure_rider_delivery_access(db, current_user, delivery)
    _ensure_status_transition(
        delivery,
        allowed_from=(DeliveryStatus.INICIADA, DeliveryStatus.EN_PICKUP),
        action="iniciar ruta",
    )

    if body.lat is not None:
        delivery.current_latitude = body.lat
    if body.lng is not None:
        delivery.current_longitude = body.lng
    delivery.status = DeliveryStatus.EN_ROUTE
    delivery.started_at = delivery.started_at or datetime.now(timezone.utc)

    await db.commit()
    await db.refresh(delivery)
    return _delivery_to_dict(delivery)


@router.post("/{delivery_id}/complete")
async def complete_delivery(
    delivery_id: str,
    body: DeliveryComplete,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    result = await db.execute(select(Delivery).where(Delivery.id == _parse_uuid(delivery_id, "delivery_id")))
    delivery = result.scalar_one_or_none()
    if not delivery:
        raise HTTPException(status_code=404, detail="Entrega no encontrada")

    await _ensure_rider_delivery_access(db, current_user, delivery)
    _ensure_status_transition(
        delivery,
        allowed_from=(DeliveryStatus.EN_ROUTE, DeliveryStatus.EN_DESTINO),
        action="completar entrega",
    )

    if body.otp_code and delivery.proof_otp and body.otp_code != delivery.proof_otp:
        raise HTTPException(status_code=400, detail="OTP incorrecto")

    now = datetime.now(timezone.utc)
    delivery.status = DeliveryStatus.COMPLETADA
    delivery.completed_at = now
    delivery.proof_notes = body.notes
    delivery.customer_name_received = body.customer_name_received
    if body.lat is not None:
        delivery.current_latitude = body.lat
    if body.lng is not None:
        delivery.current_longitude = body.lng

    if delivery.started_at:
        elapsed_minutes = max(0, int((now - delivery.started_at).total_seconds() / 60))
        delivery.sla_actual_minutes = elapsed_minutes
        if delivery.sla_expected_minutes is not None:
            delivery.sla_compliant = elapsed_minutes <= delivery.sla_expected_minutes

    order_result = await db.execute(select(Order).where(Order.id == delivery.order_id))
    order = order_result.scalar_one_or_none()
    if order:
        order.status = OrderStatus.ENTREGADO
        order.delivered_at = now

    await db.commit()
    await db.refresh(delivery)
    return _delivery_to_dict(delivery)


@router.post("/{delivery_id}/fail")
async def fail_delivery(
    delivery_id: str,
    body: DeliveryFail,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    result = await db.execute(select(Delivery).where(Delivery.id == _parse_uuid(delivery_id, "delivery_id")))
    delivery = result.scalar_one_or_none()
    if not delivery:
        raise HTTPException(status_code=404, detail="Entrega no encontrada")

    await _ensure_rider_delivery_access(db, current_user, delivery)
    _ensure_status_transition(
        delivery,
        allowed_from=(
            DeliveryStatus.PENDIENTE,
            DeliveryStatus.INICIADA,
            DeliveryStatus.EN_PICKUP,
            DeliveryStatus.EN_ROUTE,
            DeliveryStatus.EN_DESTINO,
        ),
        action="marcar como fallida",
    )

    delivery.status = DeliveryStatus.FALLIDA
    delivery.has_issues = True
    delivery.issue_type = body.issue_type
    delivery.issue_description = body.issue_description

    order_result = await db.execute(select(Order).where(Order.id == delivery.order_id))
    order = order_result.scalar_one_or_none()
    if order:
        order.status = OrderStatus.FALLIDO
        order.failure_reason = body.issue_type
        order.failure_notes = body.issue_description

    await db.commit()
    await db.refresh(delivery)
    return _delivery_to_dict(delivery)