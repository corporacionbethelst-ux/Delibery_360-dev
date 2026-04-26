"""AuditLog model for tracking system actions and compliance."""
from datetime import datetime
from typing import Any
import uuid
from sqlalchemy import Column, String, DateTime, ForeignKey, Enum as SQLEnum, Text, Boolean, JSON, Index, Float, Integer
from sqlalchemy.orm import relationship
from sqlalchemy.dialects.postgresql import UUID
import enum
from app.core.database import Base

class ActionType(str, enum.Enum):
    LOGIN = "login"
    LOGOUT = "logout"
    CREATE = "create"
    READ = "read"
    UPDATE = "update"
    DELETE = "delete"
    ASSIGN = "assign"
    REASSIGN = "reassign"
    STATUS_CHANGE = "status_change"
    PAYMENT = "payment"
    EXPORT = "export"
    IMPORT = "import"
    CONFIG_CHANGE = "config_change"
    ACCESS_DENIED = "access_denied"

class AuditLog(Base):
    __tablename__ = "audit_logs"
    
    # CORRECCIÓN: Usar UUID para el ID
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4, index=True)
    
    # CORRECCIÓN: Usar UUID para la foreign key
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), index=True)
    user_email = Column(String(255))
    user_role = Column(String(50))
    
    action_type: Any = Column(SQLEnum(ActionType), nullable=False, index=True)
    resource_type = Column(String(50), index=True)
    resource_id = Column(UUID(as_uuid=True), index=True) # También debería ser UUID si referencia a otras tablas UUID
    
    description = Column(Text)
    old_values = Column(JSON)
    new_values = Column(JSON)
    changes_summary = Column(String(500))
    
    ip_address = Column(String(45))
    user_agent = Column(String(500))
    request_method = Column(String(10))
    request_path = Column(String(255))
    
    latitude = Column(Float)
    longitude = Column(Float)
    
    status_code = Column(Integer)
    success = Column(Boolean, default=True)
    error_message = Column(Text)
    
    contains_personal_data = Column(Boolean, default=False)
    data_subject_id = Column(UUID(as_uuid=True)) # Si referencia a users, debe ser UUID
    retention_until = Column(DateTime)
    
    created_at = Column(DateTime, default=datetime.utcnow, index=True)
    
    user = relationship("User")
    actions = relationship("AuditAction", back_populates="audit_log", cascade="all, delete-orphan")

    __table_args__ = (
        Index('idx_audit_resource', 'resource_type', 'resource_id'),
        Index('idx_audit_user_date', 'user_id', 'created_at'),
    )

class AuditAction(Base):
    __tablename__ = "audit_actions"
    
    # CORRECCIÓN: Usar UUID
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4, index=True)
    
    # CORRECCIÓN: Usar UUID para la foreign key
    audit_log_id = Column(UUID(as_uuid=True), ForeignKey("audit_logs.id"), index=True)
    
    field_name = Column(String(100))
    old_value = Column(Text)
    new_value = Column(Text)
    change_type = Column(String(20))
    created_at = Column(DateTime, default=datetime.utcnow)
    
    audit_log = relationship("AuditLog", back_populates="actions")