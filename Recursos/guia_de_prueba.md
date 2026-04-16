# 🧪 Guía de Pruebas Locales - LogiRider (Delibery_360)

Esta guía está diseñada para levantar el entorno completo en tu máquina local utilizando **Docker**, permitiéndote realizar pruebas funcionales antes de pasar a producción.

---

## 📋 Prerrequisitos

1.  **Docker Desktop** instalado (Windows/Mac) o **Docker Engine + Docker Compose** (Linux).
    *   Verificar instalación: `docker --version` y `docker compose version`.
2.  **Git** instalado.
3.  **Puertos libres**: Asegúrate de que los puertos `5432` (Postgres), `6379` (Redis), `8000` (Backend) y `3000/80` (Frontend) no estén siendo usados por otros servicios locales.

---

## 🚀 Paso 1: Clonar y Preparar

Abre tu terminal en la carpeta donde quieras el proyecto:

```bash
# 1. Clonar el repositorio
git clone https://github.com/corporacionbethelst-ux/Delibery_360-dev.git
cd Delibery_360-dev

# 2. Asegurarse de estar en la rama con las mejoras
git checkout qwen-code-e70f34b2-0fb8-49a8-baaf-748990bd67fa
```

---

## ⚙️ Paso 2: Configuración de Variables de Entorno

Docker necesita un archivo `.env` para configurar las contraseñas y conexiones.

1.  Ve a la carpeta `backend/`.
2.  Crea un archivo llamado `.env` (puedes copiar el ejemplo si existe, o crearlo desde cero).

**Comando rápido para crear el archivo `.env` en backend/:**

```bash
cd backend
cat > .env << EOF
# Database Config
POSTGRES_USER=logirider_user
POSTGRES_PASSWORD=password123
POSTGRES_DB=logirider_db
DATABASE_URL=postgresql+asyncpg://logirider_user:password123@db:5432/logirider_db

# Security
SECRET_KEY=super_secret_key_for_local_testing_change_in_prod
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=30

# Redis
REDIS_URL=redis://redis:6379/0
CELERY_BROKER_URL=redis://redis:6379/0
CELERY_RESULT_BACKEND=redis://redis:6379/0

# App Settings
ENVIRONMENT=development
DEBUG=True
BACKEND_CORS_ORIGINS=["http://localhost:3000", "http://localhost:80"]
EOF
cd ..
```

> **Nota:** Estas credenciales son solo para local. No las uses en producción.

---

## 🐳 Paso 3: Definición de Servicios (Docker Compose)

Crearemos un archivo `docker-compose.dev.yml` en la raíz del proyecto para orquestar los servicios de desarrollo.

**Crea el archivo `docker-compose.dev.yml` en la raíz (`/Delibery_360-dev/`) con este contenido:**

```yaml
version: '3.8'

services:
  # --- Base de Datos PostgreSQL ---
  db:
    image: postgres:15-alpine
    container_name: logirider_db
    restart: unless-stopped
    environment:
      POSTGRES_USER: ${POSTGRES_USER}
      POSTGRES_PASSWORD: ${POSTGRES_PASSWORD}
      POSTGRES_DB: ${POSTGRES_DB}
    ports:
      - "5432:5432"  # Expuesto para poder conectar con DBeaver o similar si quieres
    volumes:
      - pgdata_dev:/var/lib/postgresql/data
    networks:
      - logirider_net
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U ${POSTGRES_USER}"]
      interval: 5s
      timeout: 5s
      retries: 5

  # --- Redis (Cache & Colas) ---
  redis:
    image: redis:7-alpine
    container_name: logirider_redis
    restart: unless-stopped
    ports:
      - "6379:6379"
    networks:
      - logirider_net
    healthcheck:
      test: ["CMD", "redis-cli", "ping"]
      interval: 5s
      timeout: 5s
      retries: 5

  # --- Backend API (FastAPI) ---
  backend:
    build:
      context: ./backend
      dockerfile: Dockerfile
    container_name: logirider_api
    restart: unless-stopped
    env_file:
      - ./backend/.env
    ports:
      - "8000:8000"
    depends_on:
      db:
        condition: service_healthy
      redis:
        condition: service_healthy
    networks:
      - logirider_net
    # Comando para iniciar uvicorn y aplicar migraciones automáticamente
    command: >
      sh -c "alembic upgrade head && uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload"
    volumes:
      - ./backend:/app  # Montaje para hot-reload en desarrollo

  # --- Celery Worker (Tareas en segundo plano) ---
  celery_worker:
    build:
      context: ./backend
      dockerfile: Dockerfile
    container_name: logirider_worker
    restart: unless-stopped
    env_file:
      - ./backend/.env
    depends_on:
      - backend
      - redis
    networks:
      - logirider_net
    command: celery -A app.core.celery_app worker --loglevel=info --concurrency=2
    volumes:
      - ./backend:/app

  # --- Frontend (Next.js/React) ---
  frontend:
    build:
      context: ./frontend
      dockerfile: Dockerfile
    container_name: logirider_web
    restart: unless-stopped
    ports:
      - "3000:3000"
    depends_on:
      - backend
    networks:
      - logirider_net
    environment:
      - NEXT_PUBLIC_API_URL=http://localhost:8000
    volumes:
      - ./frontend:/app  # Montaje para hot-reload
      - /app/node_modules # Evitar sobrescribir node_modules del contenedor

volumes:
  pgdata_dev:

networks:
  logirider_net:
    driver: bridge
```

