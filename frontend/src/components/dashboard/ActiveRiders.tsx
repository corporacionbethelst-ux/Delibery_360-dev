'use client';


import React from 'react';
import { useRouter } from 'next/navigation';
import { MapPin, Phone, Star, Clock, TrendingUp, TrendingDown } from 'lucide-react';

interface Rider {
  id: string;
  full_name: string;
  email: string;
  phone?: string;
  status: 'active' | 'inactive' | 'busy' | 'offline';
  current_order_id?: string;
  completed_today?: number;
  earnings_today?: number;
  rating?: number;
  avatar_url?: string;
  location?: {
    lat: number;
    lng: number;
    address?: string;
  };
  shift_start?: string;
}

interface ActiveRidersProps {
  riders: Rider[];
  isLoading?: boolean;
  title?: string;
  limit?: number;
  onViewRider?: (riderId: string) => void;
  onCallRider?: (riderId: string) => void;
}

export function ActiveRiders({ 
  riders, 
  isLoading = false, 
  title = 'Repartidores Activos',
  limit = 10,
  onViewRider,
  onCallRider
}: ActiveRidersProps) {
  const router = useRouter();

  const getStatusBadge = (status: string) => {
    const statusConfig: Record<string, { bg: string; text: string; label: string }> = {
      active: { bg: 'bg-green-100', text: 'text-green-800', label: 'Disponible' },
      inactive: { bg: 'bg-gray-100', text: 'text-gray-800', label: 'Inactivo' },
      busy: { bg: 'bg-blue-100', text: 'text-blue-800', label: 'Ocupado' },
      offline: { bg: 'bg-red-100', text: 'text-red-800', label: 'Desconectado' },
    };

    const config = statusConfig[status] || statusConfig['inactive'];

    return (
      <span className={`inline-flex items-center px-2 py-1 text-xs rounded-full ${config.bg} ${config.text}`}>
        {config.label}
      </span>
    );
  };

  const handleViewRider = (riderId: string) => {
    if (onViewRider) {
      onViewRider(riderId);
    } else {
      router.push(`/manager/riders?id=${riderId}`);
    }
  };

  const handleCallRider = (riderId: string) => {
    if (onCallRider) {
      onCallRider(riderId);
    } else {
      // Simular llamada o abrir teléfono
      alert(`Llamando al repartidor ${riderId}`);
    }
  };

  if (isLoading) {
    return (
      <div className="bg-white rounded-xl shadow-sm">
        <div className="p-6 border-b">
          <h2 className="text-lg font-semibold text-gray-900">{title}</h2>
        </div>
        <div className="p-6">
          <div className="animate-pulse space-y-4">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="flex items-center space-x-4">
                <div className="h-10 w-10 bg-gray-200 rounded-full"></div>
                <div className="flex-1">
                  <div className="h-4 bg-gray-200 rounded w-1/3 mb-2"></div>
                  <div className="h-3 bg-gray-200 rounded w-1/4"></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (!riders || riders.length === 0) {
    return (
      <div className="bg-white rounded-xl shadow-sm">
        <div className="p-6 border-b">
          <h2 className="text-lg font-semibold text-gray-900">{title}</h2>
        </div>
        <div className="p-6 text-center">
          <UsersIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-500">No hay repartidores activos</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow-sm">
      <div className="p-6 border-b flex justify-between items-center">
        <h2 className="text-lg font-semibold text-gray-900">{title}</h2>
        <button
          onClick={() => router.push('/manager/riders')}
          className="text-sm text-blue-600 hover:text-blue-700 hover:underline"
        >
          Ver todos →
        </button>
      </div>
      <div className="divide-y divide-gray-100">
        {riders.slice(0, limit).map((rider) => (
          <div key={rider.id} className="p-4 hover:bg-gray-50 transition-colors">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                {/* Avatar */}
                <div className="relative">
                  {rider.avatar_url ? (
                    <img
                      src={rider.avatar_url}
                      alt={rider.full_name}
                      className="h-10 w-10 rounded-full object-cover"
                    />
                  ) : (
                    <div className="h-10 w-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-medium">
                      {rider.full_name.charAt(0)}
                    </div>
                  )}
                  {/* Status indicator */}
                  <span className={`absolute bottom-0 right-0 h-3 w-3 rounded-full border-2 border-white ${
                    rider.status === 'active' ? 'bg-green-500' :
                    rider.status === 'busy' ? 'bg-blue-500' :
                    rider.status === 'offline' ? 'bg-red-500' :
                    'bg-gray-400'
                  }`}></span>
                </div>

                {/* Info */}
                <div>
                  <div className="flex items-center space-x-2">
                    <h3 className="text-sm font-medium text-gray-900">{rider.full_name}</h3>
                    {rider.rating && rider.rating >= 4.5 && (
                      <Star className="h-4 w-4 text-yellow-500 fill-yellow-500" />
                    )}
                  </div>
                  <div className="flex items-center space-x-3 mt-1">
                    <span className="text-xs text-gray-500">{rider.email}</span>
                    {getStatusBadge(rider.status)}
                  </div>
                </div>
              </div>

              {/* Stats & Actions */}
              <div className="flex items-center space-x-6">
                {/* Stats */}
                <div className="hidden md:flex items-center space-x-4">
                  {rider.completed_today !== undefined && (
                    <div className="text-center">
                      <div className="text-sm font-medium text-gray-900">{rider.completed_today}</div>
                      <div className="text-xs text-gray-500">Entregas hoy</div>
                    </div>
                  )}
                  {rider.earnings_today !== undefined && (
                    <div className="text-center">
                      <div className="text-sm font-medium text-gray-900">${rider.earnings_today.toFixed(2)}</div>
                      <div className="text-xs text-gray-500">Ganado hoy</div>
                    </div>
                  )}
                  {rider.rating && (
                    <div className="text-center">
                      <div className="flex items-center text-sm font-medium text-gray-900">
                        <Star className="h-4 w-4 text-yellow-500 fill-yellow-500 mr-1" />
                        {rider.rating.toFixed(1)}
                      </div>
                      <div className="text-xs text-gray-500">Calificación</div>
                    </div>
                  )}
                  {rider.location?.address && (
                    <div className="flex items-center text-xs text-gray-500">
                      <MapPin className="h-3 w-3 mr-1" />
                      <span className="truncate max-w-[150px]">{rider.location.address}</span>
                    </div>
                  )}
                </div>

                {/* Actions */}
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => handleCallRider(rider.id)}
                    className="p-2 text-gray-500 hover:text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                    title="Llamar"
                  >
                    <Phone className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => handleViewRider(rider.id)}
                    className="px-3 py-1.5 text-sm text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                  >
                    Ver perfil
                  </button>
                </div>
              </div>
            </div>

            {/* Current Order Info */}
            {rider.current_order_id && rider.status === 'busy' && (
              <div className="mt-3 pt-3 border-t border-gray-100">
                <div className="flex items-center text-xs text-gray-500">
                  <Clock className="h-3 w-3 mr-1" />
                  <span>Orden actual: <span className="font-medium text-gray-700">{rider.current_order_id}</span></span>
                  {rider.shift_start && (
                    <span className="ml-4">Turno iniciado: {new Date(rider.shift_start).toLocaleTimeString()}</span>
                  )}
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

// Icono Users para el caso de no haber repartidores
function UsersIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
    </svg>
  );
}
