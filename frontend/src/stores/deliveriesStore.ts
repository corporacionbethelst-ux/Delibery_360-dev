// Deliveries Store - Zustand para gestión de entregas
import { create } from 'zustand';
// Corregido: Importar DeliveryEvent en lugar de TrackingEvent
import type { Delivery, DeliveryStatus, DeliveryFilters, ProofOfDelivery, DeliveryEvent } from '@/types/delivery';
import api from '@/lib/api';

interface DeliveriesState {
  // Estado
  deliveries: Delivery[];
  selectedDelivery: Delivery | null;
  filters: DeliveryFilters;
  isLoading: boolean;
  error: string | null;
  total: number;
  
  // Acciones - Fetch
  fetchDeliveries: (filters?: Partial<DeliveryFilters>) => Promise<void>;
  fetchDeliveryById: (id: string) => Promise<void>;
  fetchActiveDeliveries: () => Promise<void>;
  fetchPendingDeliveries: () => Promise<void>;
  
  // Acciones - CRUD
  assignDelivery: (deliveryId: string, riderId: string) => Promise<Delivery>;
  unassignDelivery: (deliveryId: string) => Promise<Delivery>;
  startDelivery: (deliveryId: string) => Promise<Delivery>;
  finishDelivery: (deliveryId: string, proof: Omit<ProofOfDelivery, 'id' | 'deliveryId' | 'timestamp'>) => Promise<Delivery>;
  cancelDelivery: (deliveryId: string, reason: string) => Promise<Delivery>;
  
  // Acciones - Tracking
  // Corregido: Usar DeliveryEvent
  addTrackingEvent: (deliveryId: string, event: Omit<DeliveryEvent, 'id' | 'timestamp'>) => void;
  updateDeliveryLocation: (deliveryId: string, latitude: number, longitude: number) => void;
  
  // Acciones - Filtros
  setFilters: (filters: Partial<DeliveryFilters>) => void;
  resetFilters: () => void;
  setSelectedDelivery: (delivery: Delivery | null) => void;
  
  // Utilidades
  getDeliveriesByRider: (riderId: string) => Delivery[];
  getDeliveriesByStatus: (status: DeliveryStatus) => Delivery[];
  getUrgentDeliveries: () => Delivery[];
  searchDeliveries: (query: string) => Delivery[];
}

const initialState = {
  deliveries: [],
  selectedDelivery: null,
  filters: {},
  isLoading: false,
  error: null,
  total: 0,
};

