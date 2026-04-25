// Store de Orders con Zustand - Delivery360
import { create } from 'zustand';
import api from '@/lib/api';
import type { Order, OrderFilters, OrderStats, OrderCreateInput, OrderUpdateInput, OrderStatus } from '../types/order';

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
  
  // Fetch actions (API real)
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
  
  // FETCH - API Real (CORREGIDO)
  fetchOrders: async (filters) => {
    set({ isLoading: true, error: null });
    try {
      const params = new URLSearchParams();
      
      // CORRECCIÓN: Usar las propiedades correctas de OrderFilters
      if (filters?.status && filters.status.length > 0) {
        // Unir array de estados con comas
        params.append('status', filters.status.join(','));
      }
      
      if (filters?.riderId) {
        params.append('rider_id', filters.riderId);
      }
      
      if (filters?.dateFrom) {
        params.append('date_from', filters.dateFrom.toISOString());
      }
      
      if (filters?.dateTo) {
        params.append('date_to', filters.dateTo.toISOString());
      }
      
      if (filters?.search) {
        params.append('search', filters.search);
      }

      // Paginación (si existe en tu filtro o se maneja aparte)
      const currentPage = get().pagination.page;
      const pageSize = get().pagination.pageSize;
      params.append('page', String(currentPage));
      params.append('page_size', String(pageSize));
      
      const response = await api.get(`/orders?${params.toString()}`);
      
      // Manejar respuesta (ajustar según tu backend: items/data y total)
      const data = response.data.items || response.data.data || response.data || [];
      const total = response.data.total || data.length;

      set({ 
        orders: data,
        pagination: {
          ...get().pagination,
          total: total,
          totalPages: Math.ceil(total / pageSize),
        },
        isLoading: false 
      });
    } catch (error: any) {
      set({ 
        error: error.response?.data?.detail || error.message || 'Error al obtener pedidos',
        isLoading: false 
      });
      throw error;
    }
  },
  
  fetchOrderById: async (id) => {
    set({ isLoading: true, error: null });
    try {
      const response = await api.get(`/orders/${id}`);
      set({ selectedOrder: response.data, isLoading: false });
    } catch (error: any) {
      set({ 
        error: error.response?.data?.detail || error.message || 'Error al obtener pedido',
        isLoading: false 
      });
      throw error;
    }
  },
  
  createOrder: async (input) => {
    set({ isCreating: true, error: null });
    try {
      const response = await api.post('/orders', input);
      const newOrder: Order = response.data;
      set((state) => ({ 
        orders: [newOrder, ...state.orders],
        pagination: {
          ...state.pagination,
          total: state.pagination.total + 1,
        },
        isCreating: false 
      }));
      return newOrder;
    } catch (error: any) {
      set({ 
        error: error.response?.data?.detail || error.message || 'Error al crear pedido',
        isCreating: false 
      });
      throw error;
    }
  },
  
  updateOrderStatus: async (id, status) => {
    set({ isUpdating: true, error: null });
    try {
      // Ajusta la URL según tu backend real
      const response = await api.patch(`/orders/${id}/status`, { status });
      const updatedOrder: Order = response.data;
      get().updateOrder(id, updatedOrder);
      set({ isUpdating: false });
    } catch (error: any) {
      set({ 
        error: error.response?.data?.detail || error.message || 'Error al actualizar estado',
        isUpdating: false 
      });
      throw error;
    }
  },
  
  assignRider: async (orderId, riderId) => {
    set({ isUpdating: true, error: null });
    try {
      const response = await api.post(`/orders/${orderId}/assign`, { rider_id: riderId });
      const updatedOrder: Order = response.data;
      get().updateOrder(orderId, updatedOrder);
      set({ isUpdating: false });
    } catch (error: any) {
      set({ 
        error: error.response?.data?.detail || error.message || 'Error al asignar repartidor',
        isUpdating: false 
      });
      throw error;
    }
  },
  
  deleteOrder: async (id) => {
    set({ isUpdating: true, error: null });
    try {
      await api.delete(`/orders/${id}`);
      get().removeOrder(id);
      set({ isUpdating: false });
    } catch (error: any) {
      set({ 
        error: error.response?.data?.detail || error.message || 'Error al eliminar pedido',
        isUpdating: false 
      });
      throw error;
    }
  },
  
  reset: () => set(initialState),
}));