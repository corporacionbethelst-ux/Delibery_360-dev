/**
 * Tipos globales de Delivery360
 * Exporta todos los tipos utilizados en el frontend
 */

// Enums unificados para estados (VALORES EN MAYÚSCULAS PARA CONSISTENCIA)
export enum OrderStatus {
  PENDIENTE = 'PENDIENTE',
  ASIGNADO = 'ASIGNADO',
  EN_PREPARACION = 'EN_PREPARACION',
  LISTO_PARA_RECOLECCION = 'LISTO_PARA_RECOLECCION',
  EN_RECOLECCION = 'EN_RECOLECCION',
  RECOLECTADO = 'RECOLECTADO',
  EN_RUTA = 'EN_RUTA',
  EN_ENTREGA = 'EN_ENTREGA',
  ENTREGADO = 'ENTREGADO',
  CANCELADO = 'CANCELADO',
  FALLIDO = 'FALLIDO',
}

export const ORDER_STATUS_LABELS: Record<OrderStatus, string> = {
  [OrderStatus.PENDIENTE]: 'Pendiente',
  [OrderStatus.ASIGNADO]: 'Asignado',
  [OrderStatus.EN_PREPARACION]: 'En Preparación',
  [OrderStatus.LISTO_PARA_RECOLECCION]: 'Listo para Recolección',
  [OrderStatus.EN_RECOLECCION]: 'En Recolección',
  [OrderStatus.RECOLECTADO]: 'Recolectado',
  [OrderStatus.EN_RUTA]: 'En Ruta',
  [OrderStatus.EN_ENTREGA]: 'En Entrega',
  [OrderStatus.ENTREGADO]: 'Entregado',
  [OrderStatus.CANCELADO]: 'Cancelado',
  [OrderStatus.FALLIDO]: 'Fallido',
};

export const ORDER_STATUS_COLORS: Record<OrderStatus, string> = {
  [OrderStatus.PENDIENTE]: 'bg-gray-100 text-gray-800',
  [OrderStatus.ASIGNADO]: 'bg-blue-100 text-blue-800',
  [OrderStatus.EN_PREPARACION]: 'bg-yellow-100 text-yellow-800',
  [OrderStatus.LISTO_PARA_RECOLECCION]: 'bg-orange-100 text-orange-800',
  [OrderStatus.EN_RECOLECCION]: 'bg-purple-100 text-purple-800',
  [OrderStatus.RECOLECTADO]: 'bg-indigo-100 text-indigo-800',
  [OrderStatus.EN_RUTA]: 'bg-blue-100 text-blue-800',
  [OrderStatus.EN_ENTREGA]: 'bg-cyan-100 text-cyan-800',
  [OrderStatus.ENTREGADO]: 'bg-green-100 text-green-800',
  [OrderStatus.CANCELADO]: 'bg-red-100 text-red-800',
  [OrderStatus.FALLIDO]: 'bg-red-100 text-red-800',
};

export type UserRole = 'SUPERADMIN' | 'GERENTE' | 'OPERADOR' | 'REPARTIDOR';

export type Permission = {
  module: string;
  action: string;
};

export type RiderStatus = 'PENDIENTE' | 'ACTIVO' | 'INACTIVO' | 'SUSPENDIDO';

export type VehicleType = 'MOTO' | 'BICICLETA' | 'AUTO' | 'PIE';

export interface User {
  id: string;
  email: string;
  full_name: string;
  role: 'SUPERADMIN' | 'GERENTE' | 'OPERADOR' | 'REPARTIDOR';
  created_at?: string;
  updated_at?: string;
}

export interface Rider {
  id: string;
  user_id: string;
  phone: string;
  vehicle_type: 'BICICLETA' | 'MOTOCICLETA' | 'AUTO' | 'FURGONETA';
  license_plate?: string;
  status: 'DISPONIBLE' | 'OCUPADO' | 'OFFLINE' | 'EN_TURNO';
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
  status: 'PENDIENTE' | 'CONFIRMADO' | 'EN_PREPARACION' | 'LISTO_PARA_RETIRO' | 'EN_TRANSITO' | 'ENTREGADO' | 'CANCELADO';
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
  status: 'ASIGNADO' | 'RECOGIDO' | 'EN_CAMINO' | 'ENTREGADO' | 'FALLIDO';
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
  status: 'ACTIVO' | 'FINALIZADO' | 'PAUSADO';
  total_earnings?: number;
  total_deliveries?: number;
  created_at?: string;
}

export interface Notification {
  id: string;
  user_id: string;
  type: 'INFO' | 'WARNING' | 'ERROR' | 'SUCCESS';
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

export interface OrderUpdate {
  orderId: string;
  status: string;
  data: any;
  timestamp: string;
}

export interface DeliveryUpdate {
  deliveryId: string;
  status: string;
  data: any;
  timestamp: string;
}

export interface RiderLocationUpdate {
  riderId: string;
  latitude: number;
  longitude: number;
  timestamp: string;
}

export interface AlertMessage {
  id: string;
  type: 'INFO' | 'WARNING' | 'ERROR' | 'SUCCESS';
  message: string;
  timestamp: string;
}

// Auth & Usuarios
export * from './user';

// Órdenes y Entregas
export * from './order';      // ✅ Usando el archivo que ya tienes (singular)
export * from './delivery';   // Asegúrate de que este también exista

// Repartidores
export * from './rider';

// Alertas y Notificaciones
export * from './alerts';

// Tipos globales o utilitarios (si los tienes)
// export * from './common'; 
