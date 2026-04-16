"""
Delivery360 - Main Application Entry Point
FastAPI application with full configuration
"""

# Importación de módulos estándar de FastAPI para crear la aplicación, manejar requests y respuestas
from fastapi import FastAPI, Request, status
# Importación del middleware CORS para permitir conexiones desde diferentes dominios
from fastapi.middleware.cors import CORSMiddleware
# Importación de tipos de respuesta JSON para devolver datos al cliente
from fastapi.responses import JSONResponse
# Importación del manejador de excepciones para validación de requests
from fastapi.exceptions import RequestValidationError
# Importación del decorador para manejar el ciclo de vida de la aplicación (inicio/cierre)
from contextlib import asynccontextmanager
# Importación del módulo de logging para registrar eventos y errores
import logging
# Importación de tipos asíncronos para definir generadores
from typing import AsyncGenerator

# Importación de configuración global del proyecto
from app.core.config import settings
# Importación de conexión a base de datos y modelos base
from app.core.database import engine, Base
# Importación del registro de manejadores de excepciones personalizadas
from app.core.exception_handlers import register_exception_handlers
# Importación de todos los routers de API v1 (endpoints agrupados por funcionalidad)
from app.api.v1 import (
    auth, users, riders, orders, deliveries, 
    shifts, productivity, financial, dashboard, 
    routes, alerts, integrations, audit
)
# Importación de middlewares personalizados para rate limiting y auditoría
from app.middleware import RateLimitMiddleware, AuditLogMiddleware
# Importación de routers de monitoreo para health checks y métricas
from app.monitoring.health_check import health_router
from app.monitoring.metrics import metrics_router

# Configuración básica del logging para registrar eventos de la aplicación
# El nivel de log se obtiene de la configuración global (ej: INFO, DEBUG, ERROR)
# El formato incluye timestamp, nombre del logger, nivel y mensaje
logging.basicConfig(
    level=settings.LOG_LEVEL,
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s"
)
# Crear una instancia de logger específica para este módulo
logger = logging.getLogger(__name__)


@asynccontextmanager
async def lifespan(app: FastAPI) -> AsyncGenerator[None, None]:
    """
    Gestor del ciclo de vida de la aplicación FastAPI
    Maneja eventos de inicio (startup) y cierre (shutdown) de la aplicación
    Se ejecuta automáticamente cuando la aplicación arranca o se detiene
    """
    # --- FASE DE INICIO (STARTUP) ---
    # Registrar en logs que la aplicación está comenzando
    logger.info("Starting Delivery360 API...")
    
    # Crear tablas de base de datos solo en entorno de desarrollo
    # En producción se usan migraciones con Alembic
    if settings.ENVIRONMENT == "development":
        logger.info("Creating database tables...")
        # Abrir conexión asíncrona y crear todas las tablas definidas en los modelos
        async with engine.begin() as conn:
            await conn.run_sync(Base.metadata.create_all)
    
    # Registrar que la aplicación inició correctamente
    logger.info("Delivery360 API started successfully")
    
    # Punto de yield donde la aplicación se mantiene ejecutándose
    yield
    
    # --- FASE DE CIERRE (SHUTDOWN) ---
    # Registrar que la aplicación está deteniéndose
    logger.info("Shutting down Delivery360 API...")
    # Liberar conexiones de base de datos para evitar fugas de recursos
    await engine.dispose()
    # Confirmar en logs que las conexiones fueron cerradas
    logger.info("Database connections closed")


