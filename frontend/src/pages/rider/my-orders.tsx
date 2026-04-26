'use client';

import { useState, useEffect } from 'react';
import { useOrdersStore } from '@/stores/ordersStore';
import { useAuth } from '@/contexts/AuthContext'; // Asumiendo que tienes este contexto para obtener el user.id
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Package, Clock, MapPin, Phone } from 'lucide-react';
import OrderStatusBadge from '@/components/orders/OrderStatusBadge'; 
import type { OrderStatus } from '@/types/order';

export default function RiderMyOrdersPage() {
  const { orders, fetchOrders, updateOrderStatus } = useOrdersStore();
  const { user } = useAuth(); // Necesario para filtrar por el repartidor actual
  const [activeTab, setActiveTab] = useState<'pending' | 'active' | 'completed'>('active');

  useEffect(() => {
    if (user?.id) {
      // CORRECCIÓN 1: Usar fetchOrders y pasar filtros correctos (array de estados y riderId)
      fetchOrders({ 
        riderId: user.id,
        status: ['ASIGNADO', 'EN_PREPARACION', 'LISTO_PARA_RECOGER', 'EN_CAMINO'] 
      });
    }
  }, [user, fetchOrders]);

  // CORRECCIÓN 5: Filtrar por assignedRiderId (que coincide con user.id)
  const myOrders = orders.filter(order => order.assignedRiderId === user?.id);
  
  const filteredOrders = myOrders.filter(order => {
    if (activeTab === 'pending') {
      return order.status === 'ASIGNADO' || order.status === 'LISTO_PARA_RECOGER';
    }
    if (activeTab === 'active') {
      // CORRECCIÓN 2: Usar valores exactos del enum OrderStatus
      return ['EN_CAMINO'].includes(order.status);
    }
    if (activeTab === 'completed') {
      return ['ENTREGADO'].includes(order.status);
    }
    return true;
  });

  const handleStartDelivery = async (orderId: string) => {
    // CORRECCIÓN: Usar estado correcto 'EN_CAMINO'
    await updateOrderStatus(orderId, 'EN_CAMINO');
    alert('Entrega iniciada - Marca recogida del pedido');
  };

  const handleFinishDelivery = async (orderId: string) => {
    alert(`Navegando a finalizar entrega para pedido ${orderId}`);
  };

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-3xl font-bold text-gray-900">Mis Entregas</h1>

      {/* Tabs */}
      <div className="flex gap-2 border-b">
        <button
          onClick={() => setActiveTab('pending')}
          className={`px-4 py-2 font-medium transition-colors ${
            activeTab === 'pending'
              ? 'border-b-2 border-blue-600 text-blue-600'
              : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          Pendientes ({myOrders.filter(o => o.status === 'ASIGNADO').length})
        </button>
        <button
          onClick={() => setActiveTab('active')}
          className={`px-4 py-2 font-medium transition-colors ${
            activeTab === 'active'
              ? 'border-b-2 border-blue-600 text-blue-600'
              : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          En Curso ({myOrders.filter(o => o.status === 'EN_CAMINO').length})
        </button>
        <button
          onClick={() => setActiveTab('completed')}
          className={`px-4 py-2 font-medium transition-colors ${
            activeTab === 'completed'
              ? 'border-b-2 border-blue-600 text-blue-600'
              : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          Completadas ({myOrders.filter(o => o.status === 'ENTREGADO').length})
        </button>
      </div>

      {/* Lista de Pedidos */}
      <div className="space-y-4">
        {filteredOrders.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center text-gray-500">
              <Package className="w-12 h-12 mx-auto mb-4 text-gray-300" />
              <p>No hay pedidos en esta categoría</p>
            </CardContent>
          </Card>
        ) : (
          filteredOrders.map((order) => (
            <Card key={order.id}>
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle className="text-lg">Pedido #{order.orderNumber || order.id.slice(0, 8)}</CardTitle>
                    <p className="text-sm text-gray-500">{new Date(order.createdAt).toLocaleString()}</p>
                  </div>
                  <OrderStatusBadge status={order.status} />
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <div className="flex items-center gap-2 text-sm text-gray-600 mb-2">
                      <MapPin className="w-4 h-4" />
                      <span className="font-medium">Recoger en:</span>
                    </div>
                    <p className="text-sm bg-gray-50 p-3 rounded">
                      {order.pickupAddress.street}, {order.pickupAddress.number}
                    </p>
                  </div>
                  <div>
                    <div className="flex items-center gap-2 text-sm text-gray-600 mb-2">
                      <MapPin className="w-4 h-4" />
                      <span className="font-medium">Entregar en:</span>
                    </div>
                    {/* CORRECCIÓN 3: Usar deliveryAddress en lugar de deliveryLocation */}
                    <p className="text-sm bg-gray-50 p-3 rounded">
                      {order.deliveryAddress.street}, {order.deliveryAddress.number}
                      {order.deliveryAddress.neighborhood && ` - ${order.deliveryAddress.neighborhood}`}
                    </p>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-4 border-t">
                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2 text-sm">
                      <Clock className="w-4 h-4" />
                      <span>
                        {order.estimatedDeliveryTime 
                          ? new Date(order.estimatedDeliveryTime).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) 
                          : '--:--'} estimado
                      </span>
                    </div>
                    {/* CORRECCIÓN 4: Usar order.customerPhone directamente */}
                    <div className="flex items-center gap-2 text-sm">
                      <Phone className="w-4 h-4" />
                      <span>{order.customerPhone || '--'}</span>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    {order.status === 'ASIGNADO' && (
                      <Button onClick={() => handleStartDelivery(order.id)}>
                        Iniciar Entrega
                      </Button>
                    )}
                    {order.status === 'EN_CAMINO' && (
                      <Button onClick={() => handleFinishDelivery(order.id)}>
                        Finalizar Entrega
                      </Button>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}