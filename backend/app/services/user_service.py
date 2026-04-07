"""
Servicio de Gestión de Usuarios
"""
from typing import Optional, List
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from fastapi import HTTPException, status

from app.models.user import User, UserRole
from app.schemas.user import UserCreate, UserUpdate
from app.crud.user import user as user_crud
from app.services.auth_service import auth_service


class UserService:
    """Servicio para gestión de usuarios"""
    
    async def get_user(self, db: AsyncSession, user_id: int) -> Optional[User]:
        """Obtiene usuario por ID"""
        user = await user_crud.get(db, user_id)
        if not user:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Usuario no encontrado"
            )
        return user
    
    async def get_user_by_email(self, db: AsyncSession, email: str) -> Optional[User]:
        """Obtiene usuario por email"""
        return await user_crud.get_by_email(db, email)
    
    async def create_user(
        self, 
        db: AsyncSession, 
        user_data: UserCreate,
        created_by: int
    ) -> User:
        """Crea un nuevo usuario"""
        # Verificar si email ya existe
        existing_user = await user_crud.get_by_email(db, user_data.email)
        if existing_user:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Email ya registrado"
            )
        
        # Hash de contraseña
        hashed_password = auth_service.get_password_hash(user_data.password)
        
        # Crear usuario
        user = await user_crud.create(
            db, 
            obj_in={
                "email": user_data.email,
                "full_name": user_data.full_name,
                "hashed_password": hashed_password,
                "role": user_data.role,
                "is_active": True,
                "created_by": created_by
            }
        )
        return user
    
    async def update_user(
        self, 
        db: AsyncSession, 
        user_id: int, 
        user_data: UserUpdate,
        updated_by: int
    ) -> User:
        """Actualiza usuario existente"""
        user = await self.get_user(db, user_id)
        
        update_data = user_data.model_dump(exclude_unset=True)
        
        # Si se actualiza contraseña, hacer hash
        if "password" in update_data and update_data["password"]:
            update_data["hashed_password"] = auth_service.get_password_hash(update_data.pop("password"))
        
        update_data["updated_by"] = updated_by
        
        user = await user_crud.update(db, db_obj=user, obj_in=update_data)
        return user
    
    async def delete_user(self, db: AsyncSession, user_id: int, deleted_by: int) -> None:
        """Elimina usuario (soft delete)"""
        user = await self.get_user(db, user_id)
        await user_crud.delete(db, id=user_id)
    
    async def list_users(
        self, 
        db: AsyncSession, 
        skip: int = 0, 
        limit: int = 100,
        role: Optional[UserRole] = None,
        is_active: Optional[bool] = None
    ) -> List[User]:
        """Lista usuarios con filtros"""
        return await user_crud.get_multi(
            db, 
            skip=skip, 
            limit=limit,
            role=role,
            is_active=is_active
        )
    
    async def deactivate_user(self, db: AsyncSession, user_id: int, deactivated_by: int) -> User:
        """Desactiva usuario"""
        user = await self.get_user(db, user_id)
        user = await user_crud.update(
            db, 
            db_obj=user, 
            obj_in={"is_active": False, "updated_by": deactivated_by}
        )
        return user
    
    async def activate_user(self, db: AsyncSession, user_id: int, activated_by: int) -> User:
        """Activa usuario"""
        user = await self.get_user(db, user_id)
        user = await user_crud.update(
            db, 
            db_obj=user, 
            obj_in={"is_active": True, "updated_by": activated_by}
        )
        return user


user_service = UserService()
