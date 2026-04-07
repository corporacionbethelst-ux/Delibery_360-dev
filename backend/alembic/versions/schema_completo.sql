-- ============================================
-- DELIVERY360 - ESQUEMA DE BASE DE DATOS
-- Generado automáticamente desde modelos SQLAlchemy
-- Todos los IDs ahora usan UUID para consistencia
-- ============================================

-- Tabla: integrations
CREATE TABLE integrations (
	id UUID NOT NULL, 
	name VARCHAR(100) NOT NULL, 
	type VARCHAR(50) NOT NULL, 
	config JSONB NOT NULL, 
	is_active BOOLEAN NOT NULL, 
	last_sync_at TIMESTAMP WITH TIME ZONE, 
	created_at TIMESTAMP WITH TIME ZONE NOT NULL, 
	PRIMARY KEY (id)
)

-- Tabla: users
CREATE TABLE users (
	id UUID NOT NULL, 
	email VARCHAR(255) NOT NULL, 
	hashed_password VARCHAR(255) NOT NULL, 
	full_name VARCHAR(255) NOT NULL, 
	role userrole NOT NULL, 
	is_active BOOLEAN NOT NULL, 
	phone VARCHAR(30), 
	created_at TIMESTAMP WITH TIME ZONE NOT NULL, 
	updated_at TIMESTAMP WITH TIME ZONE NOT NULL, 
	last_login TIMESTAMP WITH TIME ZONE, 
	lgpd_consent BOOLEAN NOT NULL, 
	lgpd_consent_date TIMESTAMP WITH TIME ZONE, 
	is_deleted BOOLEAN NOT NULL, 
	PRIMARY KEY (id)
)

-- Tabla: audit_logs
CREATE TABLE audit_logs (
	id UUID NOT NULL, 
	user_id UUID, 
	action VARCHAR(100) NOT NULL, 
	resource VARCHAR(100) NOT NULL, 
	resource_id VARCHAR(100), 
	details JSONB NOT NULL, 
	ip_address VARCHAR(50), 
	user_agent VARCHAR(500), 
	created_at TIMESTAMP WITH TIME ZONE NOT NULL, 
	PRIMARY KEY (id), 
	FOREIGN KEY(user_id) REFERENCES users (id)
)

-- Tabla: notifications
CREATE TABLE notifications (
	id UUID NOT NULL, 
	user_id UUID NOT NULL, 
	type notificationtype NOT NULL, 
	title VARCHAR(200) NOT NULL, 
	body TEXT NOT NULL, 
	data JSONB NOT NULL, 
	read BOOLEAN NOT NULL, 
	sent BOOLEAN NOT NULL, 
	created_at TIMESTAMP WITH TIME ZONE NOT NULL, 
	PRIMARY KEY (id), 
	FOREIGN KEY(user_id) REFERENCES users (id)
)

-- Tabla: riders
CREATE TABLE riders (
	id UUID NOT NULL, 
	user_id UUID NOT NULL, 
	cpf VARCHAR(20), 
	cnh VARCHAR(30), 
	birth_date TIMESTAMP WITH TIME ZONE, 
	vehicle_type vehicletype NOT NULL, 
	vehicle_plate VARCHAR(20), 
	vehicle_model VARCHAR(100), 
	vehicle_year INTEGER, 
	status riderstatus NOT NULL, 
	is_online BOOLEAN NOT NULL, 
	last_lat FLOAT, 
	last_lng FLOAT, 
	last_location_at TIMESTAMP WITH TIME ZONE, 
	level INTEGER NOT NULL, 
	total_points INTEGER NOT NULL, 
	badges JSONB NOT NULL, 
	documents JSONB NOT NULL, 
	operating_zone VARCHAR(100), 
	created_at TIMESTAMP WITH TIME ZONE NOT NULL, 
	updated_at TIMESTAMP WITH TIME ZONE NOT NULL, 
	approved_at TIMESTAMP WITH TIME ZONE, 
	PRIMARY KEY (id), 
	UNIQUE (user_id), 
	FOREIGN KEY(user_id) REFERENCES users (id)
)

-- Tabla: orders
CREATE TABLE orders (
	id UUID NOT NULL, 
	external_id VARCHAR(100), 
	customer_name VARCHAR(255) NOT NULL, 
	customer_phone VARCHAR(20) NOT NULL, 
	customer_email VARCHAR(255), 
	pickup_address TEXT NOT NULL, 
	pickup_name VARCHAR(255), 
	pickup_phone VARCHAR(20), 
	delivery_address TEXT NOT NULL, 
	delivery_reference VARCHAR(255), 
	delivery_instructions TEXT, 
	pickup_latitude FLOAT, 
	pickup_longitude FLOAT, 
	delivery_latitude FLOAT, 
	delivery_longitude FLOAT, 
	items JSON, 
	subtotal FLOAT, 
	delivery_fee FLOAT, 
	total FLOAT, 
	payment_method VARCHAR(50), 
	payment_status VARCHAR(20), 
	status orderstatus, 
	priority VARCHAR(20), 
	assigned_rider_id UUID, 
	ordered_at TIMESTAMP WITHOUT TIME ZONE NOT NULL, 
	accepted_at TIMESTAMP WITHOUT TIME ZONE, 
	picked_up_at TIMESTAMP WITHOUT TIME ZONE, 
	delivered_at TIMESTAMP WITHOUT TIME ZONE, 
	estimated_delivery_time TIMESTAMP WITHOUT TIME ZONE, 
	sla_deadline TIMESTAMP WITHOUT TIME ZONE, 
	failure_reason VARCHAR(255), 
	failure_notes TEXT, 
	cancelled_by VARCHAR(50), 
	cancellation_reason TEXT, 
	source VARCHAR(50), 
	integration_id VARCHAR(100), 
	webhook_sent BOOLEAN, 
	created_at TIMESTAMP WITHOUT TIME ZONE, 
	updated_at TIMESTAMP WITHOUT TIME ZONE, 
	PRIMARY KEY (id), 
	FOREIGN KEY(assigned_rider_id) REFERENCES riders (id)
)

