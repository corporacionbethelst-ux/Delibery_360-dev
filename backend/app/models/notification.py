"""Notification model."""

import uuid
from datetime import datetime, timezone
from typing import Any
from sqlalchemy import Column, String, DateTime, ForeignKey, Enum as SQLEnum, Text, Boolean, JSON
from sqlalchemy.orm import relationship
from sqlalchemy.dialects.postgresql import UUID  # CORREGIDO: Importar UUID de SQLAlchemy
import enum

from app.core.database import Base

def utc_now_naive():
    """Devuelve la hora actual en UTC sin zona horaria (naive) para compatibilidad con PostgreSQL."""
    return datetime.now(timezone.utc).replace(tzinfo=None)

class NotificationType(str, enum.Enum):
    ALERTA_OPERACIONAL = "alerta_operacional"
    ASIGNACION_PEDIDO = "asignacion_pedido"
    ESTADO_ENTREGA = "estado_entrega"
    RECORDATORIO = "recordatorio"
    LOGRO = "logro"
    SISTEMA = "sistema"
    URGENTE = "urgente"


class NotificationPriority(str, enum.Enum):
    BAJA = "baja"
    NORMAL = "normal"
    ALTA = "alta"
    CRITICA = "critica"


class Notification(Base):
    __tablename__ = "notifications"
    
    # CORREGIDO: Usar UUID de SQLAlchemy
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4, index=True)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), index=True)
    rider_id = Column(UUID(as_uuid=True), ForeignKey("riders.id"), index=True)
    
    notification_type: Any = Column(SQLEnum(NotificationType), nullable=False)
    priority: Any = Column(SQLEnum(NotificationPriority), default=NotificationPriority.NORMAL)
    title = Column(String(255), nullable=False)
    message = Column(Text, nullable=False)
    data = Column(JSON)
    
    channels = Column(String(100))
    sent_channels = Column(String(100))
    
    is_read = Column(Boolean, default=False)
    read_at = Column(DateTime)
    is_sent = Column(Boolean, default=False)
    sent_at = Column(DateTime)
    failed_channels = Column(String(100))
    error_message = Column(Text)
    
    action_url = Column(String(500))
    action_type = Column(String(50))
    
    related_type = Column(String(50))
    # Si related_id apunta a tablas UUID, debería ser UUID, pero si es genérico lo dejamos flexible o String
    related_id = Column(String(100)) 
    
    scheduled_for = Column(DateTime)
    expires_at = Column(DateTime)
    
    created_at = Column(DateTime, default=utc_now_naive, index=True)

    def __repr__(self):
        return f"<Notification(id={self.id}, type={self.notification_type})>"


class Alert(Base):
    __tablename__ = "alerts"
    
    # CORREGIDO: ID como UUID
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4, index=True)
    alert_type = Column(String(50), nullable=False)
    severity = Column(String(20), default="medium")
    title = Column(String(255), nullable=False)
    description = Column(Text)
    
    # CORREGIDO: Todas las FKs como UUID para coincidir con orders, deliveries, riders, users
    order_id = Column(UUID(as_uuid=True), ForeignKey("orders.id"))
    delivery_id = Column(UUID(as_uuid=True), ForeignKey("deliveries.id"))
    rider_id = Column(UUID(as_uuid=True), ForeignKey("riders.id"))
    
    status = Column(String(20), default="active")
    acknowledged_by = Column(UUID(as_uuid=True), ForeignKey("users.id"))
    acknowledged_at = Column(DateTime)
    resolved_by = Column(UUID(as_uuid=True), ForeignKey("users.id"))
    resolved_at = Column(DateTime)
    resolution_notes = Column(Text)
    
    auto_resolve_at = Column(DateTime)
    auto_resolved = Column(Boolean, default=False)
    
    created_at = Column(DateTime, default=utc_now_naive, index=True)
    updated_at = Column(DateTime, default=utc_now_naive, onupdate=utc_now_naive)

    def __repr__(self):
        return f"<Alert(id={self.id}, type={self.alert_type})>"