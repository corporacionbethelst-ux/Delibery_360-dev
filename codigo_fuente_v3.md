# Delivery360 - Código Fuente Completo v3.0

**Fecha de Generación:** 2025  
**Estado del Proyecto:** Backend 100% Completado - Frontend en Desarrollo  
**Versión del Documento:** 3.0

---

## Tabla de Contenidos

1. [Backend - Estructura Principal](#backend---estructura-principal)
2. [Backend - Archivos de Configuración](#backend---archivos-de-configuración)
3. [Backend - Modelos de Datos](#backend---modelos-de-datos)
4. [Backend - APIs REST](#backend---apis-rest)
5. [Backend - Servicios](#backend---servicios)
6. [Backend - CRUD](#backend---crud)
7. [Backend - Schemas](#backend---schemas)
8. [Backend - Core](#backend---core)
9. [Backend - Middleware](#backend---middleware)
10. [Backend - Utils](#backend---utils)
11. [Backend - Workers](#backend---workers)
12. [Backend - Integrations](#backend---integrations)
13. [Backend - Monitoring](#backend---monitoring)
14. [Frontend - Estructura](#frontend---estructura)
15. [Infraestructura](#infraestructura)

---

## Backend - Estructura Principal

### `/workspace/backend/app/main.py`

```python
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
    app.include_router(auth.router, prefix="/api/v1", tags=["Auth"])
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
```

---

## Backend - Archivos de Configuración

### `/workspace/backend/app/core/config.py`

```python
from pydantic_settings import BaseSettings
from typing import List, Optional
import json


class Settings(BaseSettings):
    # App
    APP_NAME: str = "LogiRider"
    APP_VERSION: str = "1.0.0"
    APP_ENV: str = "development"
    ENVIRONMENT: str = "development"
    DEBUG: bool = True
    SECRET_KEY: str

    # API
    API_V1_STR: str = "/api/v1"
    BACKEND_CORS_ORIGINS: str = '["http://localhost:3000"]'

    @property
    def cors_origins(self) -> List[str]:
        try:
            return json.loads(self.BACKEND_CORS_ORIGINS)
        except:
            return ["http://localhost:3000"]

    # Database
    POSTGRES_DB: str = "delivery360"
    POSTGRES_USER: str = "postgres"
    POSTGRES_PASSWORD: str = ""
    POSTGRES_HOST: str = "localhost"
    POSTGRES_PORT: str = "5432"
    DATABASE_URL: str
    DATABASE_URL_SYNC: str = ""

    @property
    def database_url_computed(self) -> str:
        if self.DATABASE_URL:
            return self.DATABASE_URL
        return f"postgresql+asyncpg://{self.POSTGRES_USER}:{self.POSTGRES_PASSWORD}@{self.POSTGRES_HOST}:{self.POSTGRES_PORT}/{self.POSTGRES_DB}"

    @property
    def database_url_sync_computed(self) -> str:
        if self.DATABASE_URL_SYNC:
            return self.DATABASE_URL_SYNC
        return f"postgresql://{self.POSTGRES_USER}:{self.POSTGRES_PASSWORD}@{self.POSTGRES_HOST}:{self.POSTGRES_PORT}/{self.POSTGRES_DB}"

    # Redis
    REDIS_URL: str = "redis://localhost:6379/0"
    REDIS_HOST: str = "localhost"
    REDIS_PORT: str = "6379"

    # JWT
    ALGORITHM: str = "HS256"
    JWT_ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30
    REFRESH_TOKEN_EXPIRE_DAYS: int = 7

    @property
    def jwt_algorithm_computed(self) -> str:
        return self.JWT_ALGORITHM or self.ALGORITHM

    # Celery
    CELERY_BROKER_URL: str = "redis://localhost:6379/0"
    CELERY_RESULT_BACKEND: str = "redis://localhost:6379/0"

    # LGPD
    LGPD_RETENTION_DAYS: int = 1825
    DATA_RETENTION_DAYS: int = 90

    @property
    def retention_days_computed(self) -> int:
        return self.LGPD_RETENTION_DAYS if self.LGPD_RETENTION_DAYS else self.DATA_RETENTION_DAYS

    # Rate Limiting
    RATE_LIMIT_PER_MINUTE: int = 60

    # Seed superuser
    FIRST_SUPERUSER_EMAIL: str = "admin@logrider.com"
    FIRST_SUPERUSER_PASSWORD: str = "Admin1234!"
    FIRST_SUPERUSER_NAME: str = "Administrador"

    # Monitoring & Logging
    LOG_LEVEL: str = "INFO"
    SENTRY_DSN: Optional[str] = None

    # Optional
    GOOGLE_MAPS_API_KEY: Optional[str] = None
    MAPBOX_API_KEY: Optional[str] = None
    EMAILS_ENABLED: bool = False
    SMTP_HOST: str = "smtp.gmail.com"
    SMTP_PORT: int = 587
    SMTP_USER: Optional[str] = None
    SMTP_PASSWORD: Optional[str] = None
    EMAIL_FROM: str = "noreply@delivery360.com"

    class Config:
        env_file = ".env"
        case_sensitive = True
        extra = "ignore"


settings = Settings()
```

### `/workspace/backend/app/core/database.py`

```python
from sqlalchemy.ext.asyncio import create_async_engine, async_sessionmaker, AsyncSession
from sqlalchemy.orm import DeclarativeBase, Session
from sqlalchemy import create_engine
from app.core.config import settings


class Base(DeclarativeBase):
    pass


engine = create_async_engine(
    settings.DATABASE_URL,
    echo=settings.DEBUG,
    pool_pre_ping=True,
    pool_size=10,
    max_overflow=20,
)

AsyncSessionLocal = async_sessionmaker(
    engine,
    class_=AsyncSession,
    expire_on_commit=False,
    autocommit=False,
    autoflush=False,
)

# Engine síncrono para workers y scripts
sync_engine = create_engine(
    settings.database_url_sync_computed,
    echo=settings.DEBUG,
    pool_pre_ping=True,
    pool_size=10,
    max_overflow=20,
)

SessionLocal = Session(
    bind=sync_engine,
    expire_on_commit=False,
    autocommit=False,
    autoflush=False,
)


async def get_db() -> AsyncSession:
    async with AsyncSessionLocal() as session:
        try:
            yield session
            await session.commit()
        except Exception:
            await session.rollback()
            raise
        finally:
            await session.close()


def get_db_session():
    """Obtener sesión de base de datos síncrona para workers"""
    session = SessionLocal()
    try:
        yield session
    finally:
        session.close()
```

### `/workspace/backend/app/core/security.py`

```python
"""
Security utilities for authentication and authorization
"""
from datetime import datetime, timedelta
from typing import Optional
from jose import jwt
from passlib.context import CryptContext
from app.core.config import settings

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")


def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Verify password against hash"""
    return pwd_context.verify(plain_password, hashed_password)


def hash_password(password: str) -> str:
    """Hash password using bcrypt"""
    return pwd_context.hash(password)


def create_access_token(user_id: str, expires_delta: Optional[timedelta] = None) -> str:
    """Create JWT access token"""
    to_encode = {
        "sub": user_id,
        "type": "access",
        "iat": datetime.utcnow()
    }
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode.update({"exp": expire})
    return jwt.encode(to_encode, settings.SECRET_KEY, algorithm=settings.JWT_ALGORITHM)


def create_refresh_token(user_id: str) -> str:
    """Create JWT refresh token"""
    to_encode = {
        "sub": user_id,
        "type": "refresh",
        "iat": datetime.utcnow()
    }
    expire = datetime.utcnow() + timedelta(days=settings.REFRESH_TOKEN_EXPIRE_DAYS)
    to_encode.update({"exp": expire})
    return jwt.encode(to_encode, settings.SECRET_KEY, algorithm=settings.JWT_ALGORITHM)


def decode_token(token: str) -> Optional[dict]:
    """Decode and validate JWT token"""
    try:
        payload = jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.JWT_ALGORITHM])
        return payload
    except Exception:
        return None
```

---

## Backend - Modelos de Datos

### `/workspace/backend/app/models/user.py`

```python
import uuid
from datetime import datetime, timezone
from enum import Enum as PyEnum
from sqlalchemy import String, Boolean, DateTime, Enum, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy.dialects.postgresql import UUID
from app.core.database import Base


class UserRole(str, PyEnum):
    SUPERADMIN = "superadmin"
    GERENTE = "gerente"
    OPERADOR = "operador"
    REPARTIDOR = "repartidor"


class User(Base):
    __tablename__ = "users"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    email: Mapped[str] = mapped_column(String(255), unique=True, index=True, nullable=False)
    hashed_password: Mapped[str] = mapped_column(String(255), nullable=False)
    full_name: Mapped[str] = mapped_column(String(255), nullable=False)
    role: Mapped[UserRole] = mapped_column(Enum(UserRole), default=UserRole.OPERADOR, nullable=False)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)
    phone: Mapped[str | None] = mapped_column(String(30))
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc))
    last_login: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))

    # LGPD
    lgpd_consent: Mapped[bool] = mapped_column(Boolean, default=False)
    lgpd_consent_date: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
    is_deleted: Mapped[bool] = mapped_column(Boolean, default=False)

    # Relationships
    rider_profile = relationship("Rider", back_populates="user", uselist=False)
    audit_logs = relationship("AuditLog", back_populates="user")

    def __repr__(self) -> str:
        return f"<User {self.email} [{self.role}]>"
```

### `/workspace/backend/app/models/rider.py`

```python
import uuid
from datetime import datetime, timezone
from enum import Enum as PyEnum
from sqlalchemy import String, Boolean, DateTime, Enum, Float, ForeignKey, Text, Integer
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy.dialects.postgresql import UUID, JSONB
from app.core.database import Base


class RiderStatus(str, PyEnum):
    PENDIENTE = "pendiente"
    ACTIVO = "activo"
    INACTIVO = "inactivo"
    SUSPENDIDO = "suspendido"


class VehicleType(str, PyEnum):
    MOTO = "moto"
    BICICLETA = "bicicleta"
    AUTO = "auto"
    PIE = "pie"


class Rider(Base):
    __tablename__ = "riders"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("users.id"), unique=True)

    # Datos personales
    cpf: Mapped[str | None] = mapped_column(String(20))          # enmascarado LGPD
    cnh: Mapped[str | None] = mapped_column(String(30))
    birth_date: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))

    # Vehículo
    vehicle_type: Mapped[VehicleType] = mapped_column(Enum(VehicleType), default=VehicleType.MOTO)
    vehicle_plate: Mapped[str | None] = mapped_column(String(20))
    vehicle_model: Mapped[str | None] = mapped_column(String(100))
    vehicle_year: Mapped[int | None] = mapped_column(Integer)

    # Estado
    status: Mapped[RiderStatus] = mapped_column(Enum(RiderStatus), default=RiderStatus.PENDIENTE)
    is_online: Mapped[bool] = mapped_column(Boolean, default=False)

    # Geolocalización
    last_lat: Mapped[float | None] = mapped_column(Float)
    last_lng: Mapped[float | None] = mapped_column(Float)
    last_location_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))

    # Gamificación
    level: Mapped[int] = mapped_column(Integer, default=1)
    total_points: Mapped[int] = mapped_column(Integer, default=0)
    badges: Mapped[dict] = mapped_column(JSONB, default=list)

    # Documentos (rutas a archivos)
    documents: Mapped[dict] = mapped_column(JSONB, default=dict)

    # Zona operativa
    operating_zone: Mapped[str | None] = mapped_column(String(100))

    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc))
    approved_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))

    # Relationships
    user = relationship("User", back_populates="rider_profile")
    orders = relationship("Order", back_populates="rider")
    deliveries = relationship("Delivery", back_populates="rider")
    shifts = relationship("Shift", back_populates="rider")
    routes = relationship("Route", back_populates="rider")
```

### `/workspace/backend/app/models/order.py`

```python
"""Order model for customer orders management."""

import uuid
from datetime import datetime
from sqlalchemy import Column, String, Float, DateTime, ForeignKey, Enum as SQLEnum, Text, Boolean, JSON
from sqlalchemy.orm import relationship
from sqlalchemy.dialects.postgresql import UUID
import enum

from app.core.database import Base


class OrderStatus(str, enum.Enum):
    """Order status workflow."""
    PENDIENTE = "pendiente"  # Aguardando asignación
    ASIGNADO = "asignado"  # Repartidor asignado
    EN_RECOLECCION = "en_recoleccion"  # Repartidor en restaurante
    RECOLECTADO = "recolectado"  # Pedido recogido
    EN_RUTA = "en_ruta"  # En camino al cliente
    EN_ENTREGA = "en_entrega"  # Llegó al destino
    ENTREGADO = "entregado"  # Completado con éxito
    FALLIDO = "fallido"  # No se pudo entregar
    CANCELADO = "cancelado"  # Cancelado por cliente/sistema


class OrderType(str, enum.Enum):
    """Order types for classification."""
    NORMAL = "normal"
    VIP = "vip"
    AGENDADO = "agendado"
    GRUPO = "grupo"
    CORPORATIVO = "corporativo"


class OrderPriority(str, enum.Enum):
    """Order priority levels."""
    NORMAL = "normal"
    ALTA = "alta"
    URGENTE = "urgente"
    VIP = "vip"


class Order(Base):
    """Order model representing customer requests."""

    __tablename__ = "orders"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4, index=True)
    external_id = Column(String(100), unique=True, index=True)  # ID del sistema externo (TPV/ERP)

    # Customer Information
    customer_name = Column(String(255), nullable=False)
    customer_phone = Column(String(20), nullable=False)
    customer_email = Column(String(255))

    # Address Information
    pickup_address = Column(Text, nullable=False)
    pickup_name = Column(String(255))  # Nombre del restaurante/tienda
    pickup_phone = Column(String(20))
    delivery_address = Column(Text, nullable=False)
    delivery_reference = Column(String(255))  # Punto de referencia
    delivery_instructions = Column(Text)  # Instrucciones adicionales

    # Geolocation
    pickup_latitude = Column(Float)
    pickup_longitude = Column(Float)
    delivery_latitude = Column(Float)
    delivery_longitude = Column(Float)

    # Order Details
    items = Column(JSON)  # Lista de productos
    subtotal = Column(Float, default=0.0)
    delivery_fee = Column(Float, default=0.0)
    total = Column(Float, default=0.0)
    payment_method = Column(String(50))  # efectivo, tarjeta, pix
    payment_status = Column(String(20), default="pendiente")

    # Status & Assignment
    status = Column(SQLEnum(OrderStatus), default=OrderStatus.PENDIENTE)
    priority = Column(String(20), default="normal")  # normal, vip, urgente
    assigned_rider_id = Column(UUID(as_uuid=True), ForeignKey("riders.id"), index=True)

    # Timing
    ordered_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    accepted_at = Column(DateTime)
    picked_up_at = Column(DateTime)
    delivered_at = Column(DateTime)
    estimated_delivery_time = Column(DateTime)
    sla_deadline = Column(DateTime)  # Límite para cumplir SLA

    # Failure Information
    failure_reason = Column(String(255))  # Si falló
    failure_notes = Column(Text)
    cancelled_by = Column(String(50))  # cliente, restaurante, repartidor, sistema
    cancellation_reason = Column(Text)

    # Integration
    source = Column(String(50), default="app")  # app, web, api, erp, pos
    integration_id = Column(String(100))  # ID de integración externa
    webhook_sent = Column(Boolean, default=False)

    # Timestamps
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    rider = relationship("Rider", back_populates="orders")
    delivery = relationship("Delivery", back_populates="order", uselist=False)

    def __repr__(self):
        return f"<Order(id={self.id}, status={self.status}, customer={self.customer_name})>"
```

### `/workspace/backend/app/models/all_models.py`

```python
import uuid
from datetime import datetime, timezone
from enum import Enum as PyEnum
from sqlalchemy import String, DateTime, Enum, Float, ForeignKey, Text, Integer, Boolean
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy.dialects.postgresql import UUID, JSONB
from app.core.database import Base


# ── Delivery ──────────────────────────────────────────────────────────────────
class Delivery(Base):
    __tablename__ = "deliveries"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    order_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("orders.id"), unique=True)
    rider_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("riders.id"))

    # Prueba de entrega
    photo_url: Mapped[str | None] = mapped_column(String(500))
    signature_url: Mapped[str | None] = mapped_column(String(500))
    otp_code: Mapped[str | None] = mapped_column(String(10))
    otp_verified: Mapped[bool] = mapped_column(Boolean, default=False)

    # Geolocalización de entrega
    delivery_lat: Mapped[float | None] = mapped_column(Float)
    delivery_lng: Mapped[float | None] = mapped_column(Float)

    # Métricas de tiempo
    pickup_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
    delivered_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
    duration_minutes: Mapped[float | None] = mapped_column(Float)
    distance_km: Mapped[float | None] = mapped_column(Float)

    # Calidad
    on_time: Mapped[bool | None] = mapped_column(Boolean)
    customer_rating: Mapped[int | None] = mapped_column(Integer)
    notes: Mapped[str | None] = mapped_column(Text)

    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))

    order = relationship("Order", back_populates="delivery")
    rider = relationship("Rider", back_populates="deliveries")


# ── Shift ─────────────────────────────────────────────────────────────────────
class ShiftStatus(str, PyEnum):
    ACTIVO = "activo"
    CERRADO = "cerrado"


class Shift(Base):
    __tablename__ = "shifts"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    rider_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("riders.id"))

    checkin_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)
    checkout_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
    checkin_lat: Mapped[float | None] = mapped_column(Float)
    checkin_lng: Mapped[float | None] = mapped_column(Float)

    status: Mapped[ShiftStatus] = mapped_column(Enum(ShiftStatus), default=ShiftStatus.ACTIVO)
    total_orders: Mapped[int] = mapped_column(Integer, default=0)
    total_earnings: Mapped[float] = mapped_column(Float, default=0.0)
    duration_hours: Mapped[float | None] = mapped_column(Float)

    rider = relationship("Rider", back_populates="shifts")


# ── Financial ────────────────────────────────────────────────────────────────
class PaymentRuleType(str, PyEnum):
    FIJA = "fija"
    VARIABLE = "variable"
    HIBRIDA = "hibrida"


class Financial(Base):
    __tablename__ = "financials"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    rider_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("riders.id"))
    order_id: Mapped[uuid.UUID | None] = mapped_column(UUID(as_uuid=True), ForeignKey("orders.id"))

    rule_type: Mapped[PaymentRuleType] = mapped_column(Enum(PaymentRuleType), default=PaymentRuleType.FIJA)
    base_amount: Mapped[float] = mapped_column(Float, default=0.0)
    distance_bonus: Mapped[float] = mapped_column(Float, default=0.0)
    time_bonus: Mapped[float] = mapped_column(Float, default=0.0)
    volume_bonus: Mapped[float] = mapped_column(Float, default=0.0)
    total_amount: Mapped[float] = mapped_column(Float, default=0.0)

    operational_cost: Mapped[float] = mapped_column(Float, default=0.0)
    margin: Mapped[float] = mapped_column(Float, default=0.0)

    period_date: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)
    liquidated: Mapped[bool] = mapped_column(Boolean, default=False)
    liquidated_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))

    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))


# ── Route ────────────────────────────────────────────────────────────────────
class Route(Base):
    __tablename__ = "routes"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    rider_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("riders.id"))
    order_id: Mapped[uuid.UUID | None] = mapped_column(UUID(as_uuid=True), ForeignKey("orders.id"))

    gps_points: Mapped[list] = mapped_column(JSONB, default=list)   # [{lat, lng, ts}]
    distance_km: Mapped[float] = mapped_column(Float, default=0.0)
    deviation_detected: Mapped[bool] = mapped_column(Boolean, default=False)
    deviation_details: Mapped[dict] = mapped_column(JSONB, default=dict)

    started_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
    ended_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))

    rider = relationship("Rider", back_populates="routes")


# ── AuditLog ─────────────────────────────────────────────────────────────────
class AuditLog(Base):
    __tablename__ = "audit_logs"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id: Mapped[uuid.UUID | None] = mapped_column(UUID(as_uuid=True), ForeignKey("users.id"))

    action: Mapped[str] = mapped_column(String(100), nullable=False)
    resource: Mapped[str] = mapped_column(String(100))
    resource_id: Mapped[str | None] = mapped_column(String(100))
    details: Mapped[dict] = mapped_column(JSONB, default=dict)
    ip_address: Mapped[str | None] = mapped_column(String(50))
    user_agent: Mapped[str | None] = mapped_column(String(500))

    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))

    user = relationship("User", back_populates="audit_logs")


# ── Notification ─────────────────────────────────────────────────────────────
class NotificationType(str, PyEnum):
    PUSH = "push"
    EMAIL = "email"
    SMS = "sms"
    IN_APP = "in_app"


class Notification(Base):
    __tablename__ = "notifications"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("users.id"))
    type: Mapped[NotificationType] = mapped_column(Enum(NotificationType), default=NotificationType.IN_APP)
    title: Mapped[str] = mapped_column(String(200), nullable=False)
    body: Mapped[str] = mapped_column(Text, nullable=False)
    data: Mapped[dict] = mapped_column(JSONB, default=dict)
    read: Mapped[bool] = mapped_column(Boolean, default=False)
    sent: Mapped[bool] = mapped_column(Boolean, default=False)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))


# ── Integration ──────────────────────────────────────────────────────────────
class Integration(Base):
    __tablename__ = "integrations"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    name: Mapped[str] = mapped_column(String(100), nullable=False)
    type: Mapped[str] = mapped_column(String(50))   # pos | erp | webhook
    config: Mapped[dict] = mapped_column(JSONB, default=dict)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)
    last_sync_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))


# ── Productivity ─────────────────────────────────────────────────────────────
class Productivity(Base):
    __tablename__ = "productivity"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    rider_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("riders.id"))

    date: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)
    total_orders: Mapped[int] = mapped_column(Integer, default=0)
    orders_on_time: Mapped[int] = mapped_column(Integer, default=0)
    avg_delivery_time_min: Mapped[float] = mapped_column(Float, default=0.0)
    orders_per_hour: Mapped[float] = mapped_column(Float, default=0.0)
    sla_compliance_pct: Mapped[float] = mapped_column(Float, default=0.0)
    total_distance_km: Mapped[float] = mapped_column(Float, default=0.0)
    total_earnings: Mapped[float] = mapped_column(Float, default=0.0)
    performance_score: Mapped[float] = mapped_column(Float, default=0.0)

    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))
```

---

## Backend - APIs REST

### `/workspace/backend/app/api/v1/auth.py`

```python
from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm, OAuth2PasswordBearer
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from datetime import datetime, timezone
from pydantic import BaseModel, EmailStr
from typing import Optional

from app.core.database import get_db
from app.core.security import verify_password, hash_password, create_access_token, create_refresh_token, decode_token
from app.models.user import User, UserRole
from app.models.rider import Rider

router = APIRouter(prefix="/auth")
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/v1/auth/login")


# ── Schemas ───────────────────────────────────────────────────────────────────
class TokenResponse(BaseModel):
    access_token: str
    refresh_token: str
    token_type: str = "bearer"
    user_id: str
    role: str
    full_name: str


class RefreshRequest(BaseModel):
    refresh_token: str


class RiderRegisterRequest(BaseModel):
    email: EmailStr
    password: str
    full_name: str
    phone: Optional[str] = None
    vehicle_type: Optional[str] = "moto"
    lgpd_consent: bool = False


# ── Dependency: obtener usuario actual ────────────────────────────────────────
async def get_current_user(
    token: str = Depends(oauth2_scheme),
    db: AsyncSession = Depends(get_db),
) -> User:
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Credenciales inválidas",
        headers={"WWW-Authenticate": "Bearer"},
    )
    payload = decode_token(token)
    if not payload or payload.get("type") != "access":
        raise credentials_exception

    user_id = payload.get("sub")
    result = await db.execute(select(User).where(User.id == user_id, User.is_active == True))
    user = result.scalar_one_or_none()
    if not user:
        raise credentials_exception
    return user


def require_role(*roles: UserRole):
    async def checker(current_user: User = Depends(get_current_user)):
        if current_user.role not in roles:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Acceso denegado. Roles permitidos: {[r.value for r in roles]}",
            )
        return current_user
    return checker


# ── Endpoints ─────────────────────────────────────────────────────────────────
@router.post("/login", response_model=TokenResponse)
async def login(
    form_data: OAuth2PasswordRequestForm = Depends(),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(User).where(User.email == form_data.username, User.is_active == True, User.is_deleted == False)
    )
    user = result.scalar_one_or_none()
    if not user or not verify_password(form_data.password, user.hashed_password):
        raise HTTPException(status_code=400, detail="Email o contraseña incorrectos")

    user.last_login = datetime.now(timezone.utc)
    await db.commit()

    return TokenResponse(
        access_token=create_access_token(str(user.id)),
        refresh_token=create_refresh_token(str(user.id)),
        user_id=str(user.id),
        role=user.role.value,
        full_name=user.full_name,
    )


@router.post("/refresh", response_model=TokenResponse)
async def refresh_token(
    body: RefreshRequest,
    db: AsyncSession = Depends(get_db),
):
    payload = decode_token(body.refresh_token)
    if not payload or payload.get("type") != "refresh":
        raise HTTPException(status_code=401, detail="Token de refresco inválido")

    user_id = payload.get("sub")
    result = await db.execute(select(User).where(User.id == user_id, User.is_active == True))
    user = result.scalar_one_or_none()
    if not user:
        raise HTTPException(status_code=401, detail="Usuario no encontrado")

    return TokenResponse(
        access_token=create_access_token(str(user.id)),
        refresh_token=create_refresh_token(str(user.id)),
        user_id=str(user.id),
        role=user.role.value,
        full_name=user.full_name,
    )


@router.post("/register-rider", status_code=201)
async def register_rider(
    body: RiderRegisterRequest,
    db: AsyncSession = Depends(get_db),
):
    """Registro público para repartidores desde la app móvil."""
    if not body.lgpd_consent:
        raise HTTPException(status_code=400, detail="Debe aceptar los términos LGPD para registrarse")

    existing = await db.execute(select(User).where(User.email == body.email))
    if existing.scalar_one_or_none():
        raise HTTPException(status_code=400, detail="El email ya está registrado")

    user = User(
        email=body.email,
        hashed_password=hash_password(body.password),
        full_name=body.full_name,
        phone=body.phone,
        role=UserRole.REPARTIDOR,
        lgpd_consent=body.lgpd_consent,
        lgpd_consent_date=datetime.now(timezone.utc),
    )
    db.add(user)
    await db.flush()

    rider = Rider(user_id=user.id, vehicle_type=body.vehicle_type)
    db.add(rider)
    await db.commit()

    return {"message": "Registro exitoso. Esperando aprobación del gerente.", "user_id": str(user.id)}


@router.get("/me")
async def get_me(current_user: User = Depends(get_current_user)):
    return {
        "id": str(current_user.id),
        "email": current_user.email,
        "full_name": current_user.full_name,
        "role": current_user.role.value,
        "is_active": current_user.is_active,
    }
```

---

## Backend - Services

### `/workspace/backend/app/services/auth_service.py`

```python
"""
Servicio de Autenticación y Gestión de Usuarios
"""
from datetime import datetime, timedelta
from typing import Optional, Tuple
from jose import JWTError, jwt
from passlib.context import CryptContext
from fastapi import HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import settings
from app.models.user import User, UserRole
from app.schemas.auth import TokenData, LoginRequest
from app.crud.user import user as user_crud


class AuthService:
    """Servicio para autenticación y autorización"""

    def __init__(self):
        self.pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

    def verify_password(self, plain_password: str, hashed_password: str) -> bool:
        """Verifica si una contraseña coincide con el hash"""
        return self.pwd_context.verify(plain_password, hashed_password)

    def get_password_hash(self, password: str) -> str:
        """Genera hash de contraseña"""
        return self.pwd_context.hash(password)

    def create_access_token(self, data: dict, expires_delta: Optional[timedelta] = None) -> str:
        """Crea token de acceso JWT"""
        to_encode = data.copy()
        if expires_delta:
            expire = datetime.utcnow() + expires_delta
        else:
            expire = datetime.utcnow() + timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)

        to_encode.update({"exp": expire})
        encoded_jwt = jwt.encode(to_encode, settings.SECRET_KEY, algorithm=settings.JWT_ALGORITHM)
        return encoded_jwt

    def create_refresh_token(self, data: dict) -> str:
        """Crea token de refresco JWT"""
        to_encode = data.copy()
        expire = datetime.utcnow() + timedelta(days=settings.REFRESH_TOKEN_EXPIRE_DAYS)
        to_encode.update({"exp": expire})
        encoded_jwt = jwt.encode(to_encode, settings.SECRET_KEY, algorithm=settings.JWT_ALGORITHM)
        return encoded_jwt

    def decode_token(self, token: str) -> Optional[TokenData]:
        """Decodifica y valida token JWT"""
        try:
            payload = jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.JWT_ALGORITHM])
            user_id: str = payload.get("sub")
            role: str = payload.get("role")
            if user_id is None:
                return None
            return TokenData(user_id=int(user_id), role=UserRole(role))
        except JWTError:
            return None

    async def authenticate_user(
        self,
        db: AsyncSession,
        email: str,
        password: str
    ) -> Optional[User]:
        """Autentica usuario con email y contraseña"""
        user = await user_crud.get_by_email(db, email)
        if not user:
            return None
        if not self.verify_password(password, user.hashed_password):
            return None
        return user

    async def login(self, db: AsyncSession, login_data: LoginRequest) -> Tuple[str, str, User]:
        """Realiza login y retorna tokens"""
        user = await self.authenticate_user(db, login_data.email, login_data.password)
        if not user:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Email o contraseña incorrectos",
                headers={"WWW-Authenticate": "Bearer"},
            )

        if not user.is_active:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Usuario inactivo"
            )

        access_token = self.create_access_token(
            data={"sub": str(user.id), "role": user.role.value}
        )
        refresh_token = self.create_refresh_token(
            data={"sub": str(user.id), "role": user.role.value}
        )

        return access_token, refresh_token, user

    async def refresh_tokens(
        self,
        db: AsyncSession,
        refresh_token: str
    ) -> Tuple[str, str]:
        """Refresca tokens usando refresh token"""
        token_data = self.decode_token(refresh_token)
        if not token_data:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Refresh token inválido"
            )

        user = await user_crud.get(db, token_data.user_id)
        if not user or not user.is_active:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Usuario no encontrado o inactivo"
            )

        new_access_token = self.create_access_token(
            data={"sub": str(user.id), "role": user.role.value}
        )
        new_refresh_token = self.create_refresh_token(
            data={"sub": str(user.id), "role": user.role.value}
        )

        return new_access_token, new_refresh_token


auth_service = AuthService()
```

---

## Backend - Requirements

### `/workspace/backend/requirements.txt`

```txt
# ============================================================
# LogiRider — Backend Dependencies
# ============================================================

# --- Framework Web ---
fastapi==0.111.0
uvicorn[standard]==0.30.1

# --- Base de datos ---
sqlalchemy==2.0.31
asyncpg==0.29.0
alembic==1.13.2
psycopg2-binary==2.9.9

# --- Caché y Colas ---
redis==5.0.7
celery==5.4.0

# --- Seguridad ---
bcrypt==4.0.1
passlib[bcrypt]==1.7.4
python-jose[cryptography]==3.3.0
python-multipart==0.0.9

# --- Validación y Config ---
pydantic==2.8.2
pydantic-settings==2.3.4
email-validator==2.2.0

# --- HTTP Client ---
httpx==0.27.0

# --- Exportación de datos ---
openpyxl==3.1.5
reportlab==4.2.2

# --- Monitoreo ---
prometheus-client==0.20.0
structlog==24.4.0

# --- Utilidades ---
python-dateutil==2.9.0
pytz==2024.1
geopy==2.4.1
haversine==2.8.1

# --- Testing ---
pytest==8.3.2
pytest-asyncio==0.23.8
httpx==0.27.0
```

---

## Infraestructura

### `/workspace/backend/docker-compose.yml`

```yaml
version: '3.8'

services:
  postgres:
    image: postgres:16-alpine
    container_name: delivery360-postgres
    restart: unless-stopped
    environment:
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: Soporte
      POSTGRES_DB: delivery360
    volumes:
      - postgres_data:/var/lib/postgresql/data
    ports:
      - "5432:5432"
    networks:
      - delivery360-network
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U postgres"]
      interval: 10s
      timeout: 5s
      retries: 5

  redis:
    image: redis:7-alpine
    container_name: delivery360-redis
    restart: unless-stopped
    command: redis-server --requirepass changeme123
    volumes:
      - redis_data:/data
    ports:
      - "6379:6379"
    networks:
      - delivery360-network
    healthcheck:
      test: ["CMD", "redis-cli", "-a", "changeme123", "--raw", "incr", "ping"]
      interval: 10s
      timeout: 5s
      retries: 5

  backend:
    build:
      context: .
      dockerfile: Dockerfile
    container_name: delivery360-backend
    restart: unless-stopped
    env_file:
      - .env
    environment:
      REDIS_URL: redis://:changeme123@redis:6379/0
      CELERY_BROKER_URL: redis://:changeme123@redis:6379/0
      CELERY_RESULT_BACKEND: redis://:changeme123@redis:6379/0
    volumes:
      - ./app:/app/app
    ports:
      - "8000:8000"
    depends_on:
      postgres:
        condition: service_healthy
      redis:
        condition: service_healthy
    networks:
      - delivery360-network
    command: uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:8000/health/check"]
      interval: 30s
      timeout: 10s
      retries: 3
      start_period: 10s

  frontend:
    build:
      context: ../frontend
      dockerfile: Dockerfile
    container_name: delivery360-frontend
    restart: unless-stopped
    environment:
      NEXT_PUBLIC_API_URL: http://backend:8000
      NEXT_PUBLIC_WS_URL: ws://backend:8000/ws
    ports:
      - "3000:3000"
    depends_on:
      - backend
    networks:
      - delivery360-network

  celery-worker:
    build:
      context: .
      dockerfile: Dockerfile
    container_name: delivery360-celery-worker
    restart: unless-stopped
    env_file:
      - .env
    environment:
      REDIS_URL: redis://:changeme123@redis:6379/0
      CELERY_BROKER_URL: redis://:changeme123@redis:6379/0
      CELERY_RESULT_BACKEND: redis://:changeme123@redis:6379/0
    volumes:
      - ./app:/app/app
    depends_on:
      postgres:
        condition: service_healthy
      redis:
        condition: service_healthy
    networks:
      - delivery360-network
    command: celery -A app.workers.celery_app worker --loglevel=info

  celery-beat:
    build:
      context: .
      dockerfile: Dockerfile
    container_name: delivery360-celery-beat
    restart: unless-stopped
    env_file:
      - .env
    environment:
      REDIS_URL: redis://:changeme123@redis:6379/0
      CELERY_BROKER_URL: redis://:changeme123@redis:6379/0
      CELERY_RESULT_BACKEND: redis://:changeme123@redis:6379/0
    depends_on:
      postgres:
        condition: service_healthy
      redis:
        condition: service_healthy
    networks:
      - delivery360-network
    command: celery -A app.workers.celery_app beat --loglevel=info

networks:
  delivery360-network:
    driver: bridge

volumes:
  postgres_data:
  redis_data:
```

---

## Frontend - Componentes Principales

### `/workspace/frontend/src/app/(auth)/login/page.tsx`

```tsx
export default function Page() {
  return (
    <div>
      <h1>delivery360/frontend/src/app/(auth)/login/page.tsx</h1>
      <p>Placeholder scaffold component.</p>
    </div>
  );
}
```

### `/workspace/frontend/src/lib/api.ts`

```typescript
// Placeholder module: delivery360/frontend/src/lib/api.ts
export const moduleName = "api";
```

---

## Resumen de Archivos del Proyecto

### Backend - Total de Archivos Python

| Directorio | Cantidad | Descripción |
|------------|----------|-------------|
| `app/api/v1/` | 14 | Endpoints REST API |
| `app/models/` | 12 | Modelos SQLAlchemy |
| `app/services/` | 13 | Lógica de negocio |
| `app/crud/` | 9 | Operaciones DB |
| `app/schemas/` | 9 | Schemas Pydantic |
| `app/core/` | 7 | Configuración central |
| `app/middleware/` | 5 | Middleware personalizado |
| `app/utils/` | 7 | Utilidades varias |
| `app/workers/` | 10 | Tareas Celery |
| `app/integrations/` | 4 | Conectores externos |
| `app/monitoring/` | 6 | Monitoreo y logs |

**Total Backend:** ~96 archivos Python

### Frontend - Total de Archivos TypeScript/React

| Directorio | Cantidad | Descripción |
|------------|----------|-------------|
| `src/app/` | 25 | Páginas Next.js |
| `src/components/` | 35 | Componentes React |
| `src/contexts/` | 3 | Contextos React |
| `src/hooks/` | 4 | Custom hooks |
| `src/lib/` | 7 | Utilidades |
| `src/stores/` | 5 | Zustand stores |
| `src/types/` | 7 | Tipos TypeScript |

**Total Frontend:** ~86 archivos TypeScript/React

---

**Fin del documento de código fuente v3.0**
