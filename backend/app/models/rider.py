import uuid
from datetime import datetime, timezone
from enum import Enum as PyEnum
from sqlalchemy import String, Boolean, DateTime, Enum, Float, ForeignKey, Integer
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy.dialects.postgresql import UUID, JSONB
from app.core.database import Base


class RiderStatus(str, PyEnum):
    PENDIENTE = "pendiente"
    ACTIVO = "activo"
    INACTIVO = "inactivo"
    SUSPENDIDO = "suspendido"


class VehicleType(str, PyEnum):
    MOTO = "moto"
    BICICLETA = "bicicleta"
    AUTO = "auto"
    PIE = "pie"


class Rider(Base):
    __tablename__ = "riders"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("users.id"), unique=True)

    # Datos personales
    cpf: Mapped[str | None] = mapped_column(String(20))          # enmascarado LGPD
    cnh: Mapped[str | None] = mapped_column(String(30))
    birth_date: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))

    # Vehículo
    vehicle_type: Mapped[VehicleType] = mapped_column(Enum(VehicleType), default=VehicleType.MOTO)
    vehicle_plate: Mapped[str | None] = mapped_column(String(20))
    vehicle_model: Mapped[str | None] = mapped_column(String(100))
    vehicle_year: Mapped[int | None] = mapped_column(Integer)

    # Estado
    status: Mapped[RiderStatus] = mapped_column(Enum(RiderStatus), default=RiderStatus.PENDIENTE)
    is_online: Mapped[bool] = mapped_column(Boolean, default=False)

    # Geolocalización
    last_lat: Mapped[float | None] = mapped_column(Float)
    last_lng: Mapped[float | None] = mapped_column(Float)
    last_location_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))

    # Gamificación
    level: Mapped[int] = mapped_column(Integer, default=1)
    total_points: Mapped[int] = mapped_column(Integer, default=0)
    badges: Mapped[dict] = mapped_column(JSONB, default=list)

    # Documentos (rutas a archivos)
    documents: Mapped[dict] = mapped_column(JSONB, default=dict)

    # Zona operativa
    operating_zone: Mapped[str | None] = mapped_column(String(100))

    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc))
    approved_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))

    # Relationships
    user = relationship("User", back_populates="rider_profile")
    orders = relationship("Order", back_populates="rider")
    deliveries = relationship("Delivery", back_populates="rider")
    shifts = relationship("Shift", back_populates="rider")
    routes = relationship("Route", back_populates="rider")
