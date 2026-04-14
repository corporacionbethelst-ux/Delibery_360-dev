from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from pydantic import BaseModel
from typing import Optional, Any
from datetime import datetime, timezone
import uuid

from app.core.database import get_db
from app.models.rider import Rider, RiderStatus, VehicleType
from app.models.user import User, UserRole
from app.api.v1.auth import get_current_user, require_role

router = APIRouter(prefix="/riders")


class RiderCreate(BaseModel):
    email: str
    password: str
    full_name: str
    phone: str
    vehicle_type: str
    vehicle_plate: Optional[str] = None
    vehicle_model: Optional[str] = None
    operating_zone: Optional[str] = None
    cpf: Optional[str] = None
    cnh: Optional[str] = None


class RiderUpdate(BaseModel):
    vehicle_type: Optional[str] = None
    vehicle_plate: Optional[str] = None
    vehicle_model: Optional[str] = None
    operating_zone: Optional[str] = None
    cpf: Optional[str] = None
    cnh: Optional[str] = None


class LocationUpdate(BaseModel):
    lat: float
    lng: float


class RejectRider(BaseModel):
    reason: str


class ApproveRider(BaseModel):
    observations: Optional[str] = None


def _rider_to_dict(r: Rider, include_user: bool = False) -> dict:
    d: dict[str, Any] = {
        "id": str(r.id),
        "user_id": str(r.user_id),
        "status": r.status.value,
        "vehicle_type": r.vehicle_type.value if r.vehicle_type else None,
        "vehicle_plate": r.vehicle_plate,
        "vehicle_model": r.vehicle_model,
        "operating_zone": r.operating_zone,
        "is_online": r.is_online,
        "last_lat": r.last_lat,
        "last_lng": r.last_lng,
        "last_location_at": r.last_location_at.isoformat() if r.last_location_at else None,
        "level": r.level,
        "total_points": r.total_points,
        "badges": r.badges or [],
        "created_at": r.created_at.isoformat() if r.created_at else None,
        "approved_at": r.approved_at.isoformat() if r.approved_at else None,
    }
    return d


@router.post("", status_code=201)
async def create_rider(
    body: RiderCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_role(UserRole.SUPERADMIN, UserRole.GERENTE)),
):
    # Verificar si ya existe un usuario con ese email
    from app.models.user import User as UserModel
    result = await db.execute(select(UserModel).where(UserModel.email == body.email))
    if result.scalar_one_or_none():
        raise HTTPException(status_code=400, detail="El email ya está registrado")
    
    # Crear usuario con rol REPARTIDOR
    from app.core.security import get_password_hash
    user = UserModel(
        email=body.email,
        hashed_password=get_password_hash(body.password),
        full_name=body.full_name,
        phone=body.phone,
        role=UserRole.REPARTIDOR
    )
    db.add(user)
    await db.flush()
    
    # Crear perfil de repartidor
    rider = Rider(
        user_id=user.id,
        vehicle_type=VehicleType(body.vehicle_type),
        vehicle_plate=body.vehicle_plate,
        vehicle_model=body.vehicle_model,
        operating_zone=body.operating_zone,
        cpf=body.cpf,
        cnh=body.cnh,
        status=RiderStatus.PENDIENTE
    )
    db.add(rider)
    await db.commit()
    await db.refresh(rider)
    
    return _rider_to_dict(rider, include_user=True)


@router.get("")
async def list_riders(
    status: Optional[str] = Query(None, description="Alias legacy"),
    status_filter: Optional[str] = Query(None, description="Filtro preferido"),
    is_online: Optional[bool] = Query(None),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_role(UserRole.SUPERADMIN, UserRole.GERENTE, UserRole.OPERADOR)),
):
    q = select(Rider)
    effective_status = status_filter or status
    if effective_status:
        try:
            q = q.where(Rider.status == RiderStatus(effective_status))
        except ValueError:
            pass
    if is_online is not None:
        q = q.where(Rider.is_online == is_online)
    result = await db.execute(q.order_by(Rider.created_at.desc()))
    return [_rider_to_dict(r) for r in result.scalars().all()]


