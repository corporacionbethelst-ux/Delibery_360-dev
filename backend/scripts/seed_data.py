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
from app.models.order import Order, OrderStatus, OrderPriority
from app.models.delivery import Delivery, DeliveryStatus

# Configuración de la base de datos
DATABASE_URL = str(settings.DATABASE_URL).replace("postgresql://", "postgresql+asyncpg://")

engine = create_async_engine(DATABASE_URL, echo=False)
AsyncSessionLocal = sessionmaker(bind=engine, class_=AsyncSession, expire_on_commit=False)

def utc_now_naive():
    """Devuelve la hora actual en UTC sin zona horaria (naive)."""
    return datetime.now(timezone.utc).replace(tzinfo=None)

# Datos de ejemplo críticos (Solo Administrativos)
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

async def seed_users(db_session: AsyncSession, count: int = 5) -> List[User]:
    """Crea usuarios administrativos de prueba. 
    NOTA: Los repartidores ya no se crean como Users + Rider, sino solo como Riders."""
    print(f"🌱 Sembrando {count} usuarios administrativos...")
    
    users = []
    
    # Crear usuarios críticos
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
    
    # Algunos usuarios operadores adicionales si se necesita
    first_names = ["Carlos", "Pedro", "Laura", "Sofía"]
    last_names = ["García", "López", "Díaz", "Romero"]
    
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
            role=random.choice([UserRole.GERENTE, UserRole.OPERADOR]),
            is_active=True,
            is_superuser=False,
            phone=f"+55{random.randint(10000000000, 99999999999)}",
            failed_login_attempts="0",
            locked_until=None
        )
        users.append(new_user)
        db_session.add(new_user)
    
    await db_session.commit()
    print(f"   ✅ {len(users)} usuarios administrativos listos.")
    return users

async def seed_riders(db_session: AsyncSession, count: int = 10):
    """Crea repartidores de prueba vinculados a usuarios existentes"""
    print(f"🌱 Sembrando {count} repartidores...")
    
    # 1. Obtener usuarios con rol REPARTIDOR
    result_users = await db_session.execute(select(User).where(User.role == UserRole.REPARTIDOR))
    all_rider_users = result_users.scalars().all()
    
    riders_created = 0
    riders = []
    
    vehicle_types = [VehicleType.MOTO, VehicleType.BICICLETA, VehicleType.AUTO, VehicleType.PATINETA]
    statuses = [RiderStatus.ACTIVO, RiderStatus.INACTIVO, RiderStatus.OCUPADO, RiderStatus.SUSPENDIDO]

    for user in all_rider_users:
        if riders_created >= count:
            break

        # Verificar si este usuario YA tiene un rider asociado
        result_rider = await db_session.execute(select(Rider).where(Rider.user_id == user.id))
        existing_rider = result_rider.scalar_one_or_none()
        
        if existing_rider:
            riders.append(existing_rider)
            print(f"   ⚠ Repartidor ya existe para usuario: {user.email}")
            continue

        # Crear el perfil Rider vinculado al User
        rider = Rider(
            id=uuid.uuid4(),
            user_id=user.id,  # Clave foránea correcta
            vehicle_type=random.choice(vehicle_types),
            vehicle_plate=f"ABC-{random.randint(1000, 9999)}",
            vehicle_model=f"Modelo {random.randint(1, 10)}",
            operating_zone="Zona Centro",
            cpf=f"{random.randint(10000000000, 99999999999)}",
            cnh=f"CNH{random.randint(100000, 999999)}",
            status=random.choice(statuses),
            is_online=random.choice([True, False]),
            level=1,
            total_points=0,
            badges=[]
        )
        
        db_session.add(rider)
        riders.append(rider)
        riders_created += 1
        print(f"   ✓ Repartidor creado para: {user.email}")

    # Si no hay suficientes, creamos pares Usuario+Rider nuevos
    while riders_created < count:
        idx = riders_created + 1
        email = f"repartidor{idx}@delivery360.com"
        
        result_check = await db_session.execute(select(User).where(User.email == email))
        if not result_check.scalar_one_or_none():
            new_user = User(
                id=uuid.uuid4(),
                email=email,
                hashed_password=get_password_hash("Admin123!"),
                first_name="Repartidor",
                last_name=f"#{idx}",
                role=UserRole.REPARTIDOR,
                is_active=True,
                phone=f"+55{random.randint(10000000000, 99999999999)}",
                failed_login_attempts="0"
            )
            db_session.add(new_user)
            await db_session.flush()
            
            rider = Rider(
                id=uuid.uuid4(),
                user_id=new_user.id,
                vehicle_type=random.choice(vehicle_types),
                vehicle_plate=f"XYZ-{random.randint(1000, 9999)}",
                vehicle_model="Fiat Fiorino",
                operating_zone="Zona Norte",
                cpf=f"{random.randint(10000000000, 99999999999)}",
                status=RiderStatus.ACTIVO,
                is_online=True,
                level=1,
                total_points=0,
                badges=[]
            )
            db_session.add(rider)
            riders.append(rider)
            riders_created += 1
            print(f"   ✓ Usuario y Repartidor creados: {email}")
    
    await db_session.commit()
    print(f"   ✅ {len(riders)} repartidores listos")
    return riders

