from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm, OAuth2PasswordBearer
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from datetime import datetime, timezone
from pydantic import BaseModel, EmailStr
from typing import Optional

from app.core.database import get_db
from app.core.security import verify_password, hash_password, create_access_token, create_refresh_token, decode_token
from app.models.user import User, UserRole
from app.models.rider import Rider

router = APIRouter(prefix="/auth")
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/v1/auth/login")


# ── Schemas ───────────────────────────────────────────────────────────────────
class TokenResponse(BaseModel):
    access_token: str
    refresh_token: str
    token_type: str = "bearer"
    user_id: str
    role: str
    full_name: str
    email: Optional[str] = None


class RefreshRequest(BaseModel):
    refresh_token: str


class RiderRegisterRequest(BaseModel):
    email: EmailStr
    password: str
    full_name: str
    phone: Optional[str] = None
    vehicle_type: Optional[str] = "moto"
    lgpd_consent: bool = False


# ── Dependency: obtener usuario actual ────────────────────────────────────────
async def get_current_user(
    token: str = Depends(oauth2_scheme),
    db: AsyncSession = Depends(get_db),
) -> User:
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Credenciales inválidas",
        headers={"WWW-Authenticate": "Bearer"},
    )
    payload = decode_token(token)
    if not payload or payload.get("type") != "access":
        raise credentials_exception

    user_id = payload.get("sub")
    result = await db.execute(select(User).where(User.id == user_id, User.is_active == True))
    user = result.scalar_one_or_none()
    if not user:
        raise credentials_exception
    return user


def require_role(*roles: UserRole):
    async def checker(current_user: User = Depends(get_current_user)):
        if current_user.role not in roles:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Acceso denegado. Roles permitidos: {[r.value for r in roles]}",
            )
        return current_user
    return checker


# ── Endpoints ─────────────────────────────────────────────────────────────────
@router.post("/login", response_model=TokenResponse)
async def login(
    form_data: OAuth2PasswordRequestForm = Depends(),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(User).where(User.email == form_data.username, User.is_active == True, User.is_deleted == False)
    )
    user = result.scalar_one_or_none()
    if not user or not verify_password(form_data.password, user.hashed_password):
        raise HTTPException(status_code=400, detail="Email o contraseña incorrectos")

    user.last_login = datetime.now(timezone.utc)
    await db.commit()

    return TokenResponse(
        access_token=create_access_token(str(user.id)),
        refresh_token=create_refresh_token(str(user.id)),
        user_id=str(user.id),
        role=user.role.value,
        full_name=user.full_name,
        email=user.email,
    )


@router.post("/refresh", response_model=TokenResponse)
async def refresh_token(
    body: RefreshRequest,
    db: AsyncSession = Depends(get_db),
):
    payload = decode_token(body.refresh_token)
    if not payload or payload.get("type") != "refresh":
        raise HTTPException(status_code=401, detail="Token de refresco inválido")

    user_id = payload.get("sub")
    result = await db.execute(select(User).where(User.id == user_id, User.is_active == True))
    user = result.scalar_one_or_none()
    if not user:
        raise HTTPException(status_code=401, detail="Usuario no encontrado")

    return TokenResponse(
        access_token=create_access_token(str(user.id)),
        refresh_token=create_refresh_token(str(user.id)),
        user_id=str(user.id),
        role=user.role.value,
        full_name=user.full_name,
        email=user.email,
    )


@router.post("/register-rider", status_code=201)
async def register_rider(
    body: RiderRegisterRequest,
    db: AsyncSession = Depends(get_db),
):
    """Registro público para repartidores desde la app móvil."""
    if not body.lgpd_consent:
        raise HTTPException(status_code=400, detail="Debe aceptar los términos LGPD para registrarse")

    existing = await db.execute(select(User).where(User.email == body.email))
    if existing.scalar_one_or_none():
        raise HTTPException(status_code=400, detail="El email ya está registrado")

    user = User(
        email=body.email,
        hashed_password=hash_password(body.password),
        full_name=body.full_name,
        phone=body.phone,
        role=UserRole.REPARTIDOR,
        lgpd_consent=body.lgpd_consent,
        lgpd_consent_date=datetime.now(timezone.utc),
    )
    db.add(user)
    await db.flush()

    rider = Rider(user_id=user.id, vehicle_type=body.vehicle_type)
    db.add(rider)
    await db.commit()

    return {"message": "Registro exitoso. Esperando aprobación del gerente.", "user_id": str(user.id)}


@router.get("/me")
async def get_me(current_user: User = Depends(get_current_user)):
    return {
        "id": str(current_user.id),
        "email": current_user.email,
        "full_name": current_user.full_name,
        "role": current_user.role.value,
        "is_active": current_user.is_active,
    }