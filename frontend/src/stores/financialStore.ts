import { create } from 'zustand';
import api from '@/lib/api';

// Definición de tipos financieros
export interface FinancialSummary {
  totalRevenue: number;
  totalCosts: number;
  netProfit: number;
  period: string;
}

export interface PaymentRule {
  id: string;
  name: string;
  baseRate: number;
  distanceRate: number;
  isActive: boolean;
}

interface FinancialState {
  summary: FinancialSummary | null;
  rules: PaymentRule[];
  loading: boolean;
  error: string | null;
  
  // Acciones
  fetchSummary: (period: string) => Promise<void>;
  fetchRules: () => Promise<void>;
  clearError: () => void;
}

export const useFinancial = create<FinancialState>((set) => ({
  summary: null,
  rules: [],
  loading: false,
  error: null,

  fetchSummary: async (period) => {
    set({ loading: true, error: null });
    try {
      // Simulación de llamada API si el endpoint no existe aún
      // const response = await api.get(`/financial/summary?period=${period}`);
      const mockData: FinancialSummary = {
        totalRevenue: 15420.50,
        totalCosts: 8300.20,
        netProfit: 7120.30,
        period
      };
      set({ summary: mockData, loading: false });
    } catch (err) {
      set({ error: 'Error al cargar datos financieros', loading: false });
    }
  },

  fetchRules: async () => {
    set({ loading: true, error: null });
    try {
      // const response = await api.get('/financial/rules');
      const mockRules: PaymentRule[] = [
        { id: '1', name: 'Tarifa Estándar', baseRate: 2.5, distanceRate: 0.8, isActive: true },
        { id: '2', name: 'Tarifa Nocturna', baseRate: 3.5, distanceRate: 1.2, isActive: true },
      ];
      set({ rules: mockRules, loading: false });
    } catch (err) {
      set({ error: 'Error al cargar reglas de pago', loading: false });
    }
  },

  clearError: () => set({ error: null }),
}));