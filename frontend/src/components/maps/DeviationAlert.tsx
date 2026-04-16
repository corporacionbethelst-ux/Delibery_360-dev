"use client";

import { AlertTriangle, MapPin, Clock } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

/**
 * Componente para mostrar alertas de desviación en mapa
 * Notifica cuando un repartidor se desvía de la ruta esperada
 */
export default function DeviationAlert({ alert, onDismiss, onViewDetails }) {
  // Obtener color según severidad de la alerta
  const getSeverityColor = (severity) => {
    switch (severity) {
      case "high":
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
  const getSeverityText = (severity) => {
    switch (severity) {
      case "high":
        return "Alta";
      case "medium":
        return "Media";
      case "low":
        return "Baja";
      default:
        return severity;
    }
  };

  return (
    <div
      className={`p-4 rounded-lg border-l-4 shadow-md ${getSeverityColor(alert?.severity || "low")}`}
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
                El repartidor se ha desviado {alert?.deviationDistance || "500m"} de la ruta óptima
              </p>
            </div>
            <Badge variant="outline">
              Severidad: {getSeverityText(alert?.severity || "low")}
            </Badge>
          </div>
          
          {/* Detalles adicionales */}
          <div className="mt-3 grid gap-2 text-xs">
            <div className="flex items-center gap-2">
              <MapPin className="h-3 w-3" />
              <span>Ubicación actual: {alert?.currentLocation || "Desconocida"}</span>
            </div>
            <div className="flex items-center gap-2">
              <Clock className="h-3 w-3" />
              <span>Hace {alert?.timeAgo || "2 min"}</span>
            </div>
          </div>
          
          {/* Acciones */}
          <div className="mt-3 flex gap-2">
            <Button
              size="sm"
              variant="secondary"
              onClick={() => onViewDetails && onViewDetails(alert)}
            >
              Ver detalles
            </Button>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => onDismiss && onDismiss(alert.id)}
            >
              Descartar
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
