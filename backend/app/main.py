"""
Delivery360 - Main Application Entry Point
FastAPI application with full configuration
"""

from fastapi import FastAPI, Request
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

# Configure logging
logging.basicConfig(
    level=settings.LOG_LEVEL,
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s"
)
logger = logging.getLogger(__name__)


@asynccontextmanager
async def lifespan(app: FastAPI) -> AsyncGenerator[None, None]:
    """
    Application lifespan manager
    Handles startup and shutdown events
    """
    # Startup
    logger.info("Starting Delivery360 API...")
    
    # Create database tables (only for development)
    if settings.ENVIRONMENT == "development":
        logger.info("Creating database tables...")
        async with engine.begin() as conn:
            await conn.run_sync(Base.metadata.create_all)
    
    logger.info("Delivery360 API started successfully")
    
    yield
    
    # Shutdown
    logger.info("Shutting down Delivery360 API...")
    await engine.dispose()
    logger.info("Database connections closed")


def create_app() -> FastAPI:
    """
    Application factory pattern
    Creates and configures the FastAPI application with full security
    """
    
    app = FastAPI(
        title="Delivery360 API",
        description="Sistema completo de gestión de entregas - Enterprise Delivery Management",
        version="1.0.0",
        docs_url="/docs",
        redoc_url="/redoc",
        openapi_url="/openapi.json",
        lifespan=lifespan
    )
    
    # Configure CORS con seguridad reforzada
    from app.middleware.cors_middleware import setup_cors_middleware, get_security_headers
    from fastapi.middleware.trustedhost import TrustedHostMiddleware
    
    setup_cors_middleware(app)
    
    # Agregar headers de seguridad en todas las respuestas
    @app.middleware("http")
    async def add_security_headers(request: Request, call_next):
        response = await call_next(request)
        for header, value in get_security_headers().items():
            response.headers[header] = value
        return response
    
    # Middleware para hosts de confianza (solo producción)
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
    
    # Add custom middleware
    app.add_middleware(RateLimitMiddleware)
    app.add_middleware(AuditLogMiddleware)
    
    # Register global exception handlers (reemplaza los handlers inline)
    register_exception_handlers(app)
    
    # Include routers
    app.include_router(auth.router, prefix="/api/v1", tags=["Auth"]) 
    app.include_router(users.router, prefix="/api/v1", tags=["Users"])
    app.include_router(riders.router, prefix="/api/v1", tags=["Riders"])
    app.include_router(orders.router, prefix="/api/v1", tags=["Orders"])
    app.include_router(deliveries.router, prefix="/api/v1", tags=["Deliveries"])
    app.include_router(shifts.router, prefix="/api/v1", tags=["Shifts"])
    app.include_router(productivity.router, prefix="/api/v1", tags=["Productivity"])
    app.include_router(financial.router, prefix="/api/v1", tags=["Financial"])
    app.include_router(dashboard.router, prefix="/api/v1", tags=["Dashboard"])
    app.include_router(routes.router, prefix="/api/v1", tags=["Routes"])
    app.include_router(alerts.router, prefix="/api/v1", tags=["Alerts"])
    app.include_router(integrations.router, prefix="/api/v1", tags=["Integrations"])
    app.include_router(audit.router, prefix="/api/v1", tags=["Audit"])
    app.include_router(health_router, prefix="/health", tags=["Health"])
    app.include_router(metrics_router, prefix="/metrics", tags=["Metrics"])
    
    # Root endpoint
    @app.get("/", tags=["Root"])
    async def root():
        """Root endpoint with API information"""
        return {
            "success": True,
            "message": "Bienvenido a Delivery360 API",
            "version": "1.0.0",
            "documentation": "/docs",
            "health": "/health/check",
            "metrics": "/metrics"
        }
    
    @app.get("/ping", tags=["Root"])
    async def ping():
        """Simple ping endpoint for health checks"""
        return {"success": True, "message": "pong"}
    
    return app


# Create application instance
app = create_app()


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        "app.main:app",
        host="0.0.0.0",
        port=8000,
        reload=settings.ENVIRONMENT == "development",
        log_level=settings.LOG_LEVEL.lower()
    )
