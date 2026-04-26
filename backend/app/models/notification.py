"""Notification model for system alerts and communications."""

import uuid
from datetime import datetime
from typing import Any
from sqlalchemy import Column, String, DateTime, ForeignKey, Enum as SQLEnum, Text, Boolean, JSON
from sqlalchemy.dialects.postgresql import UUID
import enum

from app.core.database import Base


class NotificationType(str, enum.Enum):
    """Types of notifications."""
    ALERTA_OPERACIONAL = "alerta_operacional"
    ASIGNACION_PEDIDO = "asignacion_pedido"
    ESTADO_ENTREGA = "estado_entrega"
    RECORDATORIO = "recordatorio"
    LOGRO = "logro"
    SISTEMA = "sistema"
    URGENTE = "urgente"


class NotificationPriority(str, enum.Enum):
    """Notification priority levels."""
    BAJA = "baja"
    NORMAL = "normal"
    ALTA = "alta"
    CRITICA = "critica"


class Notification(Base):
    """Notification model for system communications."""
    
    __tablename__ = "notifications"
    
    # CORRECCIÓN: ID como UUID
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4, index=True)
    
    # Recipient - CORRECCIÓN: Claves foráneas como UUID
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), index=True)
    rider_id = Column(UUID(as_uuid=True), ForeignKey("riders.id"), index=True)
    
    # Content
    notification_type: Any = Column(SQLEnum(NotificationType), nullable=False)
    priority: Any = Column(SQLEnum(NotificationPriority), default=NotificationPriority.NORMAL)
    title = Column(String(255), nullable=False)
    message = Column(Text, nullable=False)
    data = Column(JSON)
    
    # Delivery Channels
    channels = Column(String(100))
    sent_channels = Column(String(100))
    
    # Status
    is_read = Column(Boolean, default=False)
    read_at = Column(DateTime)
    is_sent = Column(Boolean, default=False)
    sent_at = Column(DateTime)
    failed_channels = Column(String(100))
    error_message = Column(Text)
    
    # Action
    action_url = Column(String(500))
    action_type = Column(String(50))
    
    # Related Entity - CORRECCIÓN: related_id puede ser string o UUID dependiendo del uso, lo dejamos genérico o UUID si es FK
    related_type = Column(String(50))
    related_id = Column(UUID(as_uuid=True), nullable=True)  # Asumiendo que referencia a entidades UUID
    
    # Scheduling
    scheduled_for = Column(DateTime)
    expires_at = Column(DateTime)
    
    # Timestamps
    created_at = Column(DateTime, default=datetime.utcnow, index=True)
    
    def __repr__(self):
        return f"<Notification(id={self.id}, type={self.notification_type})>"


class Alert(Base):
    """Operational alerts requiring attention."""
    
    __tablename__ = "alerts"
    
    # CORRECCIÓN: ID como UUID
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4, index=True)
    
    # Alert Information
    alert_type = Column(String(50), nullable=False)
    severity = Column(String(20), default="medium")
    title = Column(String(255), nullable=False)
    description = Column(Text)
    
    # Related Entities - CORRECCIÓN: Claves foráneas como UUID
    order_id = Column(UUID(as_uuid=True), ForeignKey("orders.id"))
    delivery_id = Column(UUID(as_uuid=True), ForeignKey("deliveries.id"))
    rider_id = Column(UUID(as_uuid=True), ForeignKey("riders.id"))
    
    # Status
    status = Column(String(20), default="active")
    
    # Acknowledgement/Resolution - CORRECCIÓN: Users son UUID
    acknowledged_by = Column(UUID(as_uuid=True), ForeignKey("users.id"))
    acknowledged_at = Column(DateTime)
    resolved_by = Column(UUID(as_uuid=True), ForeignKey("users.id"))
    resolved_at = Column(DateTime)
    resolution_notes = Column(Text)
    
    # Auto-resolution
    auto_resolve_at = Column(DateTime)
    auto_resolved = Column(Boolean, default=False)
    
    # Timestamps
    created_at = Column(DateTime, default=datetime.utcnow, index=True)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    def __repr__(self):
        return f"<Alert(id={self.id}, type={self.alert_type})>"