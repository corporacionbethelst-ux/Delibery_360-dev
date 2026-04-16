"use client"

import { useState, useEffect } from "react"
import { useOrders } from "@/stores/ordersStore"
import { useAuth } from "@/contexts/AuthContext"

// Página de órdenes para operators con gestión y asignación
export default function OperatorOrdersPage() {
  const { orders, loadOrders, updateOrderStatus } = useOrders()
  const { user } = useAuth()
  const [filter, setFilter] = useState<"all" | "pending" | "assigned" | "in_progress">("pending")
  const [loading, setLoading] = useState(true)

  // Cargar órdenes al montar el componente
  useEffect(() => {
    const fetchData = async () => {
      await loadOrders()
      setLoading(false)
    }
    fetchData()
  }, [])

  // Filtrar órdenes según estado
  const filteredOrders = orders.filter((order) => {
    if (filter === "pending") return order.status === "pending"
    if (filter === "assigned") return order.status === "assigned"
    if (filter === "in_progress") return order.status === "in_progress"
    return true
  })

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-500">Cargando órdenes...</div>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Header de la página */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Gestión de Órdenes</h1>
        <button className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700">
          + Nueva Orden
        </button>
      </div>

      {/* Filtros de estado */}
      <div className="flex space-x-2">
        <button
          onClick={() => setFilter("all")}
          className={`px-3 py-1 rounded-md text-sm ${filter === "all" ? "bg-gray-600 text-white" : "bg-gray-200"}`}
        >
          Todas
        </button>
        <button
          onClick={() => setFilter("pending")}
          className={`px-3 py-1 rounded-md text-sm ${filter === "pending" ? "bg-yellow-600 text-white" : "bg-gray-200"}`}
        >
          Pendientes
        </button>
        <button
          onClick={() => setFilter("assigned")}
          className={`px-3 py-1 rounded-md text-sm ${filter === "assigned" ? "bg-blue-600 text-white" : "bg-gray-200"}`}
        >
          Asignadas
        </button>
        <button
          onClick={() => setFilter("in_progress")}
          className={`px-3 py-1 rounded-md text-sm ${filter === "in_progress" ? "bg-green-600 text-white" : "bg-gray-200"}`}
        >
          En Progreso
        </button>
      </div>

      {/* Tabla de órdenes */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">ID</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Cliente</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Dirección</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Estado</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Repartidor</th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Acciones</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {filteredOrders.map((order) => (
              <tr key={order.id}>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">#{order.id}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm">{order.customerName}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm">{order.deliveryAddress}</td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={`px-2 py-1 text-xs rounded-full ${
                    order.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                    order.status === 'assigned' ? 'bg-blue-100 text-blue-800' :
                    order.status === 'in_progress' ? 'bg-green-100 text-green-800' :
                    'bg-gray-100 text-gray-800'
                  }`}>
                    {order.status}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm">
                  {order.riderId ? `Rider #${order.riderId}` : 'Sin asignar'}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right text-sm">
                  <button className="text-blue-600 hover:text-blue-900 mr-3">Ver</button>
                  {order.status === 'pending' && (
                    <button className="text-green-600 hover:text-green-900">Asignar</button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
