"use client"

import { useState, useEffect } from "react"
import { useOrdersStore } from "@/stores/ordersStore" // 1. Nombre correcto del archivo y hook
import { useAuth } from "@/contexts/AuthContext"
import type { OrderStatus } from "@/types/order"

export default function OperatorOrdersPage() {
  // 2. Usar el hook correcto y extraer las funciones correctas
  const { orders, fetchOrders, updateOrderStatus } = useOrdersStore()
  const { user } = useAuth()
  
  // 3. Ajustar los estados a los valores reales de tu Enum OrderStatus
  const [filter, setFilter] = useState<"all" | "PENDIENTE" | "ASIGNADO" | "EN_CAMINO">("PENDIENTE")
  const [loading, setLoading] = useState(true)

  // Cargar órdenes al montar
  useEffect(() => {
    const fetchData = async () => {
      await fetchOrders() // Usa la función del store
      setLoading(false)
    }
    fetchData()
  }, [])

  // 4. Filtrar usando los estados correctos (Mayúsculas según tu tipo)
  const filteredOrders = orders.filter((order) => {
    if (filter === "PENDIENTE") return order.status === "PENDIENTE"
    if (filter === "ASIGNADO") return order.status === "ASIGNADO" // O 'CONFIRMADO' según tu DB
    if (filter === "EN_CAMINO") return order.status === "EN_CAMINO"
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
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Gestión de Órdenes</h1>
        <button className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700">
          + Nueva Orden
        </button>
      </div>

      {/* Filtros */}
      <div className="flex space-x-2">
        <button
          onClick={() => setFilter("all")}
          className={`px-3 py-1 rounded-md text-sm ${filter === "all" ? "bg-gray-600 text-white" : "bg-gray-200"}`}
        >
          Todas
        </button>
        <button
          onClick={() => setFilter("PENDIENTE")}
          className={`px-3 py-1 rounded-md text-sm ${filter === "PENDIENTE" ? "bg-yellow-600 text-white" : "bg-gray-200"}`}
        >
          Pendientes
        </button>
        <button
          onClick={() => setFilter("ASIGNADO")}
          className={`px-3 py-1 rounded-md text-sm ${filter === "ASIGNADO" ? "bg-blue-600 text-white" : "bg-gray-200"}`}
        >
          Asignadas
        </button>
        <button
          onClick={() => setFilter("EN_CAMINO")}
          className={`px-3 py-1 rounded-md text-sm ${filter === "EN_CAMINO" ? "bg-green-600 text-white" : "bg-gray-200"}`}
        >
          En Camino
        </button>
      </div>

      {/* Tabla */}
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
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">#{order.orderNumber || order.id.substring(0,8)}</td>
                
                {/* 5. Acceder a propiedades anidadas correctamente según tu modelo Order */}
                <td className="px-6 py-4 whitespace-nowrap text-sm">
                  {order.customerName || "Cliente Invitado"}
                </td>
                
                <td className="px-6 py-4 whitespace-nowrap text-sm">
                  {order.deliveryAddress?.street || "Sin dirección"}
                </td>
                
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={`px-2 py-1 text-xs rounded-full ${
                    order.status === 'PENDIENTE' ? 'bg-yellow-100 text-yellow-800' :
                    order.status === 'ASIGNADO' ? 'bg-blue-100 text-blue-800' :
                    order.status === 'EN_CAMINO' ? 'bg-green-100 text-green-800' :
                    'bg-gray-100 text-gray-800'
                  }`}>
                    {order.status}
                  </span>
                </td>
                
                <td className="px-6 py-4 whitespace-nowrap text-sm">
                  {order.assignedRiderId ? `Rider #${order.assignedRiderId}` : 'Sin asignar'}
                </td>
                
                <td className="px-6 py-4 whitespace-nowrap text-right text-sm">
                  <button className="text-blue-600 hover:text-blue-900 mr-3">Ver</button>
                  {order.status === 'PENDIENTE' && (
                    <button className="text-green-600 hover:text-green-900">Asignar</button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        
        {filteredOrders.length === 0 && (
          <div className="p-8 text-center text-gray-500">
            No hay órdenes que mostrar con este filtro.
          </div>
        )}
      </div>
    </div>
  )
}