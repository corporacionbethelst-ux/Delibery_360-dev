from sqlalchemy.ext.asyncio import create_async_engine, async_sessionmaker, AsyncSession
from sqlalchemy.orm import DeclarativeBase, sessionmaker, Session
from sqlalchemy import create_engine
from typing import AsyncGenerator, Generator
from app.core.config import settings
import os

class Base(DeclarativeBase):
    """
    Clase base declarativa para todos los modelos SQLAlchemy
    """
    pass

# Helper para asegurar que la URL tenga el prefijo correcto para asyncpg
def get_async_url():
    url = settings.DATABASE_URL
    if not url.startswith("postgresql+asyncpg://"):
        url = url.replace("postgresql://", "postgresql+asyncpg://")
    return url

def get_sync_url():
    url = settings.DATABASE_URL
    # Asegurar que sea síncrona para workers
    if url.startswith("postgresql+asyncpg://"):
        url = url.replace("postgresql+asyncpg://", "postgresql://")
    return url

# Crear engine asíncrono
# NOTA: No pasamos 'driver' como argumento separado, debe ir en la URL
async_engine = create_async_engine(
    get_async_url(),
    echo=settings.DEBUG,
    pool_pre_ping=True,
    pool_size=10,
    max_overflow=20,
)

AsyncSessionLocal = async_sessionmaker(
    async_engine,
    class_=AsyncSession,
    expire_on_commit=False,
    autocommit=False,
    autoflush=False,
)

# Engine síncrono para workers
sync_engine = create_engine(
    get_sync_url(),
    echo=settings.DEBUG,
    pool_pre_ping=True,
    pool_size=10,
    max_overflow=20,
)

SessionLocal = sessionmaker(
    bind=sync_engine,
    class_=Session,
    expire_on_commit=False,
    autocommit=False,
    autoflush=False,
)

async def get_db() -> AsyncGenerator[AsyncSession, None]:
    async with AsyncSessionLocal() as session:
        try:
            yield session
            await session.commit()
        except Exception:
            await session.rollback()
            raise
        finally:
            await session.close()

def get_db_session() -> Generator[Session, None, None]:
    session = SessionLocal()
    try:
        yield session
    finally:
        session.close()