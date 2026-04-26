import asyncio
import sys
from datetime import datetime, timedelta, timezone
from typing import List
import random
import uuid

# Añadir el path del proyecto
sys.path.insert(0, "/app")

from sqlalchemy.ext.asyncio import AsyncSession, create_async_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy import text, select
from app.core.config import settings
from app.core.security import get_password_hash
from app.models.user import User
from app.models.rider import Rider, RiderStatus, VehicleType
from app.models.order import Order, OrderStatus
from app.models.delivery import Delivery, DeliveryStatus

# Configuración de la base de datos
# Aseguramos que usamos el driver asyncpg
DATABASE_URL = settings.DATABASE_URL.replace("postgresql://", "postgresql+asyncpg://")

engine = create_async_engine(DATABASE_URL, echo=False)
AsyncSessionLocal = sessionmaker(bind=engine, class_=AsyncSession, expire_on_commit=False)

# Datos de ejemplo críticos - Roles en minúsculas para coincidir con el ENUM
critical_roles_data = [
    {"email": "admin.superadmin@delivery360.com", "password": "Admin123!", "first_name": "Administrador", "last_name": "Superadmin", "role": "superadmin"},
    {"email": "gerente@delivery360.com", "password": "Admin123!", "first_name": "Gerente", "last_name": "General", "role": "gerente"},
    {"email": "operador@delivery360.com", "password": "Admin123!", "first_name": "Operador", "last_name": "Logística", "role": "operador"},
]

async def seed_users(db_session: AsyncSession, count: int = 15) -> List[User]:
    """Crea usuarios de prueba incluyendo roles críticos"""
    print(f"🌱 Sembrando {count} usuarios...")
    
    users = []
    
    # 1. Crear usuarios críticos (Admins)
    for role_data in critical_roles_data:
        result = await db_session.execute(select(User).where(User.email == role_data["email"]))
        existing_user = result.scalar_one_or_none()
        
        if not existing_user:
            hashed_pwd = get_password_hash(role_data["password"])
            new_user = User(
                id=uuid.uuid4(),
                email=role_data["email"],
                hashed_password=hashed_pwd,
                first_name=role_data["first_name"],
                last_name=role_data["last_name"],
                role=role_data["role"],
                is_active=True,
                phone=f"+55{random.randint(10000000000, 99999999999)}",
                is_superuser=(role_data["role"] == "superadmin")
            )
            users.append(new_user)
            db_session.add(new_user)
            print(f"   ✓ Usuario crítico creado: {role_data['email']} ({role_data['role']})")
        else:
            users.append(existing_user)
            print(f"   ⚠ Usuario crítico ya existe: {role_data['email']}")
    
    # 2. Crear usuarios adicionales aleatorios
    first_names = ["Luis", "Ana", "Sofía", "María", "Laura", "Carlos", "Pedro", "Jorge"]
    last_names = ["Pérez", "García", "López", "González", "Rodríguez", "Fernández", "Díaz", "Romero"]
    additional_roles = ["gerente", "operador", "repartidor"]
    
    attempts = 0
    while len(users) < count and attempts < 50:
        attempts += 1
        first_name = random.choice(first_names)
        last_name = random.choice(last_names)
        email = f"{first_name.lower()}.{last_name.lower()}{random.randint(1, 999)}@delivery360.com"
        
        # Verificar duplicados
        result = await db_session.execute(select(User).where(User.email == email))
        if result.scalar_one_or_none():
            continue
            
        hashed_pwd = get_password_hash("Password123!")
        new_user = User(
            id=uuid.uuid4(),
            email=email,
            hashed_password=hashed_pwd,
            first_name=first_name,
            last_name=last_name,
            role=random.choice(additional_roles),
            is_active=True,
            phone=f"+55{random.randint(10000000000, 99999999999)}"
        )
        users.append(new_user)
        db_session.add(new_user)
    
    await db_session.commit()
    print(f"   ✅ {len(users)} usuarios creados exitosamente")
    return users

