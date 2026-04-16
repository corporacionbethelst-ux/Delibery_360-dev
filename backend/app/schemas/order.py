"""Order schemas for Pydantic validation."""

from datetime import datetime
from typing import Optional, List, Dict, Any
import uuid
from pydantic import BaseModel, ConfigDict
from enum import Enum


class OrderStatus(str, Enum):
    PENDIENTE = "pendiente"
    ASIGNADO = "asignado"
    EN_PREPARACION = "en_preparacion"
    LISTO_PARA_RECOLECCION = "listo_para_recoleccion"
    EN_RECOLECCION = "en_recoleccion"
    EN_TRANSITO = "en_transito"
    ENTREGADO = "entregado"
    CANCELADO = "cancelado"
    FALLIDO = "fallido"


class OrderType(str, Enum):
    ESTANDAR = "estandar"
    EXPRESS = "express"
    PROGRAMADO = "programado"
    CORPORATIVO = "corporativo"


# Base Schema
class OrderBase(BaseModel):
    external_id: Optional[str] = None  # ID del sistema externo (POS/ERP)
    customer_name: str
    customer_phone: str
    customer_email: Optional[str] = None
    
    # Pickup Information
    pickup_name: str
    pickup_address: str
    pickup_latitude: Optional[float] = None
    pickup_longitude: Optional[float] = None
    pickup_phone: Optional[str] = None
    pickup_instructions: Optional[str] = None
    
    # Delivery Information
    delivery_address: str
    delivery_latitude: Optional[float] = None
    delivery_longitude: Optional[float] = None
    delivery_instructions: Optional[str] = None
    delivery_reference: Optional[str] = None
    
    # Order Details
    order_type: Optional[OrderType] = OrderType.ESTANDAR
    items_description: Optional[str] = None
    items_count: Optional[int] = 1
    total_weight_kg: Optional[float] = None
    total_value: Optional[float] = 0.0
    
    # Priority & Timing
    is_priority: Optional[bool] = False
    scheduled_pickup_time: Optional[datetime] = None
    scheduled_delivery_time: Optional[datetime] = None
    estimated_duration_minutes: Optional[int] = None
    
    # Additional Info
    notes: Optional[str] = None
    metadata_json: Optional[Dict[str, Any]] = None


# Create Schema
class OrderCreate(OrderBase):
    rider_id: Optional[int] = None
    status: Optional[OrderStatus] = OrderStatus.PENDIENTE


# Update Schema
class OrderUpdate(BaseModel):
    external_id: Optional[str] = None
    customer_name: Optional[str] = None
    customer_phone: Optional[str] = None
    customer_email: Optional[str] = None
    pickup_name: Optional[str] = None
    pickup_address: Optional[str] = None
    pickup_latitude: Optional[float] = None
    pickup_longitude: Optional[float] = None
    pickup_phone: Optional[str] = None
    pickup_instructions: Optional[str] = None
    delivery_address: Optional[str] = None
    delivery_latitude: Optional[float] = None
    delivery_longitude: Optional[float] = None
    delivery_instructions: Optional[str] = None
    delivery_reference: Optional[str] = None
    order_type: Optional[OrderType] = None
    items_description: Optional[str] = None
    items_count: Optional[int] = None
    total_weight_kg: Optional[float] = None
    total_value: Optional[float] = None
    is_priority: Optional[bool] = None
    scheduled_pickup_time: Optional[datetime] = None
    scheduled_delivery_time: Optional[datetime] = None
    estimated_duration_minutes: Optional[int] = None
    notes: Optional[str] = None
    metadata_json: Optional[Dict[str, Any]] = None
    rider_id: Optional[uuid.UUID] = None
    status: Optional[OrderStatus] = None


# Response Schema
class OrderResponse(OrderBase):
    model_config = ConfigDict(from_attributes=True)
    
    id: uuid.UUID
    rider_id: Optional[uuid.UUID] = None
    status: OrderStatus
    created_at: datetime
    updated_at: datetime
    assigned_at: Optional[datetime] = None
    picked_up_at: Optional[datetime] = None
    delivered_at: Optional[datetime] = None
    cancelled_at: Optional[datetime] = None
    cancellation_reason: Optional[str] = None


# List Response
class OrderListResponse(BaseModel):
    total: int
    orders: List[OrderResponse]


# Assignment Request
class OrderAssignRequest(BaseModel):
    rider_id: int
    notes: Optional[str] = None
    
    model_config = ConfigDict(from_attributes=True)


# Status Update
class OrderStatusUpdate(BaseModel):
    status: OrderStatus
    reason: Optional[str] = None
    
    model_config = ConfigDict(from_attributes=True)