async def seed_orders(db_session: AsyncSession, riders: List[Rider], count: int = 25):
    """Crea órdenes de prueba."""
    print(f"🌱 Sembrando {count} órdenes...")
    
    orders = []
    # Usar los valores string directos del Enum para evitar problemas de tipo
    status_values = [s.value for s in OrderStatus]
    priority_values = [p.value for p in OrderPriority]
    
    rider_ids = [r.id for r in riders] if riders else []
    now = utc_now_naive()

    for i in range(count):
        status_str = random.choice(status_values)
        # Solo asignar rider si el estado lo requiere y hay riders disponibles
        assigned_rider = None
        if rider_ids and status_str in ["asignado", "en_recoleccion", "recolectado", "en_ruta", "entregado", "fallido"]:
            assigned_rider = random.choice(rider_ids)
        
        hours_ago = random.randint(1, 72)
        ordered_at = now - timedelta(hours=hours_ago)
        
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
            pickup_phone=f"+55{random.randint(10000000000, 99999999999)}",
            delivery_address=f"Calle Entrega {i+1}, Ciudad",
            delivery_reference="Casa blanca",
            delivery_instructions="Timbre dos veces",
            items=[{"name": f"Producto {j+1}", "quantity": random.randint(1, 5)} for j in range(random.randint(1, 3))],
            subtotal=subtotal,
            delivery_fee=delivery_fee,
            total=round(subtotal + delivery_fee, 2),
            payment_method=random.choice(["efectivo", "tarjeta", "pix"]),
            payment_status="pagado" if random.random() > 0.2 else "pendiente",
            status=status_str, # Guardar como string, SQLAlchemy lo convierte
            priority=random.choice(priority_values),
            assigned_rider_id=assigned_rider,
            ordered_at=ordered_at,
            source="app"
        )
        
        # Calcular fechas derivadas según el estado
        accepted_at = None
        picked_up_at = None
        estimated_delivery_time = None
        delivered_at = None
        
        if status_str in ["asignado", "en_recoleccion", "recolectado", "en_ruta", "entregado", "fallido", "cancelado"]:
            accepted_at = ordered_at + timedelta(minutes=random.randint(5, 15))
        
        if status_str in ["en_recoleccion", "recolectado", "en_ruta", "entregado", "fallido"]:
            accepted_at = accepted_at or (ordered_at + timedelta(minutes=5))
            picked_up_at = accepted_at + timedelta(minutes=random.randint(10, 30))
        
        if status_str in ["recolectado", "en_ruta", "entregado", "fallido"]:
            picked_up_at = picked_up_at or (ordered_at + timedelta(minutes=20))
            estimated_delivery_time = picked_up_at + timedelta(minutes=random.randint(20, 60))
        
        if status_str == "entregado":
            estimated_delivery_time = estimated_delivery_time or (ordered_at + timedelta(minutes=40))
            delivered_at = estimated_delivery_time - timedelta(minutes=random.randint(0, 10))
        elif status_str == "fallido":
            delivered_at = None # Opcional, dependiendo de tu lógica de fallidos
            order.failure_reason = "Cliente no encontrado"
            order.failure_notes = "Se intentó contactar sin éxito."
        elif status_str == "cancelado":
            order.cancelled_by = "cliente"
            order.cancellation_reason = "El cliente cambió de opinión."

        order.accepted_at = accepted_at
        order.picked_up_at = picked_up_at
        order.estimated_delivery_time = estimated_delivery_time
        order.delivered_at = delivered_at
        
        orders.append(order)
        db_session.add(order)
    
    await db_session.commit()
    print(f"   ✅ {len(orders)} órdenes creadas.")
    return orders

