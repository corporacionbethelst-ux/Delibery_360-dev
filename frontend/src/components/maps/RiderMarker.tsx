"use client";

import { MapPin, User, Bike } from "lucide-react";
import type { Rider } from "@/types/rider";
import type { GeoPosition } from "@/hooks/useGeolocation"; // Asumiendo que tienes este tipo

interface RiderMarkerProps {
  rider: Rider;
  position?: GeoPosition; // Opcional, si usas la posición del hook
  onClick?: (rider: Rider) => void;
}

/**
 * Componente para mostrar marcador de repartidor en mapa
 * Muestra ubicación actual del repartidor con ícono y información básica
 */
export default function RiderMarker({ rider, position, onClick }: RiderMarkerProps) {
  // Determinar si está "online" basado en el status del enum
  const isOnline = rider.status === 'ACTIVO' && rider.isOnline;
  
  // Color del indicador según estado
  const indicatorColor = isOnline ? 'bg-green-500' : 'bg-yellow-500';

  // Renderizar marcador con información del repartidor
  return (
    <div
      className="cursor-pointer transform hover:scale-110 transition-transform"
      onClick={() => onClick && onClick(rider)}
      title={rider.fullName || "Repartidor"}
    >
      <div className="relative">
        {/* Ícono del repartidor */}
        <div className="bg-blue-600 rounded-full p-2 shadow-lg flex items-center justify-center">
          <Bike className="h-6 w-6 text-white" />
        </div>
        
        {/* Indicador de estado en vivo */}
        <div className="absolute -top-1 -right-1">
          <div className={`w-3 h-3 ${indicatorColor} rounded-full border-2 border-white animate-pulse`} />
        </div>
      </div>
      
      {/* Tooltip con información */}
      <div className="absolute left-8 top-0 bg-white px-3 py-2 rounded shadow-md min-w-[150px] z-10 hidden group-hover:block">
        <p className="font-semibold text-sm">{rider.fullName}</p>
        <p className="text-xs text-muted-foreground">
          {isOnline ? "En Línea" : "Ocupado"}
        </p>
        {rider.operatingZone && (
          <p className="text-xs text-blue-600 mt-1 flex items-center gap-1">
            <MapPin className="h-3 w-3" />
            {rider.operatingZone}
          </p>
        )}
        {rider.stats && (
          <p className="text-xs text-gray-500 mt-1">
            {rider.stats.totalDeliveries} entregas
          </p>
        )}
      </div>
    </div>
  );
}