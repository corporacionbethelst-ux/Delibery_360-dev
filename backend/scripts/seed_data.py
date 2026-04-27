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
from app.models.user import User, UserRole
from app.models.rider import Rider, RiderStatus, VehicleType
from app.models.order import Order, OrderStatus
from app.models.delivery import Delivery, DeliveryStatus

# Configuración de la base de datos
DATABASE_URL = str(settings.DATABASE_URL).replace("postgresql://", "postgresql+asyncpg://")

engine = create_async_engine(DATABASE_URL, echo=False)
AsyncSessionLocal = sessionmaker(bind=engine, class_=AsyncSession, expire_on_commit=False)

# Datos de ejemplo críticos
critical_roles_data = [
    {
        "email": "admin.superadmin@delivery360.com", 
        "password": "Admin123!", 
        "first_name": "Administrador", 
        "last_name": "Superadmin", 
        "role": UserRole.SUPERADMIN
    },
    {
        "email": "gerente@delivery360.com", 
        "password": "Admin123!", 
        "first_name": "Administrador", 
        "last_name": "Gerente", 
        "role": UserRole.GERENTE
    },
    {
        "email": "operador@delivery360.com", 
        "password": "Admin123!", 
        "first_name": "Administrador", 
        "last_name": "Operador", 
        "role": UserRole.OPERADOR
    },
]

async def seed_users(db_session: AsyncSession, count: int = 15) -> List[User]:
    """Crea usuarios de prueba incluyendo roles críticos"""
    print(f"🌱 Sembrando {count} usuarios...")
    
    users = []
    
    # Primero crear usuarios críticos
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
                is_superuser=(role_data["role"] == UserRole.SUPERADMIN),
                phone=f"+55{random.randint(10000000000, 99999999999)}",
                failed_login_attempts="0",
                locked_until=None
            )
            users.append(new_user)
            db_session.add(new_user)
            print(f"   ✓ Usuario crítico creado: {role_data['email']} ({role_data['role'].value})")
        else:
            users.append(existing_user)
            print(f"   ⚠ Usuario crítico ya existe: {role_data['email']}")
    
    # Usuarios adicionales
    first_names = ["Luis", "Ana", "Sofía", "María", "Laura", "Carlos", "Pedro", "Jorge"]
    last_names = ["Pérez", "García", "López", "González", "Rodríguez", "Fernández", "Díaz", "Romero"]
    additional_roles = [UserRole.GERENTE, UserRole.OPERADOR, UserRole.REPARTIDOR]
    
    for i in range(count - len(critical_roles_data)):
        first_name = random.choice(first_names)
        last_name = random.choice(last_names)
        email = f"{first_name.lower()}.{last_name.lower()}{random.randint(1, 999)}@delivery360.com"
        
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
            is_superuser=False,
            phone=f"+55{random.randint(10000000000, 99999999999)}",
            failed_login_attempts="0",
            locked_until=None
        )
        users.append(new_user)
        db_session.add(new_user)
    
    await db_session.commit()
    print(f"   ✅ {len(users)} usuarios creados exitosamente")
    return users

async def seed_riders(db_session: AsyncSession, count: int = 10):
    """Crea repartidores de prueba"""
    print(f"🌱 Sembrando {count} repartidores...")
    
    # Obtener usuarios con rol repartidor
    result = await db_session.execute(select(User).where(User.role == UserRole.REPARTIDOR))
    rider_users = result.scalars().all()
    
    # Crear más si no hay suficientes
    while len(rider_users) < count:
        idx = len(rider_users) + 1
        email = f"repartidor{idx}@delivery360.com"
        result = await db_session.execute(select(User).where(User.email == email))
        if not result.scalar_one_or_none():
            new_user = User(
                id=uuid.uuid4(),
                email=email,
                hashed_password=get_password_hash("Admin123!"),
                first_name="Repartidor",
                last_name=str(idx),
                role=UserRole.REPARTIDOR,
                is_active=True,
                phone=f"+55{random.randint(10000000000, 99999999999)}",
                failed_login_attempts="0"
            )
            db_session.add(new_user)
            rider_users.append(new_user)
    
    await db_session.commit()
    
    riders = []
    vehicle_types = [VehicleType.MOTO, VehicleType.BICICLETA, VehicleType.AUTO, VehicleType.PATINETA]
    statuses = [RiderStatus.ACTIVO, RiderStatus.INACTIVO, RiderStatus.OCUPADO, RiderStatus.SUSPENDIDO]
    
    for i, user in enumerate(rider_users[:count]):
        # Verificar si ya existe un rider con este email
        result = await db_session.execute(select(Rider).where(Rider.email == user.email))
        existing_rider = result.scalar_one_or_none()
        
        if existing_rider:
            riders.append(existing_rider)
            print(f"   ⚠ Repartidor ya existe: {user.email}")
            continue

        rider = Rider(
            id=uuid.uuid4(),
            first_name=user.first_name,
            last_name=user.last_name,
            email=user.email,
            phone=user.phone,
            vehicle_type=random.choice(vehicle_types),
            vehicle_plate=f"ABC-{random.randint(1000, 9999)}",
            vehicle_model=f"Modelo {random.randint(1, 10)}",
            vehicle_color="Rojo",
            status=random.choice(statuses),
            is_available=random.choice([True, False]),
            total_deliveries="0",
            average_rating=5.0,
            total_earnings=0.0
        )
        riders.append(rider)
        db_session.add(rider)
        print(f"   ✓ Repartidor creado: {user.email}")
    
    await db_session.commit()
    print(f"   ✅ {len(riders)} repartidores creados")
    return riders

