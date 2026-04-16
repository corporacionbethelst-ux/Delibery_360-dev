"""
Servicio de Auditoría para tracking de acciones
"""
from datetime import datetime
from typing import Optional, List, Dict, Any
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from app.models.audit_log import AuditLog, AuditAction
from app.crud.base import CRUDBase


class AuditService:
    
    def __init__(self, db: AsyncSession):
        self.db = db
    
    async def log_action(
        self,
        user_id: int,
        action: AuditAction,
        resource_type: str,
        resource_id: Optional[int] = None,
        details: Optional[Dict[str, Any]] = None,
        ip_address: Optional[str] = None,
        user_agent: Optional[str] = None
    ) -> AuditLog:
        audit_log = AuditLog(
            user_id=user_id,
            action=action,
            resource_type=resource_type,
            resource_id=resource_id,
            details=details or {},
            ip_address=ip_address,
            user_agent=user_agent,
            timestamp=datetime.utcnow()
        )
        
        self.db.add(audit_log)
        await self.db.commit()
        await self.db.refresh(audit_log)
        
        return audit_log
    
    async def get_user_actions(
        self,
        user_id: int,
        limit: int = 100,
        offset: int = 0
    ) -> List[AuditLog]:
        query = select(AuditLog).where(AuditLog.user_id == user_id)
        query = query.order_by(AuditLog.timestamp.desc())
        query = query.limit(limit).offset(offset)
        
        result = await self.db.execute(query)
        return result.scalars().all()
    
    async def get_resource_history(
        self,
        resource_type: str,
        resource_id: int
    ) -> List[AuditLog]:
        query = select(AuditLog).where(
            AuditLog.resource_type == resource_type,
            AuditLog.resource_id == resource_id
        )
        query = query.order_by(AuditLog.timestamp.asc())
        
        result = await self.db.execute(query)
        return result.scalars().all()
    
    async def get_actions_by_date_range(
        self,
        start_date: datetime,
        end_date: datetime,
        action_type: Optional[AuditAction] = None,
        user_id: Optional[int] = None
    ) -> List[AuditLog]:
        query = select(AuditLog).where(
            AuditLog.timestamp >= start_date,
            AuditLog.timestamp <= end_date
        )
        
        if action_type:
            query = query.where(AuditLog.action == action_type)
        
        if user_id:
            query = query.where(AuditLog.user_id == user_id)
        
        query = query.order_by(AuditLog.timestamp.desc())
        
        result = await self.db.execute(query)
        return result.scalars().all()
    
    async def get_action_statistics(
        self,
        start_date: datetime,
        end_date: datetime
    ) -> Dict[str, Any]:
        # Total de acciones
        total_query = select(func.count()).select_from(AuditLog).where(
            AuditLog.timestamp >= start_date,
            AuditLog.timestamp <= end_date
        )
        total_result = await self.db.execute(total_query)
        total = total_result.scalar()
        
        # Acciones por tipo
        by_type_query = select(
            AuditLog.action,
            func.count().label('count')
        ).where(
            AuditLog.timestamp >= start_date,
            AuditLog.timestamp <= end_date
        ).group_by(AuditLog.action)
        
        type_result = await self.db.execute(by_type_query)
        by_type = {row.action.value: row.count for row in type_result}
        
        return {
            "total_actions": total,
            "by_action_type": by_type,
            "period_start": start_date.isoformat(),
            "period_end": end_date.isoformat(),
        }
    
    async def cleanup_old_logs(self, days_to_keep: int = 365) -> int:
        from sqlalchemy import delete
        from datetime import timedelta
        
        cutoff_date = datetime.utcnow() - timedelta(days=days_to_keep)
        
        query = delete(AuditLog).where(AuditLog.timestamp < cutoff_date)
        result = await self.db.execute(query)
        await self.db.commit()
        
        return result.rowcount


def get_audit_service(db: AsyncSession) -> AuditService:
    return AuditService(db)
