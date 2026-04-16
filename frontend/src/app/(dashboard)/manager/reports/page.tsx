"use client"

import { useState, useEffect } from "react"
import { useOrders } from "@/stores/ordersStore"

// Página de reporte de entregas para managers con filtros y exportación
export default function ManagerReportsPage() {
  const { orders, loadOrders } = useOrders()
  const [dateRange, setDateRange] = useState("last_30_days")
  const [loading, setLoading] = useState(true)

  // Cargar órdenes al montar el componente
  useEffect(() => {
    const fetchData = async () => {
      await loadOrders(dateRange)
      setLoading(false)
    }
    fetchData()
  }, [dateRange])

  // Calcular métricas de reporte
  const metrics = {
    totalOrders: orders.length,
    completedOrders: orders.filter(o => o.status === "delivered").length,
    pendingOrders: orders.filter(o => o.status === "pending").length,
    cancelledOrders: orders.filter(o => o.status === "cancelled").length,
    avgDeliveryTime: orders.filter(o => o.deliveredAt).length > 0 
      ? orders.reduce((acc, o) => acc + (o.deliveredAt ? new Date(o.deliveredAt).getTime() - new Date(o.createdAt).getTime() : 0), 0) / orders.filter(o => o.deliveredAt).length 
      : 0
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-500">Cargando reportes...</div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header de la página */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Reportes y Análisis</h1>
        <div className="flex space-x-2">
          <select
            value={dateRange}
            onChange={(e) => setDateRange(e.target.value)}
            className="border rounded-md px-3 py-2"
          >
            <option value="last_7_days">Últimos 7 días</option>
            <option value="last_30_days">Últimos 30 días</option>
            <option value="last_90_days">Últimos 90 días</option>
            <option value="current_month">Este Mes</option>
            <option value="last_month">Mes Anterior</option>
          </select>
          <button className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700">
            Exportar PDF
          </button>
        </div>
      </div>

      {/* Tarjetas de métricas */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <div className="bg-white p-4 rounded-lg shadow">
          <p className="text-sm text-gray-600">Total Órdenes</p>
          <p className="text-2xl font-bold text-gray-900">{metrics.totalOrders}</p>
        </div>
        <div className="bg-white p-4 rounded-lg shadow">
          <p className="text-sm text-gray-600">Completadas</p>
          <p className="text-2xl font-bold text-green-600">{metrics.completedOrders}</p>
        </div>
        <div className="bg-white p-4 rounded-lg shadow">
          <p className="text-sm text-gray-600">Pendientes</p>
          <p className="text-2xl font-bold text-yellow-600">{metrics.pendingOrders}</p>
        </div>
        <div className="bg-white p-4 rounded-lg shadow">
          <p className="text-sm text-gray-600">Canceladas</p>
          <p className="text-2xl font-bold text-red-600">{metrics.cancelledOrders}</p>
        </div>
        <div className="bg-white p-4 rounded-lg shadow">
          <p className="text-sm text-gray-600">Tiempo Promedio</p>
          <p className="text-2xl font-bold text-blue-600">
            {Math.round(metrics.avgDeliveryTime / 60000)} min
          </p>
        </div>
      </div>

      {/* Tabla de órdenes */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="px-6 py-4 border-b">
          <h2 className="text-lg font-semibold">Detalle de Órdenes</h2>
        </div>
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">ID</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Cliente</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Estado</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Fecha</th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Monto</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {orders.slice(0, 10).map((order) => (
              <tr key={order.id}>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">#{order.id}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{order.customerName}</td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={`px-2 py-1 text-xs rounded-full ${
                    order.status === 'delivered' ? 'bg-green-100 text-green-800' :
                    order.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                    'bg-red-100 text-red-800'
                  }`}>
                    {order.status}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{order.createdAt}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-right font-medium">${order.total}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
