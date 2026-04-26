"""User model for authentication and authorization."""

import uuid
from datetime import datetime
from typing import Any, List, Optional
from sqlalchemy import Column, String, Boolean, DateTime, Enum as SQLEnum
from sqlalchemy.orm import relationship
from sqlalchemy.dialects.postgresql import UUID
import enum
from passlib.context import CryptContext

from app.core.database import Base

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")


class UserRole(str, enum.Enum):
    """User roles for access control."""
    SUPERADMIN = "superadmin"
    GERENTE = "gerente"
    OPERADOR = "operador"
    REPARTIDOR = "repartidor"  # Rol lógico, aunque el repartidor técnico está en la tabla Riders
    CLIENTE = "cliente"

    # Aliases
    ADMIN = "superadmin"
    MANAGER = "gerente"
    DISPATCHER = "operador"
    RIDER = "repartidor"
    CUSTOMER = "cliente"


class User(Base):
    """User model for system access."""
    
    __tablename__ = "users"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4, index=True)
    
    # Authentication
    email = Column(String(255), unique=True, index=True, nullable=False)
    hashed_password = Column(String(255), nullable=False)
    is_active = Column(Boolean, default=True)
    is_superuser = Column(Boolean, default=False)
    
    # Profile Information
    first_name = Column(String(100), nullable=False)
    last_name = Column(String(100), nullable=False)
    phone = Column(String(20))
    role: Any = Column(SQLEnum(UserRole), default=UserRole.OPERADOR)
    
    # Additional Info
    avatar_url = Column(String(500))
    last_login = Column(DateTime)
    failed_login_attempts = Column(String, default=0)
    locked_until = Column(DateTime)
    
    # Timestamps
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    # NOTA: Se eliminó 'rider_profile' porque no existe user_id en la tabla riders.
    # Si necesitas acceder al perfil de repartidor de un usuario, hazlo buscando por email o ID externo en tu lógica de negocio,
    # o añade una FK user_id en la tabla Riders si esa es la arquitectura deseada.
    
    # Relación con AuditLogs si existiera
    # audit_logs = relationship("AuditLog", back_populates="user")

    def verify_password(self, password: str) -> bool:
        return pwd_context.verify(password, self.hashed_password)

    @staticmethod
    def get_password_hash(password: str) -> str:
        return pwd_context.hash(password)

    def __repr__(self):
        return f"<User(id={self.id}, email={self.email}, role={self.role})>"