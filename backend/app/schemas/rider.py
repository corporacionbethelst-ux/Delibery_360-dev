"""Rider schemas for Pydantic validation."""

from datetime import datetime
from typing import Optional, List
from pydantic import BaseModel, EmailStr, Field, ConfigDict
from enum import Enum


class RiderStatusEnum(str, Enum):
    PENDIENTE = "pendiente"
    ACTIVO = "activo"
    INACTIVO = "inactivo"
    SUSPENDIDO = "suspendido"
    EN_TURNO = "en_turno"
    FUERA_TURNO = "fuera_turno"


class VehicleTypeEnum(str, Enum):
    BICICLETA = "bicicleta"
    MOTO = "moto"
    CARRO = "carro"
    PATINETE = "patinete"
    A_PIE = "a_pie"


# Base Schema
class RiderBase(BaseModel):
    document_type: Optional[str] = "CPF"
    document_number: str
    birth_date: Optional[datetime] = None
    address: Optional[str] = None
    city: Optional[str] = None
    state: Optional[str] = None
    postal_code: Optional[str] = None
    vehicle_type: Optional[VehicleTypeEnum] = None
    vehicle_model: Optional[str] = None
    vehicle_plate: Optional[str] = None
    vehicle_color: Optional[str] = None
    cnh_number: Optional[str] = None
    cnh_expiry: Optional[datetime] = None
    pix_key: Optional[str] = None
    status: Optional[RiderStatusEnum] = RiderStatusEnum.PENDIENTE
    phone: Optional[str] = None
    emergency_contact_name: Optional[str] = None
    emergency_contact_phone: Optional[str] = None


# Create Schema
class RiderCreate(RiderBase):
    user_id: int


# Update Schema
class RiderUpdate(BaseModel):
    document_type: Optional[str] = None
    document_number: Optional[str] = None
    birth_date: Optional[datetime] = None
    address: Optional[str] = None
    city: Optional[str] = None
    state: Optional[str] = None
    postal_code: Optional[str] = None
    vehicle_type: Optional[VehicleTypeEnum] = None
    vehicle_model: Optional[str] = None
    vehicle_plate: Optional[str] = None
    vehicle_color: Optional[str] = None
    cnh_number: Optional[str] = None
    cnh_expiry: Optional[datetime] = None
    pix_key: Optional[str] = None
    status: Optional[RiderStatusEnum] = None
    phone: Optional[str] = None
    emergency_contact_name: Optional[str] = None
    emergency_contact_phone: Optional[str] = None
    approved_at: Optional[datetime] = None
    last_active_at: Optional[datetime] = None


# Response Schema
class RiderResponse(RiderBase):
    model_config = ConfigDict(from_attributes=True)
    
    id: int
    user_id: int
    status: RiderStatusEnum
    rating: Optional[float] = None
    total_deliveries: Optional[int] = 0
    completed_deliveries: Optional[int] = 0
    failed_deliveries: Optional[int] = 0
    created_at: datetime
    updated_at: datetime
    approved_at: Optional[datetime] = None
    last_active_at: Optional[datetime] = None


# Document Schema
class RiderDocumentBase(BaseModel):
    document_type: str
    document_url: str


class RiderDocumentCreate(RiderDocumentBase):
    rider_id: int


class RiderDocumentResponse(RiderDocumentBase):
    model_config = ConfigDict(from_attributes=True)
    
    id: int
    rider_id: int
    is_verified: bool
    verified_by: Optional[int] = None
    verified_at: Optional[datetime] = None
    rejection_reason: Optional[str] = None
    created_at: datetime
    updated_at: datetime


# Approval Request Schema
class RiderApprovalRequest(BaseModel):
    approve: bool = True
    rejection_reason: Optional[str] = None
    
    model_config = ConfigDict(from_attributes=True)


# Status Update Schema
class RiderStatusUpdate(BaseModel):
    status: RiderStatusEnum
    reason: Optional[str] = None
    
    model_config = ConfigDict(from_attributes=True)
