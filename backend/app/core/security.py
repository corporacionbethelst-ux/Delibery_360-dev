from datetime import datetime, timedelta, timezone
from typing import Any, Optional
from jose import JWTError, jwt
from passlib.context import CryptContext
from app.core.config import settings
import secrets

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")


def verify_password(plain: str, hashed: str) -> bool:
    return pwd_context.verify(plain, hashed)


def hash_password(password: str) -> str:
    return pwd_context.hash(password)


# Alias para compatibilidad con código existente
get_password_hash = hash_password


def create_access_token(subject: Any, expires_delta: Optional[timedelta] = None) -> str:
    expire = datetime.now(timezone.utc) + (
        expires_delta or timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    )
    return jwt.encode(
        {
            "sub": str(subject), 
            "exp": expire, 
            "type": "access",
            "iat": datetime.now(timezone.utc),
            "jti": secrets.token_hex(16)  # Unique token ID para prevenir replay attacks
        },
        settings.SECRET_KEY,
        algorithm=settings.JWT_ALGORITHM,
    )


def create_refresh_token(subject: Any) -> str:
    expire = datetime.now(timezone.utc) + timedelta(days=settings.REFRESH_TOKEN_EXPIRE_DAYS)
    return jwt.encode(
        {
            "sub": str(subject), 
            "exp": expire, 
            "type": "refresh",
            "iat": datetime.now(timezone.utc),
            "jti": secrets.token_hex(16)
        },
        settings.SECRET_KEY,
        algorithm=settings.JWT_ALGORITHM,
    )


def decode_token(token: str, verify_type: Optional[str] = None) -> Optional[dict]:
    """
    Decodificar y validar un token JWT
    
    Args:
        token: El token JWT a decodificar
        verify_type: Tipo de token esperado ('access' o 'refresh'). Si es None, acepta cualquier tipo.
    
    Returns:
        El payload del token si es válido, None en caso contrario
    """
    try:
        payload = jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.JWT_ALGORITHM])
        
        # Verificar tipo de token si se especifica
        if verify_type and payload.get("type") != verify_type:
            return None
        
        # Verificar que el token no haya sido usado antes (jti presente)
        if "jti" not in payload:
            return None
        
        return payload
    except JWTError:
        return None


def validate_token_strength(token: str) -> dict:
    """
    Validar la fortaleza y seguridad de un token
    
    Returns:
        dict con información de validación
    """
    result = {
        "valid": False,
        "errors": [],
        "warnings": []
    }
    
    payload = decode_token(token)
    if not payload:
        result["errors"].append("Token inválido o expirado")
        return result
    
    # Verificar campos requeridos
    required_fields = ["sub", "exp", "type", "iat", "jti"]
    for field in required_fields:
        if field not in payload:
            result["errors"].append(f"Campo requerido faltante: {field}")
    
    if result["errors"]:
        return result
    
    # Verificar tipo de token
    if payload["type"] not in ["access", "refresh"]:
        result["errors"].append(f"Tipo de token desconocido: {payload['type']}")
    
    # Verificar tiempo de expiración razonable
    exp_time = datetime.fromtimestamp(payload["exp"], tz=timezone.utc)
    iat_time = datetime.fromtimestamp(payload["iat"], tz=timezone.utc)
    now = datetime.now(timezone.utc)
    
    duration = exp_time - iat_time
    
    if payload["type"] == "access":
        if duration > timedelta(hours=2):
            result["warnings"].append("Token de acceso con duración excesiva (>2h)")
        elif duration < timedelta(minutes=5):
            result["warnings"].append("Token de acceso con duración muy corta (<5min)")
    elif payload["type"] == "refresh":
        if duration > timedelta(days=30):
            result["warnings"].append("Token de refresh con duración excesiva (>30 días)")
    
    # Verificar si está próximo a expirar
    time_until_exp = exp_time - now
    if time_until_exp < timedelta(minutes=5):
        result["warnings"].append("Token próximo a expirar (<5min)")
    
    result["valid"] = len(result["errors"]) == 0
    return result