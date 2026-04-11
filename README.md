# 🚀 Delivery360 / LogiRider

Sistema integral de gestión de entregas y logística para restaurantes y servicios de delivery.

## 📋 Descripción

Delivery360 es una plataforma completa que permite:

- **Gestión de Órdenes**: Crear, asignar y monitorear órdenes de entrega en tiempo real
- **Administración de Repartidores**: Gestionar flota de repartidores, turnos y rendimiento
- **Dashboard Gerencial**: KPIs, métricas y reportes en tiempo real
- **Seguimiento en Vivo**: Mapa interactivo con ubicación de repartidores
- **Multi-rol**: Superadmin, Gerente, Operador y Repartidor
- **LGPD Compliant**: Cumplimiento con ley de protección de datos brasileña

## 🏗️ Arquitectura

```
┌─────────────────────────────────────────────────────────────┐
│                      Frontend (Next.js)                     │
│  React 18 + TypeScript + TailwindCSS + Shadcn/ui           │
└─────────────────────────────────────────────────────────────┘
                              │
                              │ REST API / WebSocket
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                    Backend (FastAPI)                        │
│  Python 3.11+ | SQLAlchemy Async | Pydantic V2             │
│  - Autenticación JWT                                        │
│  - Rate Limiting                                            │
│  - Audit Logging                                            │
│  - WebSockets para actualizaciones en tiempo real          │
└─────────────────────────────────────────────────────────────┘
                              │
                              │ Async PG
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                  PostgreSQL + Redis                         │
│  - Base de datos relacional                                 │
│  - Caché y colas con Redis                                  │
│  - Migrations con Alembic                                   │
└─────────────────────────────────────────────────────────────┘
```

## 📁 Estructura del Proyecto

```
/workspace
├── backend/
│   ├── app/
│   │   ├── api/            # Endpoints REST
│   │   ├── core/           # Configuración, DB, seguridad
│   │   ├── models/         # Modelos SQLAlchemy
│   │   ├── schemas/        # Esquemas Pydantic
│   │   ├── services/       # Lógica de negocio
│   │   └── crud/           # Operaciones CRUD
│   ├── alembic/            # Migraciones de DB
│   ├── .env.example        # Variables de entorno
│   ├── requirements.txt    # Dependencias Python
│   └── docker-compose.yml  # Orquestación Docker
│
├── frontend/
│   ├── src/
│   │   ├── app/            # Next.js App Router
│   │   ├── components/     # Componentes React
│   │   ├── contexts/       # Contextos (Auth, Theme)
│   │   ├── hooks/          # Custom hooks
│   │   ├── lib/            # Utilidades y API client
│   │   └── types/          # Tipos TypeScript
│   ├── package.json
│   └── tailwind.config.ts
│
├── Informes_Codigos/
│   ├── codigo_fuente_v4.md
│   └── informe_de_sistema_v4.md
│
└── README.md               # Este archivo
```

## 🚀 Inicio Rápido

### Prerrequisitos

- Docker y Docker Compose
- Node.js 18+ (para desarrollo local frontend)
- Python 3.11+ (para desarrollo local backend)

### Opción 1: Docker (Recomendado)

```bash
# Clonar repositorio
cd /workspace

# Iniciar todos los servicios
docker-compose up -d

# Ejecutar seed inicial (crear usuarios de prueba)
docker-compose exec backend python app/core/seed.py

# Ver logs
docker-compose logs -f
```

**Servicios disponibles:**
- Frontend: http://localhost:3000
- Backend API: http://localhost:8000
- PostgreSQL: localhost:5432
- Redis: localhost:6379
- pgAdmin: http://localhost:5050

### Opción 2: Desarrollo Local

#### Backend

```bash
cd backend

# Crear entorno virtual
python -m venv venv
source venv/bin/activate  # Linux/Mac
# o
venv\Scripts\activate  # Windows

# Instalar dependencias
pip install -r requirements.txt

# Copiar variables de entorno
cp .env.example .env

# Ejecutar migraciones
alembic upgrade head

# Inicializar datos de prueba
python app/core/seed.py

# Iniciar servidor
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

#### Frontend

```bash
cd frontend

# Instalar dependencias
npm install

# Copiar variables de entorno
cp .env.example .env.local

