"""Route model for delivery route tracking and analysis."""

import uuid
from datetime import datetime
from typing import Any
from sqlalchemy import Column, String, Float, DateTime, ForeignKey, Enum as SQLEnum, Text, Boolean, JSON, Integer
from sqlalchemy.orm import relationship
from sqlalchemy.dialects.postgresql import UUID
import enum

from app.core.database import Base


class RouteStatus(str, enum.Enum):
    """Route status."""
    PLANIFICADA = "planificada"
    EN_PROGRESO = "en_progreso"
    COMPLETADA = "completada"
    CANCELADA = "cancelada"


class Route(Base):
    """Route model for tracking delivery paths."""
    
    __tablename__ = "routes"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4, index=True)
    delivery_id = Column(UUID(as_uuid=True), ForeignKey("deliveries.id"), unique=True, index=True)
    
    # Route Information
    status = Column(SQLEnum(RouteStatus), default=RouteStatus.PLANIFICADA)
    
    # Coordinates
    planned_route = Column(JSON)
    actual_route = Column(JSON)
    
    # Waypoints
    pickup_latitude = Column(Float)
    pickup_longitude = Column(Float)
    delivery_latitude = Column(Float)
    delivery_longitude = Column(Float)
    
    # Distance & Time
    planned_distance_km = Column(Float)
    actual_distance_km = Column(Float)
    planned_duration_minutes = Column(Integer)
    actual_duration_minutes = Column(Integer)
    
    # Deviation Analysis
    has_deviation = Column(Boolean, default=False)
    deviation_distance_km = Column(Float, default=0.0)
    deviation_time_minutes = Column(Integer, default=0)
    deviation_reason = Column(String(255))
    
    # Traffic & Conditions
    traffic_level = Column(String(20))
    weather_condition = Column(String(50))
    
    # Optimization Score
    efficiency_score = Column(Float, default=0.0)
    
    # Timestamps
    started_at = Column(DateTime)
    completed_at = Column(DateTime)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    delivery = relationship(
        "Delivery",
        back_populates="route",
        primaryjoin="Route.delivery_id == Delivery.id",
        foreign_keys="[Route.delivery_id]"
    )
    
    points = relationship("RoutePoint", back_populates="route", cascade="all, delete-orphan")
    deviations = relationship("RouteDeviation", back_populates="route", cascade="all, delete-orphan")
    
    def __repr__(self):
        return f"<Route(id={self.id}, delivery={self.delivery_id}, status={self.status})>"


class RoutePoint(Base):
    """Individual GPS point in a route for detailed tracking."""
    
    __tablename__ = "route_points"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4, index=True)
    route_id = Column(UUID(as_uuid=True), ForeignKey("routes.id"), index=True)
    
    latitude = Column(Float, nullable=False)
    longitude = Column(Float, nullable=False)
    altitude = Column(Float)
    
    accuracy = Column(Float)
    speed = Column(Float)
    heading = Column(Float)
    
    timestamp = Column(DateTime, nullable=False, index=True)
    
    battery_level = Column(Integer)
    is_charging = Column(Boolean, default=False)
    network_type = Column(String(20))
    
    source = Column(String(50), default="gps")
    created_at = Column(DateTime, default=datetime.utcnow)
    
    route = relationship("Route", back_populates="points")
    
    def __repr__(self):
        return f"<RoutePoint(route={self.route_id}, lat={self.latitude}, lng={self.longitude})>"


class RouteDeviation(Base):
    """Route deviation tracking for anomaly detection."""
    
    __tablename__ = "route_deviations"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4, index=True)
    route_id = Column(UUID(as_uuid=True), ForeignKey("routes.id"), index=True)
    
    deviation_type = Column(String(50))
    severity = Column(String(20))
    
    latitude = Column(Float)
    longitude = Column(Float)
    
    detected_at = Column(DateTime, nullable=False)
    resolved_at = Column(DateTime)
    
    expected_location = Column(JSON)
    actual_location = Column(JSON)
    distance_from_route_km = Column(Float)
    time_lost_minutes = Column(Integer, default=0)
    
    status = Column(String(20), default="aberto")
    resolution_notes = Column(Text)
    
    # CORRECCIÓN AQUÍ: Cambiar Integer a UUID
    resolved_by = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=True)
    
    alert_sent = Column(Boolean, default=False)
    alert_channels = Column(JSON)
    
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    route = relationship("Route", back_populates="deviations")
    
    def __repr__(self):
        return f"<RouteDeviation(route={self.route_id}, type={self.deviation_type}, severity={self.severity})>"