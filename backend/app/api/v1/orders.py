from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, and_
from sqlalchemy.orm import selectinload
from pydantic import BaseModel
from typing import Optional, List
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


def _order_to_dict(o: Order) -> dict:
    return {
        "id": str(o.id),
        "order_number": o.order_number,
        "status": o.status.value,
        "priority": o.priority.value,
        "pickup_address": o.pickup_address,
        "delivery_address": o.delivery_address,
        "delivery_contact": o.delivery_contact,
        "delivery_phone": o.delivery_phone,
        "declared_value": o.declared_value,
        "sla_minutes": o.sla_minutes,
        "sla_breached": o.sla_breached,
        "rider_id": str(o.rider_id) if o.rider_id else None,
        "source": o.source,
        "notes": o.notes,
        "created_at": o.created_at.isoformat() if o.created_at else None,
        "assigned_at": o.assigned_at.isoformat() if o.assigned_at else None,
        "delivered_at": o.delivered_at.isoformat() if o.delivered_at else None,
        "estimated_delivery_at": o.estimated_delivery_at.isoformat() if o.estimated_delivery_at else None,
    }


def _generate_order_number() -> str:
    suffix = "".join(random.choices(string.ascii_uppercase + string.digits, k=6))
    return f"LR-{suffix}"


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
        result = await db.execute(
            select(Rider).where(Rider.user_id == current_user.id)
        )
        rider = result.scalar_one_or_none()
        if rider:
            q = q.where(Order.rider_id == rider.id)

    if status:
        try:
            q = q.where(Order.status == OrderStatus(status))
        except ValueError:
            pass
    if rider_id:
        q = q.where(Order.rider_id == uuid.UUID(rider_id))

    q = q.order_by(Order.created_at.desc()).limit(limit).offset(offset)
    result = await db.execute(q)
    orders = result.scalars().all()
    return [_order_to_dict(o) for o in orders]


@router.post("", status_code=201)
async def create_order(
    body: OrderCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_role(UserRole.SUPERADMIN, UserRole.GERENTE, UserRole.OPERADOR)),
):
    from datetime import timedelta
    order = Order(
        order_number=_generate_order_number(),
        pickup_address=body.pickup_address,
        pickup_lat=body.pickup_lat,
        pickup_lng=body.pickup_lng,
        pickup_contact=body.pickup_contact,
        pickup_phone=body.pickup_phone,
        delivery_address=body.delivery_address,
        delivery_lat=body.delivery_lat,
        delivery_lng=body.delivery_lng,
        delivery_contact=body.delivery_contact,
        delivery_phone=body.delivery_phone,
        description=body.description,
        declared_value=body.declared_value,
        priority=body.priority,
        sla_minutes=body.sla_minutes,
        estimated_delivery_at=datetime.now(timezone.utc) + timedelta(minutes=body.sla_minutes),
    )

    if body.rider_id:
        order.rider_id = uuid.UUID(body.rider_id)
        order.status = OrderStatus.ASIGNADO
        order.assigned_at = datetime.now(timezone.utc)
        order.assigned_by_id = current_user.id

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
    result = await db.execute(select(Order).where(Order.id == uuid.UUID(order_id)))
    order = result.scalar_one_or_none()
    if not order:
        raise HTTPException(status_code=404, detail="Pedido no encontrado")
    return _order_to_dict(order)


@router.patch("/{order_id}/assign")
async def assign_rider(
    order_id: str,
    body: AssignRider,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_role(UserRole.SUPERADMIN, UserRole.GERENTE, UserRole.OPERADOR)),
):
    result = await db.execute(select(Order).where(Order.id == uuid.UUID(order_id)))
    order = result.scalar_one_or_none()
    if not order:
        raise HTTPException(status_code=404, detail="Pedido no encontrado")
    if order.status not in (OrderStatus.CREADO, OrderStatus.ASIGNADO):
        raise HTTPException(status_code=400, detail=f"No se puede asignar un pedido en estado {order.status.value}")

    result2 = await db.execute(select(Rider).where(Rider.id == uuid.UUID(body.rider_id)))
    rider = result2.scalar_one_or_none()
    if not rider or rider.status != RiderStatus.ACTIVO:
        raise HTTPException(status_code=400, detail="Repartidor no disponible")

    order.rider_id = rider.id
    order.status = OrderStatus.ASIGNADO
    order.assigned_at = datetime.now(timezone.utc)
    order.assigned_by_id = current_user.id
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
        OrderStatus.ASIGNADO: [OrderStatus.RECOGIDO],
        OrderStatus.RECOGIDO: [OrderStatus.EN_RUTA],
        OrderStatus.EN_RUTA: [OrderStatus.ENTREGADO, OrderStatus.FALLIDO],
    }

    result = await db.execute(select(Order).where(Order.id == uuid.UUID(order_id)))
    order = result.scalar_one_or_none()
    if not order:
        raise HTTPException(status_code=404, detail="Pedido no encontrado")

    try:
        target = OrderStatus(new_status)
    except ValueError:
        raise HTTPException(status_code=400, detail=f"Estado inválido: {new_status}")

    allowed = VALID_TRANSITIONS.get(order.status, [])
    if target not in allowed:
        raise HTTPException(
            status_code=400,
            detail=f"Transición inválida: {order.status.value} → {new_status}",
        )

    now = datetime.now(timezone.utc)
    order.status = target
    if target == OrderStatus.RECOGIDO:
        order.picked_up_at = now
    elif target == OrderStatus.EN_RUTA:
        order.in_route_at = now
    elif target == OrderStatus.ENTREGADO:
        order.delivered_at = now
        if order.estimated_delivery_at and now > order.estimated_delivery_at:
            order.sla_breached = True
    elif target == OrderStatus.FALLIDO:
        order.failed_at = now

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