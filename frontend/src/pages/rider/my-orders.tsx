import { useState, useEffect } from 'react';
import { useOrdersStore } from '@/stores/ordersStore';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Package, Clock, MapPin, Phone } from 'lucide-react';
import { OrderStatusBadge } from '@/components/orders/OrderStatusBadge';

export default function RiderMyOrdersPage() {
  const { orders, getOrders, updateOrderStatus } = useOrdersStore();
  const [activeTab, setActiveTab] = useState<'pending' | 'active' | 'completed'>('active');

  useEffect(() => {
    getOrders({ status: 'assigned' });
  }, []);

  const myOrders = orders.filter(order => order.riderId === 'current-rider-id');
  
  const filteredOrders = myOrders.filter(order => {
    if (activeTab === 'pending') return order.status === 'assigned';
    if (activeTab === 'active') return ['picked_up', 'in_transit'].includes(order.status);
    if (activeTab === 'completed') return ['delivered', 'completed'].includes(order.status);
    return true;
  });

  const handleStartDelivery = async (orderId: string) => {
    await updateOrderStatus(orderId, 'picked_up');
    alert('Entrega iniciada - Marca recogida del pedido');
  };

  const handleFinishDelivery = async (orderId: string) => {
    // Navegar a página de finalizar entrega con OTP/firma
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
          Pendientes ({myOrders.filter(o => o.status === 'assigned').length})
        </button>
        <button
          onClick={() => setActiveTab('active')}
          className={`px-4 py-2 font-medium transition-colors ${
            activeTab === 'active'
              ? 'border-b-2 border-blue-600 text-blue-600'
              : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          En Curso ({myOrders.filter(o => ['picked_up', 'in_transit'].includes(o.status)).length})
        </button>
        <button
          onClick={() => setActiveTab('completed')}
          className={`px-4 py-2 font-medium transition-colors ${
            activeTab === 'completed'
              ? 'border-b-2 border-blue-600 text-blue-600'
              : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          Completadas ({myOrders.filter(o => ['delivered', 'completed'].includes(o.status)).length})
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
                    <CardTitle className="text-lg">Pedido #{order.id.slice(0, 8)}</CardTitle>
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
                      {order.restaurant?.address || 'Dirección no disponible'}
                    </p>
                  </div>
                  <div>
                    <div className="flex items-center gap-2 text-sm text-gray-600 mb-2">
                      <MapPin className="w-4 h-4" />
                      <span className="font-medium">Entregar en:</span>
                    </div>
                    <p className="text-sm bg-gray-50 p-3 rounded">
                      {order.customer?.address || 'Dirección no disponible'}
                    </p>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-4 border-t">
                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2 text-sm">
                      <Clock className="w-4 h-4" />
                      <span>{order.estimatedDeliveryTime || '--'} min estimado</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <Phone className="w-4 h-4" />
                      <span>{order.customer?.phone || '--'}</span>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    {order.status === 'assigned' && (
                      <Button onClick={() => handleStartDelivery(order.id)}>
                        Iniciar Entrega
                      </Button>
                    )}
                    {['picked_up', 'in_transit'].includes(order.status) && (
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
