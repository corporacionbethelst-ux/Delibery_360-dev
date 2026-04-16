"use client"

import { useState, useEffect } from "react"
import { useDeliveries } from "@/stores/deliveriesStore"
import DeliveryTracker from "@/components/deliveries/DeliveryTracker"

// Página de tracking de entregas en tiempo real para operators
export default function OperatorLiveMapPage() {
  const { deliveries, loadDeliveries } = useDeliveries()
  const [filter, setFilter] = useState<"all" | "active" | "completed">("active")
  const [loading, setLoading] = useState(true)

  // Cargar entregas al montar el componente
  useEffect(() => {
    const fetchData = async () => {
      await loadDeliveries()
      setLoading(false)
    }
    fetchData()
  }, [])

  // Filtrar entregas según estado
  const filteredDeliveries = deliveries.filter((delivery) => {
    if (filter === "active") return delivery.status === "in_progress" || delivery.status === "pending"
    if (filter === "completed") return delivery.status === "delivered"
    return true
  })

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-500">Cargando mapa en vivo...</div>
      </div>
    )
  }

  return (
    <div className="space-y-4 h-full">
      {/* Header de la página */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Mapa en Vivo - Tracking de Entregas</h1>
        <div className="flex space-x-2">
          <button
            onClick={() => setFilter("active")}
            className={`px-3 py-1 rounded-md text-sm ${filter === "active" ? "bg-blue-600 text-white" : "bg-gray-200"}`}
          >
            Activas
          </button>
          <button
            onClick={() => setFilter("completed")}
            className={`px-3 py-1 rounded-md text-sm ${filter === "completed" ? "bg-green-600 text-white" : "bg-gray-200"}`}
          >
            Completadas
          </button>
          <button
            onClick={() => setFilter("all")}
            className={`px-3 py-1 rounded-md text-sm ${filter === "all" ? "bg-gray-600 text-white" : "bg-gray-200"}`}
          >
            Todas
          </button>
        </div>
      </div>

      {/* Contenedor del mapa y lista */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 h-[calc(100vh-200px)]">
        {/* Lista de entregas */}
        <div className="lg:col-span-1 bg-white rounded-lg shadow overflow-auto">
          <div className="p-4 border-b">
            <h2 className="font-semibold">Entregas ({filteredDeliveries.length})</h2>
          </div>
          <div className="divide-y">
            {filteredDeliveries.map((delivery) => (
              <div key={delivery.id} className="p-4 hover:bg-gray-50 cursor-pointer">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">Orden #{delivery.orderId}</p>
                    <p className="text-sm text-gray-600">{delivery.customerName}</p>
                    <p className="text-xs text-gray-500">{delivery.address}</p>
                  </div>
                  <span className={`px-2 py-1 text-xs rounded-full ${
                    delivery.status === 'delivered' ? 'bg-green-100 text-green-800' :
                    delivery.status === 'in_progress' ? 'bg-blue-100 text-blue-800' :
                    'bg-yellow-100 text-yellow-800'
                  }`}>
                    {delivery.status === 'in_progress' ? 'En Camino' : 
                     delivery.status === 'delivered' ? 'Entregado' : 'Pendiente'}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Mapa interactivo */}
        <div className="lg:col-span-2 bg-gray-200 rounded-lg shadow flex items-center justify-center">
          <div className="text-center text-gray-500">
            <p className="text-lg font-medium">Mapa Interactivo</p>
            <p className="text-sm">Integración con Leaflet/Google Maps pendiente</p>
            <p className="text-xs mt-2">Mostrará ubicación de repartidores en tiempo real</p>
          </div>
        </div>
      </div>
    </div>
  )
}
