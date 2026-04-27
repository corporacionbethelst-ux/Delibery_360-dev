"""Notification model."""
from datetime import datetime, timezone  # CORREGIDO
from typing import Any
from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, Enum as SQLEnum, Text, Boolean, JSON
from sqlalchemy.orm import relationship
import enum
from app.core.database import Base

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
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), index=True)
    rider_id = Column(Integer, ForeignKey("riders.id"), index=True)
    
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
    related_id = Column(Integer)
    
    scheduled_for = Column(DateTime)
    expires_at = Column(DateTime)
    
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), index=True)

    def __repr__(self):
        return f"<Notification(id={self.id}, type={self.notification_type})>"

class Alert(Base):
    __tablename__ = "alerts"
    
    id = Column(Integer, primary_key=True, index=True)
    alert_type = Column(String(50), nullable=False)
    severity = Column(String(20), default="medium")
    title = Column(String(255), nullable=False)
    description = Column(Text)
    
    order_id = Column(Integer, ForeignKey("orders.id"))
    delivery_id = Column(Integer, ForeignKey("deliveries.id"))
    rider_id = Column(Integer, ForeignKey("riders.id"))
    
    status = Column(String(20), default="active")
    acknowledged_by = Column(Integer, ForeignKey("users.id"))
    acknowledged_at = Column(DateTime)
    resolved_by = Column(Integer, ForeignKey("users.id"))
    resolved_at = Column(DateTime)
    resolution_notes = Column(Text)
    
    auto_resolve_at = Column(DateTime)
    auto_resolved = Column(Boolean, default=False)
    
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), index=True)
    updated_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc))

    def __repr__(self):
        return f"<Alert(id={self.id}, type={self.alert_type})>"