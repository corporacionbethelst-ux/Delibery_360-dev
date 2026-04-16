// Realtime Store - Zustand para actualizaciones en tiempo real (WebSocket)
import { create } from 'zustand';
import type { Order, OrderStatus } from '@/types/order';
import type { Delivery, DeliveryStatus } from '@/types/delivery';
import type { Rider, RiderStatus } from '@/types/rider';
import type { Alert } from '@/types/alerts';

interface RealtimeState {
  // Estado de conexión
  isConnected: boolean;
  isConnecting: boolean;
  lastMessageAt: Date | null;
  error: string | null;
  
  // Datos en tiempo real
  activeOrders: Order[];
  activeDeliveries: Delivery[];
  onlineRiders: Rider[];
  alerts: Alert[];
  
  // Acciones - Conexión
  connect: () => void;
  disconnect: () => void;
  reconnect: () => void;
  
  // Acciones - Actualización de datos
  updateOrder: (order: Order) => void;
  updateDelivery: (delivery: Delivery) => void;
  updateRider: (rider: Rider) => void;
  addAlert: (alert: Alert) => void;
  dismissAlert: (alertId: string) => void;
  
  // Acciones - Estado
  setConnected: (connected: boolean) => void;
  setError: (error: string | null) => void;
  clearAll: () => void;
}

const initialState = {
  isConnected: false,
  isConnecting: false,
  lastMessageAt: null,
  error: null,
  activeOrders: [],
  activeDeliveries: [],
  onlineRiders: [],
  alerts: [],
};

export const useRealtimeStore = create<RealtimeState>((set, get) => ({
  ...initialState,
  
  // CONEXIÓN
  connect: () => {
    set({ isConnecting: true, error: null }); // Clear error state
    // La implementación real se hace en WebSocketContext
    // Este store solo gestiona el estado
  },
  
  disconnect: () => {
    set({ 
      isConnected: false, 
      isConnecting: false,
      lastMessageAt: null 
    });
  },
  
  reconnect: () => {
    set({ isConnecting: true });
    // La implementación real se hace en WebSocketContext
  },
  
  // ACTUALIZACIÓN DE DATOS
  updateOrder: (order: Order) => {
    set((state) => {
      const existingIndex = state.activeOrders.findIndex(o => o.id === order.id);
      
      if (existingIndex >= 0) {
        // Actualizar orden existente
        const updatedOrders = [...state.activeOrders];
        updatedOrders[existingIndex] = order;
        
        // Si el estado es final, remover de activas
        const finalStatuses: OrderStatus[] = ['COMPLETADO', 'CANCELADO'];
        if (finalStatuses.includes(order.status)) {
          updatedOrders.splice(existingIndex, 1);
        }
        
        return { activeOrders: updatedOrders };
      } else {
        // Nueva orden
        return { activeOrders: [...state.activeOrders, order] };
      }
    });
  },
  
  updateDelivery: (delivery: Delivery) => {
    set((state) => {
      const existingIndex = state.activeDeliveries.findIndex(d => d.id === delivery.id);
      
      if (existingIndex >= 0) {
        // Actualizar entrega existente
        const updatedDeliveries = [...state.activeDeliveries];
        updatedDeliveries[existingIndex] = delivery;
        
        // Si el estado es final, remover de activas
        const finalStatuses: DeliveryStatus[] = ['ENTREGADO', 'CANCELADO'];
        if (finalStatuses.includes(delivery.status)) {
          updatedDeliveries.splice(existingIndex, 1);
        }
        
        return { activeDeliveries: updatedDeliveries };
      } else {
        // Nueva entrega
        return { activeDeliveries: [...state.activeDeliveries, delivery] };
      }
    });
  },
  
  updateRider: (rider: Rider) => {
    set((state) => {
      const existingIndex = state.onlineRiders.findIndex(r => r.id === rider.id);
      
      if (rider.isOnline && rider.status === 'ACTIVO') {
        if (existingIndex >= 0) {
          // Actualizar rider existente
          const updatedRiders = [...state.onlineRiders];
          updatedRiders[existingIndex] = rider;
          return { onlineRiders: updatedRiders };
        } else {
          // Nuevo rider online
          return { onlineRiders: [...state.onlineRiders, rider] };
        }
      } else {
        // Rider offline o inactivo - remover
        if (existingIndex >= 0) {
          const updatedRiders = [...state.onlineRiders];
          updatedRiders.splice(existingIndex, 1);
          return { onlineRiders: updatedRiders };
        }
      }
      
      return {};
    });
  },
  
  addAlert: (alert: Alert) => {
    set((state) => ({
      alerts: [alert, ...state.alerts].slice(0, 50) // Máximo 50 alertas
    }));
  },
  
  dismissAlert: (alertId: string) => {
    set((state) => ({
      alerts: state.alerts.filter(a => a.id !== alertId)
    }));
  },
  
  // ESTADO
  setConnected: (connected: boolean) => {
    set({ 
      isConnected: connected, 
      isConnecting: !connected,
      lastMessageAt: connected ? new Date() : null
    });
  },
  
  setError: (error: string | null) => {
    set({ error, isConnecting: false });
  },
  
  clearAll: () => {
    set(initialState);
  },
}));

export default useRealtimeStore;
