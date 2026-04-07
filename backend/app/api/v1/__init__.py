from app.api.v1 import auth
from app.api.v1 import orders
from app.api.v1 import riders
from app.api.v1.routers_combined import (
    deliveries_router,
    shifts_router,
    financial_router,
    productivity_router,
    routes_router,
    dashboard_router,
    alerts_router,
    audit_router,
    integrations_router,
    users_router,
)
from types import ModuleType
import types

# Crear módulos ficticios para que main.py pueda hacer .router
def _make_module(router_obj, name):
    m = types.ModuleType(name)
    m.router = router_obj
    return m

deliveries   = _make_module(deliveries_router,   "deliveries")
shifts       = _make_module(shifts_router,        "shifts")
financial    = _make_module(financial_router,     "financial")
productivity = _make_module(productivity_router,  "productivity")
routes       = _make_module(routes_router,        "routes")
dashboard    = _make_module(dashboard_router,     "dashboard")
alerts       = _make_module(alerts_router,        "alerts")
audit        = _make_module(audit_router,         "audit")
integrations = _make_module(integrations_router,  "integrations")
users        = _make_module(users_router,         "users")