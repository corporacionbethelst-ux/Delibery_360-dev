"""
Script de Seed para inicializar datos básicos del sistema
Delivery360/LogiRider

Este script crea:
- Superusuario admin
- Roles básicos
- Datos de configuración inicial
- Usuarios de prueba (opcional)
"""

import asyncio
import sys
from pathlib import Path

# Agregar el directorio raíz del backend al path
sys.path.insert(0, str(Path(__file__).parent.parent))

from app.core.database import get_db_session, engine, Base
from app.core.security import get_password_hash
from app.models.user import User
from app.models.rider import Rider
from app.models.order import Order, OrderStatus
from sqlalchemy import text


async def seed_database():
    """Inicializar la base de datos con datos básicos"""
    
    print("🌱 Iniciando seed de la base de datos...")
    
    # Crear tablas si no existen
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    
    print("✅ Tablas creadas verificadas")
    
    # Obtener sesión de base de datos
    async for session in get_db_session():
        try:
            # 1. Crear superusuario si no existe
            print("\n👤 Verificando superusuario...")
            
            existing_admin = await session.execute(
                User.query.filter_by(email="admin@delivery360.com")
            )
            admin_user = existing_admin.scalar_one_or_none()
            
            if not admin_user:
                admin_user = User(
                    email="admin@delivery360.com",
                    password=get_password_hash("Admin1234!"),
                    full_name="Administrador Principal",
                    role="superadmin",
                    is_active=True,
                    phone="+5511999999999",
                )
                session.add(admin_user)
                await session.commit()
                print("✅ Superusuario creado: admin@delivery360.com / Admin1234!")
            else:
                print("ℹ️  Superusuario ya existe")
            
            # 2. Crear usuarios de prueba (opcional)
            print("\n👥 Creando usuarios de prueba...")
            
            test_users = [
                {
                    "email": "gerente@delivery360.com",
                    "password": "Gerente123!",
                    "full_name": "Juan Gerente",
                    "role": "gerente",
                    "phone": "+5511988888888",
                },
                {
                    "email": "operador@delivery360.com",
                    "password": "Operador123!",
                    "full_name": "María Operadora",
                    "role": "operador",
                    "phone": "+5511977777777",
                },
                {
                    "email": "repartidor@delivery360.com",
                    "password": "Rider123!",
                    "full_name": "Carlos Repartidor",
                    "role": "repartidor",
                    "phone": "+5511966666666",
                },
            ]
            
            for user_data in test_users:
                existing_user = await session.execute(
                    User.query.filter_by(email=user_data["email"])
                )
                user = existing_user.scalar_one_or_none()
                
                if not user:
                    user = User(
                        email=user_data["email"],
                        password=get_password_hash(user_data["password"]),
                        full_name=user_data["full_name"],
                        role=user_data["role"],
                        is_active=True,
                        phone=user_data["phone"],
                    )
                    session.add(user)
                    print(f"  ✅ Usuario creado: {user_data['email']} / {user_data['password']}")
                else:
                    print(f"  ℹ️  Usuario ya existe: {user_data['email']}")
            
            await session.commit()
            
            # 3. Crear repartidor de prueba asociado al usuario
            print("\n🚴 Verificando repartidores de prueba...")
            
            rider_user = await session.execute(
                User.query.filter_by(email="repartidor@delivery360.com")
            )
            rider_user_obj = rider_user.scalar_one_or_none()
            
            if rider_user_obj:
                existing_rider = await session.execute(
                    Rider.query.filter_by(user_id=rider_user_obj.id)
                )
                rider = existing_rider.scalar_one_or_none()
                
                if not rider:
                    rider = Rider(
                        user_id=rider_user_obj.id,
                        vehicle_type="bicicleta",
                        vehicle_plate="N/A",
                        is_available=True,
                        rating=5.0,
                        total_deliveries=0,
                    )
                    session.add(rider)
                    print("  ✅ Repartidor de prueba creado")
                else:
                    print("  ℹ️  Repartidor ya existe")
                
                await session.commit()
            
            # 4. Crear órdenes de prueba (opcional)
            print("\n📦 Verificando órdenes de prueba...")
            
            existing_orders = await session.execute(Order.query.limit(1))
            order = existing_orders.scalar_one_or_none()
            
            if not order:
                # Crear algunas órdenes de prueba
                test_orders = [
                    {
                        "customer_name": "Cliente Test 1",
                        "customer_address": "Av. Paulista 1000, São Paulo",
                        "customer_phone": "+5511911111111",
                        "total_amount": 45.90,
                        "status": OrderStatus.pendiente,
                        "pickup_address": "Restaurante Test, Rua Augusta 500",
                        "pickup_phone": "+5511922222222",
                        "items": [{"name": "Pizza Grande", "quantity": 1, "price": 45.90}],
                    },
                    {
                        "customer_name": "Cliente Test 2",
                        "customer_address": "Rua Oscar Freire 800, São Paulo",
                        "customer_phone": "+5511933333333",
                        "total_amount": 32.50,
                        "status": OrderStatus.en_preparacion,
                        "pickup_address": "Hamburguesería Test, Av. Faria Lima 1200",
                        "pickup_phone": "+5511944444444",
                        "items": [{"name": "Hamburguesa Doble", "quantity": 2, "price": 16.25}],
                    },
                ]
                
                for order_data in test_orders:
                    order = Order(**order_data)
                    session.add(order)
                
                await session.commit()
                print(f"  ✅ {len(test_orders)} órdenes de prueba creadas")
            else:
                print("  ℹ️  Ya existen órdenes en la base de datos")
            
            print("\n" + "="*50)
            print("🎉 ¡Seed completado exitosamente!")
            print("="*50)
            print("\n📋 Credenciales de acceso:")
            print("   - Admin: admin@delivery360.com / Admin1234!")
            print("   - Gerente: gerente@delivery360.com / Gerente123!")
            print("   - Operador: operador@delivery360.com / Operador123!")
            print("   - Repartidor: repartidor@delivery360.com / Rider123!")
            print("\n🚀 Puedes iniciar el sistema ahora.")
            print("="*50 + "\n")
            
        except Exception as e:
            await session.rollback()
            print(f"\n❌ Error durante el seed: {str(e)}")
            raise
        finally:
            await session.close()


if __name__ == "__main__":
    print("\n" + "="*50)
    print("DELIVERY360 - Script de Inicialización")
    print("="*50 + "\n")
    
    try:
        asyncio.run(seed_database())
    except KeyboardInterrupt:
        print("\n\n⚠️  Proceso interrumpido por el usuario")
        sys.exit(1)
    except Exception as e:
        print(f"\n❌ Error fatal: {str(e)}")
        sys.exit(1)
