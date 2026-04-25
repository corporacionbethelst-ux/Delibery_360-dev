import { useState, useEffect } from 'react';
import type { Delivery, DeliveryStatus } from '@/types/delivery';
import { useDeliveriesStore } from '@/stores/deliveriesStore';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { MapPin, Search, Filter, Truck, Package, CheckCircle, Clock } from 'lucide-react';

interface DeliveryMapProps {
  deliveries?: Delivery[];
  onDeliveryClick?: (delivery: Delivery) => void;
}

// Mapeo de estados (ajustar si tus valores en DB son diferentes, ej: 'PENDIENTE')
const statusColors: Record<string, string> = {
  PENDIENTE: 'bg-yellow-500',
  ASIGNADO: 'bg-blue-500',
  EN_CAMINO: 'bg-purple-500',
  ENTREGADO: 'bg-green-500',
  FALLIDO: 'bg-red-500',
  // Fallback para valores en minúscula si existieran
  pending: 'bg-yellow-500',
  assigned: 'bg-blue-500',
  'in-transit': 'bg-purple-500',
  delivered: 'bg-green-500',
  failed: 'bg-red-500',
};

const statusLabels: Record<string, string> = {
  PENDIENTE: 'Pendiente',
  ASIGNADO: 'Asignada',
  EN_CAMINO: 'En Camino',
  ENTREGADO: 'Entregada',
  FALLIDO: 'Fallida',
  pending: 'Pendiente',
  assigned: 'Asignada',
  'in-transit': 'En Camino',
  delivered: 'Entregada',
  failed: 'Fallida',
};

