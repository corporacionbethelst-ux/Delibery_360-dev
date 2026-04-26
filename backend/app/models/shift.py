"""Shift model for rider work schedule management."""

import uuid
from datetime import datetime
from sqlalchemy import Column, String, DateTime, ForeignKey, Enum as SQLEnum, Float, Time, Integer
from sqlalchemy.orm import relationship
from sqlalchemy.dialects.postgresql import UUID
import enum

from app.core.database import Base


class ShiftStatus(str, enum.Enum):
    """Shift status."""
    PROGRAMADO = "programado"
    EN_CURSO = "en_curso"
    COMPLETADO = "completado"
    CANCELADO = "cancelado"
    INCOMPLETO = "incompleto"


class Shift(Base):
    """Shift model tracking rider work periods."""
    
    __tablename__ = "shifts"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4, index=True)
    rider_id = Column(UUID(as_uuid=True), ForeignKey("riders.id"), nullable=False, index=True)
    
    # Schedule
    shift_date = Column(DateTime, nullable=False, index=True)
    start_time = Column(Time, nullable=False)
    end_time = Column(Time, nullable=False)
    
    # Actual Times
    check_in_at = Column(DateTime)
    check_out_at = Column(DateTime)
    
    # Status
    status = Column(SQLEnum(ShiftStatus), default=ShiftStatus.PROGRAMADO)
    
    # Location
    check_in_latitude = Column(Float)
    check_in_longitude = Column(Float)
    check_out_latitude = Column(Float)
    check_out_longitude = Column(Float)
    
    # Performance
    total_deliveries = Column(Integer, default=0)
    completed_deliveries = Column(Integer, default=0)
    total_earnings = Column(Float, default=0.0)
    
    # Notes
    notes = Column(String(500))
    cancellation_reason = Column(String(255))
    
    # Timestamps
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    # CORRECCIÓN: Eliminado back_populates="shifts" porque no existe en Rider
    rider = relationship("Rider")
    
    # Relación con CheckInOut (bidireccional dentro del mismo archivo)
    check_ins = relationship("CheckInOut", back_populates="shift", cascade="all, delete-orphan")
    
    # Relación con ProductivityRecord
    productivity_records = relationship("ProductivityRecord", back_populates="shift")
    
    def __repr__(self):
        return f"<Shift(id={self.id}, rider={self.rider_id}, date={self.shift_date})>"


class CheckInOut(Base):
    """Check-in/Check-out registration for riders."""
    
    __tablename__ = "check_in_out"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4, index=True)
    rider_id = Column(UUID(as_uuid=True), ForeignKey("riders.id"), nullable=False, index=True)
    shift_id = Column(UUID(as_uuid=True), ForeignKey("shifts.id"), nullable=True, index=True)
    
    check_type = Column(String(10), nullable=False)
    timestamp = Column(DateTime, default=datetime.utcnow, nullable=False)
    
    latitude = Column(Float)
    longitude = Column(Float)
    
    device_id = Column(String(255))
    ip_address = Column(String(45))
    
    notes = Column(String(500))
    
    created_at = Column(DateTime, default=datetime.utcnow)
    
    # Relationships
    # CORRECCIÓN: Eliminado back_populates="check_ins" en Rider
    rider = relationship("Rider")
    shift = relationship("Shift", back_populates="check_ins")
    
    def __repr__(self):
        return f"<CheckInOut(id={self.id}, rider={self.rider_id}, type={self.check_type})>"