async def seed_orders(db_session: AsyncSession, riders, count: int = 25):
    """Crea órdenes de prueba"""
    print(f"🌱 Sembrando {count} órdenes...")
    
    orders = []
    statuses = ["pendiente", "asignado", "en_recoleccion", "recolectado", "en_ruta", "entregado", "fallido", "cancelado"]
    rider_ids = [r.id for r in riders] if riders else []

    # Fecha base consciente de zona horaria
    now = datetime.now(timezone.utc)

    for i in range(count):
        status = random.choice(statuses)
        assigned_rider = random.choice(rider_ids) if rider_ids and status in ["asignado", "en_recoleccion", "en_ruta", "entregado"] else None
        
        # Calculamos ordered_at hacia atrás desde ahora
        hours_ago = random.randint(1, 72)
        ordered_at = now - timedelta(hours=hours_ago)
        
        order = Order(
            id=uuid.uuid4(),
            external_id=f"ORD-{2024000 + i}",
            customer_name=f"Cliente {i+1}",
            customer_phone=f"+55{random.randint(10000000000, 99999999999)}",
            customer_email=f"cliente{i+1}@example.com",
            pickup_address=f"Calle Recogida {i+1}, Ciudad",
            pickup_name=f"Restaurante {i+1}",
            delivery_address=f"Calle Entrega {i+1}, Ciudad",
            delivery_reference="Casa blanca",
            items=[{"name": f"Producto {j+1}", "quantity": random.randint(1, 5)} for j in range(random.randint(1, 3))],
            subtotal=random.uniform(20, 200),
            delivery_fee=random.uniform(5, 15),
            total=0,  
            payment_method=random.choice(["efectivo", "tarjeta", "pix"]),
            payment_status="pagado" if random.random() > 0.2 else "pendiente",
            status=status,
            priority=random.choice(["normal", "alta", "urgente"]),
            assigned_rider_id=assigned_rider,
            ordered_at=ordered_at,
            source="app"
        )
        order.total = order.subtotal + order.delivery_fee
        
        # Inicializar variables de tiempo como None por defecto
        accepted_at = None
        picked_up_at = None
        estimated_delivery_time = None
        delivered_at = None
        
        # Asignar tiempos solo si el estado lo requiere, siempre sumando a ordered_at (que tiene tz)
        if status in ["en_recoleccion", "recolectado", "en_ruta", "entregado"]:
            accepted_at = ordered_at + timedelta(minutes=random.randint(5, 15))
        
        if status in ["recolectado", "en_ruta", "entregado"]:
            picked_up_at = accepted_at + timedelta(minutes=random.randint(10, 30)) if accepted_at else ordered_at + timedelta(minutes=20)
        
        if status in ["en_ruta", "entregado"]:
            estimated_delivery_time = picked_up_at + timedelta(minutes=random.randint(20, 60)) if picked_up_at else ordered_at + timedelta(minutes=40)
        
        if status == "entregado":
            delivered_at = estimated_delivery_time - timedelta(minutes=random.randint(0, 10)) if estimated_delivery_time else ordered_at + timedelta(minutes=50)
        
        # Asignar explícitamente los valores calculados (todos son aware o None)
        order.accepted_at = accepted_at
        order.picked_up_at = picked_up_at
        order.estimated_delivery_time = estimated_delivery_time
        order.delivered_at = delivered_at
        
        orders.append(order)
        db_session.add(order)
    
    await db_session.commit()
    print(f"   ✅ {len(orders)} órdenes creadas")
    return orders

async def seed_deliveries(db_session: AsyncSession, orders, riders):
    """Crea entregas para órdenes asignadas"""
    print(f"🌱 Sembrando entregas...")
    
    deliveries = []
    assigned_orders = [o for o in orders if o.assigned_rider_id]
    
    status_map = {
        "pendiente": "pendiente",
        "asignado": "pendiente",
        "en_recoleccion": "iniciada",
        "recolectado": "iniciada",
        "en_ruta": "en_route",
        "entregado": "completada",
        "fallido": "fallida",
        "cancelado": "fallida"
    }
    
    now = datetime.now(timezone.utc)

    for order in assigned_orders:
        delivery_status = status_map.get(order.status, "pendiente")
        
        result = await db_session.execute(select(Delivery).where(Delivery.order_id == order.id))
        if result.scalar_one_or_none():
            continue
        
        delivery = Delivery(
            id=uuid.uuid4(),
            order_id=order.id,
            rider_id=order.assigned_rider_id,
            status=delivery_status,
            started_at=order.accepted_at,
            arrived_pickup_at=order.picked_up_at,
            left_pickup_at=order.picked_up_at,
            arrived_delivery_at=order.delivered_at,
            completed_at=order.delivered_at,
            current_latitude=-23.5505 + random.uniform(-0.1, 0.1),
            current_longitude=-46.6333 + random.uniform(-0.1, 0.1),
            last_location_update=now, # Usar fecha consciente
            distance_total=random.uniform(2.0, 15.0),
            proof_notes="Entrega sin novedades" if delivery_status == "completada" else None
        )
        deliveries.append(delivery)
        db_session.add(delivery)
    
    await db_session.commit()
    print(f"   ✅ {len(deliveries)} entregas creadas")
    return deliveries

async def main():
    """Función principal"""
    print("🚀 Iniciando proceso de Seed Data para Delivery360...")
    
    async with AsyncSessionLocal() as db_session:
        try:
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