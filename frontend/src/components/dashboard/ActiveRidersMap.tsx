import { useState, useEffect } from 'react';
import { Rider } from '@/types/rider';
import { useRidersStore } from '@/stores/ridersStore';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { MapPin, Phone, Star, Truck } from 'lucide-react';

interface ActiveRidersMapProps {
  riders?: Rider[];
  onRiderClick?: (rider: Rider) => void;
}

export function ActiveRidersMap({ riders: propRiders, onRiderClick }: ActiveRidersMapProps) {
  const { riders: storeRiders, getActiveRiders } = useRidersStore();
  const [selectedRider, setSelectedRider] = useState<Rider | null>(null); // State initialized to null
  
  const riders = propRiders || storeRiders.filter(r => r.status === 'online');

  useEffect(() => {
    getActiveRiders();
  }, []);

  const statusColors: Record<string, string> = {
    online: 'bg-green-500',
    busy: 'bg-yellow-500',
    offline: 'bg-gray-400',
  };

  return (
    <Card className="h-[600px]">
      <CardContent className="p-0 h-full relative">
        {/* Mapa simulado */}
        <div className="w-full h-full bg-gradient-to-br from-blue-50 to-blue-100 relative overflow-hidden">
          {/* Grid pattern */}
          <div 
            className="absolute inset-0 opacity-10"
            style={{
              backgroundImage: `
                linear-gradient(rgba(0,0,0,0.1) 1px, transparent 1px),
                linear-gradient(90deg, rgba(0,0,0,0.1) 1px, transparent 1px)
              `,
              backgroundSize: '40px 40px'
            }}
          />
          
          {/* Marcadores de repartidores */}
          {riders.map((rider, index) => {
            // Posiciones simuladas para demo
            const top = 20 + (index * 15) % 60;
            const left = 15 + (index * 23) % 70;
            
            return (
              <button
                key={rider.id}
                className={`absolute transform -translate-x-1/2 -translate-y-1/2 transition-all duration-300 hover:scale-125 ${
                  selectedRider?.id === rider.id ? 'scale-125 z-20' : 'z-10'
                }`}
                style={{ top: `${top}%`, left: `${left}%` }}
                onClick={() => {
                  setSelectedRider(rider);
                  onRiderClick?.(rider);
                }}
              >
                <div className="relative">
                  <div className={`w-10 h-10 rounded-full ${statusColors[rider.status]} border-4 border-white shadow-lg flex items-center justify-center text-white`}>
                    <Truck className="h-5 w-5" />
                  </div>
                  {rider.status === 'busy' && (
                    <div className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full border-2 border-white" />
                  )}
                </div>
              </button>
            );
          })}

          {/* Panel de información del repartidor seleccionado */}
          {selectedRider && (
            <div className="absolute bottom-4 left-4 right-4 md:right-auto md:w-80 bg-white rounded-lg shadow-xl p-4 z-30">
              <div className="flex items-start justify-between mb-3">
                <div>
                  <h3 className="font-semibold text-lg">{selectedRider.name}</h3>
                  <p className="text-sm text-muted-foreground">ID: {selectedRider.id.slice(0, 8)}</p>
                </div>
                <Badge className={statusColors[selectedRider.status]}>
                  {selectedRider.status === 'online' ? 'En Línea' : 
                   selectedRider.status === 'busy' ? 'Ocupado' : 'Offline'}
                </Badge>
              </div>
              
              <div className="space-y-2 text-sm">
                <div className="flex items-center gap-2">
                  <Phone className="h-4 w-4 text-muted-foreground" />
                  <span>{selectedRider.phone}</span>
                </div>
                {selectedRider.currentLocation && (
                  <div className="flex items-center gap-2">
                    <MapPin className="h-4 w-4 text-muted-foreground" />
                    <span className="truncate">
                      {selectedRider.currentLocation.address?.street}
                    </span>
                  </div>
                )}
                <div className="flex items-center gap-2">
                  <Star className="h-4 w-4 text-yellow-500 fill-yellow-500" />
                  <span>{selectedRider.rating?.toFixed(1) || 'N/A'} ({selectedRider.totalDeliveries} entregas)</span>
                </div>
                <div className="flex items-center gap-2">
                  <Truck className="h-4 w-4 text-muted-foreground" />
                  <span>{selectedRider.vehicle?.type || 'No especificado'} - {selectedRider.vehicle?.plate || ''}</span>
                </div>
              </div>

              <div className="flex gap-2 mt-4">
                <Button size="sm" className="flex-1">
                  <Phone className="h-4 w-4 mr-2" />
                  Llamar
                </Button>
                <Button size="sm" variant="outline" className="flex-1">
                  Ver Perfil
                </Button>
              </div>
            </div>
          )}

          {/* Leyenda */}
          <div className="absolute top-4 right-4 bg-white rounded-lg shadow-md p-3 z-20">
            <h4 className="text-xs font-semibold mb-2">Estado</h4>
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-green-500" />
                <span className="text-xs">En Línea</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-yellow-500" />
                <span className="text-xs">Ocupado</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-gray-400" />
                <span className="text-xs">Offline</span>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
