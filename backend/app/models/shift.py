"""Shift model for rider work schedule management."""

import uuid
from datetime import datetime, date
from sqlalchemy import Column, String, DateTime, ForeignKey, Enum as SQLEnum, Boolean, Float, Interval, Time
from sqlalchemy.orm import relationship
from sqlalchemy.dialects.postgresql import UUID
import enum

from app.core.database import Base


class ShiftStatus(str, enum.Enum):
    PROGRAMADO = "programado"  # Planificado
    EN_CURSO = "en_curso"  # Actualmente activo
    COMPLETADO = "completado"  # Finalizado normalmente
    CANCELADO = "cancelado"  # Cancelado
    INCOMPLETO = "incompleto"  # Iniciado pero no completado


class Shift(Base):
    
    __tablename__ = "shifts"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4, index=True)
    rider_id = Column(UUID(as_uuid=True), ForeignKey("riders.id"), nullable=False, index=True)
    
    # Schedule
    shift_date = Column(DateTime, nullable=False, index=True)  # Fecha del turno
    start_time = Column(Time, nullable=False)  # Hora inicio programada
    end_time = Column(Time, nullable=False)  # Hora fin programada
    
    # Actual Times
    check_in_at = Column(DateTime)  # Check-in real
    check_out_at = Column(DateTime)  # Check-out real
    
    # Status
    status = Column(SQLEnum(ShiftStatus), default=ShiftStatus.PROGRAMADO)
    
    # Location
    check_in_latitude = Column(Float)
    check_in_longitude = Column(Float)
    check_out_latitude = Column(Float)
    check_out_longitude = Column(Float)
    
    # Performance during shift
    total_deliveries = Column(Integer, default=0)
    completed_deliveries = Column(Integer, default=0)
    total_earnings = Column(Float, default=0.0)  # Ganancias del turno
    
    # Notes
    notes = Column(String(500))
    cancellation_reason = Column(String(255))
    
    # Timestamps
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    rider = relationship("Rider", back_populates="shifts")
    productivity_records = relationship("ProductivityRecord", back_populates="shift")
    
    def __repr__(self):
        return f"<Shift(id={self.id}, rider={self.rider_id}, date={self.shift_date})>"


class CheckInOut(Base):
    
    __tablename__ = "check_in_out"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4, index=True)
    rider_id = Column(UUID(as_uuid=True), ForeignKey("riders.id"), nullable=False, index=True)
    shift_id = Column(UUID(as_uuid=True), ForeignKey("shifts.id"), nullable=True, index=True)
    
    # Type
    check_type = Column(String(10), nullable=False)  # "check_in" or "check_out"
    
    # Timestamp
    timestamp = Column(DateTime, default=datetime.utcnow, nullable=False)
    
    # Location
    latitude = Column(Float)
    longitude = Column(Float)
    
    # Device info
    device_id = Column(String(255))
    ip_address = Column(String(45))
    
    # Notes
    notes = Column(String(500))
    
    # Timestamps
    created_at = Column(DateTime, default=datetime.utcnow)
    
    # Relationships
    rider = relationship("Rider", back_populates="check_ins")
    shift = relationship("Shift", back_populates="check_ins")
    
    def __repr__(self):
        return f"<CheckInOut(id={self.id}, rider={self.rider_id}, type={self.check_type})>"
