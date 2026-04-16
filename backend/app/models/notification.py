"""Notification model for system alerts and communications."""

from datetime import datetime
from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, Enum as SQLEnum, Text, Boolean, JSON
from sqlalchemy.orm import relationship
import enum

from app.core.database import Base


class NotificationType(str, enum.Enum):
    ALERTA_OPERACIONAL = "alerta_operacional"
    ASIGNACION_PEDIDO = "asignacion_pedido"
    ESTADO_ENTREGA = "estado_entrega"
    RECORDATORIO = "recordatorio"
    LOGRO = "logro"  # Badge/ranking
    SISTEMA = "sistema"
    URGENTE = "urgente"


class NotificationChannel(str, enum.Enum):
    PUSH = "push"
    EMAIL = "email"
    SMS = "sms"
    IN_APP = "in_app"
    WEBHOOK = "webhook"


class NotificationPriority(str, enum.Enum):
    BAJA = "baja"
    NORMAL = "normal"
    ALTA = "alta"
    CRITICA = "critica"


class Notification(Base):
    
    __tablename__ = "notifications"
    
    id = Column(Integer, primary_key=True, index=True)
    
    # Recipient
    user_id = Column(Integer, ForeignKey("users.id"), index=True)
    rider_id = Column(Integer, ForeignKey("riders.id"), index=True)
    
    # Content
    notification_type = Column(SQLEnum(NotificationType), nullable=False)
    priority = Column(SQLEnum(NotificationPriority), default=NotificationPriority.NORMAL)
    title = Column(String(255), nullable=False)
    message = Column(Text, nullable=False)
    data = Column(JSON)  # Datos adicionales para la acción
    
    # Delivery Channels
    channels = Column(String(100))  # Comma-separated: push,email,sms
    sent_channels = Column(String(100))  # Canales donde se envió exitosamente
    
    # Status
    is_read = Column(Boolean, default=False)
    read_at = Column(DateTime)
    is_sent = Column(Boolean, default=False)
    sent_at = Column(DateTime)
    failed_channels = Column(String(100))  # Canales que fallaron
    error_message = Column(Text)
    
    # Action
    action_url = Column(String(500))  # URL para redirigir al hacer clic
    action_type = Column(String(50))  # navigate, modal, external
    
    # Related Entity
    related_type = Column(String(50))  # order, delivery, shift, etc.
    related_id = Column(Integer)
    
    # Scheduling
    scheduled_for = Column(DateTime)  # Para notificaciones programadas
    expires_at = Column(DateTime)  # Expiración de la notificación
    
    # Timestamps
    created_at = Column(DateTime, default=datetime.utcnow, index=True)
    
    def __repr__(self):
        return f"<Notification(id={self.id}, type={self.notification_type}, priority={self.priority})>"


class Alert(Base):
    
    __tablename__ = "alerts"
    
    id = Column(Integer, primary_key=True, index=True)
    
    # Alert Information
    alert_type = Column(String(50), nullable=False)  # sla_breach, rider_inactive, route_deviation
    severity = Column(String(20), default="medium")  # low, medium, high, critical
    title = Column(String(255), nullable=False)
    description = Column(Text)
    
    # Related Entities
    order_id = Column(Integer, ForeignKey("orders.id"))
    delivery_id = Column(Integer, ForeignKey("deliveries.id"))
    rider_id = Column(Integer, ForeignKey("riders.id"))
    
    # Status
    status = Column(String(20), default="active")  # active, acknowledged, resolved, false_positive
    acknowledged_by = Column(Integer, ForeignKey("users.id"))
    acknowledged_at = Column(DateTime)
    resolved_by = Column(Integer, ForeignKey("users.id"))
    resolved_at = Column(DateTime)
    resolution_notes = Column(Text)
    
    # Auto-resolution
    auto_resolve_at = Column(DateTime)  # Para alertas temporales
    auto_resolved = Column(Boolean, default=False)
    
    # Timestamps
    created_at = Column(DateTime, default=datetime.utcnow, index=True)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    def __repr__(self):
        return f"<Alert(id={self.id}, type={self.alert_type}, severity={self.severity})>"
