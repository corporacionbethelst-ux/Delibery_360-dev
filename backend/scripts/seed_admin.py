from app.core.database import AsyncSessionLocal, get_db
from app.models.user import User
from passlib.context import CryptContext
import uuid
import asyncio
from datetime import datetime

async def create_admin():
    pwd_context = CryptContext(schemes=['bcrypt'], deprecated='auto')
    
    # Usamos una sesión asíncrona directa
    async with AsyncSessionLocal() as db:
        email = 'admin@delivery360.com'
        
        # Verificar si existe
        result = await db.execute(select(User).where(User.email == email))
        existing_user = result.scalar_one_or_none()
        
        if not existing_user:
            user = User(
                id=uuid.uuid4(),
                email=email,
                hashed_password=pwd_context.hash('Admin123!'),
                full_name='Administrador Principal',
                role='superadmin',
                is_active=True,
                phone='+5511999999999',
                lgpd_consent=True,
                lgpd_consent_date=datetime.now(),
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
    from sqlalchemy import select
    asyncio.run(create_admin())