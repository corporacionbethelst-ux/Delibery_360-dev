"""Rider model for delivery personnel management."""

import uuid
from datetime import datetime
from typing import Any, List
from sqlalchemy import Column, String, Float, DateTime, ForeignKey, Enum as SQLEnum, Boolean, JSON
from sqlalchemy.orm import relationship
from sqlalchemy.dialects.postgresql import UUID
import enum

from app.core.database import Base


class RiderStatus(str, enum.Enum):
    """Rider availability status."""
    ACTIVO = "activo"
    INACTIVO = "inactivo"
    OCUPADO = "ocupado"
    VACACIONES = "vacaciones"
    SUSPENDIDO = "suspendido"

    # Aliases
    ACTIVE = "activo"
    INACTIVE = "inactivo"
    BUSY = "ocupado"
    ON_LEAVE = "vacaciones"
    SUSPENDED = "suspendido"


class VehicleType(str, enum.Enum):
    """Vehicle types for riders."""
    MOTO = "moto"
    BICICLETA = "bicicleta"
    PATINETA = "patineta"
    AUTO = "auto"
    FURGONETA = "furgoneta"

    # Aliases
    MOTORCYCLE = "moto"
    BICYCLE = "bicicleta"
    SCOOTER = "patineta"
    CAR = "auto"
    VAN = "furgoneta"


class Rider(Base):
    """Rider model representing delivery personnel."""
    
    __tablename__ = "riders"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4, index=True)
    
    # Personal Information
    first_name = Column(String(100), nullable=False)
    last_name = Column(String(100), nullable=False)
    email = Column(String(255), unique=True, index=True, nullable=False)
    phone = Column(String(20), unique=True, nullable=False)
    document_type = Column(String(20))  # cedula, passport, etc.
    document_number = Column(String(50), unique=True)
    
    # Vehicle Information
    vehicle_type: Any = Column(SQLEnum(VehicleType), default=VehicleType.MOTO)
    vehicle_plate = Column(String(20))
    vehicle_model = Column(String(100))
    vehicle_color = Column(String(50))
    
    # Status & Availability
    status: Any = Column(SQLEnum(RiderStatus), default=RiderStatus.INACTIVO)
    is_available = Column(Boolean, default=False)
    current_lat = Column(Float)
    current_lng = Column(Float)
    last_location_update = Column(DateTime)
    
    # Performance Metrics
    total_deliveries = Column(String, default=0)
    average_rating = Column(Float, default=0.0)
    total_earnings = Column(Float, default=0.0)
    
    # Documents (URLs to stored files)
    license_url = Column(String(500))
    insurance_url = Column(String(500))
    background_check_url = Column(String(500))
    profile_photo_url = Column(String(500))
    
    # Timestamps
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    # Relación con Orders (a través del campo assigned_rider_id en Order)
    orders = relationship("Order", back_populates="rider")
    
    # Relación con Deliveries (clave foránea en Delivery.rider_id)
    deliveries = relationship("Delivery", back_populates="rider")
    
    # NOTA: Se eliminó la relación 'routes' porque no existe una FK directa entre riders y routes.
    # Para obtener las rutas de un rider, usa: rider.deliveries -> delivery.route
    
    def __repr__(self):
        return f"<Rider(id={self.id}, name={self.first_name} {self.last_name}, status={self.status})>"