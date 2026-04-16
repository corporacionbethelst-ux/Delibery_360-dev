"""
Configuración de Sentry para error tracking
"""
import sentry_sdk
from sentry_sdk.integrations.fastapi import FastApiIntegration
from sentry_sdk.integrations.sqlalchemy import SqlalchemyIntegration
from sentry_sdk.integrations.redis import RedisIntegration
from sentry_sdk.integrations.celery import CeleryIntegration
from typing import Any, Optional
from app.core.config import settings


def setup_sentry(
    dsn: Optional[str] = None,
    environment: str = "development",
    traces_sample_rate: float = 0.1,
    send_default_pii: bool = False
):
    
    dsn = dsn or settings.SENTRY_DSN
    
    if not dsn:
        print("Sentry DSN no configurado. Error tracking deshabilitado.")
        return
    
    sentry_sdk.init(
        dsn=dsn,
        integrations=[
            FastApiIntegration(),
            SqlalchemyIntegration(),
            RedisIntegration(),
            CeleryIntegration(),
        ],
        environment=environment,
        traces_sample_rate=traces_sample_rate,
        send_default_pii=send_default_pii,
        profiles_sample_rate=0.1,  # Performance profiling
        _experiments={
            "continuous_profiling_auto_start": True,
        },
    )
    
    print(f"Sentry configurado: environment={environment}")


def set_user_context(user_id: str, email: Optional[str] = None, username: Optional[str] = None):
    sentry_sdk.set_user({
        "id": user_id,
        "email": email,
        "username": username,
    })


def set_tag(key: str, value: str):
    sentry_sdk.set_tag(key, value)


def set_extra(key: str, value: Any):
    sentry_sdk.set_extra(key, value)


def capture_exception(exception: Exception, **kwargs):
    sentry_sdk.capture_exception(exception, **kwargs)


def capture_message(message: str, level: str = "info"):
    sentry_sdk.capture_message(message, level=level)
