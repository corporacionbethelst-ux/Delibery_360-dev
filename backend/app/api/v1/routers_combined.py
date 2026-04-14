"""
Agrupa los routers secundarios para mantener el proyecto ordenado.
Cada uno se monta en main.py por separado.
"""
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, and_
from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime, timezone, timedelta
import uuid

from app.core.database import get_db
from app.models.all_models import (
    Delivery, Shift, ShiftStatus, Financial,
    Route, AuditLog, Notification, Integration, Productivity
)
from app.models.order import Order, OrderStatus
from app.models.rider import Rider, RiderStatus
from app.models.user import User, UserRole
from app.api.v1.auth import get_current_user, require_role

# ─────────────────────────────────────────────────────────────────────────────
# DELIVERIES
# ─────────────────────────────────────────────────────────────────────────────
deliveries_router = APIRouter(prefix="/deliveries")


class DeliveryProof(BaseModel):
    otp_code: Optional[str] = None
    delivery_lat: Optional[float] = None
    delivery_lng: Optional[float] = None
    customer_rating: Optional[int] = None
    notes: Optional[str] = None


@deliveries_router.get("")
async def list_deliveries(
    rider_id: Optional[str] = Query(None),
    limit: int = Query(50, le=200),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    q = select(Delivery)
    if rider_id:
        q = q.where(Delivery.rider_id == uuid.UUID(rider_id))
    result = await db.execute(q.order_by(Delivery.created_at.desc()).limit(limit))
    items = result.scalars().all()
    return [
        {
            "id": str(d.id),
            "order_id": str(d.order_id),
            "rider_id": str(d.rider_id),
            "otp_verified": d.otp_verified,
            "duration_minutes": d.duration_minutes,
            "distance_km": d.distance_km,
            "on_time": d.on_time,
            "customer_rating": d.customer_rating,
            "pickup_at": d.pickup_at.isoformat() if d.pickup_at else None,
            "delivered_at": d.delivered_at.isoformat() if d.delivered_at else None,
        }
        for d in items
    ]


@deliveries_router.post("/{order_id}/start")
async def start_delivery(
    order_id: str,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    result = await db.execute(select(Order).where(Order.id == uuid.UUID(order_id)))
    order = result.scalar_one_or_none()
    if not order:
        raise HTTPException(status_code=404, detail="Pedido no encontrado")

    existing = await db.execute(select(Delivery).where(Delivery.order_id == order.id))
    if existing.scalar_one_or_none():
        raise HTTPException(status_code=400, detail="La entrega ya fue iniciada")

    import random, string
    otp = "".join(random.choices(string.digits, k=6))
    if not order.assigned_rider_id:
        raise HTTPException(status_code=400, detail="El pedido no tiene repartidor asignado")

    delivery = Delivery(
        order_id=order.id,
        rider_id=order.assigned_rider_id,
        otp_code=otp,
        pickup_at=datetime.now(timezone.utc),
    )
    db.add(delivery)

    order.status = OrderStatus.EN_RUTA
    order.picked_up_at = datetime.now(timezone.utc)
    await db.commit()

    return {"otp_code": otp, "message": "Entrega iniciada. Comparte el OTP con el cliente."}


@deliveries_router.patch("/{delivery_id}/complete")
async def complete_delivery(
    delivery_id: str,
    body: DeliveryProof,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    result = await db.execute(select(Delivery).where(Delivery.id == uuid.UUID(delivery_id)))
    delivery = result.scalar_one_or_none()
    if not delivery:
        raise HTTPException(status_code=404, detail="Entrega no encontrada")

    if body.otp_code and delivery.otp_code:
        if body.otp_code != delivery.otp_code:
            raise HTTPException(status_code=400, detail="OTP incorrecto")
        delivery.otp_verified = True

    now = datetime.now(timezone.utc)
    delivery.delivered_at = now
    delivery.delivery_lat = body.delivery_lat
    delivery.delivery_lng = body.delivery_lng
    delivery.customer_rating = body.customer_rating
    delivery.notes = body.notes

    if delivery.pickup_at:
        diff = now - delivery.pickup_at
        delivery.duration_minutes = diff.total_seconds() / 60

    result2 = await db.execute(select(Order).where(Order.id == delivery.order_id))
    order = result2.scalar_one_or_none()
    if order:
        order.status = OrderStatus.ENTREGADO
        order.delivered_at = now
        delivery.on_time = now <= order.estimated_delivery_time if order.estimated_delivery_time else True

    await db.commit()
    return {"message": "Entrega completada exitosamente", "duration_minutes": delivery.duration_minutes}


# ─────────────────────────────────────────────────────────────────────────────
# SHIFTS
# ─────────────────────────────────────────────────────────────────────────────
shifts_router = APIRouter(prefix="/shifts")


@shifts_router.post("/checkin")
async def checkin(
    lat: Optional[float] = None,
    lng: Optional[float] = None,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    result = await db.execute(select(Rider).where(Rider.user_id == current_user.id))
    rider = result.scalar_one_or_none()
    if not rider:
        raise HTTPException(status_code=404, detail="Perfil de repartidor no encontrado")

    active = await db.execute(
        select(Shift).where(Shift.rider_id == rider.id, Shift.status == ShiftStatus.ACTIVO)
    )
    if active.scalar_one_or_none():
        raise HTTPException(status_code=400, detail="Ya tienes un turno activo")

    shift = Shift(
        rider_id=rider.id,
        checkin_at=datetime.now(timezone.utc),
        checkin_lat=lat,
        checkin_lng=lng,
    )
    db.add(shift)
    rider.is_online = True
    await db.commit()
    return {"message": "Check-in exitoso", "shift_id": str(shift.id)}


@shifts_router.post("/checkout/{shift_id}")
async def checkout(
    shift_id: str,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    result = await db.execute(select(Shift).where(Shift.id == uuid.UUID(shift_id)))
    shift = result.scalar_one_or_none()
    if not shift:
        raise HTTPException(status_code=404, detail="Turno no encontrado")

    now = datetime.now(timezone.utc)
    shift.checkout_at = now
    shift.status = ShiftStatus.CERRADO
    diff = now - shift.checkin_at
    shift.duration_hours = diff.total_seconds() / 3600

    result2 = await db.execute(select(Rider).where(Rider.id == shift.rider_id))
    rider = result2.scalar_one_or_none()
    if rider:
        rider.is_online = False

    await db.commit()
    return {
        "message": "Check-out exitoso",
        "duration_hours": round(shift.duration_hours, 2),
        "total_orders": shift.total_orders,
        "total_earnings": shift.total_earnings,
    }


@shifts_router.get("")
async def list_shifts(
    rider_id: Optional[str] = Query(None),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    q = select(Shift)
    if rider_id:
        q = q.where(Shift.rider_id == uuid.UUID(rider_id))
    result = await db.execute(q.order_by(Shift.checkin_at.desc()).limit(100))
    items = result.scalars().all()
    return [
        {
            "id": str(s.id),
            "rider_id": str(s.rider_id),
            "status": s.status.value,
            "checkin_at": s.checkin_at.isoformat(),
            "checkout_at": s.checkout_at.isoformat() if s.checkout_at else None,
            "duration_hours": s.duration_hours,
            "total_orders": s.total_orders,
            "total_earnings": s.total_earnings,
        }
        for s in items
    ]


# ─────────────────────────────────────────────────────────────────────────────
# FINANCIAL
# ─────────────────────────────────────────────────────────────────────────────
financial_router = APIRouter(prefix="/financial")


@financial_router.get("/summary")
async def financial_summary(
    period: str = Query("today", description="today|week|month"),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_role(UserRole.SUPERADMIN, UserRole.GERENTE)),
):
    now = datetime.now(timezone.utc)
    if period == "today":
        start = now.replace(hour=0, minute=0, second=0, microsecond=0)
    elif period == "week":
        start = now - timedelta(days=7)
    else:
        start = now - timedelta(days=30)

    result = await db.execute(
        select(
            func.count(Financial.id),
            func.sum(Financial.total_amount),
            func.sum(Financial.operational_cost),
            func.avg(Financial.total_amount),
        ).where(Financial.period_date >= start)
    )
    row = result.one()
    return {
        "period": period,
        "total_transactions": row[0] or 0,
        "total_paid": round(float(row[1] or 0), 2),
        "total_costs": round(float(row[2] or 0), 2),
        "avg_per_delivery": round(float(row[3] or 0), 2),
        "margin": round(float((row[1] or 0) - (row[2] or 0)), 2),
    }


@financial_router.get("/rider/{rider_id}")
async def rider_earnings(
    rider_id: str,
    period: str = Query("today"),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    now = datetime.now(timezone.utc)
    start = now.replace(hour=0, minute=0, second=0) if period == "today" else now - timedelta(days=30)
    result = await db.execute(
        select(func.sum(Financial.total_amount), func.count(Financial.id))
        .where(Financial.rider_id == uuid.UUID(rider_id), Financial.period_date >= start)
    )
    row = result.one()
    return {
        "rider_id": rider_id,
        "period": period,
        "total_earnings": round(float(row[0] or 0), 2),
        "total_deliveries": row[1] or 0,
    }


# ─────────────────────────────────────────────────────────────────────────────
# PRODUCTIVITY
# ─────────────────────────────────────────────────────────────────────────────
productivity_router = APIRouter(prefix="/productivity")


@productivity_router.get("/rider/{rider_id}")
async def rider_productivity(
    rider_id: str,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    result = await db.execute(
        select(Productivity)
        .where(Productivity.rider_id == uuid.UUID(rider_id))
        .order_by(Productivity.date.desc())
        .limit(30)
    )
    items = result.scalars().all()
    return [
        {
            "date": p.date.isoformat(),
            "total_orders": p.total_orders,
            "orders_on_time": p.orders_on_time,
            "avg_delivery_time_min": p.avg_delivery_time_min,
            "orders_per_hour": p.orders_per_hour,
            "sla_compliance_pct": p.sla_compliance_pct,
            "total_earnings": p.total_earnings,
            "performance_score": p.performance_score,
        }
        for p in items
    ]


@productivity_router.get("/ranking")
async def performance_ranking(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_role(UserRole.SUPERADMIN, UserRole.GERENTE, UserRole.OPERADOR)),
):
    today = datetime.now(timezone.utc).date()
    result = await db.execute(
        select(Productivity)
        .where(func.date(Productivity.date) == today)
        .order_by(Productivity.performance_score.desc())
        .limit(10)
    )
    items = result.scalars().all()
    return [
        {
            "rank": i + 1,
            "rider_id": str(p.rider_id),
            "total_orders": p.total_orders,
            "sla_pct": p.sla_compliance_pct,
            "score": p.performance_score,
        }
        for i, p in enumerate(items)
    ]


# ─────────────────────────────────────────────────────────────────────────────
# ROUTES GPS
# ─────────────────────────────────────────────────────────────────────────────
routes_router = APIRouter(prefix="/routes")


class GPSPoint(BaseModel):
    lat: float
    lng: float


@routes_router.post("/{rider_id}/track")
async def add_gps_point(
    rider_id: str,
    point: GPSPoint,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    result = await db.execute(
        select(Route)
        .where(Route.rider_id == uuid.UUID(rider_id), Route.ended_at == None)
        .order_by(Route.started_at.desc())
    )
    route = result.scalar_one_or_none()

    if not route:
        route = Route(
            rider_id=uuid.UUID(rider_id),
            gps_points=[],
            started_at=datetime.now(timezone.utc),
        )
        db.add(route)
        await db.flush()

    points = list(route.gps_points or [])
    points.append({"lat": point.lat, "lng": point.lng, "ts": datetime.now(timezone.utc).isoformat()})
    route.gps_points = points

    result2 = await db.execute(select(Rider).where(Rider.id == uuid.UUID(rider_id)))
    rider = result2.scalar_one_or_none()
    if rider:
        rider.last_lat = point.lat
        rider.last_lng = point.lng
        rider.last_location_at = datetime.now(timezone.utc)

    await db.commit()
    return {"ok": True, "points_count": len(points)}


# ─────────────────────────────────────────────────────────────────────────────
# DASHBOARD
# ─────────────────────────────────────────────────────────────────────────────
dashboard_router = APIRouter(prefix="/dashboard")


@dashboard_router.get("/manager")
async def manager_dashboard(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_role(UserRole.SUPERADMIN, UserRole.GERENTE)),
):
    today = datetime.now(timezone.utc).date()

    orders_today = await db.execute(
        select(func.count(Order.id)).where(func.date(Order.created_at) == today)
    )
    delivered_today = await db.execute(
        select(func.count(Order.id)).where(
            func.date(Order.created_at) == today,
            Order.status == OrderStatus.ENTREGADO,
        )
    )
    sla_breached = await db.execute(
        select(func.count(Order.id)).where(
            func.date(Order.created_at) == today,
            Order.delivered_at.is_not(None),
            Order.sla_deadline.is_not(None),
            Order.delivered_at > Order.sla_deadline,
        )
    )
    active_riders = await db.execute(
        select(func.count(Rider.id)).where(Rider.is_online == True)
    )
    avg_time = await db.execute(
        select(func.avg(Delivery.duration_minutes)).where(
            func.date(Delivery.created_at) == today
        )
    )
    total_orders = orders_today.scalar() or 0
    total_delivered = delivered_today.scalar() or 0
    total_breached = sla_breached.scalar() or 0
    sla_pct = round((total_delivered - total_breached) / max(total_delivered, 1) * 100, 1)

    return {
        "orders_today": total_orders,
        "delivered_today": total_delivered,
        "pending_orders": total_orders - total_delivered,
        "sla_compliance_pct": sla_pct,
        "sla_breached": total_breached,
        "active_riders": active_riders.scalar() or 0,
        "avg_delivery_time_min": round(float(avg_time.scalar() or 0), 1),
    }


@dashboard_router.get("/operator")
async def operator_dashboard(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_role(UserRole.SUPERADMIN, UserRole.GERENTE, UserRole.OPERADOR)),
):
    pending = await db.execute(
        select(Order).where(Order.status.in_([OrderStatus.PENDIENTE, OrderStatus.ASIGNADO])).limit(20)
    )
    in_route = await db.execute(
        select(Rider).where(Rider.is_online == True, Rider.last_lat != None).limit(50)
    )
    return {
        "pending_orders": [
            {"id": str(o.id), "number": o.external_id, "status": o.status.value,
             "address": o.delivery_address, "priority": o.priority}
            for o in pending.scalars().all()
        ],
        "riders_online": [
            {"id": str(r.id), "lat": r.last_lat, "lng": r.last_lng}
            for r in in_route.scalars().all()
        ],
    }


# ─────────────────────────────────────────────────────────────────────────────
# ALERTS
# ─────────────────────────────────────────────────────────────────────────────
alerts_router = APIRouter(prefix="/alerts")


@alerts_router.get("")
async def get_alerts(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    breached = await db.execute(
        select(Order).where(
            Order.delivered_at.is_not(None),
            Order.sla_deadline.is_not(None),
            Order.delivered_at > Order.sla_deadline,
            Order.status.notin_([OrderStatus.ENTREGADO, OrderStatus.CANCELADO]),
        ).limit(20)
    )
    return {
        "sla_breaches": [
            {"order_id": str(o.id), "number": o.external_id, "address": o.delivery_address}
            for o in breached.scalars().all()
        ]
    }


# ─────────────────────────────────────────────────────────────────────────────
# AUDIT
# ─────────────────────────────────────────────────────────────────────────────
audit_router = APIRouter(prefix="/audit")


@audit_router.get("")
async def get_audit_logs(
    limit: int = Query(50, le=200),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_role(UserRole.SUPERADMIN, UserRole.GERENTE)),
):
    result = await db.execute(
        select(AuditLog).order_by(AuditLog.created_at.desc()).limit(limit)
    )
    items = result.scalars().all()
    return [
        {
            "id": str(a.id),
            "user_id": str(a.user_id) if a.user_id else None,
            "action": a.action,
            "resource": a.resource,
            "resource_id": a.resource_id,
            "ip_address": a.ip_address,
            "created_at": a.created_at.isoformat(),
        }
        for a in items
    ]


# ─────────────────────────────────────────────────────────────────────────────
# INTEGRATIONS
# ─────────────────────────────────────────────────────────────────────────────
integrations_router = APIRouter(prefix="/integrations")


@integrations_router.get("")
async def list_integrations(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_role(UserRole.SUPERADMIN, UserRole.GERENTE)),
):
    result = await db.execute(select(Integration).order_by(Integration.created_at.desc()))
    items = result.scalars().all()
    return [
        {
            "id": str(i.id),
            "name": i.name,
            "type": i.type,
            "is_active": i.is_active,
            "last_sync_at": i.last_sync_at.isoformat() if i.last_sync_at else None,
        }
        for i in items
    ]


# ─────────────────────────────────────────────────────────────────────────────
# USERS
# ─────────────────────────────────────────────────────────────────────────────
users_router = APIRouter(prefix="/users")


@users_router.get("")
async def list_users(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_role(UserRole.SUPERADMIN, UserRole.GERENTE)),
):
    result = await db.execute(
        select(User).where(User.is_deleted == False).order_by(User.created_at.desc())
    )
    items = result.scalars().all()
    return [
        {
            "id": str(u.id),
            "email": u.email,
            "full_name": u.full_name,
            "role": u.role.value,
            "is_active": u.is_active,
            "created_at": u.created_at.isoformat(),
        }
        for u in items
    ]
