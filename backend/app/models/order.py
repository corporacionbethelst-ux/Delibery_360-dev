"""Order model for customer orders management."""

from datetime import datetime
from sqlalchemy import Column, Integer, String, Float, DateTime, ForeignKey, Enum as SQLEnum, Text, Boolean, JSON
from sqlalchemy.orm import relationship
import enum

from app.core.database import Base


class OrderStatus(str, enum.Enum):
    """Order status workflow."""
    PENDIENTE = "pendiente"  # Aguardando asignación
    ASIGNADO = "asignado"  # Repartidor asignado
    EN_RECOLECCION = "en_recoleccion"  # Repartidor en restaurante
    RECOLECTADO = "recolectado"  # Pedido recogido
    EN_RUTA = "en_ruta"  # En camino al cliente
    EN_ENTREGA = "en_entrega"  # Llegó al destino
    ENTREGADO = "entregado"  # Completado con éxito
    FALLIDO = "fallido"  # No se pudo entregar
    CANCELADO = "cancelado"  # Cancelado por cliente/sistema


class OrderType(str, enum.Enum):
    """Order types for classification."""
    NORMAL = "normal"
    VIP = "vip"
    AGENDADO = "agendado"
    GRUPO = "grupo"
    CORPORATIVO = "corporativo"


class OrderPriority(str, enum.Enum):
    """Order priority levels."""
    NORMAL = "normal"
    ALTA = "alta"
    URGENTE = "urgente"
    VIP = "vip"


class Order(Base):
    """Order model representing customer requests."""
    
    __tablename__ = "orders"
    
    id = Column(Integer, primary_key=True, index=True)
    external_id = Column(String(100), unique=True, index=True)  # ID del sistema externo (TPV/ERP)
    
    # Customer Information
    customer_name = Column(String(255), nullable=False)
    customer_phone = Column(String(20), nullable=False)
    customer_email = Column(String(255))
    
    # Address Information
    pickup_address = Column(Text, nullable=False)
    pickup_name = Column(String(255))  # Nombre del restaurante/tienda
    pickup_phone = Column(String(20))
    delivery_address = Column(Text, nullable=False)
    delivery_reference = Column(String(255))  # Punto de referencia
    delivery_instructions = Column(Text)  # Instrucciones adicionales
    
    # Geolocation
    pickup_latitude = Column(Float)
    pickup_longitude = Column(Float)
    delivery_latitude = Column(Float)
    delivery_longitude = Column(Float)
    
    # Order Details
    items = Column(JSON)  # Lista de productos
    subtotal = Column(Float, default=0.0)
    delivery_fee = Column(Float, default=0.0)
    total = Column(Float, default=0.0)
    payment_method = Column(String(50))  # efectivo, tarjeta, pix
    payment_status = Column(String(20), default="pendiente")
    
    # Status & Assignment
    status = Column(SQLEnum(OrderStatus), default=OrderStatus.PENDIENTE)
    priority = Column(String(20), default="normal")  # normal, vip, urgente
    assigned_rider_id = Column(Integer, ForeignKey("riders.id"), index=True)
    
    # Timing
    ordered_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    accepted_at = Column(DateTime)
    picked_up_at = Column(DateTime)
    delivered_at = Column(DateTime)
    estimated_delivery_time = Column(DateTime)
    sla_deadline = Column(DateTime)  # Límite para cumplir SLA
    
    # Failure Information
    failure_reason = Column(String(255))  # Si falló
    failure_notes = Column(Text)
    cancelled_by = Column(String(50))  # cliente, restaurante, repartidor, sistema
    cancellation_reason = Column(Text)
    
    # Integration
    source = Column(String(50), default="app")  # app, web, api, erp, pos
    integration_id = Column(String(100))  # ID de integración externa
    webhook_sent = Column(Boolean, default=False)
    
    # Timestamps
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    rider = relationship("Rider", back_populates="orders")
    delivery = relationship("Delivery", back_populates="order", uselist=False)
    
    def __repr__(self):
        return f"<Order(id={self.id}, status={self.status}, customer={self.customer_name})>"
