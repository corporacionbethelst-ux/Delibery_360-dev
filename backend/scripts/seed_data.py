import asyncio
import sys
from datetime import datetime, timedelta, timezone
from decimal import Decimal
from typing import List
import random
import uuid

# Añadir el path del proyecto
sys.path.insert(0, "/app")

from sqlalchemy.ext.asyncio import AsyncSession, create_async_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy import text, select, func
from app.core.config import settings
from app.core.security import get_password_hash
from app.models.user import User
from app.models.rider import Rider, RiderStatus, VehicleType
from app.models.order import Order, OrderStatus
from app.models.delivery import Delivery, DeliveryStatus

# Configuración de la base de datos
DATABASE_URL = settings.DATABASE_URL.replace("postgresql://", "postgresql+asyncpg://")

engine = create_async_engine(DATABASE_URL, echo=False)
AsyncSessionLocal = sessionmaker(bind=engine, class_=AsyncSession, expire_on_commit=False)

# Datos de ejemplo críticos - USANDO VALORES EN MINÚSCULAS PARA COINCIDIR CON EL ENUM DE LA BD
critical_roles_data = [
    {"email": "admin.superadmin@delivery360.com", "password": "Admin123!", "full_name": "Administrador Superadmin", "role": "superadmin"},
    {"email": "gerente@delivery360.com", "password": "Admin123!", "full_name": "Administrador Gerente", "role": "gerente"},
    {"email": "operador@delivery360.com", "password": "Admin123!", "full_name": "Administrador Operador", "role": "operador"},
]

async def seed_users(db_session: AsyncSession, count: int = 15) -> List[User]:
    """Crea usuarios de prueba incluyendo roles críticos"""
    print(f"🌱 Sembrando {count} usuarios...")
    
    users = []
    
    # Primero crear usuarios críticos
    for role_data in critical_roles_data:
        # Verificar si ya existe
        result = await db_session.execute(
            select(User).where(User.email == role_data["email"])
        )
        existing_user = result.scalar_one_or_none()
        
        if not existing_user:
            hashed_pwd = get_password_hash(role_data["password"])
            new_user = User(
                id=uuid.uuid4(),
                email=role_data["email"],
                hashed_password=hashed_pwd,
                full_name=role_data["full_name"],
                role=role_data["role"],  # Valor en minúsculas
                is_active=True,
                phone=f"+55{random.randint(10000000000, 99999999999)}",
                lgpd_consent=True,
                lgpd_consent_date=datetime.now(timezone.utc)
            )
            users.append(new_user)
            db_session.add(new_user)
            print(f"   ✓ Usuario crítico creado: {role_data['email']} ({role_data['role']})")
        else:
            users.append(existing_user)
            print(f"   ⚠ Usuario crítico ya existe: {role_data['email']}")
    
    # Luego crear usuarios adicionales
    first_names = ["Luis", "Ana", "Sofía", "María", "Laura", "Carlos", "Pedro", "Jorge"]
    last_names = ["Pérez", "García", "López", "González", "Rodríguez", "Fernández", "Díaz", "Romero"]
    additional_roles = ["gerente", "operador", "repartidor"]
    
    for i in range(count - len(critical_roles_data)):
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
            full_name=f"{first_name} {last_name}",
            role=random.choice(additional_roles),  # Valor en minúsculas
            is_active=True,
            phone=f"+55{random.randint(10000000000, 99999999999)}",
            lgpd_consent=True,
            lgpd_consent_date=datetime.now(timezone.utc)
        )
        users.append(new_user)
        db_session.add(new_user)
    
    await db_session.commit()
    print(f"   ✅ {len(users)} usuarios creados exitosamente")
    return users

async def seed_customers(db_session: AsyncSession, count: int = 20):
    """Crea clientes de prueba"""
    print(f"🌱 Sembrando {count} clientes...")
    
    customers = []
    names = ["Empresa ABC", "Restaurante El Sabor", "Tienda XYZ", "Farmacia Salud", "Supermercado Central"]
    
    for i in range(count):
        name = f"{random.choice(names)} {i+1}"
        email = f"cliente{i+1}@example.com"
        
        # Verificar duplicados
        result = await db_session.execute(select(User).where(User.email == email))
        if result.scalar_one_or_none():
            continue
        
        customer = User(
            id=uuid.uuid4(),
            email=email,
            hashed_password=get_password_hash("Password123!"),
            full_name=name,
            role="gerente",
            is_active=True,
            phone=f"+55{random.randint(10000000000, 99999999999)}",
            lgpd_consent=True,
            lgpd_consent_date=datetime.now(timezone.utc)
        )
        customers.append(customer)
        db_session.add(customer)
    
    await db_session.commit()
    print(f"   ✅ {len(customers)} clientes creados")
    return customers

async def seed_addresses(db_session: AsyncSession, customers, count: int = 30):
    """Crea direcciones de prueba - SIMPLIFICADO SIN TABLA ADDRESS"""
    print(f"🌱 Sembrando direcciones (simplificado)...")
    
    # Esta función ya no es necesaria si no existe la tabla Address
    # Se puede eliminar o dejar como no-op
    print(f"   ⚠️ Tabla Address no disponible, omitiendo creación de direcciones")
    return []

