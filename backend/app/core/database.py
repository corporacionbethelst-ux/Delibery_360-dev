# Importar funciones para crear engine y sesiones asíncronas de SQLAlchemy
from sqlalchemy.ext.asyncio import create_async_engine, async_sessionmaker, AsyncSession
# Importar clases base para ORM síncrono (usado en workers y scripts)
from sqlalchemy.orm import DeclarativeBase, sessionmaker, Session
# Importar función para crear engine síncrono
from sqlalchemy import create_engine
# Importar tipos para definir generadores asíncronos y síncronos
from typing import AsyncGenerator, Generator
# Importar configuración global con credenciales de base de datos
from app.core.config import settings


class Base(DeclarativeBase):
    """
    Clase base declarativa para todos los modelos SQLAlchemy
    Hereda de DeclarativeBase que provee metadatos y funcionalidad ORM
    Todas las clases modelo (User, Order, Delivery, etc.) heredarán de esta
    """
    pass


# Crear engine asíncrono para conexión a PostgreSQL usando asyncpg
# Este engine maneja todas las operaciones asíncronas de la API
engine = create_async_engine(
    settings.DATABASE_URL,                       # URL de conexión desde configuración
    echo=settings.DEBUG,                         # Imprimir SQL en consola si DEBUG=True
    pool_pre_ping=True,                          # Verificar conexiones antes de usar (evita conexiones muertas)
    pool_size=10,                                # Número de conexiones permanentes en el pool
    max_overflow=20,                             # Conexiones extra temporales bajo carga alta
)

# Crear fábrica de sesiones asíncronas
# AsyncSessionLocal se usa para crear nuevas sesiones de base de datos por request
AsyncSessionLocal = async_sessionmaker(
    engine,                                      # Engine asíncrono vinculado
    class_=AsyncSession,                         # Tipo de sesión a crear (asíncrona)
    expire_on_commit=False,                      # No expirar objetos después de commit (mejora rendimiento)
    autocommit=False,                            # No hacer commit automático (control manual)
    autoflush=False,                             # No hacer flush automático antes de queries
)

# --- CONFIGURACIÓN SÍNCRONA PARA WORKERS Y SCRIPTS ---
# Algunos componentes (Celery workers, scripts de seed) no soportan async

# Crear engine síncrono para operaciones que requieren compatibilidad
sync_engine = create_engine(
    settings.database_url_sync_computed,         # URL síncrona desde configuración
    echo=settings.DEBUG,                         # Imprimir SQL en consola si DEBUG=True
    pool_pre_ping=True,                          # Verificar conexiones antes de usar
    pool_size=10,                                # Número de conexiones permanentes en el pool
    max_overflow=20,                             # Conexiones extra temporales bajo carga alta
)

# Crear fábrica de sesiones síncronas vinculada al engine síncrono
SessionLocal = sessionmaker(
    bind=sync_engine,                            # Engine síncrono vinculado
    class_=Session,                              # Tipo de sesión a crear (síncrona)
    expire_on_commit=False,                      # No expirar objetos después de commit
    autocommit=False,                            # No hacer commit automático
    autoflush=False,                             # No hacer flush automático
)


async def get_db() -> AsyncGenerator[AsyncSession, None]:
    """
    Dependencia de FastAPI para obtener sesión de base de datos asíncrona
    Se usa en endpoints como: db: AsyncSession = Depends(get_db)
    Maneja automáticamente apertura, commit/rollback y cierre de sesión
    
    Uso típico en un endpoint:
        @app.get("/users")
        async def get_users(db: AsyncSession = Depends(get_db)):
            users = await db.execute(select(User))
            return users.scalars().all()
    """
    # Abrir nueva sesión asíncrona usando el factory
    async with AsyncSessionLocal() as session:
        try:
            # Yield la sesión para que el endpoint la use
            yield session
            # Si el endpoint completó sin errores, hacer commit de cambios
            await session.commit()
        except Exception:
            # Si hubo error en el endpoint, hacer rollback de cambios
            await session.rollback()
            # Re-lanzar la excepción para que el handler la procese
            raise
        finally:
            # Siempre cerrar la sesión para liberar recursos
            await session.close()


def get_db_session() -> Generator[Session, None, None]:
    """
    Función para obtener sesión de base de datos síncrona
    Usada en workers de Celery y scripts que no corren en contexto async
    
    Uso típico en worker:
        for session in get_db_session():
            # operar con session
            session.add(objeto)
            session.commit()
    
    Returns:
        Generator[Session]: Sesión síncrona que debe ser cerrada automáticamente
    """
    # Crear nueva sesión síncrona
    session = SessionLocal()
    try:
        # Yield la sesión para uso del caller
        yield session
    finally:
        # Asegurar que la sesión se cierre incluso si hay error
        session.close()
