"""
Delivery360 - Main Application Entry Point
FastAPI application with full configuration
"""

from fastapi import FastAPI, Request, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from fastapi.exceptions import RequestValidationError
from contextlib import asynccontextmanager
import logging
from typing import AsyncGenerator

from app.core.config import settings
from app.core.database import engine, Base
from app.core.exception_handlers import register_exception_handlers
from app.api.v1 import (
    auth, users, riders, orders, deliveries,
    shifts, productivity, financial, dashboard,
    routes, alerts, integrations, audit
)
from app.middleware import RateLimitMiddleware, AuditLogMiddleware
from app.monitoring.health_check import health_router
from app.monitoring.metrics import metrics_router

logging.basicConfig(
    level=settings.LOG_LEVEL,
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s"
)
logger = logging.getLogger(__name__)


@asynccontextmanager
async def lifespan(app: FastAPI) -> AsyncGenerator[None, None]:
    # Startup: iniciar aplicación y crear tablas en desarrollo
    logger.info("Starting Delivery360 API...")  # Log de inicio
    
    if settings.ENVIRONMENT == "development":  # Crear tablas solo en desarrollo
        logger.info("Creating database tables...")
        async with engine.begin() as conn:
            await conn.run_sync(Base.metadata.create_all)
    
    logger.info("Delivery360 API started successfully")  # Confirmación de inicio
    
    yield  # Aplicación en ejecución
    
    # Shutdown: cerrar conexiones de base de datos
    logger.info("Shutting down Delivery360 API...")  # Log de cierre
    await engine.dispose()  # Liberar conexiones de BD
    logger.info("Database connections closed")  # Confirmación de cierre


def create_app() -> FastAPI:
    # Factory pattern para crear y configurar la instancia de FastAPI
    
    # Crear instancia de FastAPI con metadatos del proyecto
    app = FastAPI(
        title="Delivery360 API",
        description="Sistema completo de gestión de entregas - Enterprise Delivery Management",
        version="1.0.0",
        docs_url="/docs",
        redoc_url="/redoc",
        openapi_url="/openapi.json",
        lifespan=lifespan
    )
    
    from app.middleware.cors_middleware import setup_cors_middleware, get_security_headers
    from fastapi.middleware.trustedhost import TrustedHostMiddleware
    from starlette.middleware.base import BaseHTTPMiddleware
    
    setup_cors_middleware(app)  # Configurar CORS para dominios autorizados
    
    # Middleware para agregar headers de seguridad en todas las respuestas
    @app.middleware("http")
    async def add_security_headers(request: Request, call_next):
        response = await call_next(request)  # Ejecutar siguiente middleware/endpoint
        for header, value in get_security_headers().items():  # Agregar cada header de seguridad
            response.headers[header] = value
        return response
    
    # TrustedHostMiddleware solo en producción para prevenir host header injection
    if settings.ENVIRONMENT == "production":
        app.add_middleware(
            TrustedHostMiddleware,
            allowed_hosts=[
                "api.delivery360.com",
                "*.delivery360.com",
                "localhost",
                "127.0.0.1"
            ]
        )
    
    app.add_middleware(RateLimitMiddleware)  # Rate limiting para prevenir abuso
    app.add_middleware(AuditLogMiddleware)  # Logging de auditoría para trazabilidad
    
    register_exception_handlers(app)  # Registrar manejadores globales de excepciones
    
    # Registro de routers de API v1
    app.include_router(auth.router, prefix="/api/v1", tags=["Auth"])  # Autenticación
    app.include_router(users.router, prefix="/api/v1", tags=["Users"])  # Gestión de usuarios
    app.include_router(riders.router, prefix="/api/v1", tags=["Riders"])  # Gestión de repartidores
    app.include_router(orders.router, prefix="/api/v1", tags=["Orders"])  # Gestión de órdenes
    app.include_router(deliveries.router, prefix="/api/v1", tags=["Deliveries"])  # Gestión de entregas
    app.include_router(shifts.router, prefix="/api/v1", tags=["Shifts"])  # Control de turnos
    app.include_router(productivity.router, prefix="/api/v1", tags=["Productivity"])  # Métricas de rendimiento
    app.include_router(financial.router, prefix="/api/v1", tags=["Financial"])  # Pagos y liquidaciones
    app.include_router(dashboard.router, prefix="/api/v1", tags=["Dashboard"])  # Datos consolidados
    app.include_router(routes.router, prefix="/api/v1", tags=["Routes"])  # Optimización de rutas
    app.include_router(alerts.router, prefix="/api/v1", tags=["Alerts"])  # Notificaciones y alertas
    app.include_router(integrations.router, prefix="/api/v1", tags=["Integrations"])  # Conexión ERP/POS
    app.include_router(audit.router, prefix="/api/v1", tags=["Audit"])  # Logs de auditoría
    app.include_router(health_router, prefix="/health", tags=["Health"])  # Health checks
    app.include_router(metrics_router, prefix="/metrics", tags=["Metrics"])  # Métricas de monitoreo
    
    # Endpoint raíz con información general de la API
    @app.get("/", tags=["Root"])
    async def root():
        return {
            "success": True,
            "message": "Bienvenido a Delivery360 API",
            "version": "1.0.0",
            "documentation": "/docs",
            "health": "/health/check",
            "metrics": "/metrics"
        }
    
    # Endpoint ping para health checks rápidos
    @app.get("/ping", tags=["Root"])
    async def ping():
        return {"success": True, "message": "pong"}
    
    return app


# Crear instancia de la aplicación
app = create_app()


# Ejecución directa con uvicorn
if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        "app.main:app",
        host="0.0.0.0",
        port=8000,
        reload=settings.ENVIRONMENT == "development",
        log_level=settings.LOG_LEVEL.lower()
    )
