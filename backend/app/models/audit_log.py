"""AuditLog model for tracking system actions and compliance."""

from datetime import datetime
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
    
    # Actor Information
    user_id = Column(Integer, ForeignKey("users.id"), index=True)
    user_email = Column(String(255))  # Denormalized for performance
    user_role = Column(String(50))
    
    # Action Details
    action_type = Column(SQLEnum(ActionType), nullable=False, index=True)
    resource_type = Column(String(50), index=True)  # user, order, delivery, rider, etc.
    resource_id = Column(Integer, index=True)
    
    # Action Context
    description = Column(Text)
    old_values = Column(JSON)  # Datos antes del cambio
    new_values = Column(JSON)  # Datos después del cambio
    changes_summary = Column(String(500))  # Resumen legible
    
    # Request Information
    ip_address = Column(String(45))  # IPv6 compatible
    user_agent = Column(String(500))
    request_method = Column(String(10))  # GET, POST, PUT, DELETE
    request_path = Column(String(255))
    
    # Location (if applicable)
    latitude = Column(Float)
    longitude = Column(Float)
    
    # Outcome
    status_code = Column(Integer)  # HTTP status code
    success = Column(Boolean, default=True)
    error_message = Column(Text)
    
    # LGPD Compliance
    contains_personal_data = Column(Boolean, default=False)
    data_subject_id = Column(Integer)  # ID del titular de datos (si aplica)
    retention_until = Column(DateTime)  # Fecha de eliminación programada
    
    # Timestamps
    created_at = Column(DateTime, default=datetime.utcnow, index=True)
    
    # Relationships
    user = relationship("User", back_populates="audit_logs")
    
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
    
    # Action Details
    field_name = Column(String(100))
    old_value = Column(Text)  # JSON string
    new_value = Column(Text)  # JSON string
    
    # Change Type
    change_type = Column(String(20))  # create, update, delete
    
    # Timestamp
    created_at = Column(DateTime, default=datetime.utcnow)
    
    # Relationships
    audit_log = relationship("AuditLog", back_populates="actions")
    
    def __repr__(self):
        return f"<AuditAction(audit={self.audit_log_id}, field={self.field_name})>"


# Add relationship to AuditLog class
AuditLog.actions = relationship("AuditAction", back_populates="audit_log", cascade="all, delete-orphan")
