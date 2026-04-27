"""Rider model for delivery personnel management."""

import uuid
from datetime import datetime, timezone
from typing import Any, Optional, List
from sqlalchemy import Column, String, Float, DateTime, ForeignKey, Enum as SQLEnum, Boolean, JSON, Integer, Text
from sqlalchemy.orm import relationship
from sqlalchemy.dialects.postgresql import UUID
import enum

from app.core.database import Base

def utc_now_naive():
    """Devuelve la hora actual en UTC sin zona horaria (naive)."""
    return datetime.now(timezone.utc).replace(tzinfo=None)

class RiderStatus(str, enum.Enum):
    PENDIENTE = "pendiente"
    ACTIVO = "activo"
    INACTIVO = "inactivo"
    OCUPADO = "ocupado"
    SUSPENDIDO = "suspendido"

class VehicleType(str, enum.Enum):
    MOTO = "moto"
    BICICLETA = "bicicleta"
    PATINETA = "patineta"
    AUTO = "auto"
    FURGONETA = "furgoneta"

class Rider(Base):
    __tablename__ = "riders"
    
    # ID Principal del Rider
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4, index=True)
    
    # Relación con User (Clave Foránea)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), unique=True, index=True, nullable=False)
    
    # Datos Específicos del Repartidor
    vehicle_type: Any = Column(SQLEnum(VehicleType), default=VehicleType.MOTO)
    vehicle_plate = Column(String(20))
    vehicle_model = Column(String(100))
    operating_zone = Column(String(100))
    
    # Documentos e Identificación (Brasil)
    cpf = Column(String(14))
    cnh = Column(String(20))
    
    # Estado y Ubicación
    status: Any = Column(SQLEnum(RiderStatus), default=RiderStatus.PENDIENTE)
    is_online = Column(Boolean, default=False)
    last_lat = Column(Float)
    last_lng = Column(Float)
    last_location_at = Column(DateTime)
    
    # Gamificación / Rendimiento
    level = Column(Integer, default=1)
    total_points = Column(Integer, default=0)
    badges = Column(JSON, default=list)
    notes = Column(Text)
    documents = Column(JSON) # Para guardar estado de aprobación/rechazo
    
    # Fechas
    approved_at = Column(DateTime)
    created_at = Column(DateTime, default=utc_now_naive)
    updated_at = Column(DateTime, default=utc_now_naive, onupdate=utc_now_naive)
    
    # Relaciones
    user = relationship("User", back_populates="rider_profile")
    orders = relationship("Order", back_populates="rider")
    deliveries = relationship("Delivery", back_populates="rider")

    def __repr__(self):
        return f"<Rider(id={self.id}, user_id={self.user_id}, status={self.status})>"