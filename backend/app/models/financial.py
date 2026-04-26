"""Financial models for rider payments and transactions."""

import uuid
from datetime import datetime
from typing import Any  # <--- IMPORTACIÓN AGREGADA
from sqlalchemy import Column, String, Float, DateTime, ForeignKey, Enum as SQLEnum, Numeric, Text
from sqlalchemy.orm import relationship
from sqlalchemy.dialects.postgresql import UUID
import enum

from app.core.database import Base


class TransactionType(str, enum.Enum):
    """Transaction types."""
    PAGO_ENTREGA = "pago_entrega"
    BONO = "bono"
    DESCUENTO = "descuento"
    AJUSTE = "ajuste"
    RETIRO = "retiro"


class PaymentStatus(str, enum.Enum):
    """Payment status."""
    PENDIENTE = "pendiente"
    PROCESADO = "procesado"
    PAGADO = "pagado"
    RECHAZADO = "rechazado"


class Financial(Base):
    """Financial transaction record for riders."""
    
    __tablename__ = "financials"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4, index=True)
    rider_id = Column(UUID(as_uuid=True), ForeignKey("riders.id"), nullable=False, index=True)
    shift_id = Column(UUID(as_uuid=True), ForeignKey("shifts.id"), nullable=True, index=True)
    
    # Transaction Details
    transaction_type: Any = Column(SQLEnum(TransactionType), nullable=False)
    amount = Column(Numeric(10, 2), nullable=False, default=0.0)
    balance_after = Column(Numeric(10, 2), default=0.0)
    
    # Status
    status: Any = Column(SQLEnum(PaymentStatus), default=PaymentStatus.PENDIENTE)
    
    # Description
    description = Column(Text)
    reference_id = Column(String(100))
    
    # Timestamps
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships (Unidireccionales para evitar errores de configuración)
    rider = relationship("Rider")
    shift = relationship("Shift")
    
    def __repr__(self):
        return f"<Financial(id={self.id}, rider={self.rider_id}, amount={self.amount})>"