"""Integration models for TPV/ERP and external systems."""

from datetime import datetime
from sqlalchemy import Column, Integer, String, DateTime, Enum as SQLEnum, Text, Boolean, JSON, ForeignKey
import enum

from app.core.database import Base


class IntegrationType(str, enum.Enum):
    TPV = "tpv"  # Terminal Punto de Venta
    ERP = "erp"  # Enterprise Resource Planning
    PAGOS = "pagos"  # Gateway de pagos
    MAPAS = "mapas"  # Google Maps, Mapbox
    NOTIFICACION = "notificacion"  # Firebase, Twilio
    OTRO = "otro"


class IntegrationStatus(str, enum.Enum):
    ACTIVA = "activa"
    INACTIVA = "inactiva"
    ERROR = "error"
    MANTENIMIENTO = "mantenimiento"


class Integration(Base):
    
    __tablename__ = "integrations"
    
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), nullable=False)
    integration_type = Column(SQLEnum(IntegrationType), nullable=False)
    
    # Connection Details
    provider = Column(String(50))  # Nombre del proveedor (SAP, Oracle, Stripe, etc.)
    api_url = Column(String(500))
    api_version = Column(String(20))
    
    # Authentication
    auth_type = Column(String(20))  # api_key, oauth2, basic, jwt
    credentials = Column(JSON)  # Encrypted: tokens, keys, secrets
    token_expires_at = Column(DateTime)
    
    # Status
    status = Column(SQLEnum(IntegrationStatus), default=IntegrationStatus.INACTIVA)
    last_sync_at = Column(DateTime)
    last_error_at = Column(DateTime)
    last_error_message = Column(Text)
    consecutive_failures = Column(Integer, default=0)
    
    # Configuration
    config = Column(JSON)  # Configuración específica de la integración
    webhook_url = Column(String(500))  # Para recibir webhooks del sistema externo
    webhook_secret = Column(String(255))
    
    # Sync Settings
    sync_enabled = Column(Boolean, default=False)
    sync_frequency_minutes = Column(Integer, default=60)
    sync_last_run = Column(DateTime)
    sync_next_run = Column(DateTime)
    
    # Timestamps
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    created_by = Column(Integer, ForeignKey("users.id"))
    
    def __repr__(self):
        return f"<Integration(id={self.id}, name={self.name}, type={self.integration_type})>"


class IntegrationLog(Base):
    
    __tablename__ = "integration_logs"
    
    id = Column(Integer, primary_key=True, index=True)
    integration_id = Column(Integer, ForeignKey("integrations.id"), index=True)
    
    # Operation Details
    operation_type = Column(String(50))  # sync, webhook, api_call, export, import
    direction = Column(String(10))  # inbound, outbound
    
    # Request/Response
    endpoint = Column(String(500))
    request_payload = Column(JSON)
    response_payload = Column(JSON)
    status_code = Column(Integer)
    
    # Result
    success = Column(Boolean, default=True)
    error_message = Column(Text)
    records_processed = Column(Integer, default=0)
    
    # Performance
    duration_ms = Column(Integer)
    
    # Timestamps
    created_at = Column(DateTime, default=datetime.utcnow, index=True)
    
    def __repr__(self):
        return f"<IntegrationLog(id={self.id}, integration={self.integration_id}, operation={self.operation_type})>"


class WebhookEvent(Base):
    
    __tablename__ = "webhook_events"
    
    id = Column(Integer, primary_key=True, index=True)
    integration_id = Column(Integer, ForeignKey("integrations.id"), index=True)
    
    # Event Details
    event_type = Column(String(100), nullable=False)
    event_id = Column(String(100), unique=True)  # ID único del evento externo
    source_system = Column(String(50))
    
    # Payload
    payload = Column(JSON, nullable=False)
    signature = Column(String(255))  # Para verificación
    
    # Processing
    processed = Column(Boolean, default=False)
    processed_at = Column(DateTime)
    processing_result = Column(String(50))  # success, failed, ignored
    error_message = Column(Text)
    retry_count = Column(Integer, default=0)
    
    # Related Entity (after processing)
    related_type = Column(String(50))  # order, delivery, payment
    related_id = Column(Integer)
    
    # Timestamps
    received_at = Column(DateTime, default=datetime.utcnow, index=True)
    
    def __repr__(self):
        return f"<WebhookEvent(id={self.id}, type={self.event_type}, processed={self.processed})>"
