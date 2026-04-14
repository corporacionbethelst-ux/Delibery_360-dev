"""
seed_data.py — Carga datos iniciales mínimos y compatibles con el contrato actual.
Ejecutado automáticamente por docker-compose al iniciar.
Idempotente: no duplica datos si ya existen.
"""

import asyncio
import random
import secrets
import sys
<<<<<<< codex/analyze-repository-for-errors-and-inconsistencies-xh6d6p
from datetime import datetime, timedelta, timezone
=======
import os
import secrets
sys.path.insert(0, "/app")
>>>>>>> main

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine

sys.path.insert(0, "/app")

from app.core.config import settings
from app.core.database import Base
from app.core.security import hash_password
from app.models.delivery import Delivery, DeliveryStatus
from app.models.order import Order, OrderPriority, OrderStatus
from app.models.rider import Rider, RiderStatus, VehicleType
from app.models.user import User, UserRole


engine = create_async_engine(settings.DATABASE_URL, echo=False)
SessionLocal = async_sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)


async def seed() -> None:
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)

    async with SessionLocal() as db:
        existing_admin = await db.execute(
            select(User).where(User.email == settings.FIRST_SUPERUSER_EMAIL)
        )
        if existing_admin.scalar_one_or_none():
            print("✓ Base de datos ya inicializada. Omitiendo seed.")
            return

        print("► Iniciando seed compatible con contrato actual...")

