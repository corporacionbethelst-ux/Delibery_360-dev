"""
Delivery360 - User Schemas
Pydantic models for user management
"""

from pydantic import BaseModel, EmailStr, Field
from typing import Optional
from datetime import datetime
from enum import Enum


class UserRole(str, Enum):
    SUPERADMIN = "superadmin"
    GERENTE = "gerente"
    OPERADOR = "operador"
    REPARTIDOR = "repartidor"


class UserBase(BaseModel):
    email: EmailStr
    full_name: str = Field(..., min_length=2, max_length=100)
    phone: str = Field(..., pattern=r'^\+?[1-9]\d{1,14}$')
    role: UserRole = UserRole.OPERADOR


class UserCreate(UserBase):
    password: str = Field(..., min_length=8, max_length=128)
    is_active: bool = True


class UserUpdate(BaseModel):
    email: Optional[EmailStr] = None
    full_name: Optional[str] = Field(None, min_length=2, max_length=100)
    phone: Optional[str] = Field(None, pattern=r'^\+?[1-9]\d{1,14}$')
    role: Optional[UserRole] = None
    is_active: Optional[bool] = None
    password: Optional[str] = Field(None, min_length=8, max_length=128)


class UserResponse(UserBase):
    id: int
    is_active: bool
    created_at: datetime
    updated_at: Optional[datetime] = None
    
    class Config:
        from_attributes = True


class UserInDB(UserResponse):
    hashed_password: str
