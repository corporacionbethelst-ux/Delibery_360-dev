from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from pydantic import BaseModel
from typing import Optional, List, cast
from datetime import datetime, timezone
import uuid
import random
import string

from app.core.database import get_db
from app.models.order import Order, OrderStatus, OrderPriority
from app.models.rider import Rider, RiderStatus
from app.models.user import User, UserRole
from app.api.v1.auth import get_current_user, require_role

router = APIRouter(prefix="/orders")


# ── Schemas ───────────────────────────────────────────────────────────────────
class OrderCreate(BaseModel):
    customer_name: str
    customer_phone: str
    customer_email: Optional[str] = None
    pickup_address: str
    pickup_lat: Optional[float] = None
    pickup_lng: Optional[float] = None
    pickup_contact: Optional[str] = None
    pickup_phone: Optional[str] = None
    delivery_address: str
    delivery_lat: Optional[float] = None
    delivery_lng: Optional[float] = None
    delivery_contact: str
    delivery_phone: Optional[str] = None
    description: Optional[str] = None
    declared_value: float = 0.0
    priority: OrderPriority = OrderPriority.NORMAL
    sla_minutes: int = 60
    rider_id: Optional[str] = None


class AssignRider(BaseModel):
    rider_id: str


def _parse_uuid(value: str, field_name: str) -> uuid.UUID:
    try:
        return uuid.UUID(value)
    except ValueError:
        raise HTTPException(status_code=400, detail=f"{field_name} inválido")


def _order_to_dict(o: Order) -> dict:
    status_value = o.status.value if hasattr(o.status, "value") else str(o.status)
    priority_value = o.priority.value if hasattr(o.priority, "value") else str(o.priority)
    sla_breached = bool(o.sla_deadline and o.delivered_at and o.delivered_at > o.sla_deadline)
    return {
        "id": str(o.id),
        "external_id": o.external_id,
        "status": status_value,
        "priority": priority_value,
        "customer_name": o.customer_name,
        "customer_phone": o.customer_phone,
        "customer_email": o.customer_email,
        "pickup_address": o.pickup_address,
        "pickup_name": o.pickup_name,
        "pickup_phone": o.pickup_phone,
        "delivery_address": o.delivery_address,
        "delivery_reference": o.delivery_reference,
        "delivery_instructions": o.delivery_instructions,
        "total": o.total,
        "sla_deadline": o.sla_deadline.isoformat() if o.sla_deadline else None,
        "sla_breached": sla_breached,
        "rider_id": str(o.assigned_rider_id) if o.assigned_rider_id else None,
        "source": o.source,
        "created_at": o.created_at.isoformat() if o.created_at else None,
        "accepted_at": o.accepted_at.isoformat() if o.accepted_at else None,
        "picked_up_at": o.picked_up_at.isoformat() if o.picked_up_at else None,
        "delivered_at": o.delivered_at.isoformat() if o.delivered_at else None,
        "estimated_delivery_time": o.estimated_delivery_time.isoformat() if o.estimated_delivery_time else None,
        "ordered_at": o.ordered_at.isoformat() if o.ordered_at else None,
    }


def _generate_order_number() -> str:
    suffix = "".join(random.choices(string.ascii_uppercase + string.digits, k=6))
    return f"LR-{suffix}"


async def _get_rider_for_user(db: AsyncSession, user_id) -> Optional[Rider]:
    rider_result = await db.execute(select(Rider).where(Rider.user_id == user_id))
    return rider_result.scalar_one_or_none()


async def _ensure_rider_order_access(db: AsyncSession, current_user: User, order: Order) -> None:
    if current_user.role != UserRole.REPARTIDOR:
        return
    rider = await _get_rider_for_user(db, current_user.id)
    if not rider or order.assigned_rider_id != rider.id:
        raise HTTPException(status_code=403, detail="No tienes permiso para acceder a este pedido")


# ── Endpoints ─────────────────────────────────────────────────────────────────
@router.get("")
async def list_orders(
    status: Optional[str] = Query(None),
    rider_id: Optional[str] = Query(None),
    limit: int = Query(50, le=200),
    offset: int = Query(0),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    q = select(Order)

    # Repartidor solo ve sus pedidos
    if current_user.role == UserRole.REPARTIDOR:
        rider_result = await db.execute(
            select(Rider).where(Rider.user_id == current_user.id)
        )
        rider = rider_result.scalar_one_or_none()
        if rider:
            q = q.where(Order.assigned_rider_id == rider.id)

    if status:
        try:
            q = q.where(Order.status == OrderStatus(status))
        except ValueError:
            raise HTTPException(status_code=400, detail=f"Estado inválido: {status}")
    if rider_id:
        q = q.where(Order.assigned_rider_id == _parse_uuid(rider_id, "rider_id"))

    q = q.order_by(Order.created_at.desc()).limit(limit).offset(offset)
    orders_result = await db.execute(q)
    orders: List[Order] = list(orders_result.scalars().all())
    return [_order_to_dict(o) for o in orders]


@router.post("", status_code=201)
async def create_order(
    body: OrderCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_role(UserRole.SUPERADMIN, UserRole.GERENTE, UserRole.OPERADOR)),
):
    from datetime import timedelta
    order = Order(
        external_id=_generate_order_number(),
        customer_name=body.customer_name,
        customer_phone=body.customer_phone,
        customer_email=body.customer_email,
        pickup_address=body.pickup_address,
        pickup_lat=body.pickup_lat,
        pickup_lng=body.pickup_lng,
        pickup_name=body.pickup_contact,
        pickup_phone=body.pickup_phone,
        delivery_address=body.delivery_address,
        delivery_lat=body.delivery_lat,
        delivery_lng=body.delivery_lng,
        delivery_reference=body.delivery_contact,
        delivery_instructions=body.description,
        subtotal=body.declared_value,
        total=body.declared_value,
        priority=body.priority.value,
        estimated_delivery_time=datetime.now(timezone.utc) + timedelta(minutes=body.sla_minutes),
        sla_deadline=datetime.now(timezone.utc) + timedelta(minutes=body.sla_minutes),
    )

    if body.rider_id:
        order.assigned_rider_id = _parse_uuid(body.rider_id, "rider_id")  # type: ignore[assignment]
        order.status = OrderStatus.ASIGNADO
        order.accepted_at = datetime.now(timezone.utc)  # type: ignore[assignment]

    db.add(order)
    await db.commit()
    await db.refresh(order)
    return _order_to_dict(order)


