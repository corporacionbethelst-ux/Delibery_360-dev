"""AuditLog model."""
from datetime import datetime, timezone  # CORREGIDO
from typing import Any
from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, Enum as SQLEnum, Text, Boolean, JSON, Index, Float
from sqlalchemy.orm import relationship
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
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), index=True)
    user_email = Column(String(255))
    user_role = Column(String(50))
    
    action_type: Any = Column(SQLEnum(ActionType), nullable=False, index=True)
    resource_type = Column(String(50), index=True)
    resource_id = Column(Integer, index=True)
    
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
    data_subject_id = Column(Integer)
    retention_until = Column(DateTime)
    
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), index=True)
    
    user = relationship("User")
    actions = relationship("AuditAction", back_populates="audit_log", cascade="all, delete-orphan")
    
    __table_args__ = (
        Index('idx_audit_resource', 'resource_type', 'resource_id'),
        Index('idx_audit_user_date', 'user_id', 'created_at'),
    )

    def __repr__(self):
        return f"<AuditLog(id={self.id}, action={self.action_type}, user={self.user_email})>"

class AuditAction(Base):
    __tablename__ = "audit_actions"
    id = Column(Integer, primary_key=True, index=True)
    audit_log_id = Column(Integer, ForeignKey("audit_logs.id"), index=True)
    field_name = Column(String(100))
    old_value = Column(Text)
    new_value = Column(Text)
    change_type = Column(String(20))
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    audit_log = relationship("AuditLog", back_populates="actions")

    def __repr__(self):
        return f"<AuditAction(audit={self.audit_log_id}, field={self.field_name})>"