async def seed_riders(db_session: AsyncSession, count: int = 10):
    """Crea repartidores de prueba vinculados a usuarios"""
    print(f"🌱 Sembrando {count} repartidores...")
    
    # Obtener usuarios con rol repartidor
    result = await db_session.execute(select(User).where(User.role == "repartidor"))
    rider_users = result.scalars().all()
    
    # Si no hay suficientes usuarios repartidores, crearlos
    while len(rider_users) < count:
        idx = len(rider_users) + 1
        email = f"repartidor{idx}@delivery360.com"
        
        # Verificar si existe
        check_res = await db_session.execute(select(User).where(User.email == email))
        if not check_res.scalar_one_or_none():
            new_user = User(
                id=uuid.uuid4(),
                email=email,
                hashed_password=get_password_hash("Admin123!"),
                first_name=f"Repartidor",
                last_name=f"Número {idx}",
                role="repartidor",
                is_active=True,
                phone=f"+55{random.randint(10000000000, 99999999999)}"
            )
            db_session.add(new_user)
            rider_users.append(new_user)
    
    await db_session.commit()
    
    riders = []
    vehicle_types = ["moto", "bicicleta", "auto", "pie"]
    statuses = ["pendiente", "activo", "inactivo", "suspendido"]
    
    for i, user in enumerate(rider_users[:count]):
        # Verificar si ya existe rider para este usuario
        result = await db_session.execute(select(Rider).where(Rider.user_id == user.id))
        existing_rider = result.scalar_one_or_none()
        
        if not existing_rider:
            rider = Rider(
                id=uuid.uuid4(),
                user_id=user.id,
                cpf=f"{random.randint(100, 999)}.{random.randint(100, 999)}.{random.randint(100, 999)}-{random.randint(10, 99)}",
                cnh=f"{random.randint(10000000000, 99999999999)}",
                birth_date=datetime.now() - timedelta(days=random.randint(6000, 12000)),
                vehicle_type=random.choice(vehicle_types),
                vehicle_plate=f"ABC-{random.randint(1000, 9999)}",
                vehicle_model=f"Modelo {random.randint(1, 10)}",
                vehicle_year=random.randint(2015, 2024),
                status=random.choice(statuses),
                is_online=random.choice([True, False]),
                level=random.randint(1, 5),
                total_points=random.randint(0, 1000),
                operating_zone=f"Zona {random.randint(1, 5)}"
            )
            riders.append(rider)
            db_session.add(rider)
            print(f"   ✓ Repartidor creado: {user.email}")
        else:
            riders.append(existing_rider)
            print(f"   ⚠ Repartidor ya existe: {user.email}")
    
    await db_session.commit()
    print(f"   ✅ {len(riders)} repartidores creados")
    return riders

async def seed_orders(db_session: AsyncSession, riders, count: int = 25):
    """Crea órdenes de prueba con estados correctos"""
    print(f"🌱 Sembrando {count} órdenes...")
    
    orders = []
    statuses = ["pendiente", "asignado", "en_recoleccion", "recolectado", "en_ruta", "entregado", "fallido", "cancelado"]
    
    for i in range(count):
        status = random.choice(statuses)
        assigned_rider = None
        
        # Asignar repartidor solo si el estado lo requiere
        if riders and status in ["asignado", "en_recoleccion", "recolectado", "en_ruta", "entregado"]:
            assigned_rider = random.choice(riders)
        
        subtotal = round(random.uniform(20, 200), 2)
        delivery_fee = round(random.uniform(5, 15), 2)
        
        order = Order(
            id=uuid.uuid4(),
            external_id=f"ORD-{2024000 + i}",
            customer_name=f"Cliente {i+1}",
            customer_phone=f"+55{random.randint(10000000000, 99999999999)}",
            customer_email=f"cliente{i+1}@example.com",
            pickup_address=f"Calle Recogida {i+1}, Ciudad",
            pickup_name=f"Restaurante {i+1}",
            delivery_address=f"Calle Entrega {i+1}, Ciudad",
            delivery_reference=f"Punto de referencia {i}",
            items=[{"name": f"Producto {j+1}", "quantity": random.randint(1, 5), "price": random.uniform(5, 50)} for j in range(random.randint(1, 3))],
            subtotal=subtotal,
            delivery_fee=delivery_fee,
            total=round(subtotal + delivery_fee, 2),
            payment_method=random.choice(["efectivo", "tarjeta", "pix"]),
            payment_status="pagado" if random.random() > 0.2 else "pendiente",
            status=status,
            priority=random.choice(["normal", "alta", "urgente"]),
            assigned_rider_id=assigned_rider.id if assigned_rider else None,
            ordered_at=datetime.now() - timedelta(hours=random.randint(1, 72)),
            source="app"
        )
        
        # Añadir timestamps según el estado
        if status in ["en_recoleccion", "recolectado", "en_ruta", "entregado"]:
            order.accepted_at = order.ordered_at + timedelta(minutes=random.randint(5, 15))
        if status in ["recolectado", "en_ruta", "entregado"]:
            order.picked_up_at = order.accepted_at + timedelta(minutes=random.randint(10, 30))
        if status in ["en_ruta", "entregado"]:
            order.estimated_delivery_time = order.picked_up_at + timedelta(minutes=random.randint(20, 60))
        if status == "entregado":
            order.delivered_at = order.estimated_delivery_time - timedelta(minutes=random.randint(0, 10))
        
        orders.append(order)
        db_session.add(order)
    
    await db_session.commit()
    print(f"   ✅ {len(orders)} órdenes creadas")
    return orders

