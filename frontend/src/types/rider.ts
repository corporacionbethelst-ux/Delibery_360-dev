// Tipos TypeScript para Riders - Delivery360

export type RiderStatus = 'PENDIENTE' | 'ACTIVO' | 'INACTIVO' | 'SUSPENDIDO';
export type RiderVehicleType = 'MOTO' | 'BICICLETA' | 'AUTO' | 'PIE' | 'NO_ESPECIFICADO';
export type RiderLevel = number; // 1-10

export interface RiderLocation {
  latitude: number;
  longitude: number;
  lastUpdate: Date;
}

export interface RiderProfile {
  id: string;
  userId: string;
  fullName: string;
  phoneNumber: string;
  vehicleType: 'motorcycle' | 'bicycle' | 'car' | 'van';
  vehiclePlate?: string;
  status: 'active' | 'inactive' | 'suspended';
  rating: number;
  completedDeliveries: number;
}

export interface RiderVehicle {
  type: RiderVehicleType;
  plate?: string;
  model?: string;
  color?: string;
  year?: number;
}

export interface RiderStats {
  totalDeliveries: number;
  completedDeliveries: number;
  cancelledDeliveries: number;
  averageDeliveryTime: number; // en minutos
  onTimePercentage: number;
  customerRating: number; // 0-5
  totalEarnings: number;
  todayEarnings: number;
  weekEarnings: number;
  monthEarnings: number;
}

export interface RiderPerformance {
  level: RiderLevel;
  totalPoints: number;
  badges: string[];
  efficiency: number; // 0-100
  slaCompliance: number; // 0-100
}

export interface Rider {
  id: string;
  userId: string;
  
  // Información personal (enmascarada por LGPD)
  fullName: string;
  email: string;
  phone: string;
  cpf?: string; // Enmascarado
  cnh?: string;
  birthDate?: Date;
  
  // Vehículo
  vehicle: RiderVehicle;
  
  // Estado
  status: RiderStatus;
  isOnline: boolean;
  currentShiftId?: string;
  
  // Ubicación
  location?: RiderLocation;
  operatingZone?: string;
  
  // Performance
  stats: RiderStats;
  performance: RiderPerformance;
  
  // Documentos
  documentUrls?: string[];
  backgroundCheckStatus?: 'PENDIENTE' | 'APROBADO' | 'RECHAZADO';
  
  // Fechas importantes
  createdAt: Date;
  approvedAt?: Date;
  lastLoginAt?: Date;
  lastActiveAt?: Date;
  
  // Configuración
  maxDailyHours?: number;
  preferredZones?: string[];
  notificationsEnabled: boolean;
}

export interface RiderCreateInput {
  fullName: string;
  email: string;
  password: string;
  phone: string;
  cpf: string;
  cnh?: string;
  birthDate: Date;
  vehicle: Omit<RiderVehicle, 'year'> & { year?: number };
  operatingZone?: string;
}

export interface RiderUpdateInput {
  phone?: string;
  vehicle?: Partial<RiderVehicle>;
  operatingZone?: string;
  status?: RiderStatus;
  notificationsEnabled?: boolean;
  maxDailyHours?: number;
  preferredZones?: string[];
}

export interface RiderApproval {
  riderId: string;
  approvedBy: string;
  approvedAt: Date;
  status: 'APROBADO' | 'RECHAZADO';
  rejectionReason?: string;
  observations?: string;
}

export interface RiderFilters {
  status?: RiderStatus[];
  isOnline?: boolean;
  vehicleType?: RiderVehicleType[];
  operatingZone?: string;
  search?: string;
  dateFrom?: Date;
  dateTo?: Date;
}

export interface RiderDocument {
  id: string;
  riderId: string;
  type: 'CNH' | 'CPF' | 'COMPROBANTE_DOMICILIO' | 'FOTO_PERFIL' | 'OTRO';
  url: string;
  uploadedAt: Date;
  verifiedAt?: Date;
  verifiedBy?: string;
  status: 'PENDIENTE' | 'VERIFICADO' | 'RECHAZADO';
  rejectionReason?: string;
}

// ... (otras interfaces existentes como Rider, RiderVehicle, etc.)

/**
 * Tipos de turno disponibles
 */
export type ShiftType = 'MORNING' | 'AFTERNOON' | 'NIGHT' | 'GENERAL';

/**
 * Estado del turno
 */
export type ShiftStatus = 'SCHEDULED' | 'ACTIVE' | 'COMPLETED' | 'CANCELLED';

/**
 * Interfaz para la gestión de turnos de repartidores
 */
export interface Shift {
  id: string;
  riderId: string;
  
  // Tipo y estado
  type: ShiftType;
  status: ShiftStatus;
  
  // Tiempos
  startTime: Date;
  endTime?: Date;       // Null si el turno está activo o no ha terminado
  scheduledStart: Date; // Hora programada de inicio
  scheduledEnd: Date;   // Hora programada de fin
  
  // Estado actual
  isActive: boolean;    // True si el turno está en curso ahora mismo
  
  // Ubicación de inicio/fin (opcional)
  startLocation?: {
    latitude: number;
    longitude: number;
    address: string;
  };
  endLocation?: {
    latitude: number;
    longitude: number;
    address: string;
  };
  
  // Métricas del turno
  totalDeliveries?: number;
  totalEarnings?: number;
  totalHours?: number;  // Horas reales trabajadas
  
  // Notas o incidencias
  notes?: string;
  incidentReport?: string;
  
  // Auditoría
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Input para crear un nuevo turno
 */
export interface ShiftCreateInput {
  riderId: string;
  type: ShiftType;
  scheduledStart: Date;
  scheduledEnd: Date;
  notes?: string;
}

/**
 * Input para actualizar un turno (ej. marcar inicio/fin)
 */
export interface ShiftUpdateInput {
  status?: ShiftStatus;
  isActive?: boolean;
  endTime?: Date;
  startLocation?: Shift['startLocation'];
  endLocation?: Shift['endLocation'];
  notes?: string;
  incidentReport?: string;
}

/**
 * Filtros para búsqueda de turnos
 */
export interface ShiftFilters {
  riderId?: string;
  type?: ShiftType[];
  status?: ShiftStatus[];
  isActive?: boolean;
  dateFrom?: Date;
  dateTo?: Date;
}

// ... (resto del archivo)
