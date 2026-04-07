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
    Creates and configures the FastAPI application
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
    
    # Configure CORS
    app.add_middleware(
        CORSMiddleware,
        allow_origins=settings.cors_origins,
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
        expose_headers=["X-Request-ID", "X-RateLimit-Limit", "X-RateLimit-Remaining"],
    )
    
    # Add custom middleware
    app.add_middleware(RateLimitMiddleware)
    app.add_middleware(AuditLogMiddleware)
    
    # Exception handlers
    @app.exception_handler(RequestValidationError)
    async def validation_exception_handler(
        request: Request, 
        exc: RequestValidationError
    ) -> JSONResponse:
        """Handle validation errors with detailed messages"""
        logger.warning(f"Validation error: {exc.errors()}")
        return JSONResponse(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            content={
                "success": False,
                "error": "validation_error",
                "message": "Errores de validación en los datos enviados",
                "details": exc.errors()
            }
        )
    
    @app.exception_handler(Exception)
    async def general_exception_handler(
        request: Request, 
        exc: Exception
    ) -> JSONResponse:
        """Handle unexpected exceptions"""
        logger.error(f"Unexpected error: {str(exc)}", exc_info=True)
        return JSONResponse(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            content={
                "success": False,
                "error": "internal_error",
                "message": "Error interno del servidor. Por favor contacte al administrador."
            }
        )
    
    # Include routers
    app.include_router(auth.router, prefix="/api/v1/auth", tags=["Auth"])
    app.include_router(users.router, prefix="/api/v1/users", tags=["Users"])
    app.include_router(riders.router, prefix="/api/v1/riders", tags=["Riders"])
    app.include_router(orders.router, prefix="/api/v1/orders", tags=["Orders"])
    app.include_router(deliveries.router, prefix="/api/v1/deliveries", tags=["Deliveries"])
    app.include_router(shifts.router, prefix="/api/v1/shifts", tags=["Shifts"])
    app.include_router(productivity.router, prefix="/api/v1/productivity", tags=["Productivity"])
    app.include_router(financial.router, prefix="/api/v1/financial", tags=["Financial"])
    app.include_router(dashboard.router, prefix="/api/v1/dashboard", tags=["Dashboard"])
    app.include_router(routes.router, prefix="/api/v1/routes", tags=["Routes"])
    app.include_router(alerts.router, prefix="/api/v1/alerts", tags=["Alerts"])
    app.include_router(integrations.router, prefix="/api/v1/integrations", tags=["Integrations"])
    app.include_router(audit.router, prefix="/api/v1/audit", tags=["Audit"])
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
