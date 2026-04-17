// Financial Store - Zustand para gestión financiera
import { create } from 'zustand';
import api from '@/lib/api';

export interface FinancialSummary {
  totalRevenue: number;
  totalCosts: number;
  netProfit: number;
  activeDeliveries: number;
  pendingPayments: number;
}

export interface PaymentRule {
  id: string;
  name: string;
  baseRate: number;
  perKmRate: number;
  priorityMultiplier: number;
}

interface FinancialState {
  summary: FinancialSummary | null;
  rules: PaymentRule[];
  isLoading: boolean;
  error: string | null;
  
  fetchSummary: () => Promise<void>;
  fetchPaymentRules: () => Promise<void>;
  updatePaymentRule: (id: string, data: Partial<PaymentRule>) => Promise<void>;
}

export const useFinancialStore = create<FinancialState>((set) => ({
  summary: null,
  rules: [],
  isLoading: false,
  error: null,

  fetchSummary: async () => {
    set({ isLoading: true, error: null });
    try {
      const response = await api.get('/financial/summary');
      set({ summary: response.data, isLoading: false });
    } catch (error: any) {
      set({ error: error.message, isLoading: false });
    }
  },

  fetchPaymentRules: async () => {
    set({ isLoading: true, error: null });
    try {
      const response = await api.get('/financial/rules');
      set({ rules: response.data, isLoading: false });
    } catch (error: any) {
      set({ error: error.message, isLoading: false });
    }
  },

  updatePaymentRule: async (id: string, data: Partial<PaymentRule>) => {
    set({ isLoading: true, error: null });
    try {
      await api.put(`/financial/rules/${id}`, data);
      // Recargar reglas
      const response = await api.get('/financial/rules');
      set({ rules: response.data, isLoading: false });
    } catch (error: any) {
      set({ error: error.message, isLoading: false });
      throw error;
    }
  },
}));