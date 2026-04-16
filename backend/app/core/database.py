from sqlalchemy.ext.asyncio import create_async_engine, async_sessionmaker, AsyncSession
from sqlalchemy.orm import DeclarativeBase, sessionmaker, Session
from sqlalchemy import create_engine
from typing import AsyncGenerator, Generator
from app.core.config import settings


class Base(DeclarativeBase):
    """Clase base para todos los modelos ORM de SQLAlchemy"""
    pass


# Engine asíncrono para PostgreSQL con asyncpg
engine = create_async_engine(
    settings.DATABASE_URL,
    echo=settings.DEBUG,  # Mostrar SQL en consola si DEBUG=True
    pool_pre_ping=True,  # Verificar conexiones antes de usar
    pool_size=10,  # Conexiones permanentes en el pool
    max_overflow=20,  # Conexiones extra temporales
)

# Fábrica de sesiones asíncronas
AsyncSessionLocal = async_sessionmaker(
    engine,
    class_=AsyncSession,
    expire_on_commit=False,  # No expirar objetos después de commit
    autocommit=False,  # Control manual de commits
    autoflush=False,  # No flush automático antes de queries
)

# --- CONFIGURACIÓN SÍNCRONA PARA WORKERS Y SCRIPTS ---
sync_engine = create_engine(
    settings.database_url_sync_computed,
    echo=settings.DEBUG,
    pool_pre_ping=True,
    pool_size=10,
    max_overflow=20,
)

# Fábrica de sesiones síncronas
SessionLocal = sessionmaker(
    bind=sync_engine,
    class_=Session,
    expire_on_commit=False,
    autocommit=False,
    autoflush=False,
)


async def get_db() -> AsyncGenerator[AsyncSession, None]:
    """Dependencia para obtener sesión asíncrona de BD por request"""
    async with AsyncSessionLocal() as session:
        try:
            yield session
            await session.commit()  # Commit si no hay errores
        except Exception:
            await session.rollback()  # Rollback si hay error
            raise
        finally:
            await session.close()  # Siempre cerrar sesión


def get_db_session() -> Generator[Session, None, None]:
    """Obtener sesión síncrona para workers y scripts no-async"""
    session = SessionLocal()
    try:
        yield session
    finally:
        session.close()  # Asegurar cierre de sesión
