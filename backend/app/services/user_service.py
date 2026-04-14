"""
Servicio de Gestión de Usuarios
"""
import uuid
from typing import Optional, List
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from fastapi import HTTPException, status

from app.models.user import User, UserRole
from app.schemas.user import UserCreate, UserUpdate
from app.services.auth_service import auth_service


class UserService:
    """Servicio para gestión de usuarios"""
    
    async def get_user(self, db: AsyncSession, user_id: uuid.UUID) -> User:
        """Obtiene usuario por ID"""
        result = await db.execute(select(User).where(User.id == user_id, User.is_deleted.is_(False)))
        user = result.scalar_one_or_none()
        if not user:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Usuario no encontrado"
            )
        return user
    
    async def get_user_by_email(self, db: AsyncSession, email: str) -> Optional[User]:
        """Obtiene usuario por email"""
        result = await db.execute(
            select(User).where(User.email == email, User.is_deleted.is_(False))
        )
        return result.scalar_one_or_none()
    
    async def create_user(
        self, 
        db: AsyncSession, 
        user_data: UserCreate,
        created_by: int
    ) -> User:
        """Crea un nuevo usuario"""
        # Verificar si email ya existe
        existing_user = await self.get_user_by_email(db, user_data.email)
        if existing_user:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Email ya registrado"
            )
        
        # Hash de contraseña
        hashed_password = auth_service.get_password_hash(user_data.password)
        
        # Crear usuario
        user = User(
            email=user_data.email,
            full_name=user_data.full_name,
            hashed_password=hashed_password,
            role=user_data.role,
            is_active=True,
        )
        db.add(user)
        await db.commit()
        await db.refresh(user)
        return user
    
    async def update_user(
        self,
        db: AsyncSession,
        user_id: uuid.UUID,
        user_data: UserUpdate,
        updated_by: int
    ) -> User:
        """Actualiza usuario existente"""
        user = await self.get_user(db, user_id)
        
        update_data = user_data.model_dump(exclude_unset=True)
        
        # Si se actualiza contraseña, hacer hash
        if "password" in update_data and update_data["password"]:
            update_data["hashed_password"] = auth_service.get_password_hash(update_data.pop("password"))
        
        for field, value in update_data.items():
            setattr(user, field, value)
        db.add(user)
        await db.commit()
        await db.refresh(user)
        return user
    
    async def delete_user(self, db: AsyncSession, user_id: uuid.UUID, deleted_by: int) -> None:
        """Elimina usuario (soft delete)"""
        user = await self.get_user(db, user_id)
        user.is_deleted = True
        user.is_active = False
        db.add(user)
        await db.commit()
    
    async def list_users(
        self, 
        db: AsyncSession, 
        skip: int = 0, 
        limit: int = 100,
        role: Optional[UserRole] = None,
        is_active: Optional[bool] = None
    ) -> List[User]:
        """Lista usuarios con filtros"""
        q = select(User).where(User.is_deleted.is_(False))
        if role is not None:
            q = q.where(User.role == role)
        if is_active is not None:
            q = q.where(User.is_active == is_active)

        q = q.offset(skip).limit(limit)
        result = await db.execute(q)
        return list(result.scalars().all())
    
    async def deactivate_user(self, db: AsyncSession, user_id: uuid.UUID, deactivated_by: int) -> User:
        """Desactiva usuario"""
        user = await self.get_user(db, user_id)
        user.is_active = False
        db.add(user)
        await db.commit()
        await db.refresh(user)
        return user
    
    async def activate_user(self, db: AsyncSession, user_id: uuid.UUID, activated_by: int) -> User:
        """Activa usuario"""
        user = await self.get_user(db, user_id)
        user.is_active = True
        db.add(user)
        await db.commit()
        await db.refresh(user)
        return user


user_service = UserService()
