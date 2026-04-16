// Tipos TypeScript para Alertas - Delivery360
// Define la estructura de alertas del sistema para notificaciones en tiempo real

export type AlertType = 
  | 'ENTREGA_RETASADA'
  | 'RIDER_SIN_RESPUESTA'
  | 'RUTA_DESVIADA'
  | 'ORDEN_CANCELADA'
  | 'INCIDENTE_SEGURIDAD'
  | 'PROBLEMA_TECNICO'
  | 'ALERTA_CLIMA'
  | 'TRAfico_INTENSO'
  | 'BAJO_RENDIMIENTO'
  | 'FALLO_PAGO'
  | 'OTRO';

export type AlertSeverity = 'BAJA' | 'MEDIA' | 'ALTA' | 'CRITICA';

export type AlertStatus = 'ACTIVA' | 'EN_PROGRESO' | 'RESUELTA' | 'DESCARTADA';

export interface AlertLocation {
  latitude: number;
  longitude: number;
  address?: string;
}

export interface Alert {
  id: string;
  type: AlertType;
  severity: AlertSeverity;
  status: AlertStatus;
  
  // Información descriptiva
  title: string;
  message: string;
  description?: string;
  
  // Entidades relacionadas
  orderId?: string;
  deliveryId?: string;
  riderId?: string;
  userId?: string;
  
  // Ubicación del incidente
  location?: AlertLocation;
  
  // Metadatos
  metadata?: Record<string, unknown>;
  
  // Fechas
  createdAt: Date;
  updatedAt?: Date;
  resolvedAt?: Date;
  
  // Resolución
  resolvedBy?: string;
  resolutionNotes?: string;
  
  // Notificaciones
  notifiedUsers: string[];
  escalationLevel: number;
}

export interface AlertCreateInput {
  type: AlertType;
  severity: AlertSeverity;
  title: string;
  message: string;
  description?: string;
  orderId?: string;
  deliveryId?: string;
  riderId?: string;
  location?: AlertLocation;
  metadata?: Record<string, unknown>;
}

export interface AlertUpdateInput {
  status?: AlertStatus;
  resolutionNotes?: string;
  metadata?: Record<string, unknown>;
}

export interface AlertFilters {
  type?: AlertType[];
  severity?: AlertSeverity[];
  status?: AlertStatus[];
  riderId?: string;
  orderId?: string;
  dateFrom?: Date;
  dateTo?: Date;
  search?: string;
}

export interface AlertStats {
  total: number;
  byType: Record<AlertType, number>;
  bySeverity: Record<AlertSeverity, number>;
  byStatus: Record<AlertStatus, number>;
  averageResolutionTime: number; // en minutos
}

export interface AlertNotification {
  alertId: string;
  userId: string;
  notifiedAt: Date;
  readAt?: Date;
  channel: 'PUSH' | 'EMAIL' | 'SMS' | 'IN_APP';
  success: boolean;
  errorMessage?: string;
}

export interface AlertSubscription {
  userId: string;
  alertTypes: AlertType[];
  severities: AlertSeverity[];
  channels: ('PUSH' | 'EMAIL' | 'SMS' | 'IN_APP')[];
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}
