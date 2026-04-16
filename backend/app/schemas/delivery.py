"""Delivery schemas for Pydantic validation."""

from datetime import datetime
from typing import Optional, List, Dict, Any
import uuid
from pydantic import BaseModel, ConfigDict

from app.models.delivery import DeliveryStatus


# Base Schema
class DeliveryBase(BaseModel):
    order_id: uuid.UUID
    rider_id: uuid.UUID
    
    # Pickup Confirmation
    pickup_confirmed_at: Optional[datetime] = None
    pickup_notes: Optional[str] = None
    
    # Delivery Information
    delivery_notes: Optional[str] = None
    customer_signature_required: Optional[bool] = False
    
    # Expected Times
    estimated_pickup_time: Optional[datetime] = None
    estimated_delivery_time: Optional[datetime] = None
    
    # Additional Info
    metadata_json: Optional[Dict[str, Any]] = None


# Create Schema
class DeliveryCreate(DeliveryBase):
    status: Optional[DeliveryStatus] = DeliveryStatus.PENDIENTE


# Update Schema
class DeliveryUpdate(BaseModel):
    pickup_confirmed_at: Optional[datetime] = None
    pickup_notes: Optional[str] = None
    delivery_notes: Optional[str] = None
    customer_signature_required: Optional[bool] = None
    estimated_pickup_time: Optional[datetime] = None
    estimated_delivery_time: Optional[datetime] = None
    metadata_json: Optional[Dict[str, Any]] = None
    status: Optional[DeliveryStatus] = None


# Proof of Delivery Schema
class ProofOfDeliveryBase(BaseModel):
    # Campo principal esperado por servicios legacy
    photo_url: Optional[str] = None
    # Campo alternativo para clientes que envían múltiples fotos
    photo_urls: Optional[List[str]] = None
    signature_base64: Optional[str] = None
    otp_code: Optional[str] = None  # One-time password for verification
    customer_name: Optional[str] = None
    delivery_latitude: Optional[float] = None
    delivery_longitude: Optional[float] = None
    notes: Optional[str] = None


class ProofOfDeliveryCreate(ProofOfDeliveryBase):
    delivery_id: uuid.UUID


class ProofOfDeliveryResponse(ProofOfDeliveryBase):
    model_config = ConfigDict(from_attributes=True)
    
    id: uuid.UUID
    delivery_id: uuid.UUID
    created_at: datetime
    verified: bool = False
    verified_by: Optional[uuid.UUID] = None
    verified_at: Optional[datetime] = None


# Response Schema
class DeliveryResponse(DeliveryBase):
    model_config = ConfigDict(from_attributes=True)
    
    id: uuid.UUID
    status: DeliveryStatus
    started_at: Optional[datetime] = None
    completed_at: Optional[datetime] = None
    failed_at: Optional[datetime] = None
    failure_reason: Optional[str] = None
    created_at: datetime
    updated_at: datetime
    
    proof_of_delivery: Optional[ProofOfDeliveryResponse] = None


# Status Update
class DeliveryStatusUpdate(BaseModel):
    status: DeliveryStatus
    reason: Optional[str] = None
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    
    model_config = ConfigDict(from_attributes=True)


# List Response
class DeliveryListResponse(BaseModel):
    total: int
    deliveries: List[DeliveryResponse]


# Start Delivery Request
class StartDeliveryRequest(BaseModel):
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    notes: Optional[str] = None
    
    model_config = ConfigDict(from_attributes=True)


# Complete Delivery Request
class CompleteDeliveryRequest(BaseModel):
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    photo_urls: Optional[List[str]] = None
    signature_base64: Optional[str] = None
    otp_code: Optional[str] = None
    customer_name: Optional[str] = None
    notes: Optional[str] = None
    
    model_config = ConfigDict(from_attributes=True)


# Finish Delivery Request (alias for CompleteDeliveryRequest)
class FinishDeliveryRequest(CompleteDeliveryRequest):
    pass
