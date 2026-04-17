// Rider Personal Store - Para datos específicos del repartidor logueado
import { create } from 'zustand';
import api from '@/lib/api';
import type { Delivery } from '@/types/delivery';

interface RiderPersonalState {
  myDeliveries: Delivery[];
  todayEarnings: number;
  weeklyEarnings: number;
  isLoading: boolean;
  error: string | null;

  fetchMyDeliveries: () => Promise<void>;
  fetchMyEarnings: () => Promise<void>;
  startDeliveryAction: (deliveryId: string) => Promise<void>;
  finishDeliveryAction: (deliveryId: string, proof: any) => Promise<void>;
}

export const useRiderPersonalStore = create<RiderPersonalState>((set) => ({
  myDeliveries: [],
  todayEarnings: 0,
  weeklyEarnings: 0,
  isLoading: false,
  error: null,

  fetchMyDeliveries: async () => {
    set({ isLoading: true, error: null });
    try {
      const response = await api.get('/rider/my-deliveries');
      set({ myDeliveries: response.data, isLoading: false });
    } catch (error: any) {
      set({ error: error.message, isLoading: false });
    }
  },

  fetchMyEarnings: async () => {
    try {
      const [today, weekly] = await Promise.all([
        api.get('/rider/earnings/today'),
        api.get('/rider/earnings/weekly')
      ]);
      set({ 
        todayEarnings: today.data.amount, 
        weeklyEarnings: weekly.data.amount 
      });
    } catch (error: any) {
      set({ error: error.message });
    }
  },

  startDeliveryAction: async (deliveryId: string) => {
    set({ isLoading: true, error: null });
    try {
      await api.post(`/deliveries/${deliveryId}/start`);
      // Actualizar lista localmente
      set((state) => ({
        myDeliveries: state.myDeliveries.map(d => 
          d.id === deliveryId ? { ...d, status: 'EN_CAMINO' } : d
        ),
        isLoading: false
      }));
    } catch (error: any) {
      set({ error: error.message, isLoading: false });
      throw error;
    }
  },

  finishDeliveryAction: async (deliveryId: string, proof: any) => {
    set({ isLoading: true, error: null });
    try {
      await api.post(`/deliveries/${deliveryId}/finish`, proof);
      set((state) => ({
        myDeliveries: state.myDeliveries.map(d => 
          d.id === deliveryId ? { ...d, status: 'ENTREGADO' } : d
        ),
        isLoading: false
      }));
    } catch (error: any) {
      set({ error: error.message, isLoading: false });
      throw error;
    }
  },
}));