// Deliveries Store - Zustand para gestión de entregas
import { create } from 'zustand';
import type { Delivery, DeliveryStatus, DeliveryFilters, ProofOfDelivery, TrackingEvent } from '@/types/delivery';
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
  addTrackingEvent: (deliveryId: string, event: Omit<TrackingEvent, 'id' | 'timestamp'>) => void;
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
    set({ isLoading: true, error: null }); // Set loading state
    try {
      const allFilters = { ...get().filters, ...filters };
      const params = new URLSearchParams();
      
      if (allFilters.status) params.append('status', allFilters.status.join(','));
      if (allFilters.riderId) params.append('riderId', allFilters.riderId);
      if (allFilters.orderId) params.append('orderId', allFilters.orderId);
      if (allFilters.zone) params.append('zone', allFilters.zone);
      if (allFilters.priority) params.append('priority', allFilters.priority);
      if (allFilters.dateFrom) params.append('dateFrom', allFilters.dateFrom.toISOString());
      if (allFilters.dateTo) params.append('dateTo', allFilters.dateTo.toISOString());
      if (allFilters.search) params.append('search', allFilters.search);
      
      const response = await api.get(`/deliveries?${params.toString()}`); // Call get API endpoint
      set({ 
        deliveries: response.data.items, 
        total: response.data.total,
        isLoading: false 
      });
    } catch (error: any) {
      set({ error: error.message, isLoading: false }); // Clear loading state
      throw error;
    }
  },
  
  fetchDeliveryById: async (id: string) => {
    set({ isLoading: true, error: null }); // Set loading state
    try {
      const response = await api.get(`/deliveries/${id}`); // Call get API endpoint
      set({ selectedDelivery: response.data, isLoading: false }); // Clear loading state
    } catch (error: any) {
      set({ error: error.message, isLoading: false }); // Clear loading state
      throw error;
    }
  },
  
  fetchActiveDeliveries: async () => {
    set({ isLoading: true, error: null }); // Set loading state
    try {
      const response = await api.get('/deliveries/active'); // Call get API endpoint
      set({ 
        deliveries: response.data, 
        total: response.data.length,
        isLoading: false 
      });
    } catch (error: any) {
      set({ error: error.message, isLoading: false }); // Clear loading state
      throw error;
    }
  },
  
  fetchPendingDeliveries: async () => {
    set({ isLoading: true, error: null }); // Set loading state
    try {
      const response = await api.get('/deliveries/pending'); // Call get API endpoint
      set({ 
        deliveries: response.data, 
        total: response.data.length,
        isLoading: false 
      });
    } catch (error: any) {
      set({ error: error.message, isLoading: false }); // Clear loading state
      throw error;
    }
  },
  
  // CRUD OPERATIONS
  assignDelivery: async (deliveryId: string, riderId: string) => {
    set({ isLoading: true, error: null }); // Set loading state
    try {
      const response = await api.post(`/deliveries/${deliveryId}/assign`, { riderId }); // Call post API endpoint
      const updatedDelivery = response.data;
      set((state) => ({
        deliveries: state.deliveries.map(d => d.id === deliveryId ? updatedDelivery : d),
        selectedDelivery: state.selectedDelivery?.id === deliveryId ? updatedDelivery : state.selectedDelivery,
        isLoading: false
      }));
      return updatedDelivery;
    } catch (error: any) {
      set({ error: error.message, isLoading: false }); // Clear loading state
      throw error;
    }
  },
  
  unassignDelivery: async (deliveryId: string) => {
    set({ isLoading: true, error: null }); // Set loading state
    try {
      const response = await api.post(`/deliveries/${deliveryId}/unassign`); // Call post API endpoint
      const updatedDelivery = response.data;
      set((state) => ({
        deliveries: state.deliveries.map(d => d.id === deliveryId ? updatedDelivery : d),
        selectedDelivery: state.selectedDelivery?.id === deliveryId ? updatedDelivery : state.selectedDelivery,
        isLoading: false
      }));
      return updatedDelivery;
    } catch (error: any) {
      set({ error: error.message, isLoading: false }); // Clear loading state
      throw error;
    }
  },
  
  startDelivery: async (deliveryId: string) => {
    set({ isLoading: true, error: null }); // Set loading state
    try {
      const response = await api.post(`/deliveries/${deliveryId}/start`); // Call post API endpoint
      const updatedDelivery = response.data;
      set((state) => ({
        deliveries: state.deliveries.map(d => d.id === deliveryId ? updatedDelivery : d),
        selectedDelivery: state.selectedDelivery?.id === deliveryId ? updatedDelivery : state.selectedDelivery,
        isLoading: false
      }));
      return updatedDelivery;
    } catch (error: any) {
      set({ error: error.message, isLoading: false }); // Clear loading state
      throw error;
    }
  },
  
  finishDelivery: async (deliveryId: string, proof: Omit<ProofOfDelivery, 'id' | 'deliveryId' | 'timestamp'>) => {
    set({ isLoading: true, error: null }); // Set loading state
    try {
      const response = await api.post(`/deliveries/${deliveryId}/finish`, proof); // Call post API endpoint
      const updatedDelivery = response.data;
      set((state) => ({
        deliveries: state.deliveries.map(d => d.id === deliveryId ? updatedDelivery : d),
        selectedDelivery: state.selectedDelivery?.id === deliveryId ? updatedDelivery : state.selectedDelivery,
        isLoading: false
      }));
      return updatedDelivery;
    } catch (error: any) {
      set({ error: error.message, isLoading: false }); // Clear loading state
      throw error;
    }
  },
  
  cancelDelivery: async (deliveryId: string, reason: string) => {
    set({ isLoading: true, error: null }); // Set loading state
    try {
      const response = await api.post(`/deliveries/${deliveryId}/cancel`, { reason }); // Call post API endpoint
      const updatedDelivery = response.data;
      set((state) => ({
        deliveries: state.deliveries.map(d => d.id === deliveryId ? updatedDelivery : d),
        selectedDelivery: state.selectedDelivery?.id === deliveryId ? updatedDelivery : state.selectedDelivery,
        isLoading: false
      }));
      return updatedDelivery;
    } catch (error: any) {
      set({ error: error.message, isLoading: false }); // Clear loading state
      throw error;
    }
  },
  
  // TRACKING
  addTrackingEvent: (deliveryId: string, event: Omit<TrackingEvent, 'id' | 'timestamp'>) => {
    const trackingEvent: TrackingEvent = {
      ...event,
      id: crypto.randomUUID(),
      timestamp: new Date(),
    };
    
    set((state) => ({
      deliveries: state.deliveries.map(d => 
        d.id === deliveryId 
          ? { ...d, tracking: [...d.tracking, trackingEvent] }
          : d
      ),
      selectedDelivery: state.selectedDelivery?.id === deliveryId
        ? { ...state.selectedDelivery, tracking: [...state.selectedDelivery.tracking, trackingEvent] }
        : state.selectedDelivery
    }));
  },
  
  updateDeliveryLocation: (deliveryId: string, latitude: number, longitude: number) => {
    set((state) => ({
      deliveries: state.deliveries.map(d => 
        d.id === deliveryId 
          ? { 
              ...d, 
              currentLocation: { 
                latitude, 
                longitude, 
                lastUpdate: new Date() 
              } 
            } 
          : d
      ),
      selectedDelivery: state.selectedDelivery?.id === deliveryId
        ? {
            ...state.selectedDelivery,
            currentLocation: {
              latitude,
              longitude,
              lastUpdate: new Date()
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
      if (!d.slaDeadline) return false;
      const timeRemaining = d.slaDeadline.getTime() - now.getTime();
      return timeRemaining < 30 * 60 * 1000 && d.status === 'EN_CAMINO'; // Menos de 30 min
    });
  },
  
  searchDeliveries: (query: string) => {
    const { deliveries } = get();
    const lowerQuery = query.toLowerCase();
    return deliveries.filter(d => 
      d.id.toLowerCase().includes(lowerQuery) ||
      d.customerName.toLowerCase().includes(lowerQuery) ||
      d.address.street.toLowerCase().includes(lowerQuery) ||
      (d.riderName && d.riderName.toLowerCase().includes(lowerQuery))
    );
  },
}));

export default useDeliveriesStore;
