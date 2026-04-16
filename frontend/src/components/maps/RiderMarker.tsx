"use client";

import { MapPin, User, Bike } from "lucide-react";

/**
 * Componente para mostrar marcador de repartidor en mapa
 * Muestra ubicación actual del repartidor con ícono y información básica
 */
export default function RiderMarker({ rider, position, onClick }) {
  // Renderizar marcador con información del repartidor
  return (
    <div
      className="cursor-pointer transform hover:scale-110 transition-transform"
      onClick={() => onClick && onClick(rider)}
      title={rider?.name || "Repartidor"}
    >
      <div className="relative">
        {/* Ícono del repartidor */}
        <div className="bg-blue-600 rounded-full p-2 shadow-lg">
          <Bike className="h-6 w-6 text-white" />
        </div>
        
        {/* Indicador de estado en vivo */}
        <div className="absolute -top-1 -right-1">
          <div className="w-3 h-3 bg-green-500 rounded-full border-2 border-white animate-pulse" />
        </div>
      </div>
      
      {/* Tooltip con información */}
      {rider && (
        <div className="absolute left-8 top-0 bg-white px-3 py-2 rounded shadow-md min-w-[150px] z-10">
          <p className="font-semibold text-sm">{rider.name}</p>
          <p className="text-xs text-muted-foreground">
            {rider.status === "online" ? "En línea" : "Ocupado"}
          </p>
          {rider.currentDelivery && (
            <p className="text-xs text-blue-600 mt-1">
              Entrega: {rider.currentDelivery}
            </p>
          )}
        </div>
      )}
    </div>
  );
}
