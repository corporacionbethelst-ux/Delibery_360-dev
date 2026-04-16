// Riders Store - Zustand para gestión de repartidores
import { create } from 'zustand';
import type { Rider, RiderStatus, RiderFilters, RiderCreateInput, RiderUpdateInput, RiderDocument } from '@/types/rider';
import api from '@/lib/api';

interface RidersState {
  // Estado
  riders: Rider[];
  selectedRider: Rider | null;
  filters: RiderFilters;
  isLoading: boolean;
  error: string | null;
  total: number;
  
  // Acciones - Fetch
  fetchRiders: (filters?: Partial<RiderFilters>) => Promise<void>;
  fetchRiderById: (id: string) => Promise<void>;
  fetchPendingDocuments: () => Promise<RiderDocument[]>;
  
  // Acciones - CRUD
  createRider: (data: RiderCreateInput) => Promise<Rider>;
  updateRider: (id: string, data: RiderUpdateInput) => Promise<Rider>;
  deleteRider: (id: string) => Promise<void>;
  approveRider: (id: string, observations?: string) => Promise<void>;
  rejectRider: (id: string, reason: string) => Promise<void>;
  
  // Acciones - Estado
  setRiderOnline: (id: string, online: boolean) => void;
  updateRiderLocation: (id: string, latitude: number, longitude: number) => void;
  
  // Acciones - Filtros
  setFilters: (filters: Partial<RiderFilters>) => void;
  resetFilters: () => void;
  setSelectedRider: (rider: Rider | null) => void;
  
  // Utilidades
  getAvailableRiders: () => Rider[];
  getRidersByZone: (zone: string) => Rider[];
  searchRiders: (query: string) => Rider[];
}

const initialState = {
  riders: [],
  selectedRider: null,
  filters: {},
  isLoading: false,
  error: null,
  total: 0,
};

