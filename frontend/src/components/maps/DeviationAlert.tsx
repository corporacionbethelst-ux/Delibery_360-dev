"use client";

import { AlertTriangle, MapPin, Clock } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

// Definición de tipos
export type AlertSeverity = "low" | "medium" | "high" | "critical";

export interface AlertData {
  id: string;
  severity: AlertSeverity;
  deviationDistance?: string;
  currentLocation?: string;
  timeAgo?: string;
  [key: string]: unknown; // Para permitir propiedades adicionales dinámicas
}

interface DeviationAlertProps {
  alert?: AlertData;
  onDismiss?: (id: string) => void;
  onViewDetails?: (alert: AlertData) => void;
}

/**
 * Componente para mostrar alertas de desviación en mapa
 * Notifica cuando un repartidor se desvía de la ruta esperada
 */
export default function DeviationAlert({ 
  alert, 
  onDismiss, 
  onViewDetails 
}: DeviationAlertProps) {
  
  // Valores por defecto si alert es undefined
  const severity = alert?.severity || "low";
  const deviationDistance = alert?.deviationDistance || "500m";
  const currentLocation = alert?.currentLocation || "Desconocida";
  const timeAgo = alert?.timeAgo || "2 min";
  const alertId = alert?.id || "unknown";

  // Obtener color según severidad de la alerta
  const getSeverityColor = (sev: AlertSeverity) => {
    switch (sev) {
      case "high":
      case "critical":
        return "bg-red-100 border-red-500 text-red-800";
      case "medium":
        return "bg-yellow-100 border-yellow-500 text-yellow-800";
      case "low":
        return "bg-blue-100 border-blue-500 text-blue-800";
      default:
        return "bg-gray-100 border-gray-500 text-gray-800";
    }
  };

  // Obtener texto de severidad en español
  const getSeverityText = (sev: AlertSeverity) => {
    switch (sev) {
      case "high":
        return "Alta";
      case "medium":
        return "Media";
      case "low":
        return "Baja";
      case "critical":
        return "Crítica";
      default:
        return sev;
    }
  };

  return (
    <div
      className={`p-4 rounded-lg border-l-4 shadow-md ${getSeverityColor(severity)}`}
    >
      <div className="flex items-start gap-3">
        {/* Ícono de alerta */}
        <AlertTriangle className="h-5 w-5 flex-shrink-0 mt-0.5" />
        
        {/* Contenido de la alerta */}
        <div className="flex-1">
          <div className="flex justify-between items-start">
            <div>
              <h4 className="font-semibold text-sm">Desviación de Ruta Detectada</h4>
              <p className="text-xs mt-1">
                El repartidor se ha desviado {deviationDistance} de la ruta óptima
              </p>
            </div>
            <Badge variant="outline">
              Severidad: {getSeverityText(severity)}
            </Badge>
          </div>
          
          {/* Detalles adicionales */}
          <div className="mt-3 grid gap-2 text-xs">
            <div className="flex items-center gap-2">
              <MapPin className="h-3 w-3" />
              <span>Ubicación actual: {currentLocation}</span>
            </div>
            <div className="flex items-center gap-2">
              <Clock className="h-3 w-3" />
              <span>Hace {timeAgo}</span>
            </div>
          </div>
          
          {/* Acciones */}
          <div className="mt-3 flex gap-2">
            <Button
              size="sm"
              variant="secondary"
              onClick={() => alert && onViewDetails?.(alert)}
            >
              Ver detalles
            </Button>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => onDismiss?.(alertId)}
            >
              Descartar
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}