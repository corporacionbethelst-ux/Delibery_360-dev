"""initial_models_uuid

Revision ID: 001_initial_models_uuid
Revises: 
Create Date: 2024-01-01 00:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision: str = '001_initial_models_uuid'
down_revision: Union[str, None] = None
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Crear extensión para UUID si no existe
    op.execute('CREATE EXTENSION IF NOT EXISTS "uuid-ossp"')
    
    # --- CREACIÓN DE TIPOS ENUM CON VERIFICACIÓN DE EXISTENCIA (VALORES EN MINÚSCULAS) ---
    
    # 1. userrole
    op.execute("""
        DO $$ BEGIN
            CREATE TYPE userrole AS ENUM ('superadmin', 'gerente', 'operador', 'repartidor');
        EXCEPTION
            WHEN duplicate_object THEN null;
        END $$;
    """)
    
    # 2. vehicletype
    op.execute("""
        DO $$ BEGIN
            CREATE TYPE vehicletype AS ENUM ('moto', 'bicicleta', 'auto', 'pie');
        EXCEPTION
            WHEN duplicate_object THEN null;
        END $$;
    """)
    
    # 3. riderstatus
    op.execute("""
        DO $$ BEGIN
            CREATE TYPE riderstatus AS ENUM ('pendiente', 'activo', 'inactivo', 'suspendido');
        EXCEPTION
            WHEN duplicate_object THEN null;
        END $$;
    """)
    
    # 4. orderstatus - CORREGIDO PARA COINCIDIR CON EL MODELO
    op.execute("""
        DO $$ BEGIN
            CREATE TYPE orderstatus AS ENUM (
                'pendiente', 'asignado', 'en_recoleccion', 'recolectado', 'en_ruta', 'entregado', 'fallido', 'cancelado'
            );
        EXCEPTION
            WHEN duplicate_object THEN null;
        END $$;
    """)
    
    # 5. deliverystatus - AÑADIDO FALTANTE
    op.execute("""
        DO $$ BEGIN
            CREATE TYPE deliverystatus AS ENUM ('pendiente', 'iniciada', 'en_route', 'completada');
        EXCEPTION
            WHEN duplicate_object THEN null;
        END $$;
    """)
    
    # 6. shiftstatus
    op.execute("""
        DO $$ BEGIN
            CREATE TYPE shiftstatus AS ENUM ('activo', 'cerrado');
        EXCEPTION
            WHEN duplicate_object THEN null;
        END $$;
    """)
    
    # 7. notificationtype
    op.execute("""
        DO $$ BEGIN
            CREATE TYPE notificationtype AS ENUM ('push', 'email', 'sms', 'in_app');
        EXCEPTION
            WHEN duplicate_object THEN null;
        END $$;
    """)
    
    # --- CREACIÓN DE TABLAS ---
    
    # Tabla: users
    op.create_table('users',
        sa.Column('id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('email', sa.String(length=255), nullable=False),
        sa.Column('hashed_password', sa.String(length=255), nullable=False),
        sa.Column('full_name', sa.String(length=255), nullable=False),
        sa.Column('role', sa.Enum('superadmin', 'gerente', 'operador', 'repartidor', name='userrole', create_type=False), nullable=False),
        sa.Column('is_active', sa.Boolean(), nullable=False, default=True),
        sa.Column('phone', sa.String(length=30), nullable=True),
        sa.Column('created_at', sa.TIMESTAMP(timezone=True), nullable=False, server_default=sa.func.now()),
        sa.Column('updated_at', sa.TIMESTAMP(timezone=True), nullable=False, server_default=sa.func.now()),
        sa.Column('last_login', sa.TIMESTAMP(timezone=True), nullable=True),
        sa.Column('lgpd_consent', sa.Boolean(), nullable=False, default=False),
        sa.Column('lgpd_consent_date', sa.TIMESTAMP(timezone=True), nullable=True),
        sa.Column('is_deleted', sa.Boolean(), nullable=False, default=False),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_users_email'), 'users', ['email'], unique=True)
    
    # Tabla: riders
    op.create_table('riders',
        sa.Column('id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('user_id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('cpf', sa.String(length=20), nullable=True),
        sa.Column('cnh', sa.String(length=30), nullable=True),
        sa.Column('birth_date', sa.TIMESTAMP(timezone=True), nullable=True),
        sa.Column('vehicle_type', sa.Enum('moto', 'bicicleta', 'auto', 'pie', name='vehicletype', create_type=False), nullable=False, default='moto'),
        sa.Column('vehicle_plate', sa.String(length=20), nullable=True),
        sa.Column('vehicle_model', sa.String(length=100), nullable=True),
        sa.Column('vehicle_year', sa.Integer(), nullable=True),
        sa.Column('status', sa.Enum('pendiente', 'activo', 'inactivo', 'suspendido', name='riderstatus', create_type=False), nullable=False, default='pendiente'),
        sa.Column('is_online', sa.Boolean(), nullable=False, default=False),
        sa.Column('last_lat', sa.Float(), nullable=True),
        sa.Column('last_lng', sa.Float(), nullable=True),
        sa.Column('last_location_at', sa.TIMESTAMP(timezone=True), nullable=True),
        sa.Column('level', sa.Integer(), nullable=False, default=1),
        sa.Column('total_points', sa.Integer(), nullable=False, default=0),
        sa.Column('badges', postgresql.JSONB(astext_type=sa.Text()), nullable=False, default='{}'),
        sa.Column('documents', postgresql.JSONB(astext_type=sa.Text()), nullable=False, default='{}'),
        sa.Column('operating_zone', sa.String(length=100), nullable=True),
        sa.Column('created_at', sa.TIMESTAMP(timezone=True), nullable=False, server_default=sa.func.now()),
        sa.Column('updated_at', sa.TIMESTAMP(timezone=True), nullable=False, server_default=sa.func.now()),
        sa.Column('approved_at', sa.TIMESTAMP(timezone=True), nullable=True),
        sa.ForeignKeyConstraint(['user_id'], ['users.id'], ),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('user_id')
    )
    
    # Tabla: orders
    op.create_table('orders',
        sa.Column('id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('external_id', sa.String(length=100), nullable=True),
        sa.Column('customer_name', sa.String(length=255), nullable=False),
        sa.Column('customer_phone', sa.String(length=20), nullable=False),
        sa.Column('customer_email', sa.String(length=255), nullable=True),
        sa.Column('pickup_address', sa.Text(), nullable=False),
        sa.Column('pickup_name', sa.String(length=255), nullable=True),
        sa.Column('pickup_phone', sa.String(length=20), nullable=True),
        sa.Column('delivery_address', sa.Text(), nullable=False),
        sa.Column('delivery_reference', sa.String(length=255), nullable=True),
        sa.Column('delivery_instructions', sa.Text(), nullable=True),
        sa.Column('pickup_latitude', sa.Float(), nullable=True),
        sa.Column('pickup_longitude', sa.Float(), nullable=True),
        sa.Column('delivery_latitude', sa.Float(), nullable=True),
        sa.Column('delivery_longitude', sa.Float(), nullable=True),
        sa.Column('items', sa.JSON(), nullable=True),
        sa.Column('subtotal', sa.Float(), nullable=True, default=0.0),
        sa.Column('delivery_fee', sa.Float(), nullable=True, default=0.0),
        sa.Column('total', sa.Float(), nullable=True, default=0.0),
        sa.Column('payment_method', sa.String(length=50), nullable=True),
        sa.Column('payment_status', sa.String(length=20), nullable=True, default='pendiente'),
        sa.Column('status', sa.Enum('pendiente', 'asignado', 'en_recoleccion', 'recolectado', 'en_ruta', 'entregado', 'fallido', 'cancelado', name='orderstatus', create_type=False), nullable=True),
        sa.Column('priority', sa.String(length=20), nullable=True, default='normal'),
        sa.Column('assigned_rider_id', postgresql.UUID(as_uuid=True), nullable=True),
        sa.Column('ordered_at', sa.TIMESTAMP(), nullable=False, server_default=sa.func.now()),
        sa.Column('accepted_at', sa.TIMESTAMP(), nullable=True),
        sa.Column('picked_up_at', sa.TIMESTAMP(), nullable=True),
        sa.Column('delivered_at', sa.TIMESTAMP(), nullable=True),
        sa.Column('estimated_delivery_time', sa.TIMESTAMP(), nullable=True),
        sa.Column('sla_deadline', sa.TIMESTAMP(), nullable=True),
        sa.Column('failure_reason', sa.String(length=255), nullable=True),
        sa.Column('failure_notes', sa.Text(), nullable=True),
        sa.Column('cancelled_by', sa.String(length=50), nullable=True),
        sa.Column('cancellation_reason', sa.Text(), nullable=True),
        sa.Column('source', sa.String(length=50), nullable=True, default='app'),
        sa.Column('integration_id', sa.String(length=100), nullable=True),
        sa.Column('webhook_sent', sa.Boolean(), nullable=True, default=False),
        sa.Column('created_at', sa.TIMESTAMP(), nullable=True, server_default=sa.func.now()),
        sa.Column('updated_at', sa.TIMESTAMP(), nullable=True, server_default=sa.func.now()),
        sa.ForeignKeyConstraint(['assigned_rider_id'], ['riders.id'], ),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_orders_external_id'), 'orders', ['external_id'], unique=True)
    op.create_index(op.f('ix_orders_status'), 'orders', ['status'])
    op.create_index(op.f('ix_orders_created_at'), 'orders', ['created_at'])
    
    # Tabla: deliveries
    op.create_table('deliveries',
        sa.Column('id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('order_id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('rider_id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('photo_url', sa.String(length=500), nullable=True),
        sa.Column('signature_url', sa.String(length=500), nullable=True),
        sa.Column('otp_code', sa.String(length=10), nullable=True),
        sa.Column('otp_verified', sa.Boolean(), nullable=False, default=False),
        sa.Column('delivery_lat', sa.Float(), nullable=True),
        sa.Column('delivery_lng', sa.Float(), nullable=True),
        sa.Column('pickup_at', sa.TIMESTAMP(timezone=True), nullable=True),
        sa.Column('delivered_at', sa.TIMESTAMP(timezone=True), nullable=True),
        sa.Column('duration_minutes', sa.Float(), nullable=True),
        sa.Column('distance_km', sa.Float(), nullable=True),
        sa.Column('on_time', sa.Boolean(), nullable=True),
        sa.Column('customer_rating', sa.Integer(), nullable=True),
        sa.Column('notes', sa.Text(), nullable=True),
        sa.Column('status', sa.Enum('pendiente', 'iniciada', 'en_route', 'completada', name='deliverystatus', create_type=False), nullable=True, default='pendiente'),
        sa.Column('created_at', sa.TIMESTAMP(timezone=True), nullable=False, server_default=sa.func.now()),
        sa.ForeignKeyConstraint(['order_id'], ['orders.id'], ),
        sa.ForeignKeyConstraint(['rider_id'], ['riders.id'], ),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('order_id')
    )
    
    # Tabla: shifts
    op.create_table('shifts',
        sa.Column('id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('rider_id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('checkin_at', sa.TIMESTAMP(timezone=True), nullable=False),
        sa.Column('checkout_at', sa.TIMESTAMP(timezone=True), nullable=True),
        sa.Column('checkin_lat', sa.Float(), nullable=True),
        sa.Column('checkin_lng', sa.Float(), nullable=True),
        sa.Column('status', sa.Enum('activo', 'cerrado', name='shiftstatus', create_type=False), nullable=False, default='activo'),
        sa.Column('total_orders', sa.Integer(), nullable=False, default=0),
        sa.Column('total_earnings', sa.Float(), nullable=False, default=0.0),
        sa.Column('duration_hours', sa.Float(), nullable=True),
        sa.ForeignKeyConstraint(['rider_id'], ['riders.id'], ),
        sa.PrimaryKeyConstraint('id')
    )
    
    # Tabla: productivity
    op.create_table('productivity',
        sa.Column('id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('rider_id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('date', sa.TIMESTAMP(timezone=True), nullable=False),
        sa.Column('total_orders', sa.Integer(), nullable=False, default=0),
        sa.Column('orders_on_time', sa.Integer(), nullable=False, default=0),
        sa.Column('avg_delivery_time_min', sa.Float(), nullable=False, default=0.0),
        sa.Column('orders_per_hour', sa.Float(), nullable=False, default=0.0),
        sa.Column('sla_compliance_pct', sa.Float(), nullable=False, default=0.0),
        sa.Column('total_distance_km', sa.Float(), nullable=False, default=0.0),
        sa.Column('total_earnings', sa.Float(), nullable=False, default=0.0),
        sa.Column('performance_score', sa.Float(), nullable=False, default=0.0),
        sa.Column('created_at', sa.TIMESTAMP(timezone=True), nullable=False, server_default=sa.func.now()),
        sa.ForeignKeyConstraint(['rider_id'], ['riders.id'], ),
        sa.PrimaryKeyConstraint('id')
    )
    
    # Tabla: financials
    op.create_table('financials',
        sa.Column('id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('rider_id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('order_id', postgresql.UUID(as_uuid=True), nullable=True),
        sa.Column('rule_type', sa.String(length=20), nullable=False, default='fija'),
        sa.Column('base_amount', sa.Float(), nullable=False, default=0.0),
        sa.Column('distance_bonus', sa.Float(), nullable=False, default=0.0),
        sa.Column('time_bonus', sa.Float(), nullable=False, default=0.0),
        sa.Column('volume_bonus', sa.Float(), nullable=False, default=0.0),
        sa.Column('total_amount', sa.Float(), nullable=False, default=0.0),
        sa.Column('operational_cost', sa.Float(), nullable=False, default=0.0),
        sa.Column('margin', sa.Float(), nullable=False, default=0.0),
        sa.Column('period_date', sa.TIMESTAMP(timezone=True), nullable=False),
        sa.Column('liquidated', sa.Boolean(), nullable=False, default=False),
        sa.Column('liquidated_at', sa.TIMESTAMP(timezone=True), nullable=True),
        sa.Column('created_at', sa.TIMESTAMP(timezone=True), nullable=False, server_default=sa.func.now()),
        sa.ForeignKeyConstraint(['order_id'], ['orders.id'], ),
        sa.ForeignKeyConstraint(['rider_id'], ['riders.id'], ),
        sa.PrimaryKeyConstraint('id')
    )
    
    # Tabla: routes
    op.create_table('routes',
        sa.Column('id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('delivery_id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('gps_points', postgresql.JSONB(astext_type=sa.Text()), nullable=False, default='[]'),
        sa.Column('distance_km', sa.Float(), nullable=False, default=0.0),
        sa.Column('deviation_detected', sa.Boolean(), nullable=False, default=False),
        sa.Column('deviation_details', postgresql.JSONB(astext_type=sa.Text()), nullable=False, default='{}'),
        sa.Column('started_at', sa.TIMESTAMP(timezone=True), nullable=True),
        sa.Column('ended_at', sa.TIMESTAMP(timezone=True), nullable=True),
        sa.Column('created_at', sa.TIMESTAMP(timezone=True), nullable=False, server_default=sa.func.now()),
        sa.ForeignKeyConstraint(['delivery_id'], ['deliveries.id'], ),
        sa.PrimaryKeyConstraint('id')
    )
    
    # Tabla: route_points
    op.create_table('route_points',
        sa.Column('id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('route_id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('latitude', sa.Float(), nullable=False),
        sa.Column('longitude', sa.Float(), nullable=False),
        sa.Column('timestamp', sa.TIMESTAMP(timezone=True), nullable=False),
        sa.Column('speed_kmh', sa.Float(), nullable=True),
        sa.Column('accuracy_meters', sa.Float(), nullable=True),
        sa.Column('created_at', sa.TIMESTAMP(timezone=True), nullable=False, server_default=sa.func.now()),
        sa.ForeignKeyConstraint(['route_id'], ['routes.id'], ),
        sa.PrimaryKeyConstraint('id')
    )
    
    # Tabla: route_deviations
    op.create_table('route_deviations',
        sa.Column('id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('route_id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('detected_at', sa.TIMESTAMP(timezone=True), nullable=False),
        sa.Column('expected_lat', sa.Float(), nullable=False),
        sa.Column('expected_lng', sa.Float(), nullable=False),
        sa.Column('actual_lat', sa.Float(), nullable=False),
        sa.Column('actual_lng', sa.Float(), nullable=False),
        sa.Column('deviation_meters', sa.Float(), nullable=False),
        sa.Column('resolved', sa.Boolean(), nullable=False, default=False),
        sa.Column('resolution_notes', sa.Text(), nullable=True),
        sa.Column('created_at', sa.TIMESTAMP(timezone=True), nullable=False, server_default=sa.func.now()),
        sa.ForeignKeyConstraint(['route_id'], ['routes.id'], ),
        sa.PrimaryKeyConstraint('id')
    )
    
    # Tabla: audit_logs
    op.create_table('audit_logs',
        sa.Column('id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('user_id', postgresql.UUID(as_uuid=True), nullable=True),
        sa.Column('action', sa.String(length=100), nullable=False),
        sa.Column('resource', sa.String(length=100), nullable=False),
        sa.Column('resource_id', sa.String(length=100), nullable=True),
        sa.Column('details', postgresql.JSONB(astext_type=sa.Text()), nullable=False, default='{}'),
        sa.Column('ip_address', sa.String(length=50), nullable=True),
        sa.Column('user_agent', sa.String(length=500), nullable=True),
        sa.Column('created_at', sa.TIMESTAMP(timezone=True), nullable=False, server_default=sa.func.now()),
        sa.ForeignKeyConstraint(['user_id'], ['users.id'], ),
        sa.PrimaryKeyConstraint('id')
    )
    
    # Tabla: notifications
    op.create_table('notifications',
        sa.Column('id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('user_id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('type', sa.Enum('push', 'email', 'sms', 'in_app', name='notificationtype', create_type=False), nullable=False, default='in_app'),
        sa.Column('title', sa.String(length=200), nullable=False),
        sa.Column('body', sa.Text(), nullable=False),
        sa.Column('data', postgresql.JSONB(astext_type=sa.Text()), nullable=False, default='{}'),
        sa.Column('read', sa.Boolean(), nullable=False, default=False),
        sa.Column('sent', sa.Boolean(), nullable=False, default=False),
        sa.Column('created_at', sa.TIMESTAMP(timezone=True), nullable=False, server_default=sa.func.now()),
        sa.ForeignKeyConstraint(['user_id'], ['users.id'], ),
        sa.PrimaryKeyConstraint('id')
    )
    
    # Tabla: integrations
    op.create_table('integrations',
        sa.Column('id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('name', sa.String(length=100), nullable=False),
        sa.Column('type', sa.String(length=50), nullable=False),
        sa.Column('config', postgresql.JSONB(astext_type=sa.Text()), nullable=False, default='{}'),
        sa.Column('is_active', sa.Boolean(), nullable=False, default=True),
        sa.Column('last_sync_at', sa.TIMESTAMP(timezone=True), nullable=True),
        sa.Column('created_at', sa.TIMESTAMP(timezone=True), nullable=False, server_default=sa.func.now()),
        sa.PrimaryKeyConstraint('id')
    )


def downgrade() -> None:
    # Eliminar tablas en orden inverso
    op.drop_table('integrations')
    op.drop_table('notifications')
    op.drop_table('audit_logs')
    op.drop_table('route_deviations')
    op.drop_table('route_points')
    op.drop_table('routes')
    op.drop_table('financials')
    op.drop_table('productivity')
    op.drop_table('shifts')
    op.drop_table('deliveries')
    op.drop_table('orders')
    op.drop_table('riders')
    op.drop_table('users')
    
    # Eliminar tipos ENUM
    op.execute('DROP TYPE IF EXISTS notificationtype')
    op.execute('DROP TYPE IF EXISTS deliverystatus')
    op.execute('DROP TYPE IF EXISTS shiftstatus')
    op.execute('DROP TYPE IF EXISTS orderstatus')
    op.execute('DROP TYPE IF EXISTS riderstatus')
    op.execute('DROP TYPE IF EXISTS vehicletype')
    op.execute('DROP TYPE IF EXISTS userrole')
    
    # Nota: No eliminamos la extensión uuid-ossp por si otras tablas la usan