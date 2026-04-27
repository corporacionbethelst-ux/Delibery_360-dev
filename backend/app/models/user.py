"""User model for authentication and authorization."""

import uuid
from datetime import datetime, timezone  # CORREGIDO: Agregado timezone
from typing import Any, List, Optional
from sqlalchemy import Column, String, Boolean, DateTime, Enum as SQLEnum
from sqlalchemy.orm import relationship
from sqlalchemy.dialects.postgresql import UUID
import enum
from passlib.context import CryptContext

from app.core.database import Base

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

class UserRole(str, enum.Enum):
    SUPERADMIN = "superadmin"
    GERENTE = "gerente"
    OPERADOR = "operador"
    REPARTIDOR = "repartidor"
    CLIENTE = "cliente"
    ADMIN = "superadmin"
    MANAGER = "gerente"
    DISPATCHER = "operador"
    RIDER = "repartidor"
    CUSTOMER = "cliente"

class User(Base):
    __tablename__ = "users"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4, index=True)
    email = Column(String(255), unique=True, index=True, nullable=False)
    hashed_password = Column(String(255), nullable=False)
    is_active = Column(Boolean, default=True)
    is_superuser = Column(Boolean, default=False)
    first_name = Column(String(100), nullable=False)
    last_name = Column(String(100), nullable=False)
    phone = Column(String(20))
    role: Any = Column(SQLEnum(UserRole), default=UserRole.OPERADOR)
    avatar_url = Column(String(500))
    last_login = Column(DateTime)
    failed_login_attempts = Column(String, default="0")
    locked_until = Column(DateTime)
    
    # CORREGIDO: Uso de lambda y timezone.utc
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    updated_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc))

    def verify_password(self, password: str) -> bool:
        return pwd_context.verify(password, self.hashed_password)

    @staticmethod
    def get_password_hash(password: str) -> str:
        return pwd_context.hash(password)

    def __repr__(self):
        return f"<User(id={self.id}, email={self.email}, role={self.role})>"