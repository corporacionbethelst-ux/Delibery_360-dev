"""
Delivery360 - User Management API Endpoints
"""

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from typing import List
import uuid

from app.core.database import get_db
from app.models.user import User, UserRole
from app.api.v1.auth import get_current_user


router = APIRouter()


@router.get("/", response_model=List[dict])
async def list_users(
    skip: int = 0,
    limit: int = 100,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    List all active users (requires manager or superadmin role)
    """
    if current_user.role not in [UserRole.SUPERADMIN, UserRole.GERENTE]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="No tienes permisos para listar usuarios"
        )
    
    result = await db.execute(select(User).where(User.is_active == True).offset(skip).limit(limit))
    users = result.scalars().all()
    return [{
        "id": str(u.id),
        "email": u.email,
        "full_name": u.full_name,
        "role": u.role.value,
        "is_active": u.is_active,
        "phone": u.phone,
        "created_at": u.created_at.isoformat() if u.created_at else None,
    } for u in users]


@router.get("/{user_id}", response_model=dict)
async def get_user(
    user_id: str,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Get user by ID
    """
    # Users can only view their own profile unless they're managers
    if current_user.id != uuid.UUID(user_id) and current_user.role not in [UserRole.SUPERADMIN, UserRole.GERENTE]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="No tienes permisos para ver este usuario"
        )
    
    result = await db.execute(select(User).where(User.id == uuid.UUID(user_id)))
    user = result.scalar_one_or_none()
    
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Usuario no encontrado"
        )
    
    return {
        "id": str(user.id),
        "email": user.email,
        "full_name": user.full_name,
        "role": user.role.value,
        "is_active": user.is_active,
        "phone": user.phone,
        "created_at": user.created_at.isoformat() if user.created_at else None,
    }
