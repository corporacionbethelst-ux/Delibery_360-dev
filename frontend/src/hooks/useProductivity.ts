// Hook personalizado para métricas de productividad
import { useState, useEffect, useCallback } from 'react';
import type { ProductivityMetrics, RiderProductivity, TimeMetrics, SLAMetrics } from '@/types/productivity';
import api from '@/lib/api';

export interface UseProductivityOptions {
  riderId?: string;
  dateFrom?: Date;
  dateTo?: Date;
  autoFetch?: boolean;
  refreshInterval?: number; // en ms, 0 para no refresh automático
}

interface UseProductivityReturn {
  // Datos
  metrics: ProductivityMetrics | null;
  riderProductivity: RiderProductivity[];
  timeMetrics: TimeMetrics | null;
  slaMetrics: SLAMetrics | null;
  
  // Estado
  loading: boolean;
  error: string | null;
  lastUpdated: Date | null;
  
  // Acciones
  fetchMetrics: (options?: Partial<UseProductivityOptions>) => Promise<void>;
  fetchRiderProductivity: (riderId: string, dateFrom: Date, dateTo: Date) => Promise<void>;
  fetchTimeMetrics: (date: Date) => Promise<void>;
  fetchSLAMetrics: (dateFrom: Date, dateTo: Date) => Promise<void>;
  refresh: () => void;
  
  // Utilidades
  calculateEfficiency: (completed: number, total: number) => number;
  calculateAverageTime: (times: number[]) => number;
  getPerformanceLevel: (score: number) => number;
}

const defaultOptions: UseProductivityOptions = {
  autoFetch: true,
  refreshInterval: 0,
};

export const useProductivity = (options: UseProductivityOptions = {}): UseProductivityReturn => {
  const mergedOptions = { ...defaultOptions, ...options };
  
  const [metrics, setMetrics] = useState<ProductivityMetrics | null>(null); // State initialized to null
  const [riderProductivity, setRiderProductivity] = useState<RiderProductivity[]>([]); // State initialized to empty array
  const [timeMetrics, setTimeMetrics] = useState<TimeMetrics | null>(null); // State initialized to null
  const [slaMetrics, setSlaMetrics] = useState<SLAMetrics | null>(null); // State initialized to null
  
  const [loading, setLoading] = useState<boolean>(mergedOptions.autoFetch);
  const [error, setError] = useState<string | null>(null); // State initialized to null
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null); // State initialized to null

  // Fetch general metrics
  const fetchMetrics = useCallback(async (overrideOptions?: Partial<UseProductivityOptions>) => {
    const opts = { ...mergedOptions, ...overrideOptions };
    setLoading(true);
    setError(null);
    
    try {
      const params = new URLSearchParams();
      
      if (opts.riderId) params.append('riderId', opts.riderId);
      if (opts.dateFrom) params.append('dateFrom', opts.dateFrom.toISOString());
      if (opts.dateTo) params.append('dateTo', opts.dateTo.toISOString());
      
      const response = await api.get(`/productivity/metrics?${params.toString()}`); // Call get API endpoint
      setMetrics(response.data);
      setLastUpdated(new Date());
    } catch (err: any) {
      setError(err.message || 'Error fetching productivity metrics');
    } finally {
      setLoading(false);
    }
  }, [mergedOptions]);

  // Fetch rider-specific productivity
  const fetchRiderProductivity = useCallback(async (
    riderId: string, 
    dateFrom: Date, 
    dateTo: Date
  ) => {
    setLoading(true);
    setError(null);
    
    try {
      const params = new URLSearchParams({
        dateFrom: dateFrom.toISOString(),
        dateTo: dateTo.toISOString(),
      });
      
      const response = await api.get(`/productivity/riders/${riderId}?${params}`); // Call get API endpoint
      setRiderProductivity([response.data]);
      setLastUpdated(new Date());
    } catch (err: any) {
      setError(err.message || 'Error fetching rider productivity');
    } finally {
      setLoading(false);
    }
  }, []);

  // Fetch time-based metrics (orders per hour, etc.)
  const fetchTimeMetrics = useCallback(async (date: Date) => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await api.get(`/productivity/time-metrics?date=${date.toISOString()}`); // Call get API endpoint
      setTimeMetrics(response.data);
      setLastUpdated(new Date());
    } catch (err: any) {
      setError(err.message || 'Error fetching time metrics');
    } finally {
      setLoading(false);
    }
  }, []);

  // Fetch SLA compliance metrics
  const fetchSLAMetrics = useCallback(async (dateFrom: Date, dateTo: Date) => {
    setLoading(true);
    setError(null);
    
    try {
      const params = new URLSearchParams({
        dateFrom: dateFrom.toISOString(),
        dateTo: dateTo.toISOString(),
      });
      
      const response = await api.get(`/productivity/sla?${params}`); // Call get API endpoint
      setSlaMetrics(response.data);
      setLastUpdated(new Date());
    } catch (err: any) {
      setError(err.message || 'Error fetching SLA metrics');
    } finally {
      setLoading(false);
    }
  }, []);

  // Refresh data
  const refresh = useCallback(() => {
    if (mergedOptions.riderId && mergedOptions.dateFrom && mergedOptions.dateTo) {
      fetchRiderProductivity(mergedOptions.riderId, mergedOptions.dateFrom, mergedOptions.dateTo);
    }
    fetchMetrics();
  }, [fetchMetrics, fetchRiderProductivity, mergedOptions]);

  // Auto-fetch on mount
  useEffect(() => {
    if (mergedOptions.autoFetch) {
      fetchMetrics();
    }
  }, [fetchMetrics, mergedOptions.autoFetch]);

  // Auto-refresh interval
  useEffect(() => {
    if (mergedOptions.refreshInterval && mergedOptions.refreshInterval > 0) {
      const interval = setInterval(() => {
        refresh();
      }, mergedOptions.refreshInterval);
      
      return () => clearInterval(interval);
    }
  }, [mergedOptions.refreshInterval, refresh]);

  // Utilidades
  const calculateEfficiency = useCallback((completed: number, total: number): number => {
    if (total === 0) return 0;
    return Math.round((completed / total) * 100);
  }, []);

  const calculateAverageTime = useCallback((times: number[]): number => {
    if (times.length === 0) return 0;
    const sum = times.reduce((acc, time) => acc + time, 0);
    return Math.round(sum / times.length);
  }, []);

  const getPerformanceLevel = useCallback((score: number): number => {
    // Score 0-100, retorna nivel 1-10
    const level = Math.ceil(score / 10);
    return Math.min(Math.max(level, 1), 10);
  }, []);

  return {
    // Datos
    metrics,
    riderProductivity,
    timeMetrics,
    slaMetrics,
    
    // Estado
    loading,
    error,
    lastUpdated,
    
    // Acciones
    fetchMetrics,
    fetchRiderProductivity,
    fetchTimeMetrics,
    fetchSLAMetrics,
    refresh,
    
    // Utilidades
    calculateEfficiency,
    calculateAverageTime,
    getPerformanceLevel,
  };
};

export default useProductivity;
