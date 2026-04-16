"""
Alert Service - Gestión de Alertas Operacionales
"""
from typing import Optional, List
from datetime import datetime, timedelta
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.models.notification import Notification, NotificationType, NotificationPriority
from app.models.delivery import Delivery, DeliveryStatus
from app.models.order import Order, OrderStatus
import logging

logger = logging.getLogger(__name__)


class AlertService:
    
    async def create_alert(
        self,
        db: AsyncSession,
        alert_type: str,
        severity: str,
        title: str,
        message: str,
        related_entity_id: Optional[int] = None,
        related_entity_type: Optional[str] = None,
        recipient_user_ids: Optional[List[int]] = None
    ) -> Notification:
        priority_map = {
            "low": NotificationPriority.BAJA,
            "medium": NotificationPriority.NORMAL,
            "high": NotificationPriority.ALTA,
            "critical": NotificationPriority.CRITICA,
        }
        normalized_severity = self._normalize_severity_key(severity)
        normalized_related_id = self._to_related_id(related_entity_id)
        alert_data = {"alert_type": alert_type, "severity": normalized_severity}
        if related_entity_id is not None and normalized_related_id is None:
            alert_data["related_entity_ref"] = str(related_entity_id)

        normalized_recipient_user_ids = self._normalize_recipient_user_ids(recipient_user_ids)
        base_notification_kwargs = dict(
            notification_type=NotificationType.ALERTA_OPERACIONAL,
            priority=priority_map.get(normalized_severity, NotificationPriority.NORMAL),
            title=title,
            message=message,
            data=alert_data,
            related_id=normalized_related_id,
            related_type=related_entity_type,
        )

        notifications = [
            Notification(**base_notification_kwargs, user_id=user_id)
            for user_id in normalized_recipient_user_ids
        ] or [Notification(**base_notification_kwargs)]

        db.add_all(notifications)
        await db.commit()
        for notification in notifications:
            await db.refresh(notification)

        logger.info(
            "Alerta creada: %s (severity: %s, recipients: %s)",
            title,
            normalized_severity,
            len(normalized_recipient_user_ids),
        )
        return notifications[0]
    
    async def check_sla_alerts(self, db: AsyncSession, threshold_minutes: int = 5) -> List[Notification]:
        now = datetime.utcnow()
        threshold_time = now + timedelta(minutes=threshold_minutes)
        
        # Buscar entregas en progreso que están cerca del límite SLA
        result = await db.execute(
            select(Delivery)
            .where(Delivery.status == DeliveryStatus.IN_PROGRESS)
            .where(Delivery.expected_completion_at <= threshold_time)
        )
        deliveries_at_risk = result.scalars().all()
        
        alerts = []
        for delivery in deliveries_at_risk:
            alert = await self.create_alert(
                db=db,
                alert_type="sla_warning",
                severity="high",
                title=f"Entrega #{delivery.id} en riesgo de SLA",
                message=f"La entrega {delivery.id} debe completarse en {threshold_minutes} minutos",
                related_entity_id=delivery.id,
                related_entity_type="delivery"
            )
            alerts.append(alert)
        
        return alerts
    
    async def check_inactive_riders(self, db: AsyncSession, inactive_minutes: int = 30) -> List[Notification]:
        # Implementación pendiente de tracking en tiempo real
        logger.info("Verificando repartidores inactivos...")
        return []
    
    async def check_pending_orders(self, db: AsyncSession, threshold_minutes: int = 10) -> List[Notification]:
        threshold_time = datetime.utcnow() - timedelta(minutes=threshold_minutes)
        
        result = await db.execute(
            select(Order)
            .where(Order.status == OrderStatus.PENDING)
            .where(Order.created_at <= threshold_time)
        )
        pending_orders = result.scalars().all()
        
        alerts = []
        for order in pending_orders:
            alert = await self.create_alert(
                db=db,
                alert_type="pending_order",
                severity="medium",
                title=f"Pedido #{order.id} sin asignar",
                message=f"El pedido {order.id} lleva {threshold_minutes}+ minutos sin repartidor",
                related_entity_id=order.id,
                related_entity_type="order"
            )
            alerts.append(alert)
        
        return alerts
    
    async def get_active_alerts(
        self,
        db: AsyncSession,
        limit: int = 100
    ) -> List[Notification]:
        result = await db.execute(
            select(Notification)
            .where(Notification.type == NotificationType.ALERT)
            .where(Notification.is_read == False)
            .order_by(Notification.created_at.desc())
            .limit(limit)
        )
        return result.scalars().all()


alert_service = AlertService()