async def seed_deliveries(db_session: AsyncSession, orders, riders):
    """Crea entregas para órdenes asignadas"""
    print(f"🌱 Sembrando entregas...")
    
    deliveries = []
    # Filtrar órdenes que tienen repartidor asignado
    assigned_orders = [o for o in orders if o.assigned_rider_id]
    
    for order in assigned_orders:
        # Determinar estado de entrega basado en estado de orden
        if order.status in ["pendiente", "asignado"]:
            delivery_status = "pendiente"
        elif order.status in ["en_recoleccion", "recolectado"]:
            delivery_status = "iniciada"
        elif order.status == "en_ruta":
            delivery_status = "en_route"
        elif order.status == "entregado":
            delivery_status = "completada"
        else:
            continue # Skip cancelled/failed for delivery creation
        
        # Verificar si ya existe entrega
        result = await db_session.execute(select(Delivery).where(Delivery.order_id == order.id))
        if result.scalar_one_or_none():
            continue
        
        rider = next((r for r in riders if r.id == order.assigned_rider_id), None)
        if not rider:
            continue
        
        delivery = Delivery(
            id=uuid.uuid4(),
            order_id=order.id,
            rider_id=rider.id,
            otp_code=f"{random.randint(1000, 9999)}",
            otp_verified=(delivery_status == "completada"),
            current_latitude=-23.5505 + random.uniform(-0.1, 0.1),
            current_longitude=-46.6333 + random.uniform(-0.1, 0.1),
            started_at=order.accepted_at if order.accepted_at else None,
            arrived_pickup_at=order.picked_up_at - timedelta(minutes=10) if order.picked_up_at else None,
            left_pickup_at=order.picked_up_at,
            completed_at=order.delivered_at if order.delivered_at else None,
            status=delivery_status,
            distance_total=random.uniform(2.0, 15.0),
            sla_compliant=random.choice([True, False]) if delivery_status == "completada" else None
        )
        deliveries.append(delivery)
        db_session.add(delivery)
    
    await db_session.commit()
    print(f"   ✅ {len(deliveries)} entregas creadas")
    return deliveries

async def main():
    """Función principal que ejecuta todo el proceso de seed"""
    print("🚀 Iniciando proceso de Seed Data para Delivery360...")
    
    async with AsyncSessionLocal() as db_session:
        try:
            # Ejecutar seeds en orden lógico
            users = await seed_users(db_session, count=15)
            riders = await seed_riders(db_session, count=10)
            orders = await seed_orders(db_session, riders, count=25)
            deliveries = await seed_deliveries(db_session, orders, riders)
            
            print("\n✅ ¡Seed Data completado exitosamente!")
            print("\n📊 Resumen:")
            print(f"   - Usuarios: {len(users)}")
            print(f"   - Repartidores: {len(riders)}")
            print(f"   - Órdenes: {len(orders)}")
            print(f"   - Entregas: {len(deliveries)}")
            
            print("\n🔐 Credenciales de acceso:")
            print("   - Superadmin: admin.superadmin@delivery360.com / Admin123!")
            print("   - Gerente: gerente@delivery360.com / Admin123!")
            print("   - Operador: operador@delivery360.com / Admin123!")
            print("   - Repartidor: repartidor1@delivery360.com / Admin123!")
            
        except Exception as e:
            await db_session.rollback()
            print(f"\n❌ Error durante el seed: {e}")
            import traceback
            traceback.print_exc()
            raise
        finally:
            await db_session.close()

if __name__ == "__main__":
    asyncio.run(main())