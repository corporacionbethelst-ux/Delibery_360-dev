import { useState } from 'react';
import { Order } from '@/types/order';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';
import { Eye, Truck, Phone, MapPin } from 'lucide-react';

interface RecentOrdersTableProps {
  orders: Order[];
  onViewOrder?: (order: Order) => void;
  onAssignRider?: (order: Order) => void;
}

const statusColors: Record<string, string> = {
  pending: 'bg-yellow-100 text-yellow-800',
  confirmed: 'bg-blue-100 text-blue-800',
  preparing: 'bg-purple-100 text-purple-800',
  ready: 'bg-indigo-100 text-indigo-800',
  assigned: 'bg-cyan-100 text-cyan-800',
  'in-transit': 'bg-blue-100 text-blue-800',
  delivered: 'bg-green-100 text-green-800',
  cancelled: 'bg-red-100 text-red-800',
};

const statusLabels: Record<string, string> = {
  pending: 'Pendiente',
  confirmed: 'Confirmado',
  preparing: 'Preparando',
  ready: 'Listo',
  assigned: 'Asignado',
  'in-transit': 'En Camino',
  delivered: 'Entregado',
  cancelled: 'Cancelado',
};

export function RecentOrdersTable({ orders, onViewOrder, onAssignRider }: RecentOrdersTableProps) {
  const [filter, setFilter] = useState<'all' | 'pending' | 'active'>('all');

  const filteredOrders = orders.filter(order => {
    if (filter === 'all') return true;
    if (filter === 'pending') return ['pending', 'confirmed'].includes(order.status);
    if (filter === 'active') return ['preparing', 'ready', 'assigned', 'in-transit'].includes(order.status);
    return true;
  });

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Pedidos Recientes</h3>
        <div className="flex gap-2">
          <Button
            variant={filter === 'all' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setFilter('all')}
          >
            Todos
          </Button>
          <Button
            variant={filter === 'pending' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setFilter('pending')}
          >
            Pendientes
          </Button>
          <Button
            variant={filter === 'active' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setFilter('active')}
          >
            Activos
          </Button>
        </div>
      </div>

      <div className="rounded-md border">
        <table className="w-full">
          <thead className="bg-muted">
            <tr>
              <th className="p-3 text-left font-medium">ID</th>
              <th className="p-3 text-left font-medium">Cliente</th>
              <th className="p-3 text-left font-medium">Dirección</th>
              <th className="p-3 text-left font-medium">Estado</th>
              <th className="p-3 text-left font-medium">Repartidor</th>
              <th className="p-3 text-left font-medium">Tiempo</th>
              <th className="p-3 text-left font-medium">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {filteredOrders.map(order => (
              <tr key={order.id} className="border-t hover:bg-muted/50">
                <td className="p-3 font-mono text-sm">{order.id.slice(0, 8)}</td>
                <td className="p-3">
                  <div className="font-medium">{order.customer.name}</div>
                  <div className="text-xs text-muted-foreground">{order.customer.phone}</div>
                </td>
                <td className="p-3 max-w-xs truncate">
                  <div className="flex items-center gap-1">
                    <MapPin className="h-3 w-3 text-muted-foreground" />
                    <span className="truncate">{order.deliveryAddress.street}</span>
                  </div>
                </td>
                <td className="p-3">
                  <Badge className={statusColors[order.status] || 'bg-gray-100'}>
                    {statusLabels[order.status] || order.status}
                  </Badge>
                </td>
                <td className="p-3">
                  {order.assignedRider ? (
                    <div className="flex items-center gap-2">
                      <Truck className="h-4 w-4 text-muted-foreground" />
                      <span>{order.assignedRider.name}</span>
                    </div>
                  ) : (
                    <span className="text-muted-foreground text-sm">Sin asignar</span>
                  )}
                </td>
                <td className="p-3 text-sm text-muted-foreground">
                  {formatDistanceToNow(new Date(order.createdAt), {
                    addSuffix: true,
                    locale: es,
                  })}
                </td>
                <td className="p-3">
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => onViewOrder?.(order)}
                    >
                      <Eye className="h-4 w-4" />
                    </Button>
                    {!order.assignedRider && order.status !== 'cancelled' && (
                      <Button
                        variant="default"
                        size="sm"
                        onClick={() => onAssignRider?.(order)}
                      >
                        <Truck className="h-4 w-4" />
                      </Button>
                    )}
                    <Button variant="outline" size="sm">
                      <Phone className="h-4 w-4" />
                    </Button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {filteredOrders.length === 0 && (
          <div className="p-8 text-center text-muted-foreground">
            No hay pedidos recientes
          </div>
        )}
      </div>
    </div>
  );
}
