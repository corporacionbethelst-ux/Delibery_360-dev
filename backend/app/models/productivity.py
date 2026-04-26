"""Productivity models for tracking rider performance."""

import uuid
from datetime import datetime
from typing import Any  # <--- IMPORTACIÓN AGREGADA
from sqlalchemy import Column, String, Float, DateTime, ForeignKey, Enum as SQLEnum, Integer
from sqlalchemy.orm import relationship
from sqlalchemy.dialects.postgresql import UUID
import enum

from app.core.database import Base


class MetricType(str, enum.Enum):
    """Types of productivity metrics."""
    ENTREGAS_TOTAL = "entregas_total"
    TIEMPO_PROMEDIO = "tiempo_promedio"
    CALIFICACION = "calificacion"
    DISTANCIA_TOTAL = "distancia_total"
    INGRESOS_TURNO = "ingresos_turno"


class ProductivityRecord(Base):
    """Productivity metric record."""
    
    __tablename__ = "productivity_records"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4, index=True)
    rider_id = Column(UUID(as_uuid=True), ForeignKey("riders.id"), nullable=False, index=True)
    shift_id = Column(UUID(as_uuid=True), ForeignKey("shifts.id"), nullable=True, index=True)
    
    # Metric Details
    metric_type: Any = Column(SQLEnum(MetricType), nullable=False)
    value = Column(Float, nullable=False)
    unit = Column(String(50))  # km, min, USD, etc.
    
    # Context
    date = Column(DateTime, nullable=False)
    notes = Column(String(500))
    
    # Timestamps
    created_at = Column(DateTime, default=datetime.utcnow)
    
    # Relationships (Unidireccionales)
    rider = relationship("Rider")
    shift = relationship("Shift")
    
    def __repr__(self):
        return f"<ProductivityRecord(id={self.id}, rider={self.rider_id}, type={self.metric_type})>"