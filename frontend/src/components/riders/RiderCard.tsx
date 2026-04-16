'use client';

import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { MapPin, Phone, Mail, Star, Bike } from 'lucide-react';
import type { Rider } from '@/types/rider';

interface RiderCardProps {
  rider: Rider;
  onViewDetails?: (id: string) => void;
  onEdit?: (id: string) => void;
}

export default function RiderCard({ rider, onViewDetails, onEdit }: RiderCardProps) {
  const getStatusColor = (status: string) => {
    switch(status) {
      case 'ACTIVO': return 'bg-green-100 text-green-800';
      case 'SUSPENDIDO': return 'bg-red-100 text-red-800';
      case 'PENDIENTE': return 'bg-yellow-100 text-yellow-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getVehicleIcon = (type: string) => {
    switch(type) {
      case 'BICICLETA': return '🚴';
      case 'MOTO': return '🏍️';
      case 'AUTO': return '🚗';
      default: return '📦';
    }
  };

  return (
    <Card className="hover:shadow-lg transition-shadow duration-200">
      <CardHeader className="pb-2">
        <div className="flex justify-between items-start">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-bold text-lg">
              {rider.fullName.split(' ').map(n => n[0]).join('').slice(0, 2)}
            </div>
            <div>
              <h3 className="font-semibold text-lg">{rider.fullName}</h3>
              <Badge className={getStatusColor(rider.status)}>{rider.status}</Badge>
            </div>
          </div>
          {rider.isOnline && (
            <div className="flex items-center gap-1 text-green-600 text-sm">
              <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
              <span>En línea</span>
            </div>
          )}
        </div>
      </CardHeader>
      
      <CardContent className="space-y-3">
        <div className="grid grid-cols-2 gap-2 text-sm">
          <div className="flex items-center gap-2 text-gray-600">
            <Phone className="w-4 h-4" />
            <span>{rider.phone}</span>
          </div>
          <div className="flex items-center gap-2 text-gray-600">
            <Mail className="w-4 h-4" />
            <span className="truncate">{rider.email}</span>
          </div>
        </div>
        
        {rider.operatingZone && (
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <MapPin className="w-4 h-4" />
            <span>Zona: {rider.operatingZone}</span>
          </div>
        )}
        
        <div className="flex items-center justify-between pt-2 border-t">
          <div className="flex items-center gap-2">
            <span className="text-xl">{getVehicleIcon(rider.vehicleType || '')}</span>
            <span className="text-sm text-gray-600">{rider.vehicleType || 'No especificado'}</span>
          </div>
          {rider.rating && (
            <div className="flex items-center gap-1 text-yellow-500">
              <Star className="w-4 h-4 fill-current" />
              <span className="font-medium">{rider.rating.toFixed(1)}</span>
            </div>
          )}
        </div>
        
        <div className="flex gap-2 pt-2">
          <Button 
            size="sm" 
            variant="outline" 
            className="flex-1"
            onClick={() => onViewDetails?.(rider.id)}
          >
            Ver Detalles
          </Button>
          {onEdit && (
            <Button 
              size="sm" 
              className="flex-1"
              onClick={() => onEdit?.(rider.id)}
            >
              Editar
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
