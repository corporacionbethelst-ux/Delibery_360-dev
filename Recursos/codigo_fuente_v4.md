# Delivery360 - Código Fuente Completo v4.0

**Fecha de Generación:** Abril 2025  
**Estado del Proyecto:** Backend 100% Completado - Frontend en Desarrollo  
**Versión del Documento:** 4.0  

---

## Tabla de Contenidos

1. [Backend - Archivos Principales](#backend---archivos-principales)
2. [Backend - Modelos](#backend---modelos)
3. [Backend - APIs](#backend---apis)
4. [Backend - Servicios](#backend---servicios)
5. [Backend - CRUD](#backend---crud)
6. [Backend - Schemas](#backend---schemas)
7. [Frontend - Páginas Principales](#frontend---páginas-principales)
8. [Infraestructura](#infraestructura)

---

## Backend - Archivos Principales

### `/workspace/backend/app/main.py`

```python
import os
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
from app.core.database import init_db
from app.api.administradores import router as administradores_router
from app.api.empresas import router as empresas_router
from app.api.usuarios import router as usuarios_router
from app.api.domiciliarios import router as domiciliarios_router
from app.api.zonas import router as zonas_router
from app.api.puntos_geograficos import router as puntos_geograficos_router
from app.api.tarifas import router as tarifas_router
from app.api.configuraciones import router as configuraciones_router
from app.api.vehiculos import router as vehiculos_router
from app.api.mantenimientos import router as mantenimientos_router
from app.api.gps import router as gps_router
from app.api.reportes import router as reportes_router
from app.api.auth import router as auth_router
from app.api.dashboard import router as dashboard_router
from app.api.health import router as health_router

@asynccontextmanager
async def lifespan(app: FastAPI):
    init_db()
    yield

app = FastAPI(
    title="Delivery360 API",
    description="Sistema de Gestión de Domicilios y Logística",
    version="4.0.0",
    lifespan=lifespan
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(administradores_router, prefix="/api/administradores", tags=["Administradores"])
app.include_router(empresas_router, prefix="/api/empresas", tags=["Empresas"])
app.include_router(usuarios_router, prefix="/api/usuarios", tags=["Usuarios"])
app.include_router(domiciliarios_router, prefix="/api/domiciliarios", tags=["Domiciliarios"])
app.include_router(zonas_router, prefix="/api/zonas", tags=["Zonas"])
app.include_router(puntos_geograficos_router, prefix="/api/puntos-geograficos", tags=["Puntos Geográficos"])
app.include_router(tarifas_router, prefix="/api/tarifas", tags=["Tarifas"])
app.include_router(configuraciones_router, prefix="/api/configuraciones", tags=["Configuraciones"])
app.include_router(vehiculos_router, prefix="/api/vehiculos", tags=["Vehículos"])
app.include_router(mantenimientos_router, prefix="/api/mantenimientos", tags=["Mantenimientos"])
app.include_router(gps_router, prefix="/api/gps", tags=["GPS"])
app.include_router(reportes_router, prefix="/api/reportes", tags=["Reportes"])
app.include_router(auth_router, prefix="/api/auth", tags=["Autenticación"])
app.include_router(dashboard_router, prefix="/api/dashboard", tags=["Dashboard"])
app.include_router(health_router, prefix="/api/health", tags=["Health"])

@app.get("/")
def root():
    return {"message": "Delivery360 API v4.0 - Sistema Operativo"}
```

### `/workspace/backend/app/core/database.py`

```python
from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
import os
from dotenv import load_dotenv

load_dotenv()

DATABASE_URL = os.getenv("DATABASE_URL", "postgresql://postgres:admin123@localhost:5432/delivery360")

engine = create_engine(DATABASE_URL)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

def init_db():
    from app.models import administrador, empresa, usuario, domiciliario, zona, punto_geografico, tarifa, configuracion, vehiculo, mantenimiento, gps, reporte
    Base.metadata.create_all(bind=engine)
```

### `/workspace/backend/app/core/security.py`

```python
from datetime import datetime, timedelta
from typing import Optional
from jose import JWTError, jwt
from passlib.context import CryptContext
import os
from dotenv import load_dotenv

load_dotenv()

SECRET_KEY = os.getenv("SECRET_KEY", "tu_clave_secreta_muy_segura_123456")
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = int(os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES", "30"))

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

def verify_password(plain_password, hashed_password):
    return pwd_context.verify(plain_password, hashed_password)

def get_password_hash(password):
    return pwd_context.hash(password)

def create_access_token(data: dict, expires_delta: Optional[timedelta] = None):
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt

def decode_access_token(token: str):
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        return payload
    except JWTError:
        return None
```

### `/workspace/backend/app/core/config.py`

```python
from pydantic_settings import BaseSettings
from typing import List, Optional
import os

class Settings(BaseSettings):
    PROJECT_NAME: str = "Delivery360"
    VERSION: str = "4.0.0"
    API_V1_STR: str = "/api"
    
    DATABASE_URL: str = os.getenv("DATABASE_URL", "postgresql://postgres:admin123@localhost:5432/delivery360")
    
    SECRET_KEY: str = os.getenv("SECRET_KEY", "tu_clave_secreta_muy_segura_123456")
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = int(os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES", "30"))
    
    CORS_ORIGINS: List[str] = ["*"]
    
    class Config:
        env_file = ".env"
        case_sensitive = True

settings = Settings()
```


---

## Frontend - Páginas Principales

### `/workspace/frontend/src/app/(auth)/login/page.tsx`

```tsx
'use client';

/**
 * Página de Login - Delivery360
 * Formulario de autenticación para todos los roles
 */

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import { Mail, Lock, Loader2, AlertCircle, Truck } from 'lucide-react';

export default function LoginPage() {
  const router = useRouter();
  const { login, isLoading, error, clearError } = useAuth();

  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });
  const [formErrors, setFormErrors] = useState<{ email?: string; password?: string }>({});

  const validateForm = () => {
    const errors: { email?: string; password?: string } = {};

    if (!formData.email) {
      errors.email = 'El email es requerido';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      errors.email = 'Email inválido';
    }

    if (!formData.password) {
      errors.password = 'La contraseña es requerida';
    } else if (formData.password.length < 6) {
      errors.password = 'La contraseña debe tener al menos 6 caracteres';
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    clearError();

    if (!validateForm()) return;

    try {
      await login(formData.email, formData.password);
      // La redirección se maneja en el layout o dashboard según el rol
      router.push('/manager');
    } catch (err) {
      console.error('Login error:', err);
      // El error ya está manejado por el store
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (formErrors[name as keyof typeof formErrors]) {
      setFormErrors(prev => ({ ...prev, [name]: undefined }));
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-white to-blue-100 px-4">
      <div className="max-w-md w-full">
        {/* Logo y Título */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-600 rounded-2xl mb-4 shadow-lg">
            <Truck className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900">Delivery360</h1>
          <p className="text-gray-600 mt-2">Inicia sesión para continuar</p>
        </div>

        {/* Card de Login */}
        <div className="bg-white rounded-2xl shadow-xl p-8">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Error Global */}
            {error && (
              <div className="flex items-center gap-2 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
                <AlertCircle className="w-5 h-5 flex-shrink-0" />
                <span className="text-sm">{error}</span>
              </div>
            )}

            {/* Email */}
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                Email
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Mail className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  value={formData.email}
                  onChange={handleChange}
                  className={`block w-full pl-10 pr-3 py-3 border ${
                    formErrors.email ? 'border-red-300' : 'border-gray-300'
                  } rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors`}
                  placeholder="tu@email.com"
                />
              </div>
              {formErrors.email && (
                <p className="mt-1 text-sm text-red-600">{formErrors.email}</p>
              )}
            </div>

            {/* Password */}
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
                Contraseña
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Lock className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  id="password"
                  name="password"
                  type="password"
                  autoComplete="current-password"
                  value={formData.password}
                  onChange={handleChange}
                  className={`block w-full pl-10 pr-3 py-3 border ${
                    formErrors.password ? 'border-red-300' : 'border-gray-300'
                  } rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors`}
                  placeholder="••••••••"
                />
              </div>
              {formErrors.password && (
                <p className="mt-1 text-sm text-red-600">{formErrors.password}</p>
              )}
            </div>

            {/* Forgot Password & Remember Me */}
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <input
                  id="remember-me"
                  name="remember-me"
                  type="checkbox"
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <label htmlFor="remember-me" className="ml-2 block text-sm text-gray-700">
                  Recordarme
                </label>
              </div>
              <Link
                href="/forgot-password"
                className="text-sm font-medium text-blue-600 hover:text-blue-500"
              >
                ¿Olvidaste tu contraseña?
              </Link>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full flex justify-center items-center py-3 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
            >
              {isLoading ? (
                <>
                  <Loader2 className="animate-spin -ml-1 mr-2 h-5 w-5" />
                  Iniciando sesión...
                </>
              ) : (
                'Iniciar Sesión'
              )}
            </button>
          </form>

          {/* Divider */}
          <div className="mt-6">
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-300" />
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-white text-gray-500">¿Nuevo en Delivery360?</span>
              </div>
            </div>

            <div className="mt-6">
              <Link
                href="/register-rider"
                className="w-full flex justify-center py-3 px-4 border border-gray-300 rounded-lg shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-all"
              >
                Registrarse como Repartidor
              </Link>
            </div>
          </div>
        </div>

        {/* Footer */}
        <p className="mt-8 text-center text-xs text-gray-500">
          © 2024 Delivery360. Todos los derechos reservados.
        </p>
      </div>
    </div>
  );
}
```

---

## Infraestructura

### `/workspace/docker-compose.yml`

```yaml
version: '3.8'

services:
  # PostgreSQL Database
  postgres:
    image: postgres:16-alpine
    container_name: delivery360-postgres
    restart: unless-stopped
    environment:
      POSTGRES_USER: ${POSTGRES_USER:-delivery360}
      POSTGRES_PASSWORD: ${POSTGRES_PASSWORD:-changeme123}
      POSTGRES_DB: ${POSTGRES_DB:-delivery360}
    volumes:
      - postgres_data:/var/lib/postgresql/data
    ports:
      - "5432:5432"
    networks:
      - delivery360-network
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U ${POSTGRES_USER:-delivery360}"]
      interval: 10s
      timeout: 5s
      retries: 5

  # Redis Cache & Message Broker
  redis:
    image: redis:7-alpine
    container_name: delivery360-redis
    restart: unless-stopped
    command: redis-server --requirepass ${REDIS_PASSWORD:-changeme123}
    volumes:
      - redis_data:/data
    ports:
      - "6379:6379"
    networks:
      - delivery360-network
    healthcheck:
      test: ["CMD", "redis-cli", "--raw", "incr", "ping"]
      interval: 10s
      timeout: 5s
      retries: 5

  # Backend API (FastAPI)
  backend:
    build:
      context: .
      dockerfile: Dockerfile
    container_name: delivery360-backend
    restart: unless-stopped
    env_file:
      - .env
    environment:
      DATABASE_URL: postgresql+async://postgres:${POSTGRES_PASSWORD:-changeme123}@postgres:5432/delivery360
      REDIS_URL: redis://:${REDIS_PASSWORD:-changeme123}@redis:6379/0
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

  # Frontend (Next.js)
  frontend:
    build:
      context: ../frontend
      dockerfile: Dockerfile
    container_name: delivery360-frontend
    restart: unless-stopped
    environment:
      NEXT_PUBLIC_API_URL: http://localhost:8000
      NEXT_PUBLIC_WS_URL: ws://localhost:8000/ws
    ports:
      - "3000:3000"
    depends_on:
      - backend
    networks:
      - delivery360-network

  # Celery Worker
  celery-worker:
    build:
      context: .
      dockerfile: Dockerfile
    container_name: delivery360-celery-worker
    restart: unless-stopped
    env_file:
      - .env
    environment:
      DATABASE_URL: postgresql+async://postgres:${POSTGRES_PASSWORD:-changeme123}@postgres:5432/delivery360
      REDIS_URL: redis://:${REDIS_PASSWORD:-changeme123}@redis:6379/0
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

  # Celery Beat (Scheduled Tasks)
  celery-beat:
    build:
      context: .
      dockerfile: Dockerfile
    container_name: delivery360-celery-beat
    restart: unless-stopped
    env_file:
      - .env
    environment:
      DATABASE_URL: postgresql+async://postgres:${POSTGRES_PASSWORD:-changeme123}@postgres:5432/delivery360
      REDIS_URL: redis://:${REDIS_PASSWORD:-changeme123}@redis:6379/0
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

### `/workspace/backend/Dockerfile`

```dockerfile
# ============================================================
# LogiRider Backend — Dockerfile
# Python 3.11 slim (estable para producción)
# ============================================================
FROM python:3.11-slim

WORKDIR /app

# Dependencias del sistema
RUN apt-get update && apt-get install -y \
    build-essential \
    libpq-dev \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Dependencias Python
COPY requirements.txt .
RUN pip install --no-cache-dir --upgrade pip && \
    pip install --no-cache-dir -r requirements.txt

# Copiar código fuente
COPY . .

# Puerto de la API
EXPOSE 8000

CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000", "--reload"]
```

### `/workspace/frontend/Dockerfile`

```dockerfile
# Frontend Dockerfile - Delivery360
FROM node:20-alpine

# Set environment variables
ENV NODE_ENV=production \
    PORT=3000

# Set work directory
WORKDIR /app

# Install system dependencies
RUN apk add --no-cache libc6-compat

# Copy package files
COPY package.json package-lock.json* ./

# Install dependencies
RUN npm ci

# Copy application code
COPY . .

# Build the application
RUN npm run build

# Create non-root user for security
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nextjs -u 1001 && \
    chown -R nextjs:nodejs /app/.next

USER nextjs

# Expose port
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
    CMD wget --no-verbose --tries=1 --spider http://localhost:3000/health || exit 1

# Start the application
CMD ["npm", "start"]
```

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

**Fin del Documento - Código Fuente v4.0**
