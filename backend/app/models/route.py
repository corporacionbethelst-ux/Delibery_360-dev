"""Route model for delivery route tracking and analysis."""

import uuid
from datetime import datetime
from sqlalchemy import Column, String, Float, DateTime, ForeignKey, Enum as SQLEnum, Text, Boolean, JSON
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
    
    # Coordinates (JSON array of {lat, lng, timestamp})
    planned_route = Column(JSON)  # Ruta planificada óptima
    actual_route = Column(JSON)  # Ruta real recorrida
    
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
    traffic_level = Column(String(20))  # bajo, medio, alto
    weather_condition = Column(String(50))
    
    # Optimization Score
    efficiency_score = Column(Float, default=0.0)  # 0-100
    
    # Timestamps
    started_at = Column(DateTime)
    completed_at = Column(DateTime)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    delivery = relationship("Delivery", back_populates="route")
    
    def __repr__(self):
        return f"<Route(id={self.id}, delivery={self.delivery_id}, status={self.status})>"


class RoutePoint(Base):
    """Individual GPS point in a route for detailed tracking."""
    
    __tablename__ = "route_points"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4, index=True)
    route_id = Column(UUID(as_uuid=True), ForeignKey("routes.id"), index=True)
    
    # GPS Coordinates
    latitude = Column(Float, nullable=False)
    longitude = Column(Float, nullable=False)
    altitude = Column(Float)  # meters
    
    # Accuracy & Speed
    accuracy = Column(Float)  # meters
    speed = Column(Float)  # km/h
    heading = Column(Float)  # degrees 0-360
    
    # Timestamp
    timestamp = Column(DateTime, nullable=False, index=True)
    
    # Additional Info
    battery_level = Column(Integer)  # percentage
    is_charging = Column(Boolean, default=False)
    network_type = Column(String(20))  # wifi, 4g, 5g, etc.
    
    # Metadata
    source = Column(String(50), default="gps")  # gps, network, passive
    created_at = Column(DateTime, default=datetime.utcnow)
    
    # Relationships
    route = relationship("Route", back_populates="points")
    
    def __repr__(self):
        return f"<RoutePoint(route={self.route_id}, lat={self.latitude}, lng={self.longitude})>"


# Add relationship to Route class
Route.points = relationship("RoutePoint", back_populates="route", cascade="all, delete-orphan")


class RouteDeviation(Base):
    """Route deviation tracking for anomaly detection."""
    
    __tablename__ = "route_deviations"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4, index=True)
    route_id = Column(UUID(as_uuid=True), ForeignKey("routes.id"), index=True)
    
    # Deviation Details
    deviation_type = Column(String(50))  # desvio_rota, parada_nao_programada, excesso_velocidade
    severity = Column(String(20))  # baixa, media, alta, critica
    
    # Location
    latitude = Column(Float)
    longitude = Column(Float)
    
    # Timing
    detected_at = Column(DateTime, nullable=False)
    resolved_at = Column(DateTime)
    
    # Analysis
    expected_location = Column(JSON)  # {lat, lng}
    actual_location = Column(JSON)  # {lat, lng}
    distance_from_route_km = Column(Float)
    time_lost_minutes = Column(Integer, default=0)
    
    # Resolution
    status = Column(String(20), default="aberto")  # aberto, em_analise, resolvido, falso_positivo
    resolution_notes = Column(Text)
    resolved_by = Column(Integer, ForeignKey("users.id"))
    
    # Alerts
    alert_sent = Column(Boolean, default=False)
    alert_channels = Column(JSON)  # ["push", "sms", "email"]
    
    # Timestamps
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    route = relationship("Route", back_populates="deviations")
    
    def __repr__(self):
        return f"<RouteDeviation(route={self.route_id}, type={self.deviation_type}, severity={self.severity})>"


# Add relationship to Route class
Route.deviations = relationship("RouteDeviation", back_populates="route", cascade="all, delete-orphan")
