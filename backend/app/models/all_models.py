# backend/app/models/all_models.py
"""
Central import point for all SQLAlchemy models.
Import this module to ensure all models are registered with the Base metadata.
"""

from app.models.user import User
from app.models.rider import Rider
from app.models.order import Order
from app.models.delivery import Delivery, DeliveryStatus, ProofType
from app.models.route import Route, RoutePoint, RouteDeviation, RouteStatus

# Importaciones condicionales para modelos opcionales
try:
    from app.models.shift import Shift, ShiftStatus
except ImportError:
    pass

try:
    from app.models.financial import Financial, PaymentRuleType
except ImportError:
    pass

try:
    from app.models.productivity import Productivity
except ImportError:
    pass

try:
    from app.models.audit_log import AuditLog
except ImportError:
    pass

try:
    from app.models.notification import Notification, NotificationType
except ImportError:
    pass

try:
    from app.models.integration import Integration
except ImportError:
    pass

__all__ = [
    "User",
    "Rider",
    "Order",
    "Delivery",
    "DeliveryStatus",
    "ProofType",
    "Route",
    "RoutePoint",
    "RouteDeviation",
    "RouteStatus",
]