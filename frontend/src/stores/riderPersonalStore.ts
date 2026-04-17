import { create } from 'zustand';

export interface EarningRecord {
  date: string;
  amount: number;
  status: 'paid' | 'pending';
  deliveryCount: number;
}

export interface ProductivityMetric {
  day: string;
  deliveries: number;
  hours: number;
  efficiency: number;
}

interface RiderPersonalState {
  earnings: EarningRecord[];
  productivity: ProductivityMetric[];
  profile: any | null;
  loading: boolean;
  
  fetchEarnings: () => Promise<void>;
  fetchProductivity: () => Promise<void>;
  fetchProfile: () => Promise<void>;
}

export const useRiderPersonal = create<RiderPersonalState>((set) => ({
  earnings: [],
  productivity: [],
  profile: null,
  loading: false,

  fetchEarnings: async () => {
    set({ loading: true });
    // Simular datos
    setTimeout(() => {
      set({ 
        earnings: [
          { date: '2023-10-01', amount: 45.50, status: 'paid', deliveryCount: 12 },
          { date: '2023-10-02', amount: 38.20, status: 'pending', deliveryCount: 9 }
        ],
        loading: false 
      });
    }, 500);
  },

  fetchProductivity: async () => {
    set({ loading: true });
    setTimeout(() => {
      set({
        productivity: [
          { day: 'Lun', deliveries: 15, hours: 6, efficiency: 92 },
          { day: 'Mar', deliveries: 18, hours: 7, efficiency: 95 },
          { day: 'Mie', deliveries: 12, hours: 5, efficiency: 88 },
        ],
        loading: false
      });
    }, 500);
  },

  fetchProfile: async () => {
    set({ loading: true });
    setTimeout(() => {
      set({
        profile: { name: 'Carlos Ruiz', vehicle: 'Motocicleta Yamaha', license: 'A-12345' },
        loading: false
      });
    }, 500);
  },
}));