# Iniciar servidor de desarrollo
npm run dev
```

## 👤 Credenciales de Prueba

Después de ejecutar el seed, puedes acceder con:

| Rol | Email | Contraseña |
|-----|-------|-----------|
| Superadmin | admin@delivery360.com | Admin1234! |
| Gerente | gerente@delivery360.com | Gerente123! |
| Operador | operador@delivery360.com | Operador123! |
| Repartidor | repartidor@delivery360.com | Rider123! |

## 📡 Endpoints API Principales

### Autenticación
- `POST /api/v1/auth/login` - Iniciar sesión
- `POST /api/v1/auth/register` - Registrar usuario
- `POST /api/v1/auth/refresh` - Refresh token
- `POST /api/v1/auth/logout` - Cerrar sesión

### Usuarios
- `GET /api/v1/users` - Listar usuarios
- `GET /api/v1/users/{id}` - Obtener usuario
- `PUT /api/v1/users/{id}` - Actualizar usuario
- `DELETE /api/v1/users/{id}` - Eliminar usuario

### Órdenes
- `GET /api/v1/orders` - Listar órdenes
- `POST /api/v1/orders` - Crear orden
- `GET /api/v1/orders/{id}` - Obtener orden
- `PUT /api/v1/orders/{id}` - Actualizar orden
- `PATCH /api/v1/orders/{id}/status` - Cambiar estado

### Repartidores
- `GET /api/v1/riders` - Listar repartidores
- `POST /api/v1/riders` - Crear repartidor
- `GET /api/v1/riders/active` - Repartidores activos
- `PUT /api/v1/riders/{id}/status` - Cambiar disponibilidad

### Dashboard
- `GET /api/v1/dashboard/stats` - Estadísticas generales
- `GET /api/v1/dashboard/metrics` - Métricas detalladas

**Documentación completa:** http://localhost:8000/docs

## 🔧 Variables de Entorno

Ver `backend/.env.example` para todas las opciones disponibles.

**Mínimas requeridas:**
```bash
SECRET_KEY=tu_clave_secreta_segura
DATABASE_URL=postgresql+asyncpg://user:pass@localhost:5432/delivery360
REDIS_URL=redis://localhost:6379/0
```

## 📊 Características Principales

### ✅ Completado (Fase 1 & 2)
- [x] Autenticación JWT con roles
- [x] Modelos de datos completos (User, Rider, Order, etc.)
- [x] API REST con FastAPI
- [x] Base de datos PostgreSQL con migraciones
- [x] Rate limiting y audit logging
- [x] WebSockets para actualizaciones en tiempo real
- [x] Frontend Next.js con componentes base
- [x] Dashboards por rol (Manager, Operator, Rider)
- [x] Componentes reutilizables (StatsCards, RecentOrders, ActiveRiders)
- [x] Script de seed para datos iniciales
- [x] Dockerización completa

### 🔄 En Progreso (Fase 3)
- [ ] Integración completa frontend-backend
- [ ] Mapas en tiempo real con Leaflet/Google Maps
- [ ] Notificaciones push
- [ ] Tests automatizados

### 📅 Planificado
- [ ] Integración con APIs externas (iFood, UberEats)
- [ ] Sistema de pagos integrado
- [ ] App móvil React Native
- [ ] Reportes avanzados y exportación

## 🧪 Testing

```bash
# Backend tests
cd backend
pytest

# Frontend tests
cd frontend
npm test
```

## 📝 Scripts Útiles

```bash
# Backend
python app/core/seed.py           # Inicializar datos
alembic revision --autogenerate   # Crear migración
alembic upgrade head              # Aplicar migraciones

# Docker
docker-compose up -d              # Iniciar servicios
docker-compose down               # Detener servicios
docker-compose logs -f            # Ver logs
```

## 🔒 Seguridad

- JWT para autenticación
- Hash de contraseñas con bcrypt
- Rate limiting por IP y usuario
- CORS configurado
- Audit logging de todas las operaciones
- Compliance LGPD (retención de datos configurable)

## 📄 Licencia

Propietario - Todos los derechos reservados

## 👥 Equipo

Desarrollado por el equipo Delivery360

## 🆘 Soporte

Para soporte técnico, contactar: soporte@delivery360.com

---

**Estado del Proyecto:** Fase 3 - Completando Frontend e Integración

**Última Actualización:** 2024