export const useDeliveriesStore = create<DeliveriesState>((set, get) => ({
  ...initialState,
  
  // FETCH
  fetchDeliveries: async (filters?: Partial<DeliveryFilters>) => {
    set({ isLoading: true, error: null });
    try {
      const allFilters = { ...get().filters, ...filters };
      const params = new URLSearchParams();
      
      if (allFilters.status) params.append('status', allFilters.status.join(','));
      if (allFilters.riderId) params.append('riderId', allFilters.riderId);
      if (allFilters.orderId) params.append('orderId', allFilters.orderId);
      // Eliminado: allFilters.zone y allFilters.priority no existen en DeliveryFilters
      if (allFilters.dateFrom) params.append('dateFrom', allFilters.dateFrom.toISOString());
      if (allFilters.dateTo) params.append('dateTo', allFilters.dateTo.toISOString());
      if (allFilters.search) params.append('search', allFilters.search);
      
      const response = await api.get(`/deliveries?${params.toString()}`);
      set({ 
        deliveries: response.data.items || response.data, 
        total: response.data.total || response.data.length,
        isLoading: false 
      });
    } catch (error: any) {
      set({ error: error.message || 'Error al obtener entregas', isLoading: false });
      throw error;
    }
  },
  
  fetchDeliveryById: async (id: string) => {
    set({ isLoading: true, error: null });
    try {
      const response = await api.get(`/deliveries/${id}`);
      set({ selectedDelivery: response.data, isLoading: false });
    } catch (error: any) {
      set({ error: error.message || 'Error al obtener detalle de entrega', isLoading: false });
      throw error;
    }
  },
  
  fetchActiveDeliveries: async () => {
    set({ isLoading: true, error: null });
    try {
      const response = await api.get('/deliveries/active');
      set({ 
        deliveries: response.data, 
        total: response.data.length,
        isLoading: false 
      });
    } catch (error: any) {
      set({ error: error.message || 'Error al obtener entregas activas', isLoading: false });
      throw error;
    }
  },
  
  fetchPendingDeliveries: async () => {
    set({ isLoading: true, error: null });
    try {
      const response = await api.get('/deliveries/pending');
      set({ 
        deliveries: response.data, 
        total: response.data.length,
        isLoading: false 
      });
    } catch (error: any) {
      set({ error: error.message || 'Error al obtener entregas pendientes', isLoading: false });
      throw error;
    }
  },
  
  // CRUD OPERATIONS
  assignDelivery: async (deliveryId: string, riderId: string) => {
    set({ isLoading: true, error: null });
    try {
      const response = await api.post(`/deliveries/${deliveryId}/assign`, { riderId });
      const updatedDelivery = response.data;
      set((state) => ({
        deliveries: state.deliveries.map(d => d.id === deliveryId ? updatedDelivery : d),
        selectedDelivery: state.selectedDelivery?.id === deliveryId ? updatedDelivery : state.selectedDelivery,
        isLoading: false
      }));
      return updatedDelivery;
    } catch (error: any) {
      set({ error: error.message || 'Error al asignar entrega', isLoading: false });
      throw error;
    }
  },
  
  unassignDelivery: async (deliveryId: string) => {
    set({ isLoading: true, error: null });
    try {
      const response = await api.post(`/deliveries/${deliveryId}/unassign`);
      const updatedDelivery = response.data;
      set((state) => ({
        deliveries: state.deliveries.map(d => d.id === deliveryId ? updatedDelivery : d),
        selectedDelivery: state.selectedDelivery?.id === deliveryId ? updatedDelivery : state.selectedDelivery,
        isLoading: false
      }));
      return updatedDelivery;
    } catch (error: any) {
      set({ error: error.message || 'Error al desasignar entrega', isLoading: false });
      throw error;
    }
  },
  
  startDelivery: async (deliveryId: string) => {
    set({ isLoading: true, error: null });
    try {
      const response = await api.post(`/deliveries/${deliveryId}/start`);
      const updatedDelivery = response.data;
      set((state) => ({
        deliveries: state.deliveries.map(d => d.id === deliveryId ? updatedDelivery : d),
        selectedDelivery: state.selectedDelivery?.id === deliveryId ? updatedDelivery : state.selectedDelivery,
        isLoading: false
      }));
      return updatedDelivery;
    } catch (error: any) {
      set({ error: error.message || 'Error al iniciar entrega', isLoading: false });
      throw error;
    }
  },
  
  finishDelivery: async (deliveryId: string, proof: Omit<ProofOfDelivery, 'id' | 'deliveryId' | 'timestamp'>) => {
    set({ isLoading: true, error: null });
    try {
      const response = await api.post(`/deliveries/${deliveryId}/finish`, proof);
      const updatedDelivery = response.data;
      set((state) => ({
        deliveries: state.deliveries.map(d => d.id === deliveryId ? updatedDelivery : d),
        selectedDelivery: state.selectedDelivery?.id === deliveryId ? updatedDelivery : state.selectedDelivery,
        isLoading: false
      }));
      return updatedDelivery;
    } catch (error: any) {
      set({ error: error.message || 'Error al finalizar entrega', isLoading: false });
      throw error;
    }
  },
  
  cancelDelivery: async (deliveryId: string, reason: string) => {
    set({ isLoading: true, error: null });
    try {
      const response = await api.post(`/deliveries/${deliveryId}/cancel`, { reason });
      const updatedDelivery = response.data;
      set((state) => ({
        deliveries: state.deliveries.map(d => d.id === deliveryId ? updatedDelivery : d),
        selectedDelivery: state.selectedDelivery?.id === deliveryId ? updatedDelivery : state.selectedDelivery,
        isLoading: false
      }));
      return updatedDelivery;
    } catch (error: any) {
      set({ error: error.message || 'Error al cancelar entrega', isLoading: false });
      throw error;
    }
  },
  
  // TRACKING
  addTrackingEvent: (deliveryId: string, event: Omit<DeliveryEvent, 'id' | 'timestamp'>) => {
    const trackingEvent: DeliveryEvent = {
      ...event,
      id: crypto.randomUUID(),
      timestamp: new Date(),
    };
    
    set((state) => ({
      // Corregido: Usar 'events' en lugar de 'tracking'
      deliveries: state.deliveries.map(d => 
        d.id === deliveryId 
          ? { ...d, events: [...(d.events || []), trackingEvent] }
          : d
      ),
      selectedDelivery: state.selectedDelivery?.id === deliveryId
        ? { ...state.selectedDelivery, events: [...(state.selectedDelivery.events || []), trackingEvent] }
        : state.selectedDelivery
    }));
  },
  
  updateDeliveryLocation: (deliveryId: string, latitude: number, longitude: number) => {
    set((state) => ({
      deliveries: state.deliveries.map(d => 
        d.id === deliveryId 
          ? { 
              ...d, 
              // Actualiza la ubicación de entrega o añade un campo currentLocation si lo defines en el tipo
              deliveryLocation: {
                ...d.deliveryLocation,
                latitude,
                longitude
              }
            } 
          : d
      ),
      selectedDelivery: state.selectedDelivery?.id === deliveryId
        ? {
            ...state.selectedDelivery,
            deliveryLocation: {
              ...state.selectedDelivery.deliveryLocation,
              latitude,
              longitude
            }
          }
        : state.selectedDelivery
    }));
  },
  
  // FILTROS
  setFilters: (filters: Partial<DeliveryFilters>) => {
    set((state) => ({ filters: { ...state.filters, ...filters } }));
  },
  
  resetFilters: () => {
    set({ filters: {} });
  },
  
  setSelectedDelivery: (delivery: Delivery | null) => {
    set({ selectedDelivery: delivery });
  },
  
  // UTILIDADES
  getDeliveriesByRider: (riderId: string) => {
    const { deliveries } = get();
    return deliveries.filter(d => d.riderId === riderId);
  },
  
  getDeliveriesByStatus: (status: DeliveryStatus) => {
    const { deliveries } = get();
    return deliveries.filter(d => d.status === status);
  },
  
  getUrgentDeliveries: () => {
    const { deliveries } = get();
    const now = new Date();
    return deliveries.filter(d => {
      // Corregido: Usar estimatedDeliveryTime en lugar de slaDeadline
      if (!d.estimatedDeliveryTime) return false;
      const timeRemaining = d.estimatedDeliveryTime.getTime() - now.getTime();
      return timeRemaining < 30 * 60 * 1000 && d.status === 'EN_CAMINO';
    });
  },
  
  searchDeliveries: (query: string) => {
    const { deliveries } = get();
    const lowerQuery = query.toLowerCase();
    
    return deliveries.filter(d => {
      // 1. Nombre del cliente: Depende de cómo venga en tu objeto Order. 
      // Si Order tiene customerName directo, úsalo. Si viene anidado en order, usa d.order?.customerName.
      const customerName = d.order?.customerName || ''; 
      
      // 2. Dirección: Correcto según tu modelo DeliveryLocation
      const address = d.deliveryLocation?.address || '';
      
      // 3. Nombre del repartidor: CORREGIDO a 'fullName' según tu interfaz Rider
      const riderName = d.rider?.fullName || ''; 

      return (
        d.id.toLowerCase().includes(lowerQuery) ||
        customerName.toLowerCase().includes(lowerQuery) ||
        address.toLowerCase().includes(lowerQuery) ||
        (riderName && riderName.toLowerCase().includes(lowerQuery))
      );
    });
  },
}));

export default useDeliveriesStore;