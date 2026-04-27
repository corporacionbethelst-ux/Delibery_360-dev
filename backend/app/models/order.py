"""Order model."""
import uuid
from datetime import datetime, timezone  # CORREGIDO
from typing import Any
from sqlalchemy import Column, String, Float, DateTime, ForeignKey, Enum as SQLEnum, Text, Boolean, JSON, Integer
from sqlalchemy.orm import relationship
from sqlalchemy.dialects.postgresql import UUID
import enum
from app.core.database import Base

def utc_now_naive():
    """Devuelve la hora actual en UTC sin zona horaria (naive) para compatibilidad con PostgreSQL."""
    return datetime.now(timezone.utc).replace(tzinfo=None)

class OrderStatus(str, enum.Enum):
    PENDIENTE = "pendiente"
    ASIGNADO = "asignado"
    EN_RECOLECCION = "en_recoleccion"
    RECOLECTADO = "recolectado"
    EN_RUTA = "en_ruta"
    ENTREGADO = "entregado"
    FALLIDO = "fallido"
    CANCELADO = "cancelado"

class OrderPriority(str, enum.Enum):
    NORMAL = "normal"
    ALTA = "alta"
    URGENTE = "urgente"

class Order(Base):
    __tablename__ = "orders"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4, index=True)
    external_id = Column(String(100), unique=True, index=True)
    customer_name = Column(String(255), nullable=False)
    customer_phone = Column(String(20), nullable=False)
    customer_email = Column(String(255))
    
    pickup_address = Column(Text, nullable=False)
    pickup_name = Column(String(255))
    pickup_phone = Column(String(20))
    delivery_address = Column(Text, nullable=False)
    delivery_reference = Column(String(255))
    delivery_instructions = Column(Text)
    
    pickup_latitude = Column(Float)
    pickup_longitude = Column(Float)
    delivery_latitude = Column(Float)
    delivery_longitude = Column(Float)
    
    items = Column(JSON)
    subtotal = Column(Float, default=0.0)
    delivery_fee = Column(Float, default=0.0)
    total = Column(Float, default=0.0)
    
    payment_method = Column(String(50))
    payment_status = Column(String(20), default="pendiente")
    status: Any = Column(SQLEnum(OrderStatus), default=OrderStatus.PENDIENTE)
    priority: Any = Column(SQLEnum(OrderPriority), default=OrderPriority.NORMAL)
    
    assigned_rider_id = Column(UUID(as_uuid=True), ForeignKey("riders.id"), index=True)
    
    # CORREGIDO: Fechas con timezone
    ordered_at = Column(DateTime, default=utc_now_naive, nullable=False)
    accepted_at = Column(DateTime)
    picked_up_at = Column(DateTime)
    delivered_at = Column(DateTime)
    estimated_delivery_time = Column(DateTime)
    sla_deadline = Column(DateTime)
    
    failure_reason = Column(String(255))
    failure_notes = Column(Text)
    cancelled_by = Column(String(50))
    cancellation_reason = Column(Text)
    source = Column(String(50), default="app")
    integration_id = Column(String(100))
    webhook_sent = Column(Boolean, default=False)
    
    created_at = Column(DateTime, default=utc_now_naive)
    updated_at = Column(DateTime, default=utc_now_naive, onupdate=utc_now_naive)
    
    rider = relationship("Rider", back_populates="orders")
    delivery = relationship("Delivery", back_populates="order", uselist=False)

    def __repr__(self):
        return f"<Order(id={self.id}, external_id={self.external_id}, status={self.status})>"