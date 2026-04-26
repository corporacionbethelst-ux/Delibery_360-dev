# backend/app/models/__init__.py

# Importaciones directas de modelos existentes
from app.models.user import User, UserRole
from app.models.rider import Rider, RiderStatus, VehicleType
from app.models.order import Order, OrderStatus, OrderPriority
from app.models.delivery import Delivery, DeliveryStatus, ProofType
from app.models.route import Route, RoutePoint, RouteDeviation, RouteStatus

# Intentar importar modelos adicionales si existen, sino ignorar
try:
    from app.models.shift import Shift, ShiftStatus
except ImportError:
    Shift = None
    ShiftStatus = None

try:
    from app.models.financial import Financial, PaymentRuleType
except ImportError:
    Financial = None
    PaymentRuleType = None

try:
    from app.models.productivity import Productivity
except ImportError:
    Productivity = None

try:
    from app.models.audit_log import AuditLog
except ImportError:
    AuditLog = None

try:
    from app.models.notification import Notification, NotificationType
except ImportError:
    Notification = None
    NotificationType = None

try:
    from app.models.integration import Integration
except ImportError:
    Integration = None

# Alias por compatibilidad con imports relativos del código existente
# Solo asignamos el alias si la clase fue importada exitosamente
shift = Shift if Shift else None
financial = Financial if Financial else None
route = Route
audit_log = AuditLog if AuditLog else None
notification = Notification if Notification else None
integration = Integration if Integration else None
productivity = Productivity if Productivity else None

__all__ = [
    "User", "UserRole",
    "Rider", "RiderStatus", "VehicleType",
    "Order", "OrderStatus", "OrderPriority",
    "Delivery", "DeliveryStatus", "ProofType",
    "Route", "RoutePoint", "RouteDeviation", "RouteStatus",
    # Solo agregar al __all__ si existen
    *([item for item in ["Shift", "ShiftStatus"] if item in locals()]),
    *([item for item in ["Financial", "PaymentRuleType"] if item in locals()]),
    *([item for item in ["Productivity"] if item in locals()]),
    *([item for item in ["AuditLog"] if item in locals()]),
    *([item for item in ["Notification", "NotificationType"] if item in locals()]),
    *([item for item in ["Integration"] if item in locals()]),
    # Aliases de módulos
    "user", "rider", "order", "delivery", "route",
    *([item for item in ["shift", "financial", "audit_log", "notification", "integration", "productivity"] if locals().get(item) is not None])
]