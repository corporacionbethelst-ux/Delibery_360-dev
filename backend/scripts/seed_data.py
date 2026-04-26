import asyncio
import random
import string
from datetime import datetime, timedelta, timezone

# IMPORTANTE: Importamos solo la sesión y la Base, NO los modelos individuales aquí
# para evitar el error "Table already defined".
# En su lugar, importaremos los modelos de forma segura o usaremos la Base.metadata.
from app.core.database import AsyncSessionLocal
from app.core.security import get_password_hash
from app.models.user import User, UserRole
from app.models.rider import Rider, RiderStatus, VehicleType
# Nota: Si sigues teniendo errores con Delivery o Shift, es porque se importan en cadena.
# La solución real es ejecutar este script DENTRO del contexto de la app o asegurar 
# que los modelos se importen una sola vez. 

# TRUCO: Para evitar el error en scripts externos, a veces es necesario 
# importar los modelos en un orden específico o usar 'extend_existing' en los modelos.
# Pero como ya intentaste eso, vamos a forzar la importación segura.

# Re-importamos los modelos necesarios. Si el error persiste, significa que 
# el problema es que 'app.models' se importa múltiples veces con diferentes metadatas.
# La solución definitiva es usar la misma registry.

from sqlalchemy import select

# Datos falsos básicos
FIRST_NAMES = ["Carlos", "Ana", "Luis", "María", "Jorge", "Sofía", "Pedro", "Laura", "Miguel", "Carmen"]
LAST_NAMES = ["García", "Rodríguez", "López", "Martínez", "González", "Pérez", "Sánchez", "Romero", "Díaz", "Fernández"]
STREETS = ["Av. Principal", "Calle 10", "Carrera 5", "Blvd. Central", "Calle 25", "Av. Libertador"]
CITIES = ["São Paulo", "Rio de Janeiro", "Bogotá", "Medellín", "Buenos Aires", "Santiago"]
NEIGHBORHOODS = ["Centro", "Norte", "Sur", "Este", "Oeste", "Las Flores", "El Prado"]

def generate_email(first: str, last: str) -> str:
    return f"{first.lower()}.{last.lower()}{random.randint(1,99)}@delivery360.com".replace(" ", "")

def generate_phone() -> str:
    return f"+55{random.randint(11,99)}9{random.randint(10000000,99999999)}"

async def seed_users(db_session, count: int = 10):
    print(f"🌱 Sembrando {count} usuarios...")
    users = []
    
    # Definimos los roles críticos explícitamente en MINÚSCULAS para coincidir con el ENUM de la DB
    critical_roles_data = [
        ("admin.superadmin@delivery360.com", "Administrador Superadmin", "superadmin"),
        ("gerente@delivery360.com", "Administrador Gerente", "gerente"),
        ("operador@delivery360.com", "Administrador Operador", "operador"),
    ]

    # 1. Crear usuarios críticos
    for email, full_name, role_str in critical_roles_data:
        # Verificar si ya existe para evitar errores de unicidad
        from sqlalchemy import select
        from app.models.user import User
        stmt = select(User).where(User.email == email)
        result = await db_session.execute(stmt)
        existing = result.scalar_one_or_none()
        
        if not existing:
            user = User(
                email=email,
                hashed_password=get_password_hash("Admin123!"),
                full_name=full_name,
                role=role_str,  # Enviamos el string directamente en minúsculas
                is_active=True,
                phone=generate_phone(),
                lgpd_consent=True
            )
            db_session.add(user)
            users.append(user)
        else:
            print(f"   ⚠️ Usuario {email} ya existe, saltando.")
            users.append(existing)

    # 2. Usuarios aleatorios restantes
    roles_pool = ["operador", "gerente"] # Solo minúsculas
    
    for _ in range(count - len(critical_roles_data)):
        first = random.choice(FIRST_NAMES)
        last = random.choice(LAST_NAMES)
        email = generate_email(first, last)
        
        # Verificar duplicados aleatorios
        from sqlalchemy import select
        from app.models.user import User
        stmt = select(User).where(User.email == email)
        result = await db_session.execute(stmt)
        if result.scalar_one_or_none():
            continue
            
        user = User(
            email=email,
            hashed_password=get_password_hash("User123!"),
            full_name=f"{first} {last}",
            role=random.choice(roles_pool), # String en minúscula
            is_active=True,
            phone=generate_phone(),
            lgpd_consent=True
        )
        db_session.add(user)
        users.append(user)
    
    await db_session.commit()
    print(f"✅ {len(users)} usuarios creados/verificados.")
    return users

