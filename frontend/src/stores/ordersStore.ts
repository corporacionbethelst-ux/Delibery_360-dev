// Store de Orders con Zustand - Delivery360
import { create } from 'zustand';
import type { Order, OrderFilters, OrderStats, OrderCreateInput, OrderUpdateInput } from '../types/order';

interface OrdersState {
  // Datos
  orders: Order[];
  selectedOrder: Order | null;
  filters: OrderFilters;
  stats: OrderStats | null;
  
  // Estado de carga
  isLoading: boolean;
  isCreating: boolean;
  isUpdating: boolean;
  error: string | null;
  
  // Paginación
  pagination: {
    page: number;
    pageSize: number;
    total: number;
    totalPages: number;
  };
  
  // Acciones
  setOrders: (orders: Order[]) => void;
  addOrder: (order: Order) => void;
  updateOrder: (id: string, updates: Partial<Order>) => void;
  removeOrder: (id: string) => void;
  setSelectedOrder: (order: Order | null) => void;
  setFilters: (filters: Partial<OrderFilters>) => void;
  setStats: (stats: OrderStats) => void;
  
  // Fetch actions (se implementan con API real)
  fetchOrders: (filters?: OrderFilters) => Promise<void>;
  fetchOrderById: (id: string) => Promise<void>;
  createOrder: (input: OrderCreateInput) => Promise<Order>;
  updateOrderStatus: (id: string, status: Order['status']) => Promise<void>;
  assignRider: (orderId: string, riderId: string) => Promise<void>;
  deleteOrder: (id: string) => Promise<void>;
  
  reset: () => void;
}

const initialState = {
  orders: [],
  selectedOrder: null,
  filters: {},
  stats: null,
  isLoading: false,
  isCreating: false,
  isUpdating: false,
  error: null,
  pagination: {
    page: 1,
    pageSize: 20,
    total: 0,
    totalPages: 0,
  },
};

export const useOrdersStore = create<OrdersState>((set, get) => ({
  ...initialState,
  
  setOrders: (orders) => set({ orders }),
  
  addOrder: (order) => set((state) => ({ 
    orders: [order, ...state.orders] 
  })),
  
  updateOrder: (id, updates) => set((state) => ({
    orders: state.orders.map((order) => 
      order.id === id ? { ...order, ...updates } : order
    ),
    selectedOrder: state.selectedOrder?.id === id 
      ? { ...state.selectedOrder, ...updates } 
      : state.selectedOrder,
  })),
  
  removeOrder: (id) => set((state) => ({
    orders: state.orders.filter((order) => order.id !== id),
    selectedOrder: state.selectedOrder?.id === id ? null : state.selectedOrder,
  })),
  
  setSelectedOrder: (order) => set({ selectedOrder: order }),
  
  setFilters: (filters) => set((state) => ({ 
    filters: { ...state.filters, ...filters } 
  })),
  
  setStats: (stats) => set({ stats }),
  
  // Implementaciones placeholder para fetch actions
  fetchOrders: async (filters) => {
    set({ isLoading: true, error: null });
    try {
      // TODO: Implementar llamada a API real
      // const response = await api.get('/orders', { params: filters });
      console.log('Fetching orders with filters:', filters);
      set({ isLoading: false });
    } catch (error) {
      set({ 
        error: error instanceof Error ? error.message : 'Error al obtener pedidos',
        isLoading: false 
      });
    }
  },
  
  fetchOrderById: async (id) => {
    set({ isLoading: true, error: null });
    try {
      // TODO: Implementar llamada a API real
      // const response = await api.get(`/orders/${id}`);
      console.log('Fetching order:', id);
      set({ isLoading: false });
    } catch (error) {
      set({ 
        error: error instanceof Error ? error.message : 'Error al obtener pedido',
        isLoading: false 
      });
    }
  },
  
  createOrder: async (input) => {
    set({ isCreating: true, error: null });
    try {
      // TODO: Implementar llamada a API real
      // const response = await api.post('/orders', input);
      console.log('Creating order:', input);
      const newOrder: Order = {} as Order; // Placeholder
      set({ isCreating: false });
      return newOrder;
    } catch (error) {
      set({ 
        error: error instanceof Error ? error.message : 'Error al crear pedido',
        isCreating: false 
      });
      throw error;
    }
  },
  
  updateOrderStatus: async (id, status) => {
    set({ isUpdating: true, error: null });
    try {
      // TODO: Implementar llamada a API real
      // await api.patch(`/orders/${id}/status`, { status });
      console.log('Updating order status:', id, status);
      get().updateOrder(id, { status });
      set({ isUpdating: false });
    } catch (error) {
      set({ 
        error: error instanceof Error ? error.message : 'Error al actualizar estado',
        isUpdating: false 
      });
      throw error;
    }
  },
  
  assignRider: async (orderId, riderId) => {
    set({ isUpdating: true, error: null });
    try {
      // TODO: Implementar llamada a API real
      // await api.post(`/orders/${orderId}/assign`, { riderId });
      console.log('Assigning rider:', riderId, 'to order:', orderId);
      get().updateOrder(orderId, { assignedRiderId: riderId });
      set({ isUpdating: false });
    } catch (error) {
      set({ 
        error: error instanceof Error ? error.message : 'Error al asignar repartidor',
        isUpdating: false 
      });
      throw error;
    }
  },
  
  deleteOrder: async (id) => {
    set({ isUpdating: true, error: null });
    try {
      // TODO: Implementar llamada a API real
      // await api.delete(`/orders/${id}`);
      console.log('Deleting order:', id);
      get().removeOrder(id);
      set({ isUpdating: false });
    } catch (error) {
      set({ 
        error: error instanceof Error ? error.message : 'Error al eliminar pedido',
        isUpdating: false 
      });
      throw error;
    }
  },
  
  reset: () => set(initialState),
}));
