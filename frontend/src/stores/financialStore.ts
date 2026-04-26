// Financial Store - Zustand para gestión financiera
import { create } from 'zustand';
import type { Transaction, FinancialReportDetailed, FinancialFilters } from '@/types/financial';
import api from '@/lib/api';

// Resumen simplificado para el dashboard (compatible con tu componente)
export interface FinancialSummary {
  totalRevenue: number;
  totalCosts: number;
  netProfit: number;
  riderPayments: number;      // Coincide con summary?.riderPayments
  netCommission: number;      // Coincide con summary?.netCommission
  pendingPayouts: number;     // Coincide con summary?.pendingPayouts
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
  // Estado
  summary: FinancialSummary | null;
  report: FinancialReportDetailed | null;
  transactions: Transaction[];
  rules: PaymentRule[];
  
  // Estados de carga
  isLoading: boolean;
  loading: boolean; // Alias para compatibilidad con el componente
  error: string | null;
  
  // Acciones Principales
  fetchSummary: () => Promise<void>;
  getFinancialReport: (filters?: Partial<FinancialFilters>) => Promise<FinancialReportDetailed | null>;
  getTransactions: (filters?: Partial<FinancialFilters>) => Promise<Transaction[]>;
  
  // ALIAS: Función requerida por ManagerFinancialPage
  getDailySummary: (period: string) => Promise<FinancialSummary | null>;
  
  // Gestión de Reglas
  fetchPaymentRules: () => Promise<void>;
  updatePaymentRule: (id: string, data: Partial<PaymentRule>) => Promise<void>;
}

export const useFinancialStore = create<FinancialState>((set, get) => ({
  summary: null,
  report: null,
  transactions: [],
  rules: [],
  isLoading: false,
  loading: false,
  error: null,

  // Fetch resumen general
  fetchSummary: async () => {
    set({ isLoading: true, error: null });
    try {
      // Simulación de datos si la API falla o no existe aún
      // const response = await api.get('/financial/summary');
      const mockData: FinancialSummary = {
        totalRevenue: 15000,
        totalCosts: 8000,
        netProfit: 7000,
        riderPayments: 6000,
        netCommission: 2500,
        pendingPayouts: 1200,
        activeDeliveries: 12,
        pendingPayments: 5,
      };
      
      // Descomentar cuando tengas la API real:
      // set({ summary: response.data, isLoading: false });
      set({ summary: mockData, isLoading: false });
    } catch (error: any) {
      set({ error: error.message, isLoading: false });
    }
  },

  // Obtener reporte detallado (usada internamente)
  getFinancialReport: async (filters?: Partial<FinancialFilters>) => {
    set({ loading: true, error: null });
    try {
      const params = new URLSearchParams();
      if (filters?.dateFrom) params.append('dateFrom', filters.dateFrom.toISOString());
      if (filters?.dateTo) params.append('dateTo', filters.dateTo.toISOString());
      if (filters?.statuses) params.append('statuses', filters.statuses.join(','));
      
      // Simulación de respuesta
      // const response = await api.get(`/financial/report?${params.toString()}`);
      
      const mockReport: FinancialReportDetailed = {
        period: {
          from: filters?.dateFrom || new Date(),
          to: filters?.dateTo || new Date(),
        },
        generatedAt: new Date(),
        totalRevenue: 15000,
        totalExpenses: 8000,
        totalRiderPayments: 6000,
        netProfit: 7000,
        profitMargin: 46.6,
        dailyConsolidated: [],
        topRiders: [],
        metrics: {
          averageTicket: 45.5,
          averageDeliveryFee: 5.5,
          averageDeliveryTime: 25,
          onTimePercentage: 92,
          cancellationRate: 3,
        },
      };

      // Descomentar cuando tengas la API real:
      // set({ report: response.data, loading: false });
      set({ report: mockReport, loading: false });
      return mockReport;
    } catch (error: any) {
      set({ error: error.message, loading: false });
      return null;
    }
  },

  // ALIAS EXPLÍCITO: getDailySummary para ManagerFinancialPage
  // Esto soluciona el error "getDailySummary does not exist"
  getDailySummary: async (period: string) => {
    // Mapeo simple de período a fechas (puedes mejorar esta lógica)
    const now = new Date();
    let dateFrom = new Date();
    
    if (period === 'today') {
      dateFrom.setHours(0, 0, 0, 0);
    } else if (period === 'week') {
      dateFrom.setDate(now.getDate() - 7);
    } else if (period === 'month') {
      dateFrom.setMonth(now.getMonth() - 1);
    }

    // Llama a la función principal y adapta la respuesta si es necesario
    const report = await get().getFinancialReport({ dateFrom, dateTo: now });
    
    if (!report) return null;

    // Adapta el reporte detallado al resumen simple que espera el componente
    const adaptedSummary: FinancialSummary = {
      totalRevenue: report.totalRevenue,
      totalCosts: report.totalExpenses,
      netProfit: report.netProfit,
      riderPayments: report.totalRiderPayments,
      netCommission: report.netProfit, // Simplificación
      pendingPayouts: 0, // Deberías calcularlo de las transacciones pendientes
      activeDeliveries: 0,
      pendingPayments: 0,
    };

    // Actualiza también el estado global del summary
    set({ summary: adaptedSummary });
    
    return adaptedSummary;
  },

  // Obtener transacciones
  getTransactions: async (filters?: Partial<FinancialFilters>) => {
    set({ loading: true, error: null });
    try {
      const params = new URLSearchParams();
      if (filters?.dateFrom) params.append('dateFrom', filters.dateFrom.toISOString());
      if (filters?.dateTo) params.append('dateTo', filters.dateTo.toISOString());
      if (filters?.statuses) params.append('statuses', filters.statuses.join(','));

      // Simulación de datos
      // const response = await api.get(`/financial/transactions?${params.toString()}`);
      
      const mockTransactions: Transaction[] = [
        {
          id: 'txn_123456',
          type: 'INGRESO',
          referenceType: 'ORDER',
          referenceId: 'ord_987',
          amount: 45.50,
          currency: 'BRL',
          status: 'PAGADO',
          paymentMethod: 'PIX',
          createdBy: 'system',
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          id: 'txn_123457',
          type: 'PAGO_RIDER',
          referenceType: 'RIDER_PAYMENT',
          referenceId: 'pay_555',
          amount: 30.00,
          currency: 'BRL',
          status: 'PENDIENTE',
          createdBy: 'admin',
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ];

      // Descomentar cuando tengas la API real:
      // set({ transactions: response.data, loading: false });
      set({ transactions: mockTransactions, loading: false });
      return mockTransactions;
    } catch (error: any) {
      set({ error: error.message, loading: false });
      return [];
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
      const response = await api.get('/financial/rules');
      set({ rules: response.data, isLoading: false });
    } catch (error: any) {
      set({ error: error.message, isLoading: false });
      throw error;
    }
  },
}));