async def seed_riders(db_session, user_ids: list, count: int = 20):
    print(f"🌱 Sembrando {count} repartidores...")
    riders = []
    vehicle_types = [VehicleType.MOTO, VehicleType.BICICLETA, VehicleType.AUTO, VehicleType.PIE]
    statuses = [RiderStatus.ACTIVO, RiderStatus.PENDIENTE, RiderStatus.INACTIVO]
    
    # Asegurar que haya varios activos
    for i in range(min(count, 10)):
        uid = random.choice(user_ids)
        # Verificar duplicados por user_id
        stmt = select(Rider).where(Rider.user_id == uid)
        result = await db_session.execute(stmt)
        if not result.scalar_one_or_none():
            rider = Rider(
                user_id=uid,
                cpf=f"{random.randint(100,999)}.{random.randint(100,999)}.{random.randint(100,999)}-{random.randint(10,99)}",
                cnh=f"CNH{random.randint(10000000000,99999999999)}",
                vehicle_type=random.choice(vehicle_types),
                vehicle_plate=f"ABC-{random.randint(1000,9999)}",
                vehicle_model=f"Modelo {random.choice(['Yamaha', 'Honda', 'Ford', 'Chevrolet'])}",
                vehicle_year=random.randint(2018, 2024),
                status=RiderStatus.ACTIVO if i < 8 else random.choice(statuses),
                is_online=True if i < 8 else False,
                operating_zone=random.choice(CITIES),
                level=random.randint(1, 5),
                total_points=random.randint(0, 5000)
            )
            db_session.add(rider)
            riders.append(rider)
        else:
            # Si ya existe, lo obtenemos para usar su ID si fuera necesario
            riders.append(result.scalar_one())
    
    await db_session.commit()
    print(f"✅ {len(riders)} repartidores creados/verificados.")
    return riders

async def seed_orders(db_session, rider_ids: list, count: int = 50):
    print(f"🌱 Sembrando {count} órdenes...")
    orders = []
    # Importamos Order aquí para limitar el scope si es necesario, 
    # aunque lo ideal es importarlo arriba si no da error.
    from app.models.order import Order, OrderStatus
    
    # Usamos los estados reales definidos en el modelo OrderStatus
    statuses = [OrderStatus.PENDIENTE, OrderStatus.ASIGNADO, OrderStatus.EN_RECOLECCION, 
                OrderStatus.RECOLECTADO, OrderStatus.EN_RUTA, OrderStatus.ENTREGADO]
    
    now = datetime.now(timezone.utc)
    
    for i in range(count):
        status = random.choices(statuses, weights=[10, 10, 10, 10, 20, 40])[0]
        
        assigned_rider = None
        if status != OrderStatus.PENDIENTE and rider_ids:
            assigned_rider = random.choice(rider_ids)
            
        order_date = now - timedelta(days=random.randint(0, 30), hours=random.randint(0, 23))
        
        # Verificar external_id único
        external_id = f"ORD-{now.year}-{random.randint(10000, 99999)}"
        stmt = select(Order).where(Order.external_id == external_id)
        result = await db_session.execute(stmt)
        if not result.scalar_one_or_none():
            order = Order(
                external_id=external_id,
                customer_name=f"{random.choice(FIRST_NAMES)} {random.choice(LAST_NAMES)}",
                customer_phone=generate_phone(),
                customer_email=generate_email("cliente", "test"),
                pickup_address=f"{random.choice(STREETS)} {random.randint(1,500)}, {random.choice(NEIGHBORHOODS)}",
                delivery_address=f"{random.choice(STREETS)} {random.randint(1,500)}, {random.choice(NEIGHBORHOODS)}",
                pickup_latitude=-23.5505 + random.uniform(-0.1, 0.1),
                pickup_longitude=-46.6333 + random.uniform(-0.1, 0.1),
                delivery_latitude=-23.5505 + random.uniform(-0.1, 0.1),
                delivery_longitude=-46.6333 + random.uniform(-0.1, 0.1),
                items=[{"name": "Producto X", "qty": random.randint(1,5), "price": random.uniform(10, 100)}],
                subtotal=random.uniform(50, 500),
                delivery_fee=random.uniform(5, 20),
                total=random.uniform(60, 520),
                payment_method=random.choice(["credit_card", "debit_card", "cash", "pix"]),
                payment_status="pagado" if random.random() > 0.2 else "pendiente",
                status=status,
                priority=random.choice(["normal", "alta", "urgente"]),
                assigned_rider_id=assigned_rider,
                ordered_at=order_date,
                accepted_at=order_date + timedelta(minutes=5) if status != OrderStatus.PENDIENTE else None,
                picked_up_at=order_date + timedelta(minutes=20) if status in [OrderStatus.EN_RUTA, OrderStatus.ENTREGADO] else None,
                delivered_at=order_date + timedelta(minutes=45) if status == OrderStatus.ENTREGADO else None,
            )
            db_session.add(order)
            orders.append(order)
    
    await db_session.commit()
    print(f"✅ {len(orders)} órdenes creadas/verificadas.")
    return orders

