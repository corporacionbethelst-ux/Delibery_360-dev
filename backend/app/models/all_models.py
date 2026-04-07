import uuid
from datetime import datetime, timezone
from enum import Enum as PyEnum
from sqlalchemy import String, DateTime, Enum, Float, ForeignKey, Text, Integer, Boolean
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy.dialects.postgresql import UUID, JSONB
from app.core.database import Base


# ── Delivery ──────────────────────────────────────────────────────────────────
class Delivery(Base):
    __tablename__ = "deliveries"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    order_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("orders.id"), unique=True)
    rider_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("riders.id"))

    # Prueba de entrega
    photo_url: Mapped[str | None] = mapped_column(String(500))
    signature_url: Mapped[str | None] = mapped_column(String(500))
    otp_code: Mapped[str | None] = mapped_column(String(10))
    otp_verified: Mapped[bool] = mapped_column(Boolean, default=False)

    # Geolocalización de entrega
    delivery_lat: Mapped[float | None] = mapped_column(Float)
    delivery_lng: Mapped[float | None] = mapped_column(Float)

    # Métricas de tiempo
    pickup_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
    delivered_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
    duration_minutes: Mapped[float | None] = mapped_column(Float)
    distance_km: Mapped[float | None] = mapped_column(Float)

    # Calidad
    on_time: Mapped[bool | None] = mapped_column(Boolean)
    customer_rating: Mapped[int | None] = mapped_column(Integer)
    notes: Mapped[str | None] = mapped_column(Text)

    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))

    order = relationship("Order", back_populates="delivery")
    rider = relationship("Rider", back_populates="deliveries")


# ── Shift ─────────────────────────────────────────────────────────────────────
class ShiftStatus(str, PyEnum):
    ACTIVO = "activo"
    CERRADO = "cerrado"


class Shift(Base):
    __tablename__ = "shifts"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    rider_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("riders.id"))

    checkin_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)
    checkout_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
    checkin_lat: Mapped[float | None] = mapped_column(Float)
    checkin_lng: Mapped[float | None] = mapped_column(Float)

    status: Mapped[ShiftStatus] = mapped_column(Enum(ShiftStatus), default=ShiftStatus.ACTIVO)
    total_orders: Mapped[int] = mapped_column(Integer, default=0)
    total_earnings: Mapped[float] = mapped_column(Float, default=0.0)
    duration_hours: Mapped[float | None] = mapped_column(Float)

    rider = relationship("Rider", back_populates="shifts")


# ── Financial ────────────────────────────────────────────────────────────────
class PaymentRuleType(str, PyEnum):
    FIJA = "fija"
    VARIABLE = "variable"
    HIBRIDA = "hibrida"


class Financial(Base):
    __tablename__ = "financials"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    rider_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("riders.id"))
    order_id: Mapped[uuid.UUID | None] = mapped_column(UUID(as_uuid=True), ForeignKey("orders.id"))

    rule_type: Mapped[PaymentRuleType] = mapped_column(Enum(PaymentRuleType), default=PaymentRuleType.FIJA)
    base_amount: Mapped[float] = mapped_column(Float, default=0.0)
    distance_bonus: Mapped[float] = mapped_column(Float, default=0.0)
    time_bonus: Mapped[float] = mapped_column(Float, default=0.0)
    volume_bonus: Mapped[float] = mapped_column(Float, default=0.0)
    total_amount: Mapped[float] = mapped_column(Float, default=0.0)

    operational_cost: Mapped[float] = mapped_column(Float, default=0.0)
    margin: Mapped[float] = mapped_column(Float, default=0.0)

    period_date: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)
    liquidated: Mapped[bool] = mapped_column(Boolean, default=False)
    liquidated_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))

    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))


# ── Route ────────────────────────────────────────────────────────────────────
class Route(Base):
    __tablename__ = "routes"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    rider_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("riders.id"))
    order_id: Mapped[uuid.UUID | None] = mapped_column(UUID(as_uuid=True), ForeignKey("orders.id"))

    gps_points: Mapped[list] = mapped_column(JSONB, default=list)   # [{lat, lng, ts}]
    distance_km: Mapped[float] = mapped_column(Float, default=0.0)
    deviation_detected: Mapped[bool] = mapped_column(Boolean, default=False)
    deviation_details: Mapped[dict] = mapped_column(JSONB, default=dict)

    started_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
    ended_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))

    rider = relationship("Rider", back_populates="routes")


# ── AuditLog ─────────────────────────────────────────────────────────────────
class AuditLog(Base):
    __tablename__ = "audit_logs"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id: Mapped[uuid.UUID | None] = mapped_column(UUID(as_uuid=True), ForeignKey("users.id"))

    action: Mapped[str] = mapped_column(String(100), nullable=False)
    resource: Mapped[str] = mapped_column(String(100))
    resource_id: Mapped[str | None] = mapped_column(String(100))
    details: Mapped[dict] = mapped_column(JSONB, default=dict)
    ip_address: Mapped[str | None] = mapped_column(String(50))
    user_agent: Mapped[str | None] = mapped_column(String(500))

    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))

    user = relationship("User", back_populates="audit_logs")


# ── Notification ─────────────────────────────────────────────────────────────
class NotificationType(str, PyEnum):
    PUSH = "push"
    EMAIL = "email"
    SMS = "sms"
    IN_APP = "in_app"


class Notification(Base):
    __tablename__ = "notifications"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("users.id"))
    type: Mapped[NotificationType] = mapped_column(Enum(NotificationType), default=NotificationType.IN_APP)
    title: Mapped[str] = mapped_column(String(200), nullable=False)
    body: Mapped[str] = mapped_column(Text, nullable=False)
    data: Mapped[dict] = mapped_column(JSONB, default=dict)
    read: Mapped[bool] = mapped_column(Boolean, default=False)
    sent: Mapped[bool] = mapped_column(Boolean, default=False)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))


# ── Integration ──────────────────────────────────────────────────────────────
class Integration(Base):
    __tablename__ = "integrations"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    name: Mapped[str] = mapped_column(String(100), nullable=False)
    type: Mapped[str] = mapped_column(String(50))   # pos | erp | webhook
    config: Mapped[dict] = mapped_column(JSONB, default=dict)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)
    last_sync_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))


# ── Productivity ─────────────────────────────────────────────────────────────
class Productivity(Base):
    __tablename__ = "productivity"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    rider_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("riders.id"))

    date: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)
    total_orders: Mapped[int] = mapped_column(Integer, default=0)
    orders_on_time: Mapped[int] = mapped_column(Integer, default=0)
    avg_delivery_time_min: Mapped[float] = mapped_column(Float, default=0.0)
    orders_per_hour: Mapped[float] = mapped_column(Float, default=0.0)
    sla_compliance_pct: Mapped[float] = mapped_column(Float, default=0.0)
    total_distance_km: Mapped[float] = mapped_column(Float, default=0.0)
    total_earnings: Mapped[float] = mapped_column(Float, default=0.0)
    performance_score: Mapped[float] = mapped_column(Float, default=0.0)

    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))