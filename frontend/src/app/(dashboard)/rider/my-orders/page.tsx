"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Package, Clock, MapPin, DollarSign, Phone, Navigation, CheckCircle } from "lucide-react"
import { useAuth } from "@/contexts/AuthContext"
import { api } from "@/lib/api"
import { formatCurrency } from "@/lib/financial-utils"

// Página de mis órdenes para repartidores con lista y acciones
export default function RiderMyOrdersPage() {
  const router = useRouter()
  const { user } = useAuth()
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState("pending")
  const [orders, setOrders] = useState<any[]>([])
  const [searchTerm, setSearchTerm] = useState("")

  // Cargar órdenes del repartidor al montar el componente
  useEffect(() => {
    loadOrders()
  }, [user, filter])

  // Obtener lista de órdenes desde el backend
  async function loadOrders() {
    try {
      const response = await api.get(`/riders/${user?.id}/orders?status=${filter}`)
      setOrders(response.data)
    } catch (error) {
      console.error("Error al cargar órdenes:", error)
    } finally {
      setLoading(false)
    }
  }

  // Iniciar una nueva entrega
  function handleStartDelivery(order: any) {
    localStorage.setItem("currentDelivery", JSON.stringify({ ...order, started_at: new Date().toISOString() }))
    router.push("/rider/start-delivery")
  }

  // Finalizar entrega
  function handleFinishDelivery(order: any) {
    localStorage.setItem("currentDelivery", JSON.stringify(order))
    router.push("/rider/finish-delivery")
  }

  // Filtrar órdenes por término de búsqueda
  function filteredOrders() {
    return orders.filter(order =>
      order.order_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.customer_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.address.toLowerCase().includes(searchTerm.toLowerCase())
    )
  }

  // Obtener color del badge según estado
  function getStatusBadgeColor(status: string) {
    const colors: Record<string, string> = {
      pending: "bg-yellow-100 text-yellow-800",
      assigned: "bg-blue-100 text-blue-800",
      in_progress: "bg-purple-100 text-purple-800",
      completed: "bg-green-100 text-green-800",
      cancelled: "bg-red-100 text-red-800",
    }
    return colors[status] || "bg-gray-100 text-gray-800"
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p>Cargando tus órdenes...</p>
      </div>
    )
  }

  return (
    <div className="container mx-auto p-4 max-w-6xl space-y-6">
      {/* Encabezado */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold">Mis Órdenes</h1>
          <p className="text-muted-foreground">Gestiona tus entregas asignadas</p>
        </div>
        <Input
          placeholder="Buscar por orden, cliente o dirección..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="max-w-md"
        />
      </div>

      {/* Pestañas de filtro */}
      <div className="flex gap-2 border-b pb-2">
        {["pending", "assigned", "in_progress", "completed"].map((status) => (
          <Button
            key={status}
            variant={filter === status ? "default" : "outline"}
            onClick={() => setFilter(status)}
            className="capitalize"
          >
            {status === "pending" ? "Pendientes" : status === "assigned" ? "Asignadas" : status === "in_progress" ? "En Curso" : "Completadas"}
          </Button>
        ))}
      </div>

      {/* Lista de órdenes */}
      {filteredOrders().length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Package className="h-12 w-12 text-muted-foreground mb-4" />
            <p className="text-muted-foreground">No hay órdenes {filter === "pending" ? "pendientes" : filter === "assigned" ? "asignadas" : filter === "in_progress" ? "en curso" : "completadas"}</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {filteredOrders().map((order) => (
            <Card key={order.id}>
              <CardContent className="p-4">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                  {/* Información principal */}
                  <div className="flex-1 space-y-2">
                    <div className="flex items-center gap-2">
                      <Package className="h-4 w-4 text-muted-foreground" />
                      <span className="font-semibold">Orden #{order.order_number}</span>
                      <Badge className={getStatusBadgeColor(order.status)}>
                        {order.status === "pending" ? "Pendiente" : order.status === "assigned" ? "Asignada" : order.status === "in_progress" ? "En Curso" : "Completada"}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {new Date(order.created_at).toLocaleString()}
                      </span>
                      <span className="flex items-center gap-1">
                        <MapPin className="h-3 w-3" />
                        {order.address}
                      </span>
                    </div>
                    <div className="flex items-center gap-4">
                      <span className="text-sm">Cliente: {order.customer_name}</span>
                      <span className="flex items-center gap-1 text-green-600 font-medium">
                        <DollarSign className="h-3 w-3" />
                        {formatCurrency(order.total_amount)}
                      </span>
                    </div>
                  </div>

                  {/* Acciones */}
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm">
                      <Phone className="h-4 w-4 mr-1" />
                      Llamar
                    </Button>
                    <Button variant="outline" size="sm">
                      <Navigation className="h-4 w-4 mr-1" />
                      Mapa
                    </Button>
                    {order.status === "assigned" && (
                      <Button onClick={() => handleStartDelivery(order)} size="sm" className="bg-blue-600 hover:bg-blue-700">
                        <CheckCircle className="h-4 w-4 mr-1" />
                        Iniciar
                      </Button>
                    )}
                    {order.status === "in_progress" && (
                      <Button onClick={() => handleFinishDelivery(order)} size="sm" className="bg-green-600 hover:bg-green-700">
                        <CheckCircle className="h-4 w-4 mr-1" />
                        Finalizar
                      </Button>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
