"""
seed_data.py — Carga datos iniciales en la base de datos.
Ejecutado automáticamente por docker-compose al iniciar.
Idempotente: no duplica datos si ya existen.
"""
import asyncio
import sys
import os
sys.path.insert(0, "/app")

from sqlalchemy.ext.asyncio import create_async_engine, async_sessionmaker, AsyncSession
from sqlalchemy import select, text
from datetime import datetime, timezone, timedelta
import random
import uuid

from app.core.config import settings
from app.core.security import hash_password
from app.models.user import User, UserRole
from app.models.rider import Rider, RiderStatus, VehicleType
from app.models.order import Order, OrderStatus, OrderPriority
from app.models.all_models import (
    Delivery, Shift, ShiftStatus,
    Financial, PaymentRuleType,
    Productivity
)
from app.core.database import Base

engine = create_async_engine(settings.DATABASE_URL, echo=False)
SessionLocal = async_sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)


async def seed():
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)

    async with SessionLocal() as db:
        # ── 1. Verificar si ya existe el superadmin ─────────────────────────
        existing = await db.execute(select(User).where(User.email == settings.FIRST_SUPERUSER_EMAIL))
        if existing.scalar_one_or_none():
            print("✓ Base de datos ya inicializada. Omitiendo seed.")
            return

        print("► Iniciando carga de datos de prueba...")

        # ── 2. Usuarios base ────────────────────────────────────────────────
        users_data = [
            (settings.FIRST_SUPERUSER_EMAIL, settings.FIRST_SUPERUSER_PASSWORD, settings.FIRST_SUPERUSER_NAME, UserRole.SUPERADMIN),
            ("gerente@logrider.com",  "Gerente1234!", "Carlos Mendoza",    UserRole.GERENTE),
            ("operador@logrider.com", "Operador1234!", "Ana González",     UserRole.OPERADOR),
            ("operador2@logrider.com","Operador1234!", "Luis Ramírez",     UserRole.OPERADOR),
        ]

        users = []
        for email, pwd, name, role in users_data:
            u = User(
                email=email,
                hashed_password=hash_password(pwd),
                full_name=name,
                role=role,
                is_active=True,
                lgpd_consent=True,
                lgpd_consent_date=datetime.now(timezone.utc),
            )
            db.add(u)
            users.append(u)

        await db.flush()
        print(f"  ✓ {len(users)} usuarios creados")

        # ── 3. Repartidores ─────────────────────────────────────────────────
        riders_data = [
            ("rider1@logrider.com", "Rider1234!", "Pedro Souza",    VehicleType.MOTO,      "MTP-1234", "Honda CG 160"),
            ("rider2@logrider.com", "Rider1234!", "Maria Silva",    VehicleType.MOTO,      "MTP-5678", "Yamaha Factor"),
            ("rider3@logrider.com", "Rider1234!", "João Costa",     VehicleType.BICICLETA, None,        "Bike Caloi"),
            ("rider4@logrider.com", "Rider1234!", "Ana Ferreira",   VehicleType.MOTO,      "MTP-9012", "Honda Biz"),
            ("rider5@logrider.com", "Rider1234!", "Carlos Lima",    VehicleType.AUTO,      "ABC-3456", "Fiat Uno"),
        ]

        riders = []
        for email, pwd, name, vtype, plate, model in riders_data:
            u = User(
                email=email,
                hashed_password=hash_password(pwd),
                full_name=name,
                role=UserRole.REPARTIDOR,
                is_active=True,
                lgpd_consent=True,
                lgpd_consent_date=datetime.now(timezone.utc),
            )
            db.add(u)
            await db.flush()

            r = Rider(
                user_id=u.id,
                status=RiderStatus.ACTIVO,
                vehicle_type=vtype,
                vehicle_plate=plate,
                vehicle_model=model,
                operating_zone="Centro",
                is_online=random.choice([True, False]),
                last_lat=-23.5505 + random.uniform(-0.05, 0.05),
                last_lng=-46.6333 + random.uniform(-0.05, 0.05),
                last_location_at=datetime.now(timezone.utc),
                level=random.randint(1, 5),
                total_points=random.randint(100, 2000),
                approved_at=datetime.now(timezone.utc),
            )
            db.add(r)
            riders.append(r)

        await db.flush()
        print(f"  ✓ {len(riders)} repartidores creados")

        # ── 4. Pedidos históricos (últimos 7 días) ──────────────────────────
        addresses = [
            ("Rua Augusta, 1500, São Paulo", -23.5506, -46.6570),
            ("Av. Paulista, 900, São Paulo",  -23.5629, -46.6544),
            ("Rua Oscar Freire, 300",         -23.5629, -46.6699),
            ("Av. Faria Lima, 2000",          -23.5784, -46.6957),
            ("Rua Consolação, 200",           -23.5482, -46.6574),
        ]
        contacts = ["João Silva", "Maria Santos", "Pedro Lima", "Ana Costa", "Carlos Mendes"]
        statuses_dist = [OrderStatus.ENTREGADO] * 15 + [OrderStatus.EN_RUTA] * 3 + \
                        [OrderStatus.ASIGNADO] * 3 + [OrderStatus.CREADO] * 2 + [OrderStatus.FALLIDO] * 2

        orders_created = []
        for i in range(25):
            pickup = random.choice(addresses)
            delivery = random.choice(addresses)
            rider = random.choice(riders)
            status = random.choice(statuses_dist)
            days_ago = random.randint(0, 7)
            created = datetime.now(timezone.utc) - timedelta(days=days_ago, hours=random.randint(0, 8))

            o = Order(
                order_number=f"LR-{str(i+1).zfill(5)}",
                pickup_address=pickup[0],
                pickup_lat=pickup[1],
                pickup_lng=pickup[2],
                pickup_contact="Restaurante Bom Sabor",
                delivery_address=delivery[0],
                delivery_lat=delivery[1],
                delivery_lng=delivery[2],
                delivery_contact=random.choice(contacts),
                delivery_phone=f"+55119{random.randint(10000000,99999999)}",
                declared_value=round(random.uniform(20, 200), 2),
                priority=random.choice(list(OrderPriority)),
                sla_minutes=60,
                status=status,
                rider_id=rider.id if status != OrderStatus.CREADO else None,
                created_at=created,
                assigned_at=created + timedelta(minutes=5) if status != OrderStatus.CREADO else None,
                delivered_at=created + timedelta(minutes=random.randint(30, 90)) if status == OrderStatus.ENTREGADO else None,
                estimated_delivery_at=created + timedelta(minutes=60),
                sla_breached=random.choice([True, False, False, False]),
                source=random.choice(["manual", "ifood", "ubereats"]),
            )
            db.add(o)
            orders_created.append((o, rider))

        await db.flush()
        print(f"  ✓ {len(orders_created)} pedidos creados")

        # ── 5. Entregas para pedidos completados ────────────────────────────
        deliveries_count = 0
        for o, rider in orders_created:
            if o.status == OrderStatus.ENTREGADO and o.delivered_at:
                dur = (o.delivered_at - o.created_at).total_seconds() / 60
                d = Delivery(
                    order_id=o.id,
                    rider_id=rider.id,
                    otp_verified=True,
                    pickup_at=o.assigned_at,
                    delivered_at=o.delivered_at,
                    duration_minutes=round(dur, 1),
                    distance_km=round(random.uniform(1.5, 8.0), 2),
                    on_time=not o.sla_breached,
                    customer_rating=random.randint(3, 5),
                )
                db.add(d)
                deliveries_count += 1

        await db.flush()
        print(f"  ✓ {deliveries_count} entregas registradas")

        # ── 6. Turnos activos ───────────────────────────────────────────────
        for rider in riders[:3]:
            shift = Shift(
                rider_id=rider.id,
                checkin_at=datetime.now(timezone.utc) - timedelta(hours=3),
                status=ShiftStatus.ACTIVO,
                total_orders=random.randint(3, 10),
                total_earnings=round(random.uniform(50, 200), 2),
            )
            db.add(shift)

        print("  ✓ 3 turnos activos creados")

        # ── 7. Métricas de productividad ────────────────────────────────────
        for rider in riders:
            for days_ago in range(7):
                date = datetime.now(timezone.utc) - timedelta(days=days_ago)
                total = random.randint(5, 20)
                on_time = int(total * random.uniform(0.7, 1.0))
                p = Productivity(
                    rider_id=rider.id,
                    date=date,
                    total_orders=total,
                    orders_on_time=on_time,
                    avg_delivery_time_min=round(random.uniform(25, 55), 1),
                    orders_per_hour=round(random.uniform(1.5, 4.0), 2),
                    sla_compliance_pct=round(on_time / total * 100, 1),
                    total_distance_km=round(random.uniform(20, 80), 1),
                    total_earnings=round(random.uniform(80, 300), 2),
                    performance_score=round(random.uniform(60, 100), 1),
                )
                db.add(p)

        print("  ✓ Métricas de productividad generadas (7 días)")

        # ── 8. Registros financieros ────────────────────────────────────────
        for o, rider in orders_created:
            if o.status == OrderStatus.ENTREGADO:
                f = Financial(
                    rider_id=rider.id,
                    order_id=o.id,
                    rule_type=PaymentRuleType.HIBRIDA,
                    base_amount=5.0,
                    distance_bonus=round(random.uniform(1, 4), 2),
                    time_bonus=round(random.uniform(0, 2), 2),
                    volume_bonus=0.0,
                    total_amount=round(random.uniform(6, 12), 2),
                    operational_cost=round(random.uniform(1, 3), 2),
                    period_date=o.created_at,
                    liquidated=True,
                    liquidated_at=o.created_at + timedelta(hours=24),
                )
                f.margin = round(f.total_amount - f.operational_cost, 2)
                db.add(f)

        await db.commit()
        print("  ✓ Registros financieros creados")
        print()
        print("═" * 50)
        print("✅ SEED COMPLETADO CON ÉXITO")
        print("═" * 50)
        print(f"  Admin:    {settings.FIRST_SUPERUSER_EMAIL} / {settings.FIRST_SUPERUSER_PASSWORD}")
        print(f"  Gerente:  gerente@logrider.com / Gerente1234!")
        print(f"  Operador: operador@logrider.com / Operador1234!")
        print(f"  Rider:    rider1@logrider.com / Rider1234!")
        print("  Docs API: http://localhost:8000/docs")
        print("═" * 50)


if __name__ == "__main__":
    asyncio.run(seed())