async def seed_riders(db_session: AsyncSession, count: int = 10):
    """Crea repartidores de prueba"""
    print(f"🌱 Sembrando {count} repartidores...")
    
    # Obtener usuarios con rol repartidor o crear algunos
    result = await db_session.execute(select(User).where(User.role == "repartidor"))
    rider_users = result.scalars().all()
    
    # Si no hay suficientes, crear usuarios repartidores
    while len(rider_users) < count:
        email = f"repartidor{len(rider_users)+1}@delivery360.com"
        result = await db_session.execute(select(User).where(User.email == email))
        if not result.scalar_one_or_none():
            new_user = User(
                id=uuid.uuid4(),
                email=email,
                hashed_password=get_password_hash("Admin123!"),
                full_name=f"Repartidor {len(rider_users)+1}",
                role="repartidor",  # Valor en minúsculas
                is_active=True,
                phone=f"+55{random.randint(10000000000, 99999999999)}",
                lgpd_consent=True
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
                vehicle_type=random.choice(vehicle_types),  # Valor en minúsculas
                vehicle_plate=f"ABC-{random.randint(1000, 9999)}",
                vehicle_model=f"Modelo {random.randint(1, 10)}",
                vehicle_year=random.randint(2015, 2024),
                status=random.choice(statuses),  # Valor en minúsculas
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
        
        order = Order(
            id=uuid.uuid4(),
            external_id=f"ORD-{2024000 + i}",
            customer_name=f"Cliente {i+1}",
            customer_phone=f"+55{random.randint(10000000000, 99999999999)}",
            customer_email=f"cliente{i+1}@example.com",
            pickup_address=f"Calle Recogida {i+1}, Ciudad",
            delivery_address=f"Calle Entrega {i+1}, Ciudad",
            items=[{"name": f"Producto {j+1}", "quantity": random.randint(1, 5)} for j in range(random.randint(1, 3))],
            subtotal=random.uniform(20, 200),
            delivery_fee=random.uniform(5, 15),
            total=0,  # Se calculará abajo
            payment_method=random.choice(["efectivo", "tarjeta", "pix"]),
            payment_status="pagado" if random.random() > 0.2 else "pendiente",
            status=status,  # Valor en minúsculas
            priority=random.choice(["normal", "alta", "urgente"]),
            assigned_rider_id=random.choice(riders).id if riders and status in ["asignado", "en_recoleccion", "en_ruta"] else None,
            ordered_at=datetime.now() - timedelta(hours=random.randint(1, 72)),
            source="app"
        )
        order.total = order.subtotal + order.delivery_fee
        
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
    statuses = ["pendiente", "iniciada", "en_route", "completada"]
    
    # Filtrar órdenes que tienen repartidor asignado
    assigned_orders = [o for o in orders if o.assigned_rider_id]
    
    for order in assigned_orders:
        # Determinar estado basado en el estado de la orden
        if order.status in ["pendiente", "asignado"]:
            delivery_status = "pendiente"
        elif order.status in ["en_recoleccion", "recolectado"]:
            delivery_status = "iniciada"
        elif order.status == "en_ruta":
            delivery_status = "en_route"
        elif order.status == "entregado":
            delivery_status = "completada"
        else:
            continue
        
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
            otp_verified=delivery_status == "completada",
            delivery_lat=-23.5505 + random.uniform(-0.1, 0.1),
            delivery_lng=-46.6333 + random.uniform(-0.1, 0.1),
            pickup_at=order.picked_up_at if order.picked_up_at else None,
            delivered_at=order.delivered_at if order.delivered_at else None,
            status=delivery_status,  # Valor en minúsculas
            on_time=random.choice([True, False]) if delivery_status == "completada" else None,
            customer_rating=random.randint(1, 5) if delivery_status == "completada" and random.random() > 0.3 else None,
            notes=f"Notas de entrega para orden {order.external_id}" if random.random() > 0.7 else None
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
            # Limpiar datos existentes (opcional, comentar si no se desea borrar)
            # print("🗑️ Limpiando datos existentes...")
            # await db_session.execute(text("DELETE FROM deliveries"))
            # await db_session.execute(text("DELETE FROM orders"))
            # await db_session.execute(text("DELETE FROM riders"))
            # await db_session.execute(text("DELETE FROM addresses"))
            # await db_session.execute(text("DELETE FROM customers"))
            # await db_session.execute(text("DELETE FROM users"))
            # await db_session.commit()
            
            # Ejecutar seeds en orden
            users = await seed_users(db_session, count=15)
            customers = await seed_customers(db_session, count=20)
            addresses = await seed_addresses(db_session, customers, count=30)
            riders = await seed_riders(db_session, count=10)
            orders = await seed_orders(db_session, riders, count=25)
            deliveries = await seed_deliveries(db_session, orders, riders)
            
            print("\n✅ ¡Seed Data completado exitosamente!")
            print("\n📊 Resumen:")
            print(f"   - Usuarios: {len(users)}")
            print(f"   - Clientes: {len(customers)}")
            print(f"   - Direcciones: {len(addresses)}")
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
            raise
        finally:
            await db_session.close()

if __name__ == "__main__":
    asyncio.run(main())