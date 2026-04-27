"""Rider model for delivery personnel management."""

import uuid
from datetime import datetime, timezone  # CORREGIDO
from typing import Any
from sqlalchemy import Column, String, Float, DateTime, ForeignKey, Enum as SQLEnum, Boolean, JSON
from sqlalchemy.orm import relationship
from sqlalchemy.dialects.postgresql import UUID
import enum

from app.core.database import Base

class RiderStatus(str, enum.Enum):
    ACTIVO = "activo"
    INACTIVO = "inactivo"
    OCUPADO = "ocupado"
    VACACIONES = "vacaciones"
    SUSPENDIDO = "suspendido"
    ACTIVE = "activo"
    INACTIVE = "inactivo"
    BUSY = "ocupado"
    ON_LEAVE = "vacaciones"
    SUSPENDED = "suspendido"
    PENDIENTE = "pendiente"

class VehicleType(str, enum.Enum):
    MOTO = "moto"
    BICICLETA = "bicicleta"
    PATINETA = "patineta"
    AUTO = "auto"
    FURGONETA = "furgoneta"
    MOTORCYCLE = "moto"
    BICYCLE = "bicicleta"
    SCOOTER = "patineta"
    CAR = "auto"
    VAN = "furgoneta"

class Rider(Base):
    __tablename__ = "riders"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4, index=True)
    first_name = Column(String(100), nullable=False)
    last_name = Column(String(100), nullable=False)
    email = Column(String(255), unique=True, index=True, nullable=False)
    phone = Column(String(20), unique=True, nullable=False)
    document_type = Column(String(20))
    document_number = Column(String(50), unique=True)
    
    vehicle_type: Any = Column(SQLEnum(VehicleType), default=VehicleType.MOTO)
    vehicle_plate = Column(String(20))
    vehicle_model = Column(String(100))
    vehicle_color = Column(String(50))
    
    status: Any = Column(SQLEnum(RiderStatus), default=RiderStatus.INACTIVO)
    is_available = Column(Boolean, default=False)
    current_lat = Column(Float)
    current_lng = Column(Float)
    last_location_update = Column(DateTime)
    
    total_deliveries = Column(String, default="0")
    average_rating = Column(Float, default=0.0)
    total_earnings = Column(Float, default=0.0)
    
    license_url = Column(String(500))
    insurance_url = Column(String(500))
    background_check_url = Column(String(500))
    profile_photo_url = Column(String(500))
    
    # CORREGIDO
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    updated_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc))
    
    orders = relationship("Order", back_populates="rider")
    deliveries = relationship("Delivery", back_populates="rider")

    def __repr__(self):
        return f"<Rider(id={self.id}, name={self.first_name} {self.last_name}, status={self.status})>"