-- Tabla: productivity
CREATE TABLE productivity (
	id UUID NOT NULL, 
	rider_id UUID NOT NULL, 
	date TIMESTAMP WITH TIME ZONE NOT NULL, 
	total_orders INTEGER NOT NULL, 
	orders_on_time INTEGER NOT NULL, 
	avg_delivery_time_min FLOAT NOT NULL, 
	orders_per_hour FLOAT NOT NULL, 
	sla_compliance_pct FLOAT NOT NULL, 
	total_distance_km FLOAT NOT NULL, 
	total_earnings FLOAT NOT NULL, 
	performance_score FLOAT NOT NULL, 
	created_at TIMESTAMP WITH TIME ZONE NOT NULL, 
	PRIMARY KEY (id), 
	FOREIGN KEY(rider_id) REFERENCES riders (id)
)

-- Tabla: shifts
CREATE TABLE shifts (
	id UUID NOT NULL, 
	rider_id UUID NOT NULL, 
	checkin_at TIMESTAMP WITH TIME ZONE NOT NULL, 
	checkout_at TIMESTAMP WITH TIME ZONE, 
	checkin_lat FLOAT, 
	checkin_lng FLOAT, 
	status shiftstatus NOT NULL, 
	total_orders INTEGER NOT NULL, 
	total_earnings FLOAT NOT NULL, 
	duration_hours FLOAT, 
	PRIMARY KEY (id), 
	FOREIGN KEY(rider_id) REFERENCES riders (id)
)

-- Tabla: deliveries
CREATE TABLE deliveries (
	id UUID NOT NULL, 
	order_id UUID NOT NULL, 
	rider_id UUID NOT NULL, 
	photo_url VARCHAR(500), 
	signature_url VARCHAR(500), 
	otp_code VARCHAR(10), 
	otp_verified BOOLEAN NOT NULL, 
	delivery_lat FLOAT, 
	delivery_lng FLOAT, 
	pickup_at TIMESTAMP WITH TIME ZONE, 
	delivered_at TIMESTAMP WITH TIME ZONE, 
	duration_minutes FLOAT, 
	distance_km FLOAT, 
	on_time BOOLEAN, 
	customer_rating INTEGER, 
	notes TEXT, 
	created_at TIMESTAMP WITH TIME ZONE NOT NULL, 
	PRIMARY KEY (id), 
	UNIQUE (order_id), 
	FOREIGN KEY(order_id) REFERENCES orders (id), 
	FOREIGN KEY(rider_id) REFERENCES riders (id)
)

-- Tabla: financials
CREATE TABLE financials (
	id UUID NOT NULL, 
	rider_id UUID NOT NULL, 
	order_id UUID, 
	rule_type paymentruletype NOT NULL, 
	base_amount FLOAT NOT NULL, 
	distance_bonus FLOAT NOT NULL, 
	time_bonus FLOAT NOT NULL, 
	volume_bonus FLOAT NOT NULL, 
	total_amount FLOAT NOT NULL, 
	operational_cost FLOAT NOT NULL, 
	margin FLOAT NOT NULL, 
	period_date TIMESTAMP WITH TIME ZONE NOT NULL, 
	liquidated BOOLEAN NOT NULL, 
	liquidated_at TIMESTAMP WITH TIME ZONE, 
	created_at TIMESTAMP WITH TIME ZONE NOT NULL, 
	PRIMARY KEY (id), 
	FOREIGN KEY(rider_id) REFERENCES riders (id), 
	FOREIGN KEY(order_id) REFERENCES orders (id)
)

-- Tabla: routes
CREATE TABLE routes (
	id UUID NOT NULL, 
	rider_id UUID NOT NULL, 
	order_id UUID, 
	gps_points JSONB NOT NULL, 
	distance_km FLOAT NOT NULL, 
	deviation_detected BOOLEAN NOT NULL, 
	deviation_details JSONB NOT NULL, 
	started_at TIMESTAMP WITH TIME ZONE, 
	ended_at TIMESTAMP WITH TIME ZONE, 
	created_at TIMESTAMP WITH TIME ZONE NOT NULL, 
	PRIMARY KEY (id), 
	FOREIGN KEY(rider_id) REFERENCES riders (id), 
	FOREIGN KEY(order_id) REFERENCES orders (id)
)

