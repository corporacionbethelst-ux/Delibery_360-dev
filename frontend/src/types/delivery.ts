// Tipos TypeScript para Deliveries - Delivery360
import { Order } from './order';
import { Rider } from './rider';

export type DeliveryStatus = 
  | 'PENDIENTE'
  | 'ASIGNADO'
  | 'RECOGIDO'
  | 'EN_CAMINO'
  | 'ENTREGADO'
  | 'FALLIDO'
  | 'CANCELADO';

export type DeliveryType = 'STANDARD' | 'EXPRESS' | 'PROGRAMADO' | 'AGENDADO';

export type ProofType = 'FIRMA' | 'FOTO' | 'CODIGO' | 'OTP';

export interface DeliveryLocation {
  latitude: number;
  longitude: number;
  address: string;
  neighborhood: string;
  city: string;
  state: string;
  zipCode: string;
  reference?: string;
}

export interface ProofOfDelivery {
  type: ProofType;
  signatureUrl?: string;
  photoUrls?: string[];
  code?: string;
  otp?: string;
  recipientName?: string;
  recipientPhone?: string;
  notes?: string;
  timestamp: Date;
}

export interface DeliveryEvent {
  id: string;
  deliveryId: string;
  status: DeliveryStatus;
  timestamp: Date;
  location?: {
    latitude: number;
    longitude: number;
  };
  description: string;
  performedBy?: string;
  metadata?: Record<string, unknown>;
}

export interface Delivery {
  id: string;
  deliveryNumber: string;
  
  // Orden asociada
  orderId: string;
  order?: Order;
  
  // Estado
  status: DeliveryStatus;
  type: DeliveryType;
  priority: 'NORMAL' | 'ALTA' | 'URGENTE';
  
  // Asignación
  riderId?: string;
  rider?: Rider;
  
  // Ubicaciones
  pickupLocation: DeliveryLocation;
  deliveryLocation: DeliveryLocation;
  
  // Tiempos estimados y reales
  estimatedPickupTime?: Date;
  estimatedDeliveryTime?: Date;
  actualPickupTime?: Date;
  actualDeliveryTime?: Date;
  
  // Prueba de entrega
  proofOfDelivery?: ProofOfDelivery;
  
  // Eventos de tracking
  events: DeliveryEvent[];
  
  // Información adicional
  observations?: string;
  internalNotes?: string;
  customerInstructions?: string;
  
  // Valores
  deliveryFee: number;
  distanceKm: number;
  durationMinutes: number;
  
  // Fechas de auditoría
  createdAt: Date;
  updatedAt: Date;
  completedAt?: Date;
  cancelledAt?: Date;
  
  // Cancelación/Fallo
  cancellationReason?: string;
  failureReason?: string;
  cancelledBy?: string;
}

export interface DeliveryCreateInput {
  orderId: string;
  type: DeliveryType;
  priority?: 'NORMAL' | 'ALTA' | 'URGENTE';
  riderId?: string;
  pickupLocation: Omit<DeliveryLocation, 'address'> & { address: string };
  deliveryLocation: Omit<DeliveryLocation, 'address'> & { address: string };
  estimatedPickupTime?: Date;
  estimatedDeliveryTime?: Date;
  observations?: string;
  customerInstructions?: string;
}

export interface DeliveryUpdateInput {
  status?: DeliveryStatus;
  riderId?: string | null;
  estimatedPickupTime?: Date;
  estimatedDeliveryTime?: Date;
  observations?: string;
  internalNotes?: string;
}

export interface DeliveryAssignment {
  deliveryId: string;
  riderId: string;
  assignedBy: string;
  assignedAt: Date;
  acceptedAt?: Date;
  rejectedAt?: Date;
  rejectionReason?: string;
}

export interface DeliveryFilters {
  status?: DeliveryStatus[];
  type?: DeliveryType[];
  riderId?: string;
  orderId?: string;
  dateFrom?: Date;
  dateTo?: Date;
  search?: string;
}

export interface DeliveryStats {
  total: number;
  byStatus: Record<DeliveryStatus, number>;
  byType: Record<DeliveryType, number>;
  averageDeliveryTime: number; // en minutos
  onTimePercentage: number;
  successRate: number;
  totalDistance: number; // km
  totalRevenue: number;
}

export interface DeliveryRoute {
  deliveryId: string;
  route: Array<{
    latitude: number;
    longitude: number;
    timestamp: Date;
    speed?: number;
  }>;
  totalDistance: number;
  totalDuration: number;
  deviations: Array<{
    timestamp: Date;
    expectedLocation: { latitude: number; longitude: number };
    actualLocation: { latitude: number; longitude: number };
    deviationMeters: number;
  }>;
}
