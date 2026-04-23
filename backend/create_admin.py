import asyncio
import uuid
from datetime import datetime, timezone

from app.core.database import AsyncSessionLocal
from app.models.user import User, UserRole
from passlib.context import CryptContext
from sqlalchemy import select

async def create_admin():
    pwd_context = CryptContext(schemes=['bcrypt'], deprecated='auto')
    
    async with AsyncSessionLocal() as db:
        email = 'admin@delivery360.com'
        
        # Verificar si existe
        stmt = select(User).where(User.email == email)
        result = await db.execute(stmt)
        existing_user = result.scalar_one_or_none()
        
        if not existing_user:
            user = User(
                id=uuid.uuid4(),
                email=email,
                hashed_password=pwd_context.hash('Admin123!'),
                full_name='Administrador Principal',
                # Usamos el valor .value.lower() para garantizar que sea 'superadmin' en minúsculas
                role=UserRole.SUPERADMIN.value.lower(), 
                is_active=True,
                phone='+5511999999999',
                lgpd_consent=True,
                lgpd_consent_date=datetime.now(timezone.utc),
                is_deleted=False
            )
            db.add(user)
            await db.commit()
            print('✅ Usuario creado exitosamente.')
            print(f'Email: {email}')
            print('Contraseña: Admin123!')
        else:
            print('ℹ️ El usuario ya existe.')

if __name__ == '__main__':
    asyncio.run(create_admin())