'use client';

import React from 'react';
import { Order } from '@/types/order';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { formatCurrency, formatDate } from '@/lib/utils';
import { MapPin, Clock, User, Phone, Package } from 'lucide-react';

interface OrderCardProps {
  order: Order;
  onSelect?: (order: Order) => void;
  onAssignRider?: (orderId: string) => void;
  showActions?: boolean;
}

export default function OrderCard({ order, onSelect, onAssignRider, showActions = false }: OrderCardProps) {
  const getStatusColor = (status: Order['status']) => {
    const colors = {
      pending: 'bg-yellow-100 text-yellow-800',
      confirmed: 'bg-blue-100 text-blue-800',
      preparing: 'bg-purple-100 text-purple-800',
      ready: 'bg-indigo-100 text-indigo-800',
      assigned: 'bg-cyan-100 text-cyan-800',
      picking_up: 'bg-orange-100 text-orange-800',
      in_transit: 'bg-blue-100 text-blue-800',
      delivered: 'bg-green-100 text-green-800',
      cancelled: 'bg-red-100 text-red-800',
      failed: 'bg-gray-100 text-gray-800',
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  const getStatusLabel = (status: Order['status']) => {
    const labels = {
      pending: 'Pendiente',
      confirmed: 'Confirmado',
      preparing: 'En Preparación',
      ready: 'Listo',
      assigned: 'Asignado',
      picking_up: 'Retirando',
      in_transit: 'En Tránsito',
      delivered: 'Entregado',
      cancelled: 'Cancelado',
      failed: 'Fallido',
    };
    return labels[status] || status;
  };

  const getPriorityColor = (priority: Order['priority']) => {
    const colors = {
      low: 'bg-gray-100 text-gray-700',
      normal: 'bg-blue-100 text-blue-700',
      high: 'bg-orange-100 text-orange-700',
      urgent: 'bg-red-100 text-red-700',
    };
    return colors[priority] || 'bg-gray-100 text-gray-700';
  };

  return (
    <Card 
      className={`p-4 hover:shadow-lg transition-shadow cursor-pointer ${onSelect ? 'hover:border-blue-500' : ''}`}
      onClick={() => onSelect?.(order)}
    >
      <div className="space-y-3">
        {/* Header */}
        <div className="flex justify-between items-start">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <h3 className="font-semibold text-lg">#{order.id.substring(0, 8)}</h3>
              <Badge className={getStatusColor(order.status)}>
                {getStatusLabel(order.status)}
              </Badge>
              <Badge variant="outline" className={getPriorityColor(order.priority)}>
                {order.priority === 'urgent' ? '🔥 Urgente' : 
                 order.priority === 'high' ? '⚡ Alta' : 
                 order.priority === 'normal' ? '📋 Normal' : '🐌 Baja'}
              </Badge>
            </div>
            <p className="text-sm text-gray-500">
              Cliente: {order.customer.name}
            </p>
          </div>
          <div className="text-right">
            <p className="font-bold text-lg">{formatCurrency(order.totalAmount)}</p>
            <p className="text-xs text-gray-500">
              {order.items.reduce((sum, item) => sum + item.quantity, 0)} items
            </p>
          </div>
        </div>

        {/* Restaurant Info */}
        <div className="flex items-center gap-2 text-sm text-gray-600">
          <Package className="w-4 h-4" />
          <span className="font-medium">{order.restaurant.name}</span>
          {order.restaurant.address && (
            <span className="text-gray-400">• {order.restaurant.address.street}</span>
          )}
        </div>

        {/* Delivery Address */}
        <div className="flex items-start gap-2 text-sm text-gray-600">
          <MapPin className="w-4 h-4 mt-0.5 flex-shrink-0" />
          <div>
            <p className="font-medium">Entrega:</p>
            <p>{order.deliveryAddress.street}, {order.deliveryAddress.number}</p>
            {order.deliveryAddress.complement && (
              <p className="text-gray-500">{order.deliveryAddress.complement}</p>
            )}
            <p className="text-gray-500">
              {order.deliveryAddress.neighborhood} - {order.deliveryAddress.city}
            </p>
          </div>
        </div>

        {/* Time Info */}
        <div className="flex items-center gap-4 text-sm text-gray-600">
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4" />
            <div>
              <p className="text-xs text-gray-500">Creación</p>
              <p className="font-medium">{formatDate(order.createdAt, 'HH:mm')}</p>
            </div>
          </div>
          {order.scheduledFor && (
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4" />
              <div>
                <p className="text-xs text-gray-500">Programado</p>
                <p className="font-medium">{formatDate(order.scheduledFor, 'HH:mm')}</p>
              </div>
            </div>
          )}
          {order.estimatedDeliveryTime && (
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4" />
              <div>
                <p className="text-xs text-gray-500">Estimado</p>
                <p className="font-medium">{formatDate(order.estimatedDeliveryTime, 'HH:mm')}</p>
              </div>
            </div>
          )}
        </div>

        {/* Rider Info */}
        {order.assignedTo && (
          <div className="flex items-center gap-2 text-sm text-gray-600 bg-blue-50 p-2 rounded">
            <User className="w-4 h-4" />
            <div>
              <p className="font-medium">{order.assignedTo.name}</p>
              <p className="text-xs text-gray-500">Repartidor asignado</p>
            </div>
            {order.assignedTo.phone && (
              <Button variant="ghost" size="sm" className="ml-auto">
                <Phone className="w-4 h-4" />
              </Button>
            )}
          </div>
        )}

        {/* Payment Info */}
        <div className="flex items-center gap-2 text-sm">
          <Badge variant="outline">
            {order.paymentMethod === 'pix' ? '💳 PIX' : 
             order.paymentMethod === 'credit_card' ? '💳 Crédito' : 
             order.paymentMethod === 'debit_card' ? '💳 Débito' : '💵 Efectivo'}
          </Badge>
          {order.paymentMethod === 'cash' && order.cashChange && (
            <span className="text-xs text-gray-500">
              Cambio para: {formatCurrency(order.cashChange)}
            </span>
          )}
        </div>

        {/* Actions */}
        {showActions && !order.assignedTo && order.status !== 'cancelled' && order.status !== 'delivered' && (
          <div className="flex gap-2 pt-2 border-t">
            <Button 
              className="flex-1"
              onClick={(e) => {
                e.stopPropagation();
                onAssignRider?.(order.id);
              }}
            >
              Asignar Repartidor
            </Button>
            <Button variant="outline" className="flex-1">
              Ver Detalles
            </Button>
          </div>
        )}
      </div>
    </Card>
  );
}