async def seed_deliveries(db_session: AsyncSession, orders, riders):
    """Crea entregas para órdenes asignadas"""
    print(f"🌱 Sembrando entregas...")
    
    deliveries = []
    # Filtrar órdenes asignadas que estén en estados de entrega
    assigned_orders = [o for o in orders if o.assigned_rider_id and o.status in ["en_ruta", "entregado", "fallido", "recolectado"]]
    
    status_map = {
        "en_ruta": DeliveryStatus.EN_ROUTE,
        "entregado": DeliveryStatus.COMPLETADA,
        "fallido": DeliveryStatus.FALLIDA,
        "recolectado": DeliveryStatus.EN_PICKUP
    }
    
    now = utc_now_naive()

    for order in assigned_orders:
        delivery_status = status_map.get(order.status, DeliveryStatus.PENDIENTE)
        
        # Evitar duplicados
        result = await db_session.execute(select(Delivery).where(Delivery.order_id == order.id))
        if result.scalar_one_or_none():
            continue
        
        # Calcular tiempos estimados (en minutos)
        total_time_min = None
        sla_actual = None
        sla_compliant = False
        
        if order.picked_up_at and order.delivered_at:
            diff = (order.delivered_at - order.picked_up_at).total_seconds() / 60
            total_time_min = int(diff)
            sla_actual = int(diff)
            if order.sla_deadline:
                sla_compliant = order.delivered_at <= order.sla_deadline
        elif order.accepted_at and order.delivered_at:
            diff = (order.delivered_at - order.accepted_at).total_seconds() / 60
            total_time_min = int(diff)

        delivery = Delivery(
            id=uuid.uuid4(),
            order_id=order.id,
            rider_id=order.assigned_rider_id,
            status=delivery_status,
            started_at=order.accepted_at,       # Mapeo lógico
            arrived_pickup_at=order.picked_up_at,
            left_pickup_at=order.picked_up_at,
            arrived_delivery_at=order.delivered_at,
            completed_at=order.delivered_at,
            current_latitude=-23.5505 + random.uniform(-0.1, 0.1),
            current_longitude=-46.6333 + random.uniform(-0.1, 0.1),
            last_location_update=now,
            distance_total=random.uniform(2.0, 15.0),
            distance_pickup=random.uniform(1.0, 5.0),
            distance_delivery=random.uniform(1.0, 10.0),
            proof_notes="Entrega sin novedades" if order.status == "entregado" else None,
            has_issues=(order.status == "fallido"),
            issue_type="Cliente no encontrado" if order.status == "fallido" else None,
            total_time=total_time_min,
            sla_expected_minutes=order.sla_minutes if hasattr(order, 'sla_minutes') else 60,
            sla_actual_minutes=sla_actual,
            sla_compliant=sla_compliant
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
            # 1. Usuarios Admin
            users = await seed_users(db_session, count=5)
            
            # 2. Riders (Independientes)
            riders = await seed_riders(db_session, count=10)
            
            # 3. Órdenes
            orders = await seed_orders(db_session, riders, count=25)
            
            # 4. Entregas
            deliveries = await seed_deliveries(db_session, orders, riders)
            
            print("\n✅ ¡Seed Data completado exitosamente!")
            print("\n📊 Resumen:")
            print(f"   - Usuarios Admin: {len(users)}")
            print(f"   - Repartidores: {len(riders)}")
            print(f"   - Órdenes: {len(orders)}")
            print(f"   - Entregas: {len(deliveries)}")
            
            print("\n🔐 Credenciales de acceso:")
            print("   - Superadmin: admin.superadmin@delivery360.com / Admin123!")
            print("   - Gerente: gerente@delivery360.com / Admin123!")
            print("   - Operador: operador@delivery360.com / Admin123!")
            print("   - Repartidor (ejemplo): Usa el email generado en los logs (ej. luis.perez123@...) / Admin123!")
            # Nota: Como los riders ahora son independientes, no tienen login web a menos que implementes un endpoint específico para ellos o uses su email en el login general si la lógica lo permite.
            
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