@router.get("/{order_id}")
async def get_order(
    order_id: str,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    result = await db.execute(select(Order).where(Order.id == _parse_uuid(order_id, "order_id")))
    order = result.scalar_one_or_none()
    if not order:
        raise HTTPException(status_code=404, detail="Pedido no encontrado")
    await _ensure_rider_order_access(db, current_user, order)
    return _order_to_dict(order)


@router.patch("/{order_id}/assign")
async def assign_rider(
    order_id: str,
    body: AssignRider,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_role(UserRole.SUPERADMIN, UserRole.GERENTE, UserRole.OPERADOR)),
):
    result = await db.execute(select(Order).where(Order.id == _parse_uuid(order_id, "order_id")))
    order = result.scalar_one_or_none()
    if not order:
        raise HTTPException(status_code=404, detail="Pedido no encontrado")
    if order.status not in (OrderStatus.PENDIENTE, OrderStatus.ASIGNADO):
        raise HTTPException(status_code=400, detail=f"No se puede asignar un pedido en estado {order.status.value}")

    result2 = await db.execute(select(Rider).where(Rider.id == _parse_uuid(body.rider_id, "rider_id")))
    rider = result2.scalar_one_or_none()
    if not rider or rider.status != RiderStatus.ACTIVO:
        raise HTTPException(status_code=400, detail="Repartidor no disponible")

    order.assigned_rider_id = rider.id  # type: ignore[assignment]
    order.status = OrderStatus.ASIGNADO
    order.accepted_at = datetime.now(timezone.utc)  # type: ignore[assignment]
    await db.commit()
    return _order_to_dict(order)


@router.patch("/{order_id}/status")
async def update_status(
    order_id: str,
    new_status: str,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Máquina de estados. El rider avanza su pedido."""
    VALID_TRANSITIONS = {
        OrderStatus.PENDIENTE: [OrderStatus.ASIGNADO, OrderStatus.CANCELADO],
        OrderStatus.ASIGNADO: [OrderStatus.RECOLECTADO, OrderStatus.CANCELADO],
        OrderStatus.RECOLECTADO: [OrderStatus.EN_RUTA, OrderStatus.CANCELADO],
        OrderStatus.EN_RUTA: [OrderStatus.ENTREGADO, OrderStatus.FALLIDO, OrderStatus.CANCELADO],
    }

    result = await db.execute(select(Order).where(Order.id == _parse_uuid(order_id, "order_id")))
    order = result.scalar_one_or_none()
    if not order:
        raise HTTPException(status_code=404, detail="Pedido no encontrado")

    try:
        target = OrderStatus(new_status)
    except ValueError:
        raise HTTPException(status_code=400, detail=f"Estado inválido: {new_status}")

    await _ensure_rider_order_access(db, current_user, order)

    current_status = cast(OrderStatus, order.status)
    allowed = VALID_TRANSITIONS.get(current_status, [])
    if target not in allowed:
        raise HTTPException(
            status_code=400,
            detail=f"Transición inválida: {order.status.value} → {new_status}",
        )

    now = datetime.now(timezone.utc)
    order.status = target
    if target == OrderStatus.RECOLECTADO:
        order.picked_up_at = now  # type: ignore[assignment]
    elif target == OrderStatus.ENTREGADO:
        order.delivered_at = now  # type: ignore[assignment]
    elif target == OrderStatus.FALLIDO:
        order.failure_reason = "delivery_failed"  # type: ignore[assignment]

    await db.commit()
    return _order_to_dict(order)


@router.get("/stats/summary")
async def orders_summary(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    today = datetime.now(timezone.utc).date()
    result = await db.execute(
        select(Order.status, func.count(Order.id))
        .where(func.date(Order.created_at) == today)
        .group_by(Order.status)
    )
    rows = result.all()
    summary = {r[0].value: r[1] for r in rows}
    total = sum(summary.values())
    return {"today": summary, "total_today": total}