def create_app() -> FastAPI:
    """
    Patrón de diseño Factory para crear la aplicación FastAPI
    Crea y configura la instancia de la aplicación con toda la seguridad necesaria
    Retorna una aplicación completamente configurada lista para usar
    """
    
    # Crear instancia de FastAPI con metadatos del proyecto
    # title: Nombre de la API que aparece en Swagger/OpenAPI
    # description: Descripción detallada visible en la documentación
    # version: Versión actual de la API
    # docs_url: Ruta para acceder a la documentación Swagger UI
    # redoc_url: Ruta para acceder a la documentación ReDoc
    # openapi_url: Ruta donde se sirve el esquema OpenAPI JSON
    # lifespan: Función que maneja el ciclo de vida (startup/shutdown)
    app = FastAPI(
        title="Delivery360 API",
        description="Sistema completo de gestión de entregas - Enterprise Delivery Management",
        version="1.0.0",
        docs_url="/docs",
        redoc_url="/redoc",
        openapi_url="/openapi.json",
        lifespan=lifespan
    )
    
    # --- CONFIGURACIÓN DE SEGURIDAD Y MIDDLEWARES ---
    
    # Importar funciones para configurar CORS y headers de seguridad
    from app.middleware.cors_middleware import setup_cors_middleware, get_security_headers
    # Importar middleware para validar hosts de confianza (seguridad adicional)
    from fastapi.middleware.trustedhost import TrustedHostMiddleware
    # Importar clase base para crear middlewares personalizados HTTP
    from starlette.middleware.base import BaseHTTPMiddleware
    
    # Configurar middleware CORS para permitir conexiones desde dominios autorizados
    setup_cors_middleware(app)
    
    # Middleware personalizado para agregar headers de seguridad en todas las respuestas
    # Se ejecuta en cada request/response cycle
    @app.middleware("http")
    async def add_security_headers(request: Request, call_next):
        """
        Agrega headers de seguridad HTTP a todas las respuestas
        Estos headers protegen contra ataques comunes (XSS, clickjacking, etc.)
        """
        # Ejecutar el siguiente middleware o endpoint y obtener la respuesta
        response = await call_next(request)
        # Iterar sobre todos los headers de seguridad configurados
        for header, value in get_security_headers().items():
            # Insertar cada header de seguridad en la respuesta
            response.headers[header] = value
        # Retornar la respuesta modificada con los headers agregados
        return response
    
    # Middleware para validar hosts de confianza solo en producción
    # Previene ataques de host header injection
    if settings.ENVIRONMENT == "production":
        app.add_middleware(
            TrustedHostMiddleware,
            allowed_hosts=[
                "api.delivery360.com",      # Dominio principal permitido
                "*.delivery360.com",         # Subdominios permitidos
                "localhost",                 # Local para testing
                "127.0.0.1"                  # IP local para testing
            ]
        )
    
    # Agregar middleware personalizado para rate limiting (límite de requests por IP)
    # Previene ataques de fuerza bruta y abuso de la API
    app.add_middleware(RateLimitMiddleware)
    # Agregar middleware personalizado para logging de auditoría
    # Registra todas las acciones importantes para trazabilidad
    app.add_middleware(AuditLogMiddleware)
    
    # Registrar manejadores globales de excepciones
    # Centraliza el manejo de errores en toda la aplicación
    register_exception_handlers(app)
    
    # --- REGISTRO DE ROUTERS (ENDPOINTS DE LA API) ---
    
    # Router de autenticación: login, logout, refresh token
    app.include_router(auth.router, prefix="/api/v1", tags=["Auth"]) 
    # Router de usuarios: CRUD de usuarios del sistema
    app.include_router(users.router, prefix="/api/v1", tags=["Users"])
    # Router de repartidores (riders): gestión de flota de delivery
    app.include_router(riders.router, prefix="/api/v1", tags=["Riders"])
    # Router de órdenes: creación y seguimiento de pedidos
    app.include_router(orders.router, prefix="/api/v1", tags=["Orders"])
    # Router de entregas (deliveries): gestión de entregas asignadas
    app.include_router(deliveries.router, prefix="/api/v1", tags=["Deliveries"])
    # Router de turnos (shifts): control de horarios de repartidores
    app.include_router(shifts.router, prefix="/api/v1", tags=["Shifts"])
    # Router de productividad: métricas de rendimiento de repartidores
    app.include_router(productivity.router, prefix="/api/v1", tags=["Productivity"])
    # Router financiero: pagos, liquidaciones y earnings
    app.include_router(financial.router, prefix="/api/v1", tags=["Financial"])
    # Router de dashboard: datos consolidados para vista general
    app.include_router(dashboard.router, prefix="/api/v1", tags=["Dashboard"])
    # Router de rutas: optimización y análisis de rutas de entrega
    app.include_router(routes.router, prefix="/api/v1", tags=["Routes"])
    # Router de alertas: notificaciones y alertas del sistema
    app.include_router(alerts.router, prefix="/api/v1", tags=["Alerts"])
    # Router de integraciones: conexión con sistemas externos (ERP, POS)
    app.include_router(integrations.router, prefix="/api/v1", tags=["Integrations"])
    # Router de auditoría: logs de actividades del sistema
    app.include_router(audit.router, prefix="/api/v1", tags=["Audit"])
    # Router de health check: endpoints para monitoreo de salud del servicio
    app.include_router(health_router, prefix="/health", tags=["Health"])
    # Router de métricas: endpoints para métricas de rendimiento (Prometheus, etc.)
    app.include_router(metrics_router, prefix="/metrics", tags=["Metrics"])
    
    # --- ENDPOINTS RAÍZ (ROOT) ---
    
    # Endpoint raíz que devuelve información general de la API
    # Accesible en GET / - muestra bienvenida y enlaces útiles
    @app.get("/", tags=["Root"])
    async def root():
        """Endpoint raíz con información de la API"""
        # Retornar diccionario con datos básicos de la API
        return {
            "success": True,                                  # Indicador de respuesta exitosa
            "message": "Bienvenido a Delivery360 API",        # Mensaje de bienvenida
            "version": "1.0.0",                               # Versión actual de la API
            "documentation": "/docs",                         # Ruta a Swagger UI
            "health": "/health/check",                        # Ruta para verificar salud del servicio
            "metrics": "/metrics"                             # Ruta para métricas de monitoreo
        }
    
    # Endpoint simple de ping para health checks rápidos
    # Accesible en GET /ping - responde inmediatamente con "pong"
    @app.get("/ping", tags=["Root"])
    async def ping():
        """Endpoint simple ping para verificaciones de salud rápidas"""
        # Retornar respuesta mínima para confirmar que el servidor está activo
        return {"success": True, "message": "pong"}
    
    # Retornar la instancia de aplicación completamente configurada
    return app


# Crear la instancia de la aplicación usando el factory pattern
# Esta es la instancia que se usa para correr el servidor
app = create_app()


# Bloque de ejecución directa cuando se corre como script principal
# Permite iniciar el servidor con: python -m app.main
if __name__ == "__main__":
    # Importar uvicorn (servidor ASGI para FastAPI) solo cuando se necesita
    import uvicorn
    # Iniciar el servidor uvicorn con configuración específica
    uvicorn.run(
        "app.main:app",                                    # Ruta al objeto app (module:variable)
        host="0.0.0.0",                                    # Escuchar en todas las interfaces de red
        port=8000,                                         # Puerto donde escuchar requests
        reload=settings.ENVIRONMENT == "development",      # Auto-reload solo en desarrollo
        log_level=settings.LOG_LEVEL.lower()               # Nivel de logging desde configuración
    )