---

## 🔨 Paso 4: Construir y Levantar el Entorno

Ejecuta los siguientes comandos en la raíz del proyecto:

```bash
# 1. Construir las imágenes (la primera vez tarda unos minutos)
docker compose -f docker-compose.dev.yml build

# 2. Levantar todos los servicios en segundo plano
docker compose -f docker-compose.dev.yml up -d
```

---

## 🔍 Paso 5: Verificación de Servicios

Espera unos 30 segundos para que los servicios inicien y verifica el estado:

```bash
docker compose -f docker-compose.dev.yml ps
```

Deberías ver algo como esto:
*   `logirider_db`: healthy
*   `logirider_redis`: healthy
*   `logirider_api`: running
*   `logirider_worker`: running
*   `logirider_web`: running

**Ver logs en tiempo real (útil para debugging):**
```bash
# Ver logs de todos
docker compose -f docker-compose.dev.yml logs -f

# O ver solo los del backend
docker compose -f docker-compose.dev.yml logs -f backend
```

---

## 🧪 Paso 6: Ejecutar Pruebas Funcionales

### 6.1 Prueba de Backend (API)
1.  Abre tu navegador en: `http://localhost:8000/docs`
2.  Deberías ver la interfaz **Swagger UI**.
3.  Prueba el endpoint `GET /api/v1/health` (debería retornar `{"status": "healthy"}`).
4.  Si hay autenticación, crea un usuario vía endpoint `POST /api/v1/auth/register` y obtén un token.

### 6.2 Prueba de Frontend
1.  Abre tu navegador en: `http://localhost:3000`
2.  Deberías ver la interfaz de **LogiRider**.
3.  Intenta navegar por las secciones implementadas:
    *   **Repartidores:** Registro y lista.
    *   **Entregas:** Iniciar y finalizar entregas.
    *   **Turnos:** Check-in/out.
    *   **Productividad:** Gráficos y métricas.

### 6.3 Prueba de Base de Datos
Si tienes un cliente SQL instalado (DBeaver, pgAdmin) o usas la terminal:
*   Host: `localhost`
*   Puerto: `5432`
*   Usuario: `logirider_user`
*   Password: `password123`
*   DB: `logirider_db`

O desde la terminal del contenedor:
```bash
docker exec -it logirider_db psql -U logirider_user -d logirider_db -c "\dt"
```
*(Deberías listar las tablas: users, riders, deliveries, alerts, etc.)*

---

## 🛠️ Solución de Problemas Comunes

### Error: "Puerto ya en uso"
Si ves errores como `Bind for 0.0.0.0:8000 failed: port is already allocated`:
1.  Identifica qué usa el puerto: `lsof -i :8000` (Mac/Linux) o `netstat -ano | findstr :8000` (Windows).
2.  Mata el proceso o cambia el puerto en `docker-compose.dev.yml` (ej. `8001:8000`).

### Error: "Connection refused" en el Backend
Asegúrate de que la base de datos haya iniciado completamente antes que el backend. El `healthcheck` en el docker-compose debería manejar esto, pero si falla:
```bash
docker compose -f docker-compose.dev.yml restart db
docker compose -f docker-compose.dev.yml restart backend
```

### El Frontend no carga o muestra error de API
Verifica que la variable `NEXT_PUBLIC_API_URL` en el `docker-compose.dev.yml` apunte a `http://localhost:8000` (o la IP de tu máquina si lo pruebas desde otro dispositivo en la red local).

### Cambios en el código no se reflejan
Gracias al montaje de volúmenes (`volumes`), los cambios deberían verse al guardar.
*   Si no es así, fuerza la reconstrucción: `docker compose -f docker-compose.dev.yml up -d --build`.

---

## 🛑 Detener el Entorno

Cuando termines tus pruebas:

```bash
# Detener y eliminar contenedores (los datos de la DB se mantienen en el volumen)
docker compose -f docker-compose.dev.yml down

# Para borrar TODO incluyendo la base de datos (¡Cuidado!)
docker compose -f docker-compose.dev.yml down -v
```

---

## ✅ Checklist de Pruebas Exitosas

- [ ] Todos los contenedores están en estado `Up (healthy)`.
- [ ] Swagger UI (`/docs`) responde correctamente.
- [ ] El Login/Register funciona.
- [ ] Se pueden crear Repartidores.
- [ ] Se pueden registrar Entregas.
- [ ] Los gráficos de Productividad muestran datos (o estado vacío sin errores).
- [ ] No hay errores críticos en los logs (`logs -f`).

¡Listo! Ahora tienes un entorno local idéntico al de producción para validar todas las funcionalidades.
