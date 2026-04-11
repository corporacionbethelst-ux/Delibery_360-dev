// Tipos TypeScript para Riders - Delivery360

export type RiderStatus = 'PENDIENTE' | 'ACTIVO' | 'INACTIVO' | 'SUSPENDIDO';
export type RiderVehicleType = 'MOTO' | 'BICICLETA' | 'AUTO' | 'PIE';
export type RiderLevel = number; // 1-10

export interface RiderLocation {
  latitude: number;
  longitude: number;
  lastUpdate: Date;
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
