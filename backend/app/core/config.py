from pydantic_settings import BaseSettings
from typing import List, Optional
import json


class Settings(BaseSettings):
    """
    Clase de configuración global de la aplicación
    Hereda de BaseSettings para cargar automáticamente variables de ambiente
    Todos los atributos son configuraciones que pueden ser sobrescritas desde .env o el entorno
    """
    
    # --- CONFIGURACIÓN GENERAL DE LA APLICACIÓN ---
    
    # Nombre de la aplicación mostrado en documentación y logs
    APP_NAME: str = "LogiRider"
    # Versión actual de la aplicación (semántica)
    APP_VERSION: str = "1.0.0"
    # Entorno de la aplicación (development, staging, production)
    APP_ENV: str = "development"
    # Alias para el entorno, usado en checks condicionales
    ENVIRONMENT: str = "development"
    # Bandera para activar modo debug (detalles de errores, auto-reload, etc.)
    DEBUG: bool = True
    # Clave secreta para firmar JWTs y cifrar datos sensibles (DEBE ser cambiada en producción)
    SECRET_KEY: str

    @property
    def is_secret_key_default(self) -> bool:
        """Verificar si se está usando la clave secreta por defecto (inseguro en producción)"""
        return self.SECRET_KEY == "CHANGE-THIS-SECRET-KEY-IN-PRODUCTION-MIN-32-CHARS-RANDOM!"

    # --- CONFIGURACIÓN DE API ---
    
    # Prefijo base para todos los endpoints de la API versión 1
    API_V1_STR: str = "/api/v1"
    # Lista de orígenes CORS permitidos como string JSON (se parsea en propiedad cors_origins)
    BACKEND_CORS_ORIGINS: str = '["http://localhost:3000"]'

    @property
    def cors_origins(self) -> List[str]:
        """
        Propiedad computada que convierte el string JSON de CORS_ORIGINS a lista de Python
        Maneja errores de parsing retornando un valor por defecto seguro
        """
        try:
            # Intentar parsear el string JSON a lista de Python
            return json.loads(self.BACKEND_CORS_ORIGINS)
        except (json.JSONDecodeError, TypeError):
            # Si falla el parsing, retornar origen local por defecto
            return ["http://localhost:3000"]

    # --- CONFIGURACIÓN DE BASE DE DATOS ---
    
    # Nombre de la base de datos PostgreSQL
    POSTGRES_DB: str = "delivery360"
    # Usuario para conexión a PostgreSQL
    POSTGRES_USER: str = "postgres"
    # Contraseña para conexión a PostgreSQL (debe venir de variable de ambiente)
    POSTGRES_PASSWORD: str = ""
    # Host del servidor PostgreSQL
    POSTGRES_HOST: str = "localhost"
    # Puerto del servidor PostgreSQL
    POSTGRES_PORT: str = "5432"
    # URL completa de conexión (opcional, si no se usa se construye desde los componentes)
    DATABASE_URL: str = ""
    # URL de conexión síncrona (para operaciones que no soportan async)
    DATABASE_URL_SYNC: str = ""

    @property
    def database_url_computed(self) -> str:
        """
        Construir URL de conexión asíncrona a PostgreSQL
        Usa DATABASE_URL si está definida, sino la construye desde los componentes
        Formato: postgresql+asyncpg://user:pass@host:port/dbname
        """
        if self.DATABASE_URL:
            # Retornar URL personalizada si está definida
            return self.DATABASE_URL
        # Construir URL estándar desde componentes individuales
        return f"postgresql+asyncpg://{self.POSTGRES_USER}:{self.POSTGRES_PASSWORD}@{self.POSTGRES_HOST}:{self.POSTGRES_PORT}/{self.POSTGRES_DB}"

    @property
    def database_url_sync_computed(self) -> str:
        """
        Construir URL de conexión síncrona a PostgreSQL
        Usa DATABASE_URL_SYNC si está definida, sino la construye desde los componentes
        Formato: postgresql://user:pass@host:port/dbname (sin asyncpg)
        """
        if self.DATABASE_URL_SYNC:
            # Retornar URL síncrona personalizada si está definida
            return self.DATABASE_URL_SYNC
        # Construir URL síncrona estándar desde componentes individuales
        return f"postgresql://{self.POSTGRES_USER}:{self.POSTGRES_PASSWORD}@{self.POSTGRES_HOST}:{self.POSTGRES_PORT}/{self.POSTGRES_DB}"

    # --- CONFIGURACIÓN DE REDIS ---
    
    # URL completa de conexión a Redis para cache y colas
    REDIS_URL: str = "redis://localhost:6379/0"
    # Host del servidor Redis
    REDIS_HOST: str = "localhost"
    # Puerto del servidor Redis
    REDIS_PORT: str = "6379"

    # --- CONFIGURACIÓN DE AUTENTICACIÓN JWT ---
    
    # Algoritmo de cifrado para tokens JWT (HS256 = HMAC con SHA-256)
    ALGORITHM: str = "HS256"
    # Alias para el algoritmo JWT (compatibilidad con versiones anteriores)
    JWT_ALGORITHM: str = "HS256"
    # Tiempo de expiración para access tokens en minutos (30 min por defecto)
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30
    # Tiempo de expiración para refresh tokens en días (7 días por defecto)
    REFRESH_TOKEN_EXPIRE_DAYS: int = 7

    @property
    def jwt_algorithm_computed(self) -> str:
        """Retornar el algoritmo JWT a usar (prioriza JWT_ALGORITHM sobre ALGORITHM)"""
        return self.JWT_ALGORITHM or self.ALGORITHM

    # --- CONFIGURACIÓN DE CELERY (TASKS ASÍNCRONOS) ---
    
    # URL del broker de mensajes para Celery (Redis en este caso)
    CELERY_BROKER_URL: str = "redis://localhost:6379/0"
    # URL del backend para almacenar resultados de tasks de Celery
    CELERY_RESULT_BACKEND: str = "redis://localhost:6379/0"

    # --- CONFIGURACIÓN DE PROTECCIÓN DE DATOS (LGPD) ---
    
    # Días de retención de datos según ley LGPD (5 años = 1825 días)
    LGPD_RETENTION_DAYS: int = 1825
    # Días de retención generales para datos no críticos (90 días)
    DATA_RETENTION_DAYS: int = 90

    @property
    def retention_days_computed(self) -> int:
        """Retornar días de retención a usar (prioriza LGPD sobre general)"""
        return self.LGPD_RETENTION_DAYS if self.LGPD_RETENTION_DAYS else self.DATA_RETENTION_DAYS

    # --- CONFIGURACIÓN DE RATE LIMITING ---
    
    # Límite máximo de requests por minuto por IP/cliente
    RATE_LIMIT_PER_MINUTE: int = 60

    # --- CONFIGURACIÓN DE USUARIO INICIAL (SEED) ---
    
    # Email del usuario superadministrador inicial
    FIRST_SUPERUSER_EMAIL: str = "admin@delivery360.com"
    # Contraseña del usuario superadministrador inicial (opcional, puede venir de .env)
    FIRST_SUPERUSER_PASSWORD: Optional[str] = None
    # Nombre visible del usuario superadministrador inicial
    FIRST_SUPERUSER_NAME: str = "Administrador"

    # --- CONFIGURACIÓN DE MONITOREO Y LOGGING ---
    
    # Nivel de logging (DEBUG, INFO, WARNING, ERROR, CRITICAL)
    LOG_LEVEL: str = "INFO"
    # DSN de Sentry para tracking de errores en producción (opcional)
    SENTRY_DSN: Optional[str] = None

    # --- CONFIGURACIONES OPCIONALES ---
    
    # API Key de Google Maps para servicios de geolocalización y mapas
    GOOGLE_MAPS_API_KEY: Optional[str] = None
    # API Key de Mapbox como alternativa a Google Maps
    MAPBOX_API_KEY: Optional[str] = None
    # Bandera para habilitar/deshabilitar envío de emails
    EMAILS_ENABLED: bool = False
    # Host del servidor SMTP para envío de emails
    SMTP_HOST: str = "smtp.gmail.com"
    # Puerto del servidor SMTP (587 para TLS)
    SMTP_PORT: int = 587
    # Usuario para autenticación SMTP
    SMTP_USER: Optional[str] = None
    # Contraseña para autenticación SMTP
    SMTP_PASSWORD: Optional[str] = None
    # Email remitente por defecto para notificaciones
    EMAIL_FROM: str = "noreply@delivery360.com"

    class Config:
        """Configuración interna de Pydantic para carga de settings"""
        # Archivo .env desde donde cargar variables de ambiente
        env_file = ".env"
        # Respetar mayúsculas/minúsculas en nombres de variables
        case_sensitive = True
        # Ignorar variables de ambiente extra que no estén definidas en la clase
        extra = "ignore"


# Crear instancia global de configuración que se importa en toda la aplicación
# Esta instancia carga automáticamente las variables de ambiente al iniciarse
settings = Settings()  # type: ignore[call-arg]
