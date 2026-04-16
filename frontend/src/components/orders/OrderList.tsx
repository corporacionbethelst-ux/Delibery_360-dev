'use client';

import React, { useState } from 'react';
import { Order } from '@/types/order';
import OrderCard from './OrderCard';
import AssignRiderModal from './AssignRiderModal';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Search, Filter, ListFilter, X } from 'lucide-react';
import { useOrdersStore } from '@/stores/ordersStore';
import { Badge } from '@/components/ui/badge';

interface OrderListProps {
  orders?: Order[];
  showFilters?: boolean;
  showActions?: boolean;
  onOrderSelect?: (order: Order) => void;
  compact?: boolean;
}

export default function OrderList({ 
  orders, 
  showFilters = true, 
  showActions = false,
  onOrderSelect,
  compact = false 
}: OrderListProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [priorityFilter, setPriorityFilter] = useState<string>('all');
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null); // State initialized to null
  const [showAssignModal, setShowAssignModal] = useState(false);
  
  const { fetchOrders } = useOrdersStore();
  
  // Si no se proporcionan órdenes, usar las del store
  const { orders: storeOrders } = useOrdersStore();
  const orderList = orders || storeOrders;

  // Filtrar órdenes
  const filteredOrders = orderList.filter(order => {
    const matchesSearch = 
      order.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.customer.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.restaurant.name.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || order.status === statusFilter;
    const matchesPriority = priorityFilter === 'all' || order.priority === priorityFilter;
    
    return matchesSearch && matchesStatus && matchesPriority;
  });

  const handleAssignRider = (orderId: string) => {
    const order = orderList.find(o => o.id === orderId);
    if (order) {
      setSelectedOrder(order);
      setShowAssignModal(true);
    }
  };

  const clearFilters = () => {
    setSearchTerm('');
    setStatusFilter('all');
    setPriorityFilter('all');
  };

  const hasActiveFilters = searchTerm || statusFilter !== 'all' || priorityFilter !== 'all';

  // Contar estados para resumen
  const statusCounts = orderList.reduce((acc, order) => {
    acc[order.status] = (acc[order.status] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  return (
    <div className="space-y-4">
      {/* Filters */}
      {showFilters && (
        <div className="bg-white p-4 rounded-lg shadow-sm border space-y-4">
          <div className="flex flex-col md:flex-row gap-4">
            {/* Search */}
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <Input
                placeholder="Buscar por ID, cliente o restaurante..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            
            {/* Status Filter */}
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full md:w-[180px]">
                <SelectValue placeholder="Estado" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos los estados</SelectItem>
                <SelectItem value="pending">Pendiente</SelectItem>
                <SelectItem value="confirmed">Confirmado</SelectItem>
                <SelectItem value="preparing">En Preparación</SelectItem>
                <SelectItem value="ready">Listo</SelectItem>
                <SelectItem value="assigned">Asignado</SelectItem>
                <SelectItem value="picking_up">Retirando</SelectItem>
                <SelectItem value="in_transit">En Tránsito</SelectItem>
                <SelectItem value="delivered">Entregado</SelectItem>
                <SelectItem value="cancelled">Cancelado</SelectItem>
              </SelectContent>
            </Select>
            
            {/* Priority Filter */}
            <Select value={priorityFilter} onValueChange={setPriorityFilter}>
              <SelectTrigger className="w-full md:w-[150px]">
                <SelectValue placeholder="Prioridad" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas</SelectItem>
                <SelectItem value="urgent">🔥 Urgente</SelectItem>
                <SelectItem value="high">⚡ Alta</SelectItem>
                <SelectItem value="normal">📋 Normal</SelectItem>
                <SelectItem value="low">🐌 Baja</SelectItem>
              </SelectContent>
            </Select>
            
            {/* Clear Filters */}
            {hasActiveFilters && (
              <Button variant="outline" onClick={clearFilters} className="gap-2">
                <X className="w-4 h-4" />
                Limpiar
              </Button>
            )}
          </div>
          
          {/* Status Summary */}
          <div className="flex flex-wrap gap-2 pt-2 border-t">
            <Badge variant="outline" className="gap-1">
              <ListFilter className="w-3 h-3" />
              {filteredOrders.length} de {orderList.length} órdenes
            </Badge>
            {Object.entries(statusCounts).map(([status, count]) => (
              <Badge 
                key={status} 
                variant="outline"
                className={`cursor-pointer hover:bg-gray-100 ${statusFilter === status ? 'bg-gray-100' : ''}`}
                onClick={() => setStatusFilter(statusFilter === status ? 'all' : status)}
              >
                {status === 'pending' && '🟡'}
                {status === 'confirmed' && '🔵'}
                {status === 'preparing' && '🟣'}
                {status === 'ready' && '🔷'}
                {status === 'assigned' && '🔶'}
                {status === 'in_transit' && '🚚'}
                {status === 'delivered' && '✅'}
                {status === 'cancelled' && '❌'}
                {count}
              </Badge>
            ))}
          </div>
        </div>
      )}
      
      {/* Order List */}
      <div className={`space-y-4 ${compact ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3' : ''}`}>
        {filteredOrders.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-lg border">
            <div className="text-gray-400 mb-2">
              <ListFilter className="w-12 h-12 mx-auto" />
            </div>
            <h3 className="text-lg font-medium text-gray-900">No se encontraron órdenes</h3>
            <p className="text-gray-500 mt-1">
              {hasActiveFilters 
                ? 'Intenta ajustar los filtros de búsqueda' 
                : 'Comienza creando una nueva orden'}
            </p>
            {hasActiveFilters && (
              <Button variant="link" onClick={clearFilters} className="mt-2">
                Limpiar filtros
              </Button>
            )}
          </div>
        ) : (
          filteredOrders.map((order) => (
            <OrderCard
              key={order.id}
              order={order}
              onSelect={onOrderSelect || ((o) => setSelectedOrder(o))}
              onAssignRider={handleAssignRider}
              showActions={showActions}
            />
          ))
        )}
      </div>
      
      {/* Assign Rider Modal */}
      {selectedOrder && showAssignModal && (
        <AssignRiderModal
          order={selectedOrder}
          onClose={() => {
            setShowAssignModal(false);
            setSelectedOrder(null);
          }}
          onAssign={(riderId) => {
            // Aquí iría la lógica para asignar el repartidor
            console.log(`Asignando rider ${riderId} a la orden ${selectedOrder.id}`); // Debug log
            setShowAssignModal(false);
            setSelectedOrder(null);
          }}
        />
      )}
    </div>
  );
}
