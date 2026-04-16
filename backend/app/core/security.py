# Importar clases para manejar fechas y zonas horarias en tokens JWT
from datetime import datetime, timedelta, timezone
# Importar tipos para definir valores genéricos y opcionales
from typing import Any, Optional
# Importar módulo para trabajar con UUIDs
import uuid
# Importar excepciones y dependencias de FastAPI
from fastapi import Depends, HTTPException, status
# Importar esquema de autenticación OAuth2 con bearer token
from fastapi.security import OAuth2PasswordBearer
# Importar clases para sesiones asíncronas de SQLAlchemy
from sqlalchemy.ext.asyncio import AsyncSession
# Importar función select para queries tipo ORM
from sqlalchemy import select
# Importar dependencia de sesión de base de datos
from app.core.database import get_db
# Importar modelo de usuario para validación en DB
from app.models.user import User
# Importar funciones para codificar/decodificar JWT y manejar errores
from jose import JWTError, jwt
# Importar contexto de cifrado para hashing de contraseñas
from passlib.context import CryptContext
# Importar configuración global (SECRET_KEY, tiempos de expiración, etc.)
from app.core.config import settings
# Importar módulo para generar IDs únicos seguros
import secrets

# Crear contexto de cifrado usando algoritmo bcrypt para hashear contraseñas
# "deprecated=auto" usa automáticamente el algoritmo más seguro disponible
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
# Crear esquema OAuth2 que extrae tokens del header Authorization: Bearer <token>
# tokenUrl define el endpoint donde los clientes obtienen el token inicial
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/v1/auth/login")


def verify_password(plain: str, hashed: str) -> bool:
    # Usar bcrypt para comparar texto plano con hash almacenado
    return pwd_context.verify(plain, hashed)


def hash_password(password: str) -> str:
    # Hashear contraseña con bcrypt (incluye salt automático)
    return pwd_context.hash(password)


# Alias para compatibilidad con código existente que usa el nombre antiguo
get_password_hash = hash_password


def create_access_token(subject: Any, expires_delta: Optional[timedelta] = None) -> str:
    # Calcular timestamp de expiración: ahora + tiempo configurado o personalizado
    expire = datetime.now(timezone.utc) + (
        expires_delta or timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    )
    # Codificar payload JWT con claims estándar y personalizados
    return jwt.encode(
        {
            "sub": str(subject),                              # Identificador del usuario
            "exp": expire,                                    # Fecha de expiración
            "type": "access",                                 # Tipo de token
            "iat": datetime.now(timezone.utc),                # Fecha de emisión
            "jti": secrets.token_hex(16)                      # ID único para seguridad
        },
        settings.SECRET_KEY,                                  # Clave secreta para firmar
        algorithm=settings.JWT_ALGORITHM,                     # Algoritmo de cifrado (HS256)
    )


def create_refresh_token(subject: Any) -> str:
    # Calcular expiración basada en días configurados (ej: 7 días)
    expire = datetime.now(timezone.utc) + timedelta(days=settings.REFRESH_TOKEN_EXPIRE_DAYS)
    # Codificar payload JWT similar al access token pero con tipo "refresh"
    return jwt.encode(
        {
            "sub": str(subject),                              # Identificador del usuario
            "exp": expire,                                    # Fecha de expiración (larga)
            "type": "refresh",                                # Tipo de token
            "iat": datetime.now(timezone.utc),                # Fecha de emisión
            "jti": secrets.token_hex(16)                      # ID único para seguridad
        },
        settings.SECRET_KEY,                                  # Clave secreta para firmar
        algorithm=settings.JWT_ALGORITHM,                     # Algoritmo de cifrado
    )


def decode_token(token: str, verify_type: Optional[str] = None) -> Optional[dict]:
    try:
        # Decodificar token verificando firma y expiración automáticamente
        payload = jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.JWT_ALGORITHM])
        
        # Verificar que el tipo de token coincida si se especificó uno esperado
        if verify_type and payload.get("type") != verify_type:
            return None
        
        # Verificar que el token tenga ID único (jti) para seguridad
        if "jti" not in payload:
            return None
        
        # Retornar payload completo con todos los claims
        return payload
    except JWTError:
        # Capturar cualquier error de decodificación (firma inválida, expirado, malformado)
        return None


