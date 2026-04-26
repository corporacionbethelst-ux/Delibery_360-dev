"""Delivery model for tracking delivery execution."""

import uuid
from datetime import datetime
from typing import Any
from sqlalchemy import Column, String, Integer, Float, DateTime, ForeignKey, Enum as SQLEnum, Text, Boolean, JSON
from sqlalchemy.orm import relationship
from sqlalchemy.dialects.postgresql import UUID
import enum

from app.core.database import Base


class DeliveryStatus(str, enum.Enum):
    """Delivery execution status."""
    PENDIENTE = "pendiente"  # Esperando inicio
    INICIADA = "iniciada"  # Repartidor inició entrega
    EN_PICKUP = "en_pickup"  # En punto de recogida
    EN_ROUTE = "en_route"  # En camino al cliente
    EN_DESTINO = "en_destino"  # Llegó al destino
    COMPLETADA = "completada"  # Entrega exitosa
    FALLIDA = "fallida"  # Entrega falló

    # Aliases para compatibilidad con nomenclatura legacy
    PENDING = "pendiente"
    IN_PROGRESS = "iniciada"
    COMPLETED = "completada"
    FAILED = "fallida"


class ProofType(str, enum.Enum):
    """Types of proof of delivery."""
    FOTO = "foto"
    FIRMA = "firma"
    OTP = "otp"  # One-time password
    NINGUNO = "ninguno"


class Delivery(Base):
    """Delivery model tracking the execution of an order delivery."""
    
    __tablename__ = "deliveries"

    __table_args__ = {'extend_existing': True}
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4, index=True)
    order_id = Column(UUID(as_uuid=True), ForeignKey("orders.id"), unique=True, nullable=False, index=True)
    rider_id = Column(UUID(as_uuid=True), ForeignKey("riders.id"), nullable=False, index=True)
    
    # Status
    status: Any = Column(SQLEnum(DeliveryStatus), default=DeliveryStatus.PENDIENTE)
    
    # Timing
    started_at = Column(DateTime)  # Cuando el repartidor inicia
    arrived_pickup_at = Column(DateTime)  # Llegada al restaurante
    left_pickup_at = Column(DateTime)  # Salida del restaurante
    arrived_delivery_at = Column(DateTime)  # Llegada al cliente
    completed_at = Column(DateTime)  # Entrega completada
    
    # Geolocation Tracking
    current_latitude = Column(Float)
    current_longitude = Column(Float)
    last_location_update = Column(DateTime)
    
    # Route Information
    route_data = Column(JSON)  # Ruta completa (lista de coordenadas)
    distance_total = Column(Float)  # km totales
    distance_pickup = Column(Float)  # km hasta restaurante
    distance_delivery = Column(Float)  # km hasta cliente
    
    # Proof of Delivery
    proof_type: Any = Column(SQLEnum(ProofType))
    proof_photo_url = Column(String(500))  # URL de la foto
    proof_signature = Column(Text)  # Firma digital (base64)
    proof_otp = Column(String(10))  # OTP para verificación
    proof_notes = Column(Text)  # Notas del repartidor
    customer_name_received = Column(String(255))  # Nombre quien recibió
    
    # Issues & Exceptions
    has_issues = Column(Boolean, default=False)
    issue_type = Column(String(50))  # cliente_ausente, direccion_incorrecta, producto_danado
    issue_description = Column(Text)
    issue_resolved = Column(Boolean, default=False)
    
    # Performance Metrics
    time_to_pickup = Column(Integer)  # segundos
    time_at_pickup = Column(Integer)  # segundos en restaurante
    time_to_delivery = Column(Integer)  # segundos
    total_time = Column(Integer)  # segundos totales
    
    # SLA Compliance
    sla_expected_minutes = Column(Integer)
    sla_actual_minutes = Column(Integer)
    sla_compliant = Column(Boolean)  # True si cumplió SLA
    
    # Timestamps
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    order = relationship("Order", back_populates="delivery")
    rider = relationship("Rider", back_populates="deliveries")
    route = relationship(
        "Route",
        back_populates="delivery",
        uselist=False,
        primaryjoin="Route.delivery_id == Delivery.id"
    )
    
    def __repr__(self):
        return f"<Delivery(id={self.id}, order={self.order_id}, status={self.status})>"
