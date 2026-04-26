from app.models.user import User, UserRole
from app.models.rider import Rider, RiderStatus, VehicleType
from app.models.order import Order, OrderStatus, OrderPriority
from app.models.delivery import Delivery, DeliveryStatus, ProofType
from app.models.all_models import (
    Shift, ShiftStatus,
    Financial, PaymentRuleType,
    Route, AuditLog, Notification,
    NotificationType, Integration, Productivity
)

# Alias por compatibilidad con imports relativos del código existente
from app.models import user, rider, order, delivery
from app.models.all_models import (
    Shift as shift,
    Financial as financial,
    Route as route,
    AuditLog as audit_log,
    Notification as notification,
    Integration as integration,
    Productivity as productivity,
)

__all__ = [
    "User", "UserRole",
    "Rider", "RiderStatus", "VehicleType",
    "Order", "OrderStatus", "OrderPriority",
    "Delivery", "DeliveryStatus", "ProofType",
    "Shift", "ShiftStatus",
    "Financial", "PaymentRuleType",
    "Route", "AuditLog", "Notification",
    "NotificationType", "Integration", "Productivity",
    "user", "rider", "order", "delivery",
    "shift", "financial", "route",
    "audit_log", "notification", "integration", "productivity",
]