export const useRidersStore = create<RidersState>((set, get) => ({
  ...initialState,
  
  // FETCH
  fetchRiders: async (filters?: Partial<RiderFilters>) => {
    set({ isLoading: true, error: null }); // Set loading state
    try {
      const allFilters = { ...get().filters, ...filters };
      const params = new URLSearchParams();
      
      if (allFilters.status) params.append('status', allFilters.status.join(','));
      if (allFilters.isOnline !== undefined) params.append('isOnline', String(allFilters.isOnline));
      if (allFilters.vehicleType) params.append('vehicleType', allFilters.vehicleType.join(','));
      if (allFilters.operatingZone) params.append('operatingZone', allFilters.operatingZone);
      if (allFilters.search) params.append('search', allFilters.search);
      if (allFilters.dateFrom) params.append('dateFrom', allFilters.dateFrom.toISOString());
      if (allFilters.dateTo) params.append('dateTo', allFilters.dateTo.toISOString());
      
      const response = await api.get(`/riders?${params.toString()}`); // Call get API endpoint
      set({ 
        riders: response.data.items, 
        total: response.data.total,
        isLoading: false 
      });
    } catch (error: any) {
      set({ error: error.message, isLoading: false }); // Clear loading state
      throw error;
    }
  },
  
  fetchRiderById: async (id: string) => {
    set({ isLoading: true, error: null }); // Set loading state
    try {
      const response = await api.get(`/riders/${id}`); // Call get API endpoint
      set({ selectedRider: response.data, isLoading: false }); // Clear loading state
    } catch (error: any) {
      set({ error: error.message, isLoading: false }); // Clear loading state
      throw error;
    }
  },
  
  fetchPendingDocuments: async () => {
    try {
      const response = await api.get('/riders/documents/pending'); // Call get API endpoint
      return response.data;
    } catch (error: any) {
      set({ error: error.message });
      throw error;
    }
  },
  
  // CRUD
  createRider: async (data: RiderCreateInput) => {
    set({ isLoading: true, error: null }); // Set loading state
    try {
      const response = await api.post('/riders', data); // Call post API endpoint
      const newRider = response.data;
      set((state) => ({ 
        riders: [...state.riders, newRider],
        total: state.total + 1,
        isLoading: false 
      }));
      return newRider;
    } catch (error: any) {
      set({ error: error.message, isLoading: false }); // Clear loading state
      throw error;
    }
  },
  
  updateRider: async (id: string, data: RiderUpdateInput) => {
    set({ isLoading: true, error: null }); // Set loading state
    try {
      const response = await api.put(`/riders/${id}`, data); // Call put API endpoint
      const updatedRider = response.data;
      set((state) => ({
        riders: state.riders.map(r => r.id === id ? updatedRider : r),
        selectedRider: state.selectedRider?.id === id ? updatedRider : state.selectedRider,
        isLoading: false
      }));
      return updatedRider;
    } catch (error: any) {
      set({ error: error.message, isLoading: false }); // Clear loading state
      throw error;
    }
  },
  
  deleteRider: async (id: string) => {
    set({ isLoading: true, error: null }); // Set loading state
    try {
      await api.delete(`/riders/${id}`); // Call delete API endpoint
      set((state) => ({
        riders: state.riders.filter(r => r.id !== id),
        total: state.total - 1,
        selectedRider: state.selectedRider?.id === id ? null : state.selectedRider,
        isLoading: false
      }));
    } catch (error: any) {
      set({ error: error.message, isLoading: false }); // Clear loading state
      throw error;
    }
  },
  
  approveRider: async (id: string, observations?: string) => {
    set({ isLoading: true, error: null }); // Set loading state
    try {
      await api.post(`/riders/${id}/approve`, { observations }); // Call post API endpoint
      const response = await api.get(`/riders/${id}`); // Call get API endpoint
      const updatedRider = response.data;
      set((state) => ({
        riders: state.riders.map(r => r.id === id ? updatedRider : r),
        isLoading: false
      }));
    } catch (error: any) {
      set({ error: error.message, isLoading: false }); // Clear loading state
      throw error;
    }
  },
  
  rejectRider: async (id: string, reason: string) => {
    set({ isLoading: true, error: null }); // Set loading state
    try {
      await api.post(`/riders/${id}/reject`, { reason }); // Call post API endpoint
      const response = await api.get(`/riders/${id}`); // Call get API endpoint
      const updatedRider = response.data;
      set((state) => ({
        riders: state.riders.map(r => r.id === id ? updatedRider : r),
        isLoading: false
      }));
    } catch (error: any) {
      set({ error: error.message, isLoading: false }); // Clear loading state
      throw error;
    }
  },
  
  // ESTADO
  setRiderOnline: (id: string, online: boolean) => {
    set((state) => ({
      riders: state.riders.map(r => 
        r.id === id ? { ...r, isOnline: online } : r
      ),
      selectedRider: state.selectedRider?.id === id 
        ? { ...state.selectedRider, isOnline: online } 
        : state.selectedRider
    }));
  },
  
  updateRiderLocation: (id: string, latitude: number, longitude: number) => {
    set((state) => ({
      riders: state.riders.map(r => 
        r.id === id 
          ? { 
              ...r, 
              location: { 
                latitude, 
                longitude, 
                lastUpdate: new Date() 
              } 
            } 
          : r
      ),
      selectedRider: state.selectedRider?.id === id
        ? {
            ...state.selectedRider,
            location: {
              latitude,
              longitude,
              lastUpdate: new Date()
            }
          }
        : state.selectedRider
    }));
  },
  
  // FILTROS
  setFilters: (filters: Partial<RiderFilters>) => {
    set((state) => ({ filters: { ...state.filters, ...filters } }));
  },
  
  resetFilters: () => {
    set({ filters: {} });
  },
  
  setSelectedRider: (rider: Rider | null) => {
    set({ selectedRider: rider });
  },
  
  // UTILIDADES
  getAvailableRiders: () => {
    const { riders } = get();
    return riders.filter(r => r.status === 'ACTIVO' && r.isOnline);
  },
  
  getRidersByZone: (zone: string) => {
    const { riders } = get();
    return riders.filter(r => r.operatingZone === zone && r.isOnline && r.status === 'ACTIVO');
  },
  
  searchRiders: (query: string) => {
    const { riders } = get();
    const lowerQuery = query.toLowerCase();
    return riders.filter(r => 
      r.fullName.toLowerCase().includes(lowerQuery) ||
      r.email.toLowerCase().includes(lowerQuery) ||
      r.phone.includes(query)
    );
  },
}));

export default useRidersStore;
