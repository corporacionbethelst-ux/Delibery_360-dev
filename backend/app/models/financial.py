"""Financial models for payments, costs, and liquidation."""

import uuid
from datetime import datetime, date
from sqlalchemy import Column, String, Integer, Float, DateTime, ForeignKey, Enum as SQLEnum, Boolean, Text, Numeric
from sqlalchemy.orm import relationship
from sqlalchemy.dialects.postgresql import UUID
import enum

from app.core.database import Base


class PaymentRuleType(str, enum.Enum):
    """Types of payment rules."""
    FIJA = "fija"  # Valor fijo por entrega
    VARIABLE = "variable"  # Por distancia/tiempo
    MIXTA = "mixta"  # Combinación
    POR_HORA = "por_hora"  # Pago por hora


class LiquidationStatus(str, enum.Enum):
    """Liquidation status."""
    PENDIENTE = "pendiente"
    PROCESADA = "procesada"
    PAGADA = "pagada"
    CANCELADA = "cancelada"


class TransactionType(str, enum.Enum):
    """Types of financial transactions."""
    PAGO_ENTREGA = "pago_entrega"
    BONO = "bono"
    DEDUCCION = "deduccion"
    AJUSTE = "ajuste"
    REEMBOLSO = "reembolso"


class FinancialTransaction(Base):
    """Financial transaction record."""
    
    __tablename__ = "financial_transactions"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4, index=True)
    rider_id = Column(UUID(as_uuid=True), ForeignKey("riders.id"), nullable=False, index=True)
    order_id = Column(UUID(as_uuid=True), ForeignKey("orders.id"), nullable=True)
    delivery_id = Column(UUID(as_uuid=True), ForeignKey("deliveries.id"), nullable=True)
    
    # Transaction info
    transaction_type = Column(SQLEnum(TransactionType), nullable=False)
    amount = Column(Numeric(10, 2), nullable=False)
    description = Column(String(500))
    
    # Status
    is_processed = Column(Boolean, default=False)
    processed_at = Column(DateTime)
    
    # Timestamps
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    rider = relationship("Rider", back_populates="transactions")
    order = relationship("Order", back_populates="transactions")
    delivery = relationship("Delivery", back_populates="transactions")
    
    def __repr__(self):
        return f"<FinancialTransaction(id={self.id}, rider={self.rider_id}, amount={self.amount})>"


class PaymentRule(Base):
    """Payment rules configuration for rider compensation."""
    
    __tablename__ = "payment_rules"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4, index=True)
    name = Column(String(100), nullable=False)
    description = Column(Text)
    
    # Rule Type
    rule_type = Column(SQLEnum(PaymentRuleType), nullable=False)
    
    # Fixed Values
    base_value = Column(Numeric(10, 2), default=0.0)  # Valor base por entrega
    
    # Variable Components
    per_km_rate = Column(Numeric(10, 2), default=0.0)  # Por km
    per_minute_rate = Column(Numeric(10, 2), default=0.0)  # Por minuto
    night_shift_bonus = Column(Numeric(10, 2), default=0.0)  # Bono turno noche
    rainy_day_bonus = Column(Numeric(10, 2), default=0.0)  # Bono día de lluvia
    weekend_bonus = Column(Numeric(10, 2), default=0.0)  # Bono fin de semana
    
    # Performance Bonuses
    sla_bonus = Column(Numeric(10, 2), default=0.0)  # Bono por 100% SLA
    volume_bonus_threshold = Column(Integer, default=0)  # Mínimo entregas para bono
    volume_bonus_value = Column(Numeric(10, 2), default=0.0)
    
    # Guarantees
    minimum_daily = Column(Numeric(10, 2), default=0.0)  # Piso diario
    maximum_daily = Column(Numeric(10, 2), default=0.0)  # Tope diario
    
    # Validity
    is_active = Column(Boolean, default=True)
    valid_from = Column(DateTime)
    valid_until = Column(DateTime)
    
    # Timestamps
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    def __repr__(self):
        return f"<PaymentRule(id={self.id}, name={self.name}, type={self.rule_type})>"


class DailyLiquidation(Base):
    """Daily liquidation for each rider."""
    
    __tablename__ = "daily_liquidations"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4, index=True)
    rider_id = Column(UUID(as_uuid=True), ForeignKey("riders.id"), nullable=False, index=True)
    payment_rule_id = Column(UUID(as_uuid=True), ForeignKey("payment_rules.id"))
    
    # Date
    liquidation_date = Column(DateTime, nullable=False, index=True)
    
    # Deliveries Summary
    total_deliveries = Column(Integer, default=0)
    completed_deliveries = Column(Integer, default=0)
    failed_deliveries = Column(Integer, default=0)
    
    # Distance & Time
    total_distance_km = Column(Float, default=0.0)
    total_time_minutes = Column(Integer, default=0)
    
    # Earnings Breakdown
    base_earnings = Column(Numeric(10, 2), default=0.0)
    distance_earnings = Column(Numeric(10, 2), default=0.0)
    time_earnings = Column(Numeric(10, 2), default=0.0)
    bonuses = Column(Numeric(10, 2), default=0.0)
    deductions = Column(Numeric(10, 2), default=0.0)
    total_earnings = Column(Numeric(10, 2), default=0.0)
    
    # Status
    status = Column(SQLEnum(LiquidationStatus), default=LiquidationStatus.PENDIENTE)
    
    # Payment Info
    payment_method = Column(String(50))  # pix, transferencia, efectivo
    payment_reference = Column(String(100))
    paid_at = Column(DateTime)
    
    # Notes
    notes = Column(Text)
    processed_by = Column(String(100))
    
    # Timestamps
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    processed_at = Column(DateTime)
    
    # Relationships
    rider = relationship("Rider", back_populates="liquidations")
    payment_rule = relationship("PaymentRule")
    
    def __repr__(self):
        return f"<DailyLiquidation(id={self.id}, rider={self.rider_id}, date={self.liquidation_date})>"


class CostRecord(Base):
    """Cost records per order/delivery for operational analysis."""
    
    __tablename__ = "cost_records"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4, index=True)
    order_id = Column(UUID(as_uuid=True), ForeignKey("orders.id"), index=True)
    delivery_id = Column(UUID(as_uuid=True), ForeignKey("deliveries.id"), index=True)
    
    # Costs
    rider_cost = Column(Numeric(10, 2), default=0.0)  # Pago al repartidor
    platform_fee = Column(Numeric(10, 2), default=0.0)  # Comisión plataforma
    tax = Column(Numeric(10, 2), default=0.0)  # Impuestos
    operational_cost = Column(Numeric(10, 2), default=0.0)  # Otros costos operacionales
    total_cost = Column(Numeric(10, 2), default=0.0)
    
    # Revenue
    customer_paid = Column(Numeric(10, 2), default=0.0)  # Lo que pagó el cliente
    delivery_fee = Column(Numeric(10, 2), default=0.0)  # Tarifa de entrega
    restaurant_commission = Column(Numeric(10, 2), default=0.0)  # Comisión restaurante
    
    # Margins
    gross_margin = Column(Numeric(10, 2), default=0.0)
    margin_percentage = Column(Float, default=0.0)
    
    # Timestamps
    created_at = Column(DateTime, default=datetime.utcnow)
    
    def __repr__(self):
        return f"<CostRecord(id={self.id}, order={self.order_id}, cost={self.total_cost})>"
