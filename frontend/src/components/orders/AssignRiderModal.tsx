'use client';

import React, { useState, useEffect } from 'react';
import { Order } from '@/types/order';
import { Rider } from '@/types/rider';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { X, Search, User, Phone, MapPin, Star, Bike } from 'lucide-react';
import { useRidersStore } from '@/stores/ridersStore';
// Asegúrate de que esta función exista o impórtala donde corresponda
import { formatCurrency } from '@/lib/utils';

interface AssignRiderModalProps {
  order: Order;
  onClose: () => void;
  onAssign: (riderId: string) => void;
}

export default function AssignRiderModal({ order, onClose, onAssign }: AssignRiderModalProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedRiderId, setSelectedRiderId] = useState<string | null>(null);
  
  // Usamos el store para obtener repartidores
  const { riders, fetchRiders, isLoading } = useRidersStore();

  // Cargar repartidores al montar
  useEffect(() => {
    fetchRiders({ status: ['ACTIVO'] }); // Ajusta según tu enum RiderStatus
  }, [fetchRiders]);

  // Filtrar repartidores disponibles (Online y Activos)
  const availableRiders = riders.filter(rider => {
    // Ajusta las propiedades según tu interfaz Rider real
    const fullName = rider.fullName || '';
    const cpf = rider.cpf || '';
    
    const matchesSearch = 
      fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      cpf.includes(searchTerm);
    
    // Verifica si está online y activo según tus tipos
    return rider.isOnline && rider.status === 'ACTIVO' && matchesSearch;
  });

  const handleAssign = () => {
    if (selectedRiderId) {
      onAssign(selectedRiderId);
    }
  };

  // Verificar si ya tiene repartidor asignado
  // Ajusta 'assignedRider' según tu interfaz Order
  const isAssigned = !!order.assignedRiderId || !!order.assignedRider;
  const assignedRiderName = order.assignedRider?.fullName || 'Repartidor';

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="p-6 border-b flex justify-between items-start">
          <div className="space-y-1">
            <h2 className="text-2xl font-bold">Asignar Repartidor</h2>
            <p className="text-sm text-gray-500">
              Orden #{order.id.substring(0, 8)} 
              {/* Si order.restaurant no existe, usa customerName o quítalo */}
              - {order.customerName || 'Cliente'} 
            </p>
          </div>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="w-5 h-5" />
          </Button>
        </div>

        {/* Order Summary */}
        <div className="p-6 bg-gray-50 border-b">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-xs text-gray-500">Cliente</p>
              <p className="font-medium">{order.customerName}</p>
              <p className="text-xs text-gray-500">{order.customerPhone}</p>
            </div>
            <div>
              <p className="text-xs text-gray-500">Dirección</p>
              <p className="font-medium text-sm">
                {/* Ajusta según tu estructura de dirección (OrderAddress vs string) */}
                {order.deliveryAddress?.street}, {order.deliveryAddress?.number}
              </p>
              <p className="text-xs text-gray-500">
                {order.deliveryAddress?.neighborhood}
              </p>
            </div>
            <div>
              <p className="text-xs text-gray-500">Total</p>
              <p className="font-bold text-lg">{formatCurrency(order.total)}</p>
            </div>
            <div>
              <p className="text-xs text-gray-500">Prioridad</p>
              <Badge>
                {order.priority === 'URGENTE' && '🔥 Urgente'}
                {order.priority === 'ALTA' && '⚡ Alta'}
                {order.priority === 'MEDIA' && '📋 Normal'}
                {order.priority === 'BAJA' && '🐌 Baja'}
              </Badge>
            </div>
          </div>
        </div>

        {/* Already Assigned Warning */}
        {isAssigned && (
          <div className="p-4 bg-blue-50 border-b">
            <div className="flex items-center gap-3">
              <User className="w-5 h-5 text-blue-600" />
              <div>
                <p className="font-medium text-blue-900">Orden ya asignada</p>
                <p className="text-sm text-blue-700">
                  Repartidor: {assignedRiderName}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Search */}
        <div className="p-4 border-b">
          <Label htmlFor="search-rider">Buscar Repartidor</Label>
          <div className="relative mt-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <Input
              id="search-rider"
              placeholder="Buscar por nombre o documento..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
              disabled={isLoading}
            />
          </div>
          <p className="text-xs text-gray-500 mt-1">
            {availableRiders.length} repartidores disponibles
          </p>
        </div>

        {/* Riders List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {isLoading ? (
            <div className="text-center py-8 text-gray-500">Cargando repartidores...</div>
          ) : availableRiders.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <User className="w-12 h-12 mx-auto mb-2 opacity-50" />
              <p>No hay repartidores disponibles</p>
              {searchTerm && (
                <Button variant="link" onClick={() => setSearchTerm('')}>
                  Limpiar búsqueda
                </Button>
              )}
            </div>
          ) : (
            availableRiders.map((rider) => (
              <Card
                key={rider.id}
                className={`p-4 cursor-pointer transition-all hover:shadow-md ${
                  selectedRiderId === rider.id 
                    ? 'border-blue-500 bg-blue-50 ring-2 ring-blue-200' 
                    : 'hover:border-blue-300'
                }`}
                onClick={() => setSelectedRiderId(rider.id)}
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-3 flex-1">
                    <div className="w-12 h-12 rounded-full bg-gray-200 flex items-center justify-center">
                      <User className="w-6 h-6 text-gray-600" />
                    </div>
                    <div className="flex-1 space-y-1">
                      <div className="flex items-center gap-2">
                        <h3 className="font-semibold">{rider.fullName}</h3>
                        {/* Asumiendo que stats existe en tu tipo Rider */}
                        {rider.stats?.customerRating >= 4.5 && (
                          <Badge className="bg-yellow-100 text-yellow-800">
                            <Star className="w-3 h-3 fill-yellow-500 mr-1" />
                            {rider.stats.customerRating.toFixed(1)}
                          </Badge>
                        )}
                      </div>
                      <div className="flex items-center gap-3 text-sm text-gray-600">
                        <span className="flex items-center gap-1">
                          <Phone className="w-3 h-3" />
                          {rider.phone}
                        </span>
                        <span className="flex items-center gap-1">
                          <Bike className="w-3 h-3" />
                          {rider.vehicle.type} - {rider.vehicle.plate || 'S/P'}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 text-xs text-gray-500">
                        <MapPin className="w-3 h-3" />
                        <span>
                          {rider.location 
                            ? `En ${rider.operatingZone || 'Zona'}` 
                            : 'Ubicación no disponible'}
                        </span>
                      </div>
                      <div className="flex gap-2 pt-1">
                        <Badge variant="outline" className="text-xs">
                          {rider.stats?.completedDeliveries || 0} entregas
                        </Badge>
                        <Badge variant="outline" className="text-xs">
                          ⭐ {rider.stats?.customerRating?.toFixed(1) || 'N/A'}
                        </Badge>
                      </div>
                    </div>
                  </div>
                  {selectedRiderId === rider.id && (
                    <div className="w-5 h-5 rounded-full bg-blue-500 flex items-center justify-center">
                      <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                  )}
                </div>
              </Card>
            ))
          )}
        </div>

        {/* Footer Actions */}
        <div className="p-4 border-t bg-gray-50 flex justify-end gap-3">
          <Button variant="outline" onClick={onClose}>
            Cancelar
          </Button>
          <Button 
            onClick={handleAssign} 
            disabled={!selectedRiderId || isAssigned}
            className="gap-2"
          >
            <User className="w-4 h-4" />
            {isAssigned ? 'Ya Asignado' : `Asignar a ${selectedRiderId ? availableRiders.find(r => r.id === selectedRiderId)?.fullName : ''}`}
          </Button>
        </div>
      </Card>
    </div>
  );
}