async def seed_deliveries(db_session, order_ids: list, rider_ids: list, count: int = 40):
    print(f"🌱 Sembrando {count} entregas...")
    deliveries = []
    from app.models.delivery import Delivery, DeliveryStatus
    
    # Usamos los estados reales definidos en el modelo DeliveryStatus
    statuses = [DeliveryStatus.PENDIENTE, DeliveryStatus.INICIADA, DeliveryStatus.EN_ROUTE, DeliveryStatus.COMPLETADA]
    
    for i in range(count):
        if not order_ids or not rider_ids:
            break
            
        order_id = random.choice(order_ids)
        rider_id = random.choice(rider_ids)
        
        status = random.choice(statuses)
        
        # Verificar si ya existe entrega para esta orden (relación 1:1)
        stmt = select(Delivery).where(Delivery.order_id == order_id)
        result = await db_session.execute(stmt)
        if not result.scalar_one_or_none():
            delivery = Delivery(
                order_id=order_id,
                rider_id=rider_id,
                status=status,
                priority=random.choice(["NORMAL", "ALTA", "URGENTE"]),
                otp_code=f"{random.randint(1000, 9999)}",
                otp_verified=(status == DeliveryStatus.COMPLETADA),
                distance_km=random.uniform(2.0, 15.0),
                duration_minutes=random.uniform(15.0, 60.0),
                on_time=(random.random() > 0.1),
                notes="Entregar en portería" if random.random() > 0.8 else None
            )
            db_session.add(delivery)
            deliveries.append(delivery)
    
    await db_session.commit()
    print(f"✅ {len(deliveries)} entregas creadas/verificadas.")
    return deliveries

async def main():
    print("🚀 Iniciando proceso de Seed Data para Delivery360...")
    
    async with AsyncSessionLocal() as db:
        try:
            # 1. Usuarios
            users = await seed_users(db, count=15)
            user_ids = [u.id for u in users]
            
            # 2. Repartidores
            riders = await seed_riders(db, user_ids, count=25)
            rider_ids = [r.id for r in riders]
            
            # 3. Órdenes
            orders = await seed_orders(db, rider_ids, count=60)
            order_ids = [o.id for o in orders]
            
            # 4. Entregas
            await seed_deliveries(db, order_ids, rider_ids, count=50)
            
            print("\n✨ ¡Seed completado exitosamente!")
            print("📊 Resumen:")
            print(f"   - Usuarios: {len(user_ids)}")
            print(f"   - Repartidores: {len(rider_ids)}")
            print(f"   - Órdenes: {len(order_ids)}")
            print("\n🔐 Credenciales de acceso rápido:")
            print("   - Admin: admin.superadmin@delivery360.com / Admin123!")
            print("   - Gerente: gerente@delivery360.com / Admin123!")
            print("   - Operador: operador@delivery360.com / Admin123!")
            
        except Exception as e:
            print(f"\n❌ Error durante el seed: {e}")
            await db.rollback()
            raise

if __name__ == "__main__":
    asyncio.run(main())