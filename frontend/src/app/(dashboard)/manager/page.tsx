'use client';


import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import apiClient from '@/lib/api';
import { 
  Truck, 
  Package, 
  Users, 
  DollarSign, 
  TrendingUp, 
  TrendingDown,
  Clock,
  CheckCircle,
  AlertCircle,
  MapPin
} from 'lucide-react';

interface DashboardStats {
  total_orders: number;
  active_orders: number;
  completed_today: number;
  total_revenue: number;
  revenue_today: number;
  active_riders: number;
  available_riders: number;
  avg_delivery_time: number;
  completion_rate: number;
}

interface RecentOrder {
  id: string;
  customer_name: string;
  status: string;
  total_amount: number;
  created_at: string;
  rider_name?: string;
}

export default function ManagerDashboard() {
  const router = useRouter();
  const { user, isAuthenticated, isLoading: authLoading, logout } = useAuth();
  const [stats, setStats] = useState<DashboardStats | null>(null); // State initialized to null
  const [recentOrders, setRecentOrders] = useState<RecentOrder[]>([]); // State initialized to empty array
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null); // State initialized to null

  // Verificar autenticación y rol
  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push('/login');
    } else if (!authLoading && user && user.role !== 'superadmin' && user.role !== 'gerente') {
      // Redirigir según el rol
      if (user.role === 'operador') {
        router.push('/operator');
      } else if (user.role === 'repartidor') {
        router.push('/rider');
      }
    }
  }, [authLoading, isAuthenticated, user, router]);

  // Cargar datos del dashboard
  useEffect(() => {
    const loadDashboardData = async () => {
      if (!isAuthenticated || !user || (user.role !== 'superadmin' && user.role !== 'gerente')) {
        return;
      }

      setIsLoading(true);
      try {
        // Cargar estadísticas
        const statsResponse = await apiClient.get<DashboardStats>('/dashboard/stats');
        setStats(statsResponse.data);

        // Cargar órdenes recientes
        const ordersResponse = await apiClient.get<RecentOrder[]>('/orders?limit=5&sort_by=created_at&sort_order=desc');
        setRecentOrders(ordersResponse.data || []);
        
        setError(null);
      } catch (err) {
        console.error('Error loading dashboard:', err); // Log error for debugging
        setError('No se pudieron cargar los datos del dashboard');
        
        // Datos mock para desarrollo
        setStats({
          total_orders: 1247,
          active_orders: 23,
          completed_today: 87,
          total_revenue: 45678.90,
          revenue_today: 2345.60,
          active_riders: 45,
          available_riders: 12,
          avg_delivery_time: 28,
          completion_rate: 96.5,
        });
        
        setRecentOrders([
          { id: 'ORD-001', customer_name: 'Juan Pérez', status: 'en_ruta', total_amount: 45.90, created_at: new Date().toISOString(), rider_name: 'Carlos R.' },
          { id: 'ORD-002', customer_name: 'María García', status: 'recolectado', total_amount: 32.50, created_at: new Date(Date.now() - 300000).toISOString(), rider_name: 'Ana M.' },
          { id: 'ORD-003', customer_name: 'Pedro López', status: 'en_recoleccion', total_amount: 67.80, created_at: new Date(Date.now() - 600000).toISOString() },
          { id: 'ORD-004', customer_name: 'Laura Sánchez', status: 'entregado', total_amount: 28.90, created_at: new Date(Date.now() - 900000).toISOString(), rider_name: 'Luis T.' },
          { id: 'ORD-005', customer_name: 'Roberto Díaz', status: 'pendiente', total_amount: 54.20, created_at: new Date(Date.now() - 1200000).toISOString() },
        ]);
      } finally {
        setIsLoading(false);
      }
    };

    loadDashboardData();
  }, [isAuthenticated, user]);

  const handleLogout = async () => {
    await logout();
    router.push('/login');
  };

  if (authLoading || isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Cargando dashboard...</p>
        </div>
      </div>
    );
  }

  if (error && !stats) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <p className="text-gray-600">{error}</p>
          <button onClick={() => router.refresh()} className="mt-4 text-blue-600 hover:underline">
            Reintentar
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
              <p className="text-sm text-gray-500">Bienvenido, {user?.full_name}</p>
            </div>
            <div className="flex items-center gap-4">
              <span className="text-sm text-gray-600 capitalize">{user?.role}</span>
              <button
                onClick={handleLogout}
                className="px-4 py-2 text-sm text-red-600 hover:bg-red-50 rounded-lg transition-colors"
              >
                Cerrar Sesión
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {/* Órdenes Activas */}
          <div className="bg-white rounded-xl shadow-sm p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Órdenes Activas</p>
                <p className="text-3xl font-bold text-gray-900">{stats?.active_orders || 0}</p>
                <div className="flex items-center mt-2">
                  <TrendingUp className="h-4 w-4 text-green-500 mr-1" />
                  <span className="text-sm text-green-600">+12% vs ayer</span>
                </div>
              </div>
              <div className="bg-blue-100 rounded-full p-4">
                <Package className="h-8 w-8 text-blue-600" />
              </div>
            </div>
          </div>

          {/* Repartidores Activos */}
          <div className="bg-white rounded-xl shadow-sm p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Repartidores Activos</p>
                <p className="text-3xl font-bold text-gray-900">{stats?.active_riders || 0}</p>
                <div className="flex items-center mt-2">
                  <span className="text-sm text-gray-500">{stats?.available_riders || 0} disponibles</span>
                </div>
              </div>
              <div className="bg-green-100 rounded-full p-4">
                <Users className="h-8 w-8 text-green-600" />
              </div>
            </div>
          </div>

          {/* Ingresos Hoy */}
          <div className="bg-white rounded-xl shadow-sm p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Ingresos Hoy</p>
                <p className="text-3xl font-bold text-gray-900">${stats?.revenue_today?.toFixed(2) || '0.00'}</p>
                <div className="flex items-center mt-2">
                  <TrendingUp className="h-4 w-4 text-green-500 mr-1" />
                  <span className="text-sm text-green-600">+8% vs ayer</span>
                </div>
              </div>
              <div className="bg-yellow-100 rounded-full p-4">
                <DollarSign className="h-8 w-8 text-yellow-600" />
              </div>
            </div>
          </div>

          {/* Tiempo Promedio */}
          <div className="bg-white rounded-xl shadow-sm p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Tiempo Promedio</p>
                <p className="text-3xl font-bold text-gray-900">{stats?.avg_delivery_time || 0} min</p>
                <div className="flex items-center mt-2">
                  <TrendingDown className="h-4 w-4 text-green-500 mr-1" />
                  <span className="text-sm text-green-600">-3 min vs ayer</span>
                </div>
              </div>
              <div className="bg-purple-100 rounded-full p-4">
                <Clock className="h-8 w-8 text-purple-600" />
              </div>
            </div>
          </div>
        </div>

        {/* Órdenes Recientes */}
        <div className="bg-white rounded-xl shadow-sm mb-8">
          <div className="p-6 border-b">
            <h2 className="text-lg font-semibold text-gray-900">Órdenes Recientes</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Orden</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Cliente</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Estado</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Repartidor</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Total</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Hora</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {recentOrders.map((order) => (
                  <tr key={order.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{order.id}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">{order.customer_name}</td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 py-1 text-xs rounded-full ${
                        order.status === 'entregado' ? 'bg-green-100 text-green-800' :
                        order.status === 'en_ruta' ? 'bg-blue-100 text-blue-800' :
                        order.status === 'en_recoleccion' || order.status === 'recolectado' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-gray-100 text-gray-800'
                      }`}>
                        {order.status.replace('_', ' ')}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                      {order.rider_name || '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">${order.total_amount.toFixed(2)}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {new Date(order.created_at).toLocaleTimeString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Accesos Rápidos */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <button 
            onClick={() => router.push('/manager/orders')}
            className="bg-white rounded-xl shadow-sm p-6 hover:shadow-md transition-shadow text-left"
          >
            <div className="flex items-center mb-4">
              <Package className="h-8 w-8 text-blue-600 mr-3" />
              <h3 className="text-lg font-semibold text-gray-900">Gestionar Órdenes</h3>
            </div>
            <p className="text-sm text-gray-600">Ver todas las órdenes, asignar repartidores y monitorear entregas</p>
          </button>

          <button 
            onClick={() => router.push('/manager/riders')}
            className="bg-white rounded-xl shadow-sm p-6 hover:shadow-md transition-shadow text-left"
          >
            <div className="flex items-center mb-4">
              <Truck className="h-8 w-8 text-green-600 mr-3" />
              <h3 className="text-lg font-semibold text-gray-900">Repartidores</h3>
            </div>
            <p className="text-sm text-gray-600">Administrar repartidores, turnos y rendimiento</p>
          </button>

          <button 
            onClick={() => router.push('/manager/financial')}
            className="bg-white rounded-xl shadow-sm p-6 hover:shadow-md transition-shadow text-left"
          >
            <div className="flex items-center mb-4">
              <DollarSign className="h-8 w-8 text-yellow-600 mr-3" />
              <h3 className="text-lg font-semibold text-gray-900">Finanzas</h3>
            </div>
            <p className="text-sm text-gray-600">Reportes financieros, liquidaciones y métricas de ingresos</p>
          </button>
        </div>
      </main>
    </div>
  );
}
