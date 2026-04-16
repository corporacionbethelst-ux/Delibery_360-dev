"""Productivity models for performance tracking and analytics."""

import uuid
from datetime import datetime
from sqlalchemy import Column, String, Float, DateTime, ForeignKey, Enum as SQLEnum, Index, Integer
from sqlalchemy.orm import relationship
from sqlalchemy.dialects.postgresql import UUID
import enum

from app.core.database import Base


class PerformanceLevel(str, enum.Enum):
    """Performance classification levels."""
    EXCELENTE = "excelente"  # Top 10%
    MUY_BUENO = "muy_bueno"  # Top 25%
    BUENO = "bueno"  # Promedio superior
    REGULAR = "regular"  # Promedio
    BAJO = "bajo"  # Por debajo del promedio


class ProductivityRecord(Base):
    """Daily productivity record for each rider."""
    
    __tablename__ = "productivity_records"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4, index=True)
    rider_id = Column(UUID(as_uuid=True), ForeignKey("riders.id"), nullable=False, index=True)
    shift_id = Column(UUID(as_uuid=True), ForeignKey("shifts.id"), index=True)
    
    # Date
    record_date = Column(DateTime, nullable=False, index=True)
    
    # Deliveries Metrics
    total_deliveries = Column(Integer, default=0)
    completed_deliveries = Column(Integer, default=0)
    failed_deliveries = Column(Integer, default=0)
    
    # Time Metrics (in seconds)
    total_working_time = Column(Integer, default=0)  # Tiempo total en turno
    active_delivery_time = Column(Integer, default=0)  # Tiempo en entregas activas
    idle_time = Column(Integer, default=0)  # Tiempo entre pedidos
    avg_time_per_delivery = Column(Integer, default=0)  # Promedio por entrega
    
    # Distance Metrics (in km)
    total_distance = Column(Float, default=0.0)
    avg_distance_per_delivery = Column(Float, default=0.0)
    
    # Efficiency Metrics
    deliveries_per_hour = Column(Float, default=0.0)
    km_per_hour = Column(Float, default=0.0)
    efficiency_score = Column(Float, default=0.0)  # 0-100
    
    # SLA Compliance
    sla_compliant_deliveries = Column(Integer, default=0)
    sla_percentage = Column(Float, default=0.0)  # % entregas a tiempo
    
    # Performance Classification
    performance_level = Column(SQLEnum(PerformanceLevel), default=PerformanceLevel.REGULAR)
    ranking_position = Column(Integer)  # Posición en ranking del día
    ranking_total = Column(Integer)  # Total de repartidores en ranking
    
    # Earnings
    total_earnings = Column(Float, default=0.0)
    earnings_per_delivery = Column(Float, default=0.0)
    earnings_per_hour = Column(Float, default=0.0)
    
    # Badges & Achievements
    badges_earned = Column(String(255))  # JSON o lista separada por comas
    
    # Timestamps
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    rider = relationship("Rider", back_populates="productivity_records")
    shift = relationship("Shift", back_populates="productivity_records")
    
    __table_args__ = (
        Index('idx_rider_date', 'rider_id', 'record_date'),
    )
    
    def __repr__(self):
        return f"<ProductivityRecord(id={self.id}, rider={self.rider_id}, date={self.record_date})>"


class ShiftComparison(Base):
    """Comparative analysis between shifts."""
    
    __tablename__ = "shift_comparisons"
    
    id = Column(Integer, primary_key=True, index=True)
    
    # Comparison Period
    comparison_date = Column(DateTime, nullable=False, index=True)
    shift_type = Column(String(50))  # manana, tarde, noche
    
    # Metrics
    total_deliveries = Column(Integer, default=0)
    avg_delivery_time = Column(Integer, default=0)  # segundos
    sla_percentage = Column(Float, default=0.0)
    total_revenue = Column(Float, default=0.0)
    total_cost = Column(Float, default=0.0)
    margin_percentage = Column(Float, default=0.0)
    
    # Riders
    total_riders = Column(Integer, default=0)
    avg_riders_active = Column(Integer, default=0)
    top_performer_id = Column(Integer, ForeignKey("riders.id"))
    
    # Timestamps
    created_at = Column(DateTime, default=datetime.utcnow)
    
    def __repr__(self):
        return f"<ShiftComparison(id={self.id}, date={self.comparison_date}, shift={self.shift_type})>"


class PerformanceRanking(Base):
    """Leaderboard/ranking for riders."""
    
    __tablename__ = "performance_rankings"
    
    id = Column(Integer, primary_key=True, index=True)
    
    # Ranking Period
    ranking_type = Column(String(20), nullable=False)  # diario, semanal, mensual
    start_date = Column(DateTime, nullable=False)
    end_date = Column(DateTime, nullable=False)
    
    # Rider Info
    rider_id = Column(Integer, ForeignKey("riders.id"), nullable=False)
    position = Column(Integer, nullable=False)
    
    # Score Components
    total_score = Column(Float, default=0.0)
    deliveries_score = Column(Float, default=0.0)
    sla_score = Column(Float, default=0.0)
    efficiency_score = Column(Float, default=0.0)
    customer_rating_score = Column(Float, default=0.0)
    
    # Metrics Summary
    total_deliveries = Column(Integer, default=0)
    sla_percentage = Column(Float, default=0.0)
    avg_rating = Column(Float, default=0.0)
    
    # Rewards
    badge_awarded = Column(String(100))
    prize_value = Column(Float, default=0.0)
    
    # Timestamps
    created_at = Column(DateTime, default=datetime.utcnow)
    
    def __repr__(self):
        return f"<PerformanceRanking(id={self.id}, rider={self.rider_id}, position={self.position})>"