def validate_token_strength(token: str) -> dict[str, Any]:
    # Inicializar resultado con estado inválido por defecto
    result: dict[str, Any] = {
        "valid": False,
        "errors": [],
        "warnings": []
    }
    
    # Intentar decodificar token sin verificar tipo específico
    payload = decode_token(token)
    # Si no se puede decodificar, agregar error y retornar inmediatamente
    if not payload:
        result["errors"].append("Token inválido o expirado")
        return result
    
    # Lista de campos obligatorios que todo token debe tener
    required_fields = ["sub", "exp", "type", "iat", "jti"]
    # Verificar cada campo requerido
    for field in required_fields:
        if field not in payload:
            result["errors"].append(f"Campo requerido faltante: {field}")
    
    # Si hay errores críticos, retornar sin hacer validaciones adicionales
    if result["errors"]:
        return result
    
    # Verificar que el tipo de token sea uno conocido
    if payload["type"] not in ["access", "refresh"]:
        result["errors"].append(f"Tipo de token desconocido: {payload['type']}")
    
    # Convertir timestamps Unix a objetos datetime para cálculos
    exp_time = datetime.fromtimestamp(payload["exp"], tz=timezone.utc)
    iat_time = datetime.fromtimestamp(payload["iat"], tz=timezone.utc)
    now = datetime.now(timezone.utc)
    
    # Calcular duración total del token (expiración - emisión)
    duration = exp_time - iat_time
    
    # Validaciones específicas según tipo de token
    if payload["type"] == "access":
        # Access tokens no deberían durar más de 2 horas (riesgo de seguridad)
        if duration > timedelta(hours=2):
            result["warnings"].append("Token de acceso con duración excesiva (>2h)")
        # Access tokens deberían durar al menos 5 minutos (usabilidad)
        elif duration < timedelta(minutes=5):
            result["warnings"].append("Token de acceso con duración muy corta (<5min)")
    elif payload["type"] == "refresh":
        # Refresh tokens no deberían durar más de 30 días
        if duration > timedelta(days=30):
            result["warnings"].append("Token de refresh con duración excesiva (>30 días)")
    
    # Calcular tiempo restante hasta expiración
    time_until_exp = exp_time - now
    # Advertir si el token expira en menos de 5 minutos
    if time_until_exp < timedelta(minutes=5):
        result["warnings"].append("Token próximo a expirar (<5min)")
    
    # Marcar como válido solo si no hay errores críticos
    result["valid"] = len(result["errors"]) == 0
    return result


async def get_current_active_user(
    token: str = Depends(oauth2_scheme),
    db: AsyncSession = Depends(get_db),
) -> User:
    """
    Dependencia de FastAPI para obtener el usuario activo actual desde el token JWT
    
    Args:
        token: Token JWT extraído automáticamente del header Authorization
        db: Sesión de base de datos inyectada como dependencia
    
    Returns:
        User: Objeto de usuario autenticado y activo
    
    Raises:
        HTTPException 401: Si el token es inválido, expirado o usuario no existe/inactivo
    
    Flujo de validación:
        1. Extraer token del header (OAuth2PasswordBearer lo hace automático)
        2. Decodificar y validar token JWT
        3. Extraer user_id del claim 'sub'
        4. Buscar usuario en base de datos
        5. Verificar que usuario exista y esté activo
    
    Uso típico en endpoints:
        @app.get("/profile")
        async def get_profile(current_user: User = Depends(get_current_active_user)):
            return {"email": current_user.email}
    """
    # Decodificar token verificando que sea tipo "access"
    payload = decode_token(token, verify_type="access")
    # Si token es inválido, lanzar excepción 401
    if not payload:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Credenciales inválidas",
            headers={"WWW-Authenticate": "Bearer"},
        )

    # Extraer identificador de usuario del claim 'sub'
    user_id_raw = payload.get("sub")
    # Intentar convertir a UUID (formato esperado)
    try:
        user_id = uuid.UUID(str(user_id_raw))
    except (TypeError, ValueError):
        # Si no es UUID válido, lanzar excepción 401
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token inválido: subject incorrecto",
            headers={"WWW-Authenticate": "Bearer"},
        )

    # Query asíncrona para buscar usuario por ID en base de datos
    result = await db.execute(select(User).where(User.id == user_id))
    # Obtener usuario o None si no existe
    current_user = result.scalar_one_or_none()
    # Verificar que usuario exista y esté activo (no baneado/eliminado)
    if not current_user or not current_user.is_active:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Usuario no autorizado",
            headers={"WWW-Authenticate": "Bearer"},
        )
    # Retornar usuario autenticado para usar en el endpoint
    return current_user