@router.get("/me")
async def get_my_rider_profile(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    result = await db.execute(select(Rider).where(Rider.user_id == current_user.id))
    rider = result.scalar_one_or_none()
    if not rider:
        raise HTTPException(status_code=404, detail="Perfil de repartidor no encontrado")
    return _rider_to_dict(rider)


@router.get("/{rider_id}")
async def get_rider(
    rider_id: str,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    result = await db.execute(select(Rider).where(Rider.id == uuid.UUID(rider_id)))
    rider = result.scalar_one_or_none()
    if not rider:
        raise HTTPException(status_code=404, detail="Repartidor no encontrado")
    return _rider_to_dict(rider)


@router.patch("/{rider_id}")
async def update_rider(
    rider_id: str,
    body: RiderUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    result = await db.execute(select(Rider).where(Rider.id == uuid.UUID(rider_id)))
    rider = result.scalar_one_or_none()
    if not rider:
        raise HTTPException(status_code=404, detail="Repartidor no encontrado")

    for field, value in body.model_dump(exclude_none=True).items():
        setattr(rider, field, value)
    await db.commit()
    return _rider_to_dict(rider)


@router.patch("/{rider_id}/approve")
async def approve_rider(
    rider_id: str,
    body: Optional[ApproveRider] = None,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_role(UserRole.SUPERADMIN, UserRole.GERENTE)),
):
    result = await db.execute(select(Rider).where(Rider.id == uuid.UUID(rider_id)))
    rider = result.scalar_one_or_none()
    if not rider:
        raise HTTPException(status_code=404, detail="Repartidor no encontrado")

    rider.status = RiderStatus.ACTIVO
    rider.approved_at = datetime.now(timezone.utc)
    if body and body.observations:
        # Guardar observaciones si se proporcionan
        pass
    await db.commit()
    return {"message": "Repartidor aprobado exitosamente", "rider_id": rider_id}


@router.post("/{rider_id}/reject")
async def reject_rider(
    rider_id: str,
    body: RejectRider,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_role(UserRole.SUPERADMIN, UserRole.GERENTE)),
):
    result = await db.execute(select(Rider).where(Rider.id == uuid.UUID(rider_id)))
    rider = result.scalar_one_or_none()
    if not rider:
        raise HTTPException(status_code=404, detail="Repartidor no encontrado")

    rider.status = RiderStatus.SUSPENDIDO
    rider.documents = {
        **(rider.documents or {}),
        "rejection_reason": body.reason,
        "rejected_at": datetime.now(timezone.utc).isoformat(),
    }
    await db.commit()
    return {"message": "Repartidor rechazado", "rider_id": rider_id}


@router.delete("/{rider_id}")
async def delete_rider(
    rider_id: str,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_role(UserRole.SUPERADMIN, UserRole.GERENTE)),
):
    result = await db.execute(select(Rider).where(Rider.id == uuid.UUID(rider_id)))
    rider = result.scalar_one_or_none()
    if not rider:
        raise HTTPException(status_code=404, detail="Repartidor no encontrado")

    # Eliminar el rider (cascade eliminará el usuario asociado si está configurado)
    await db.delete(rider)
    await db.commit()
    return {"message": "Repartidor eliminado exitosamente", "rider_id": rider_id}


@router.get("/documents/pending")
async def get_pending_documents(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_role(UserRole.SUPERADMIN, UserRole.GERENTE)),
):
    """Obtener lista de repartidores con documentos pendientes de aprobación"""
    result = await db.execute(
        select(Rider).where(
            Rider.status == RiderStatus.PENDIENTE
        ).order_by(Rider.created_at.desc())
    )
    riders = result.scalars().all()
    return [_rider_to_dict(r) for r in riders]


@router.patch("/{rider_id}/location")
async def update_location(
    rider_id: str,
    body: LocationUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    result = await db.execute(select(Rider).where(Rider.id == uuid.UUID(rider_id)))
    rider = result.scalar_one_or_none()
    if not rider:
        raise HTTPException(status_code=404, detail="Repartidor no encontrado")

    rider.last_lat = body.lat
    rider.last_lng = body.lng
    rider.last_location_at = datetime.now(timezone.utc)
    await db.commit()
    return {"ok": True}


@router.patch("/{rider_id}/online")
async def toggle_online(
    rider_id: str,
    online: bool,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    result = await db.execute(select(Rider).where(Rider.id == uuid.UUID(rider_id)))
    rider = result.scalar_one_or_none()
    if not rider:
        raise HTTPException(status_code=404, detail="Repartidor no encontrado")
    rider.is_online = online
    await db.commit()
    return {"is_online": rider.is_online}
