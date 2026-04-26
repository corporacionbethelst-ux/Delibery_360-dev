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
    PENDIENTE = "pendiente"
    INICIADA = "iniciada"
    EN_PICKUP = "en_pickup"
    EN_ROUTE = "en_route"
    EN_DESTINO = "en_destino"
    COMPLETADA = "completada"
    FALLIDA = "fallida"

    PENDING = "pendiente"
    IN_PROGRESS = "iniciada"
    COMPLETED = "completada"
    FAILED = "fallida"


class ProofType(str, enum.Enum):
    """Types of proof of delivery."""
    FOTO = "foto"
    FIRMA = "firma"
    OTP = "otp"
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
    started_at = Column(DateTime)
    arrived_pickup_at = Column(DateTime)
    left_pickup_at = Column(DateTime)
    arrived_delivery_at = Column(DateTime)
    completed_at = Column(DateTime)
    
    # Geolocation Tracking
    current_latitude = Column(Float)
    current_longitude = Column(Float)
    last_location_update = Column(DateTime)
    
    # Route Information
    route_data = Column(JSON)
    distance_total = Column(Float)
    distance_pickup = Column(Float)
    distance_delivery = Column(Float)
    
    # Proof of Delivery
    proof_type: Any = Column(SQLEnum(ProofType))
    proof_photo_url = Column(String(500))
    proof_signature = Column(Text)
    proof_otp = Column(String(10))
    proof_notes = Column(Text)
    customer_name_received = Column(String(255))
    
    # Issues & Exceptions
    has_issues = Column(Boolean, default=False)
    issue_type = Column(String(50))
    issue_description = Column(Text)
    issue_resolved = Column(Boolean, default=False)
    
    # Performance Metrics
    time_to_pickup = Column(Integer)
    time_at_pickup = Column(Integer)
    time_to_delivery = Column(Integer)
    total_time = Column(Integer)
    
    # SLA Compliance
    sla_expected_minutes = Column(Integer)
    sla_actual_minutes = Column(Integer)
    sla_compliant = Column(Boolean)
    
    # Timestamps
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    order = relationship("Order", back_populates="delivery")
    rider = relationship("Rider", back_populates="deliveries")
    
    # Relación corregida con Route
    route = relationship(
        "Route",
        back_populates="delivery",
        uselist=False,
        primaryjoin="Delivery.id == foreign(Route.delivery_id)",
        foreign_keys="[Route.delivery_id]"
    )
    
    def __repr__(self):
        return f"<Delivery(id={self.id}, order={self.order_id}, status={self.status})>"