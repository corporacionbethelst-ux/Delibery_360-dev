"""
CORS Middleware para configuración de acceso cruzado
"""
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from typing import List, Optional


def setup_cors_middleware(
    app: FastAPI,
    allow_origins: Optional[List[str]] = None,
    allow_credentials: bool = True,
    allow_methods: Optional[List[str]] = None,
    allow_headers: Optional[List[str]] = None
):
    """
    Configurar middleware CORS en la aplicación FastAPI
    
    Args:
        app: Instancia de FastAPI
        allow_origins: Lista de orígenes permitidos (default: ["*"])
        allow_credentials: Permitir cookies y autenticación (default: True)
        allow_methods: Métodos HTTP permitidos (default: todos)
        allow_headers: Headers permitidos (default: todos)
    """
    
    # Configuración por defecto
    origins = allow_origins or [
        "http://localhost:3000",
        "http://localhost:8080",
        "http://127.0.0.1:3000",
        "http://127.0.0.1:8080",
        "https://delivery360.local",
    ]
    
    methods = allow_methods or [
        "GET",
        "POST",
        "PUT",
        "PATCH",
        "DELETE",
        "OPTIONS",
    ]
    
    headers = allow_headers or [
        "Content-Type",
        "Authorization",
        "X-Requested-With",
        "Accept",
        "Origin",
        "Access-Control-Request-Method",
        "Access-Control-Request-Headers",
    ]
    
    app.add_middleware(
        CORSMiddleware,
        allow_origins=origins,
        allow_credentials=allow_credentials,
        allow_methods=methods,
        allow_headers=headers,
        expose_headers=["X-RateLimit-Limit", "X-RateLimit-Remaining"],
    )
    
    return app


def get_default_cors_config() -> dict:
    """Obtener configuración CORS por defecto"""
    return {
        "allow_origins": [
            "http://localhost:3000",
            "http://localhost:8080",
            "http://127.0.0.1:3000",
            "http://127.0.0.1:8080",
        ],
        "allow_credentials": True,
        "allow_methods": ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
        "allow_headers": [
            "Content-Type",
            "Authorization",
            "X-Requested-With",
            "Accept",
            "Origin",
        ],
    }
