import uuid
from datetime import datetime, timezone
from enum import Enum as PyEnum
from sqlalchemy import String, Boolean, DateTime, Enum
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy.dialects.postgresql import UUID
from app.core.database import Base


class UserRole(str, PyEnum):
    SUPERADMIN = "superadmin"
    GERENTE = "gerente"
    OPERADOR = "operador"
    REPARTIDOR = "repartidor"


class User(Base):
    __tablename__ = "users"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    email: Mapped[str] = mapped_column(String(255), unique=True, index=True, nullable=False)
    hashed_password: Mapped[str] = mapped_column(String(255), nullable=False)
    full_name: Mapped[str] = mapped_column(String(255), nullable=False)
    role: Mapped[UserRole] = mapped_column(Enum(UserRole), default=UserRole.OPERADOR, nullable=False)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)
    phone: Mapped[str | None] = mapped_column(String(30))
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc))
    last_login: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))

    # LGPD
    lgpd_consent: Mapped[bool] = mapped_column(Boolean, default=False)
    lgpd_consent_date: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
    is_deleted: Mapped[bool] = mapped_column(Boolean, default=False)

    # Relationships
    rider_profile = relationship("Rider", back_populates="user", uselist=False)
    audit_logs = relationship("AuditLog", back_populates="user")

    def __repr__(self) -> str:
        return f"<User {self.email} [{self.role}]>"
