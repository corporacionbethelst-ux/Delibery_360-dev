from pydantic_settings import BaseSettings
from typing import List, Optional
import json


class Settings(BaseSettings):
    """Configuración global de la aplicación cargada desde variables de ambiente"""
    
    # --- CONFIGURACIÓN GENERAL ---
    APP_NAME: str = "LogiRider"  # Nombre de la aplicación
    APP_VERSION: str = "1.0.0"  # Versión semántica
    APP_ENV: str = "development"  # Entorno (development/staging/production)
    ENVIRONMENT: str = "development"  # Alias para checks condicionales
    DEBUG: bool = True  # Modo debug habilitado
    SECRET_KEY: str  # Clave secreta para JWT y cifrado
    
    @property
    def is_secret_key_default(self) -> bool:
        """Verificar si se usa la clave secreta por defecto (inseguro)"""
        return self.SECRET_KEY == "CHANGE-THIS-SECRET-KEY-IN-PRODUCTION-MIN-32-CHARS-RANDOM!"

    # --- CONFIGURACIÓN DE API ---
    API_V1_STR: str = "/api/v1"  # Prefijo para endpoints v1
    BACKEND_CORS_ORIGINS: str = '["http://localhost:3000"]'  # Orígenes CORS como JSON string

    @property
    def cors_origins(self) -> List[str]:
        """Convertir string JSON de CORS a lista de Python"""
        try:
            return json.loads(self.BACKEND_CORS_ORIGINS)
        except (json.JSONDecodeError, TypeError):
            return ["http://localhost:3000"]

    # --- CONFIGURACIÓN DE BASE DE DATOS ---
    POSTGRES_DB: str = "delivery360"  # Nombre de la BD
    POSTGRES_USER: str = "postgres"  # Usuario de BD
    POSTGRES_PASSWORD: str = ""  # Contraseña de BD
    POSTGRES_HOST: str = "localhost"  # Host del servidor PostgreSQL
    POSTGRES_PORT: str = "5432"  # Puerto del servidor PostgreSQL
    DATABASE_URL: str = ""  # URL completa opcional
    DATABASE_URL_SYNC: str = ""  # URL síncrona opcional

    @property
    def database_url_computed(self) -> str:
        """Construir URL asíncrona de PostgreSQL"""
        if self.DATABASE_URL:
            return self.DATABASE_URL
        return f"postgresql+asyncpg://{self.POSTGRES_USER}:{self.POSTGRES_PASSWORD}@{self.POSTGRES_HOST}:{self.POSTGRES_PORT}/{self.POSTGRES_DB}"

    @property
    def database_url_sync_computed(self) -> str:
        """Construir URL síncrona de PostgreSQL"""
        if self.DATABASE_URL_SYNC:
            return self.DATABASE_URL_SYNC
        return f"postgresql://{self.POSTGRES_USER}:{self.POSTGRES_PASSWORD}@{self.POSTGRES_HOST}:{self.POSTGRES_PORT}/{self.POSTGRES_DB}"

    # --- CONFIGURACIÓN DE REDIS ---
    REDIS_URL: str = "redis://localhost:6379/0"  # URL completa de Redis
    REDIS_HOST: str = "localhost"  # Host de Redis
    REDIS_PORT: str = "6379"  # Puerto de Redis

    # --- CONFIGURACIÓN JWT ---
    ALGORITHM: str = "HS256"  # Algoritmo de firma JWT
    JWT_ALGORITHM: str = "HS256"  # Alias del algoritmo
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30  # Expiración de access token (minutos)
    REFRESH_TOKEN_EXPIRE_DAYS: int = 7  # Expiración de refresh token (días)

    @property
    def jwt_algorithm_computed(self) -> str:
        """Retornar algoritmo JWT (prioriza JWT_ALGORITHM)"""
        return self.JWT_ALGORITHM or self.ALGORITHM

    # --- CONFIGURACIÓN DE CELERY ---
    CELERY_BROKER_URL: str = "redis://localhost:6379/0"  # Broker de mensajes
    CELERY_RESULT_BACKEND: str = "redis://localhost:6379/0"  # Backend de resultados

    # --- CONFIGURACIÓN LGPD ---
    LGPD_RETENTION_DAYS: int = 1825  # Días de retención según ley (5 años)
    DATA_RETENTION_DAYS: int = 90  # Días de retención general

    @property
    def retention_days_computed(self) -> int:
        """Retornar días de retención (prioriza LGPD)"""
        return self.LGPD_RETENTION_DAYS if self.LGPD_RETENTION_DAYS else self.DATA_RETENTION_DAYS

    # --- RATE LIMITING ---
    RATE_LIMIT_PER_MINUTE: int = 60  # Requests máximos por minuto

    # --- USUARIO INICIAL (SEED) ---
    FIRST_SUPERUSER_EMAIL: str = "admin@delivery360.com"  # Email del admin inicial
    FIRST_SUPERUSER_PASSWORD: Optional[str] = None  # Contraseña del admin inicial
    FIRST_SUPERUSER_NAME: str = "Administrador"  # Nombre del admin inicial

    # --- MONITOREO Y LOGGING ---
    LOG_LEVEL: str = "INFO"  # Nivel de logging
    SENTRY_DSN: Optional[str] = None  # DSN de Sentry para errores

    # --- CONFIGURACIONES OPCIONALES ---
    GOOGLE_MAPS_API_KEY: Optional[str] = None  # API Key de Google Maps
    MAPBOX_API_KEY: Optional[str] = None  # API Key de Mapbox
    EMAILS_ENABLED: bool = False  # Habilitar envío de emails
    SMTP_HOST: str = "smtp.gmail.com"  # Servidor SMTP
    SMTP_PORT: int = 587  # Puerto SMTP (TLS)
    SMTP_USER: Optional[str] = None  # Usuario SMTP
    SMTP_PASSWORD: Optional[str] = None  # Contraseña SMTP
    EMAIL_FROM: str = "noreply@delivery360.com"  # Email remitente

    class Config:
        """Configuración interna de Pydantic"""
        env_file = ".env"  # Archivo .env para cargar variables
        case_sensitive = True  # Respetar mayúsculas/minúsculas
        extra = "ignore"  # Ignorar variables extra


# Instancia global de configuración cargada automáticamente
settings = Settings()  # type: ignore[call-arg]