<<<<<<< codex/analyze-repository-for-errors-and-inconsistencies-xh6d6p
        admin_password = settings.FIRST_SUPERUSER_PASSWORD or secrets.token_urlsafe(16)
        users_data = [
            (settings.FIRST_SUPERUSER_EMAIL, admin_password, settings.FIRST_SUPERUSER_NAME, UserRole.SUPERADMIN),
            ("gerente@logrider.com", secrets.token_urlsafe(12), "Carlos Mendoza", UserRole.GERENTE),
            ("operador@logrider.com", secrets.token_urlsafe(12), "Ana González", UserRole.OPERADOR),
=======
        # ── 2. Usuarios base ────────────────────────────────────────────────
        admin_password = settings.FIRST_SUPERUSER_PASSWORD or secrets.token_urlsafe(16)
        users_data = [
            (settings.FIRST_SUPERUSER_EMAIL, admin_password, settings.FIRST_SUPERUSER_NAME, UserRole.SUPERADMIN),
            ("gerente@logrider.com",  secrets.token_urlsafe(12), "Carlos Mendoza",    UserRole.GERENTE),
            ("operador@logrider.com", secrets.token_urlsafe(12), "Ana González",     UserRole.OPERADOR),
            ("operador2@logrider.com", secrets.token_urlsafe(12), "Luis Ramírez",     UserRole.OPERADOR),
>>>>>>> main
        ]

        users: list[User] = []
        for email, pwd, name, role in users_data:
            user = User(
                email=email,
                hashed_password=hash_password(pwd),
                full_name=name,
                role=role,
                is_active=True,
                lgpd_consent=True,
                lgpd_consent_date=datetime.now(timezone.utc),
            )
            db.add(user)
            users.append(user)

        await db.flush()

        riders: list[Rider] = []
        riders_data = [
<<<<<<< codex/analyze-repository-for-errors-and-inconsistencies-xh6d6p
            ("rider1@logrider.com", "Pedro Souza", VehicleType.MOTO),
            ("rider2@logrider.com", "Maria Silva", VehicleType.BICICLETA),
            ("rider3@logrider.com", "João Costa", VehicleType.AUTO),
=======
            ("rider1@logrider.com", secrets.token_urlsafe(12), "Pedro Souza",    VehicleType.MOTO,      "MTP-1234", "Honda CG 160"),
            ("rider2@logrider.com", secrets.token_urlsafe(12), "Maria Silva",    VehicleType.MOTO,      "MTP-5678", "Yamaha Factor"),
            ("rider3@logrider.com", secrets.token_urlsafe(12), "João Costa",     VehicleType.BICICLETA, None,        "Bike Caloi"),
            ("rider4@logrider.com", secrets.token_urlsafe(12), "Ana Ferreira",   VehicleType.MOTO,      "MTP-9012", "Honda Biz"),
            ("rider5@logrider.com", secrets.token_urlsafe(12), "Carlos Lima",    VehicleType.AUTO,      "ABC-3456", "Fiat Uno"),
>>>>>>> main
        ]

        for idx, (email, name, vehicle_type) in enumerate(riders_data, start=1):
            rider_user = User(
                email=email,
                hashed_password=hash_password(secrets.token_urlsafe(12)),
                full_name=name,
                role=UserRole.REPARTIDOR,
                is_active=True,
                lgpd_consent=True,
                lgpd_consent_date=datetime.now(timezone.utc),
            )
            db.add(rider_user)
            await db.flush()

            rider = Rider(
                user_id=rider_user.id,
                status=RiderStatus.ACTIVO,
                vehicle_type=vehicle_type,
                vehicle_plate=f"SEED-{idx:04d}",
                vehicle_model="Seed Vehicle",
                operating_zone="Centro",
                is_online=random.choice([True, False]),
                approved_at=datetime.now(timezone.utc),
            )
            db.add(rider)
            riders.append(rider)

        await db.flush()

        addresses = [
            ("Rua Augusta, 1500, São Paulo", -23.5506, -46.6570),
            ("Av. Paulista, 900, São Paulo", -23.5629, -46.6544),
            ("Rua Consolação, 200, São Paulo", -23.5482, -46.6574),
        ]
        order_statuses = [OrderStatus.ENTREGADO, OrderStatus.EN_RUTA, OrderStatus.ASIGNADO, OrderStatus.PENDIENTE]

        orders: list[Order] = []
        for i in range(12):
            pickup = random.choice(addresses)
            delivery = random.choice(addresses)
            status = random.choice(order_statuses)
            rider = random.choice(riders)
            created_at = datetime.now(timezone.utc) - timedelta(days=random.randint(0, 5), hours=random.randint(0, 8))
            delivered_at = created_at + timedelta(minutes=random.randint(30, 90)) if status == OrderStatus.ENTREGADO else None

            order = Order(
                external_id=f"SEED-{i+1:05d}",
                customer_name=f"Cliente Seed {i+1}",
                customer_phone=f"+55119{random.randint(10000000, 99999999)}",
                customer_email=f"cliente{i+1}@example.com",
                pickup_address=pickup[0],
                pickup_name="Restaurante Seed",
                pickup_phone="+5511999999999",
                delivery_address=delivery[0],
                delivery_reference="Portería",
                delivery_instructions="Tocar timbre",
                pickup_lat=pickup[1],
                pickup_lng=pickup[2],
                delivery_lat=delivery[1],
                delivery_lng=delivery[2],
                items={"count": random.randint(1, 5), "description": "Pedido de prueba"},
                subtotal=round(random.uniform(20, 120), 2),
                delivery_fee=round(random.uniform(3, 12), 2),
                total=round(random.uniform(25, 140), 2),
                payment_method=random.choice(["efectivo", "tarjeta", "pix"]),
                payment_status="pendiente",
                status=status,
                priority=random.choice([p.value for p in OrderPriority]),
                assigned_rider_id=rider.id if status != OrderStatus.PENDIENTE else None,
                ordered_at=created_at,
                accepted_at=created_at + timedelta(minutes=5) if status != OrderStatus.PENDIENTE else None,
                delivered_at=delivered_at,
                estimated_delivery_time=created_at + timedelta(minutes=60),
                sla_deadline=created_at + timedelta(minutes=75),
                source="seed",
                integration_id=f"INT-SEED-{i+1:05d}",
                created_at=created_at,
                updated_at=datetime.now(timezone.utc),
            )
            db.add(order)
            orders.append(order)

        await db.flush()

        deliveries_created = 0
        for order in orders:
            if order.status != OrderStatus.ENTREGADO or not order.assigned_rider_id:
                continue

            delivery = Delivery(
                order_id=order.id,
                rider_id=order.assigned_rider_id,
                status=DeliveryStatus.COMPLETADA,
                started_at=(order.accepted_at or order.ordered_at),
                completed_at=order.delivered_at,
                current_latitude=order.delivery_lat,
                current_longitude=order.delivery_lng,
                proof_notes="Entrega seed completada",
                customer_name_received=order.customer_name,
                sla_expected_minutes=75,
                sla_actual_minutes=45,
                sla_compliant=True,
            )
            db.add(delivery)
            deliveries_created += 1

        await db.commit()

        print("═" * 50)
        print("✅ SEED COMPLETADO CON ÉXITO")
        print("═" * 50)
<<<<<<< codex/analyze-repository-for-errors-and-inconsistencies-xh6d6p
        print(f"  Admin: {settings.FIRST_SUPERUSER_EMAIL} / [usar FIRST_SUPERUSER_PASSWORD o temporal generado]")
        print(f"  Usuarios creados: {len(users) + len(riders_data)}")
        print(f"  Riders creados: {len(riders)}")
        print(f"  Orders creadas: {len(orders)}")
        print(f"  Deliveries creadas: {deliveries_created}")
=======
        print(f"  Admin:    {settings.FIRST_SUPERUSER_EMAIL} / [usar FIRST_SUPERUSER_PASSWORD o contraseña generada]")
        print("  Usuarios de prueba creados con contraseñas temporales seguras")
        print("  Docs API: http://localhost:8000/docs")
>>>>>>> main
        print("═" * 50)


if __name__ == "__main__":
    asyncio.run(seed())
