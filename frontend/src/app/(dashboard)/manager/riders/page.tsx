"use client"

import { useState, useEffect } from "react"
import { useRiders } from "@/stores/ridersStore"
import RiderCard from "@/components/riders/RiderCard"

// Página de gestión de repartidores para managers con lista y filtros
export default function ManagerRidersPage() {
  const { riders, loadRiders, updateRiderStatus } = useRiders()
  const [filter, setFilter] = useState<"all" | "active" | "inactive">("all")
  const [loading, setLoading] = useState(true)

  // Cargar lista de repartidores al montar el componente
  useEffect(() => {
    const fetchData = async () => {
      await loadRiders()
      setLoading(false)
    }
    fetchData()
  }, [])

  // Filtrar repartidores según estado seleccionado
  const filteredRiders = riders.filter((rider) => {
    if (filter === "active") return rider.status === "active"
    if (filter === "inactive") return rider.status === "inactive"
    return true
  })

  // Calcular estadísticas de repartidores
  const stats = {
    total: riders.length,
    active: riders.filter(r => r.status === "active").length,
    inactive: riders.filter(r => r.status === "inactive").length,
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-500">Cargando repartidores...</div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header de la página */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Gestión de Repartidores</h1>
        <button className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700">
          + Nuevo Repartidor
        </button>
      </div>

      {/* Tarjetas de estadísticas */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white p-4 rounded-lg shadow">
          <p className="text-sm text-gray-600">Total Repartidores</p>
          <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
        </div>
        <div className="bg-white p-4 rounded-lg shadow">
          <p className="text-sm text-gray-600">Activos</p>
          <p className="text-2xl font-bold text-green-600">{stats.active}</p>
        </div>
        <div className="bg-white p-4 rounded-lg shadow">
          <p className="text-sm text-gray-600">Inactivos</p>
          <p className="text-2xl font-bold text-red-600">{stats.inactive}</p>
        </div>
      </div>

      {/* Filtros de estado */}
      <div className="flex space-x-2">
        <button
          onClick={() => setFilter("all")}
          className={`px-4 py-2 rounded-md ${filter === "all" ? "bg-blue-600 text-white" : "bg-gray-200"}`}
        >
          Todos
        </button>
        <button
          onClick={() => setFilter("active")}
          className={`px-4 py-2 rounded-md ${filter === "active" ? "bg-green-600 text-white" : "bg-gray-200"}`}
        >
          Activos
        </button>
        <button
          onClick={() => setFilter("inactive")}
          className={`px-4 py-2 rounded-md ${filter === "inactive" ? "bg-red-600 text-white" : "bg-gray-200"}`}
        >
          Inactivos
        </button>
      </div>

      {/* Lista de tarjetas de repartidores */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredRiders.map((rider) => (
          <RiderCard key={rider.id} rider={rider} />
        ))}
      </div>

      {/* Mensaje si no hay resultados */}
      {filteredRiders.length === 0 && (
        <div className="text-center py-12 text-gray-500">
          No se encontraron repartidores con los filtros seleccionados
        </div>
      )}
    </div>
  )
}