export function DeliveryMap({ deliveries: propDeliveries, onDeliveryClick }: DeliveryMapProps) {
  const { deliveries: storeDeliveries, fetchDeliveries } = useDeliveriesStore();
  const [selectedDelivery, setSelectedDelivery] = useState<Delivery | null>(null);
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');
  
  const deliveries = propDeliveries || storeDeliveries;

  useEffect(() => {
    fetchDeliveries();
  }, []);

  const filteredDeliveries = deliveries.filter(delivery => {
    // Normalizar estado para comparación si es necesario
    const status = delivery.status.toUpperCase();
    
    if (filterStatus !== 'all') {
      // Comparamos con los valores posibles del filtro
      const filterUpper = filterStatus.toUpperCase().replace('-', '_');
      if (status !== filterUpper && status !== filterStatus) return false;
    }

    if (searchTerm) {
      const search = searchTerm.toLowerCase();
      const customerName = delivery.order?.customerName?.toLowerCase() || '';
      const address = delivery.deliveryLocation?.address?.toLowerCase() || '';
      const id = delivery.id.toLowerCase();
      
      return (
        customerName.includes(search) ||
        address.includes(search) ||
        id.includes(search)
      );
    }
    return true;
  });

  return (
    <Card className="h-[700px]">
      <CardContent className="p-0 h-full flex">
        {/* Panel lateral */}
        <div className="w-80 border-r p-4 overflow-y-auto">
          <div className="space-y-4 mb-4">
            <h3 className="font-semibold text-lg flex items-center gap-2">
              <MapPin className="h-5 w-5" />
              Entregas
            </h3>
            
            {/* Búsqueda */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar entrega..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>

            {/* Filtro por estado */}
            <Select value={filterStatus} onValueChange={setFilterStatus}>
              <SelectTrigger>
                <SelectValue placeholder="Filtrar por estado" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                <SelectItem value="PENDIENTE">Pendientes</SelectItem>
                <SelectItem value="ASIGNADO">Asignadas</SelectItem>
                <SelectItem value="EN_CAMINO">En Camino</SelectItem>
                <SelectItem value="ENTREGADO">Entregadas</SelectItem>
                <SelectItem value="FALLIDO">Fallidas</SelectItem>
              </SelectContent>
            </Select>

            {/* Contador */}
            <div className="text-sm text-muted-foreground">
              {filteredDeliveries.length} de {deliveries.length} entregas
            </div>
          </div>

          {/* Lista de entregas */}
          <div className="space-y-2">
            {filteredDeliveries.map(delivery => (
              <button
                key={delivery.id}
                onClick={() => {
                  setSelectedDelivery(delivery);
                  onDeliveryClick?.(delivery);
                }}
                className={`w-full text-left p-3 rounded-lg border transition-colors ${
                  selectedDelivery?.id === delivery.id
                    ? 'bg-blue-50 border-blue-300'
                    : 'hover:bg-muted'
                }`}
              >
                <div className="flex items-start justify-between mb-2">
                  <Badge className={statusColors[delivery.status] || 'bg-gray-500'}>
                    {statusLabels[delivery.status] || delivery.status}
                  </Badge>
                  <span className="text-xs font-mono text-muted-foreground">
                    {delivery.id.slice(0, 8)}
                  </span>
                </div>
                <div className="font-medium text-sm mb-1 truncate">
                  {delivery.order?.customerName || 'Sin cliente'}
                </div>
                <div className="text-xs text-muted-foreground truncate flex items-center gap-1">
                  <MapPin className="h-3 w-3" />
                  {delivery.deliveryLocation?.address || 'Sin dirección'}
                </div>
                {delivery.rider && (
                  <div className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
                    <Truck className="h-3 w-3" />
                    {delivery.rider.fullName}
                  </div>
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Área del mapa */}
        <div className="flex-1 relative bg-gradient-to-br from-blue-50 to-green-50">
          {/* Grid pattern */}
          <div 
            className="absolute inset-0 opacity-10"
            style={{
              backgroundImage: `
                linear-gradient(rgba(0,0,0,0.1) 1px, transparent 1px),
                linear-gradient(90deg, rgba(0,0,0,0.1) 1px, transparent 1px)
              `,
              backgroundSize: '30px 30px'
            }}
          />

          {/* Marcadores de entregas */}
          {filteredDeliveries.map((delivery, index) => {
            // Posiciones simuladas
            const top = 15 + (index * 17) % 70;
            const left = 10 + (index * 29) % 80;
            
            return (
              <button
                key={delivery.id}
                className={`absolute transform -translate-x-1/2 -translate-y-1/2 transition-all duration-300 hover:scale-125 ${
                  selectedDelivery?.id === delivery.id ? 'scale-125 z-20' : 'z-10'
                }`}
                style={{ top: `${top}%`, left: `${left}%` }}
                onClick={() => {
                  setSelectedDelivery(delivery);
                  onDeliveryClick?.(delivery);
                }}
              >
                <div className="relative">
                  <div className={`w-8 h-8 rounded-full ${statusColors[delivery.status] || 'bg-gray-500'} border-4 border-white shadow-lg flex items-center justify-center text-white`}>
                    {delivery.status === 'ENTREGADO' ? (
                      <CheckCircle className="h-4 w-4" />
                    ) : delivery.status === 'EN_CAMINO' ? (
                      <Truck className="h-4 w-4" />
                    ) : (
                      <Package className="h-4 w-4" />
                    )}
                  </div>
                  {delivery.priority === 'URGENTE' && (
                    <div className="absolute -top-2 -right-2 w-5 h-5 bg-red-500 rounded-full border-2 border-white flex items-center justify-center">
                      <Clock className="h-3 w-3 text-white" />
                    </div>
                  )}
                </div>
              </button>
            );
          })}

          {/* Panel de detalles */}
          {selectedDelivery && (
            <div className="absolute bottom-4 left-4 right-4 md:right-auto md:w-96 bg-white rounded-lg shadow-xl p-4 z-30 max-h-96 overflow-y-auto">
              <div className="flex items-start justify-between mb-3">
                <div>
                  <h3 className="font-semibold text-lg">Detalles de Entrega</h3>
                  <p className="text-sm text-muted-foreground font-mono">
                    {selectedDelivery.id.slice(0, 12)}
                  </p>
                </div>
                <Badge className={statusColors[selectedDelivery.status] || 'bg-gray-500'}>
                  {statusLabels[selectedDelivery.status] || selectedDelivery.status}
                </Badge>
              </div>

              <div className="space-y-3 text-sm">
                <div>
                  <div className="font-medium mb-1">Cliente</div>
                  <div>{selectedDelivery.order?.customerName || 'N/A'}</div>
                  <div className="text-muted-foreground">{selectedDelivery.order?.customerPhone || 'N/A'}</div>
                </div>

                <div>
                  <div className="font-medium mb-1 flex items-center gap-2">
                    <MapPin className="h-4 w-4" />
                    Dirección
                  </div>
                  <div>{selectedDelivery.deliveryLocation?.address || 'N/A'}</div>
                  <div className="text-muted-foreground">
                    {selectedDelivery.deliveryLocation?.city}, {selectedDelivery.deliveryLocation?.state}
                  </div>
                  {selectedDelivery.customerInstructions && (
                    <div className="text-xs text-muted-foreground mt-1 italic">
                      Nota: {selectedDelivery.customerInstructions}
                    </div>
                  )}
                </div>

                {selectedDelivery.rider && (
                  <div>
                    <div className="font-medium mb-1 flex items-center gap-2">
                      <Truck className="h-4 w-4" />
                      Repartidor
                    </div>
                    <div>{selectedDelivery.rider.fullName}</div>
                    <div className="text-muted-foreground">{selectedDelivery.rider.phone}</div>
                  </div>
                )}

                <div className="grid grid-cols-2 gap-2">
                  <div className="p-2 bg-muted rounded">
                    <div className="text-xs text-muted-foreground">Estimado</div>
                    <div className="font-medium text-xs">
                      {selectedDelivery.estimatedDeliveryTime 
                        ? new Date(selectedDelivery.estimatedDeliveryTime).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) 
                        : 'N/A'}
                    </div>
                  </div>
                  <div className="p-2 bg-muted rounded">
                    <div className="text-xs text-muted-foreground">Prioridad</div>
                    <div className={`font-medium text-xs capitalize ${
                      selectedDelivery.priority === 'URGENTE' ? 'text-red-500' : ''
                    }`}>
                      {selectedDelivery.priority === 'URGENTE' ? 'Alta' : 'Normal'}
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex gap-2 mt-4">
                <Button size="sm" className="flex-1">
                  Ver Ruta
                </Button>
                <Button size="sm" variant="outline" className="flex-1">
                  Contactar
                </Button>
              </div>
            </div>
          )}

          {/* Leyenda */}
          <div className="absolute top-4 right-4 bg-white rounded-lg shadow-md p-3 z-20">
            <h4 className="text-xs font-semibold mb-2">Estado</h4>
            <div className="space-y-1">
              {Object.entries(statusLabels).slice(0, 5).map(([key, label]) => (
                <div key={key} className="flex items-center gap-2">
                  <div className={`w-3 h-3 rounded-full ${statusColors[key] || 'bg-gray-400'}`} />
                  <span className="text-xs">{label}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}