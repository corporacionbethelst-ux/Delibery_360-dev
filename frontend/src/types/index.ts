/**
 * Tipos globales de Delivery360
 * Exporta todos los tipos utilizados en el frontend
 */

export interface User {
  id: string;
  email: string;
  full_name: string;
  role: 'superadmin' | 'gerente' | 'operador' | 'repartidor';
  created_at?: string;
  updated_at?: string;
}

export interface Rider {
  id: string;
  user_id: string;
  phone: string;
  vehicle_type: 'bicicleta' | 'motocicleta' | 'auto' | 'furgoneta';
  license_plate?: string;
  status: 'disponible' | 'ocupado' | 'offline' | 'en_turno';
  current_lat?: number;
  current_lng?: number;
  rating?: number;
  total_deliveries?: number;
  created_at?: string;
  updated_at?: string;
}

export interface Customer {
  id: string;
  name: string;
  email?: string;
  phone: string;
  address?: string;
}

export interface Order {
  id: string;
  customer_id: string;
  status: 'pendiente' | 'confirmada' | 'en_preparacion' | 'lista_para_retiro' | 'en_transito' | 'entregada' | 'cancelada';
  pickup_address: string;
  pickup_lat?: number;
  pickup_lng?: number;
  delivery_address: string;
  delivery_lat?: number;
  delivery_lng?: number;
  items: OrderItem[];
  total_amount: number;
  notes?: string;
  estimated_pickup_time?: string;
  estimated_delivery_time?: string;
  assigned_rider_id?: string;
  created_at?: string;
  updated_at?: string;
}

export interface OrderItem {
  id: string;
  name: string;
  quantity: number;
  price: number;
  notes?: string;
}

export interface Delivery {
  id: string;
  order_id: string;
  rider_id: string;
  status: 'asignada' | 'recogida' | 'en_camino' | 'entregada' | 'fallida';
  picked_up_at?: string;
  delivered_at?: string;
  proof_of_delivery?: string; // URL de foto o firma
  notes?: string;
  created_at?: string;
  updated_at?: string;
}

export interface Shift {
  id: string;
  rider_id: string;
  start_time: string;
  end_time?: string;
  status: 'activo' | 'finalizado' | 'pausado';
  total_earnings?: number;
  total_deliveries?: number;
  created_at?: string;
}

export interface Notification {
  id: string;
  user_id: string;
  type: 'info' | 'warning' | 'error' | 'success';
  title: string;
  message: string;
  read: boolean;
  created_at?: string;
}

// Tipos para respuestas de API
export interface ApiResponse<T> {
  data: T;
  message?: string;
  success: boolean;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  per_page: number;
  total_pages: number;
}

// Filtros comunes
export interface PaginationParams {
  page?: number;
  per_page?: number;
  sort_by?: string;
  sort_order?: 'asc' | 'desc';
}

export interface OrderFilters extends PaginationParams {
  status?: Order['status'];
  rider_id?: string;
  date_from?: string;
  date_to?: string;
}

export interface RiderFilters extends PaginationParams {
  status?: Rider['status'];
  vehicle_type?: Rider['vehicle_type'];
}
