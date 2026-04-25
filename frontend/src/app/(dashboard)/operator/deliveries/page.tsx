"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { 
  Package, 
  Search, 
  Filter, 
  Clock, 
  MapPin, 
  User, 
  CheckCircle,
  Truck,
  AlertCircle,
  Calendar
} from "lucide-react"
import api from "@/lib/api"

// Definir tipo para las entregas
interface Delivery {
  id: string
  orderId: string
  rider?: {
    id: string
    name: string
    phone: string
  }
  status: "pending" | "assigned" | "picked_up" | "in_transit" | "delivered" | "failed"
  pickupAddress: string
  deliveryAddress: string
  customerName: string
  estimatedDeliveryTime?: string
  createdAt: string
  priority: "normal" | "high" | "urgent"
  items: Array<{ name: string; quantity: number }>
}

export default function OperatorDeliveriesPage() {
  // Estado para la lista de entregas
  const [deliveries, setDeliveries] = useState<Delivery[]>([])
  // Estado para el filtro de estado seleccionado
  const [statusFilter, setStatusFilter] = useState<string>("all")
  // Estado para el término de búsqueda
  const [searchTerm, setSearchTerm] = useState("")
  // Estado de carga
  const [loading, setLoading] = useState(true)
  // Estado para la entrega seleccionada para ver detalles
  const [selectedDelivery, setSelectedDelivery] = useState<Delivery | null>(null)

  // Cargar entregas al montar el componente
  useEffect(() => {
    loadDeliveries()
    // Configurar polling para actualizaciones (cada 60 segundos)
    const interval = setInterval(loadDeliveries, 60000)
    return () => clearInterval(interval)
  }, [])

  // Función asíncrona para cargar las entregas desde la API
  async function loadDeliveries() {
    try {
      setLoading(true)
      const response = await api.get("/deliveries?status=all")
      setDeliveries(response.data)
    } catch (error) {
      console.error("Error loading deliveries:", error)
      // Datos mock para demostración
      setDeliveries([
        {
          id: "1",
          orderId: "ORD-2024-0892",
          rider: { id: "RID-045", name: "Carlos Mendoza", phone: "+58 412 1234567" },
          status: "in_transit",
          pickupAddress: "Av. Principal con Calle 5, Centro Comercial Norte",
          deliveryAddress: "Calle 123, Casa 45, Urb. Las Flores",
          customerName: "María Rodríguez",
          estimatedDeliveryTime: new Date(Date.now() + 15 * 60000).toISOString(),
          createdAt: new Date(Date.now() - 30 * 60000).toISOString(),
          priority: "normal",
          items: [{ name: "Pizza Pepperoni", quantity: 2 }, { name: "Refresco 2L", quantity: 1 }]
        },
        {
          id: "2",
          orderId: "ORD-2024-0893",
          rider: { id: "RID-023", name: "Ana García", phone: "+58 414 7654321" },
          status: "pending",
          pickupAddress: "Restaurante El Sabor, Av. Libertador",
          deliveryAddress: "Torre Empresarial, Piso 8, Oficina 801",
          customerName: "Juan Pérez",
          createdAt: new Date(Date.now() - 10 * 60000).toISOString(),
          priority: "high",
          items: [{ name: "Hamburguesa Doble", quantity: 3 }, { name: "Papas Fritas", quantity: 3 }]
        },
        {
          id: "3",
          orderId: "ORD-2024-0894",
          rider: undefined,
          status: "assigned",
          pickupAddress: "Farmacia Salud, Calle 67",
          deliveryAddress: "Residencias Los Pinos, Apto 12-B",
          customerName: "Carmen López",
          createdAt: new Date(Date.now() - 5 * 60000).toISOString(),
          priority: "urgent",
          items: [{ name: "Medicamento Genérico", quantity: 2 }]
        }
      ])
    } finally {
      setLoading(false)
    }
  }

  // Filtrar entregas según los filtros seleccionados
  const filteredDeliveries = deliveries.filter(delivery => {
    const matchesStatus = statusFilter === "all" || delivery.status === statusFilter
    const matchesSearch = searchTerm === "" || 
      delivery.orderId.toLowerCase().includes(searchTerm.toLowerCase()) ||
      delivery.customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      delivery.rider?.name.toLowerCase().includes(searchTerm.toLowerCase())
    return matchesStatus && matchesSearch
  })

  // Calcular estadísticas de entregas
  const stats = {
    total: deliveries.length,
    pending: deliveries.filter(d => d.status === "pending").length,
    inTransit: deliveries.filter(d => d.status === "in_transit" || d.status === "picked_up").length,
    delivered: deliveries.filter(d => d.status === "delivered").length
  }

  // Obtener color del badge según estado
  function getStatusColor(status: string) {
    switch (status) {
      case "pending": return "secondary"
      case "assigned": return "outline"
      case "picked_up": return "default"
      case "in_transit": return "default"
      case "delivered": return "default"
      case "failed": return "destructive"
      default: return "outline"
    }
  }

  // Obtener etiqueta legible para el estado
  function getStatusLabel(status: string) {
    switch (status) {
      case "pending": return "Pendiente"
      case "assigned": return "Asignada"
      case "picked_up": return "Recogida"
      case "in_transit": return "En Camino"
      case "delivered": return "Entregada"
      case "failed": return "Fallida"
      default: return status
    }
  }

  // Formatear fecha relativa
  function formatRelativeTime(dateString: string) {
    const date = new Date(dateString)
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffMins = Math.floor(diffMs / 60000)
    
    if (diffMins < 1) return "Ahora"
    if (diffMins < 60) return `Hace ${diffMins} min`
    const diffHours = Math.floor(diffMins / 60)
    if (diffHours < 24) return `Hace ${diffHours} h`
    return `Hace ${Math.floor(diffHours / 24)} d`
  }

  // Formatear tiempo estimado de entrega
  function formatEstimatedTime(dateString: string) {
    const date = new Date(dateString)
    return date.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })
  }

  return (
    <div className="space-y-6">
      {/* Encabezado de la página */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Entregas</h1>
          <p className="text-muted-foreground">
            Gestiona y monitorea todas las entregas activas
          </p>
        </div>
        <Button>
          <Truck className="mr-2 h-4 w-4" />
          Nueva Entrega
        </Button>
      </div>

      {/* Tarjetas de estadísticas */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Entregas</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
            <p className="text-xs text-muted-foreground">Últimas 24 horas</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pendientes</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.pending}</div>
            <p className="text-xs text-muted-foreground">Por asignar</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">En Tránsito</CardTitle>
            <Truck className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.inTransit}</div>
            <p className="text-xs text-muted-foreground">Activas ahora</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Entregadas</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.delivered}</div>
            <p className="text-xs text-muted-foreground">Completadas hoy</p>
          </CardContent>
        </Card>
      </div>

      {/* Filtros y búsqueda */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar por orden, cliente o repartidor..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <div className="flex items-center space-x-2">
              <Filter className="h-4 w-4 text-muted-foreground" />
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="border rounded-md px-3 py-2 text-sm"
              >
                <option value="all">Todos Estados</option>
                <option value="pending">Pendiente</option>
                <option value="assigned">Asignada</option>
                <option value="picked_up">Recogida</option>
                <option value="in_transit">En Camino</option>
                <option value="delivered">Entregada</option>
                <option value="failed">Fallida</option>
              </select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Lista de entregas */}
      <Tabs defaultValue="list" className="space-y-4">
        <TabsList>
          <TabsTrigger value="list">Lista</TabsTrigger>
          <TabsTrigger value="map">Mapa</TabsTrigger>
        </TabsList>

        <TabsContent value="list" className="space-y-4">
          {loading ? (
            <div className="flex items-center justify-center h-48">
              <p className="text-muted-foreground">Cargando entregas...</p>
            </div>
          ) : filteredDeliveries.length === 0 ? (
            <Card>
              <CardContent className="flex items-center justify-center h-48">
                <div className="text-center">
                  <Package className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground">No hay entregas que mostrar</p>
                </div>
              </CardContent>
            </Card>
          ) : (
            filteredDeliveries.map((delivery) => (
              <Card key={delivery.id} className={delivery.priority === "urgent" ? "border-l-4 border-l-destructive" : ""}>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex items-center space-x-3">
                      <div className={`p-2 rounded-lg ${
                        delivery.status === "pending" ? "bg-yellow-500 text-white" :
                        delivery.status === "in_transit" ? "bg-blue-500 text-white" :
                        delivery.status === "delivered" ? "bg-green-500 text-white" :
                        "bg-gray-500 text-white"
                      }`}>
                        <Package className="h-5 w-5" />
                      </div>
                      <div>
                        <CardTitle className="flex items-center space-x-2">
                          <span>{delivery.orderId}</span>
                          <Badge variant={getStatusColor(delivery.status)}>
                            {getStatusLabel(delivery.status)}
                          </Badge>
                          {delivery.priority === "urgent" && (
                            <Badge variant="destructive">Urgente</Badge>
                          )}
                          {delivery.priority === "high" && (
                            <Badge variant="default">Alta</Badge>
                          )}
                        </CardTitle>
                        <CardDescription className="flex items-center space-x-4 mt-1">
                          <span>{formatRelativeTime(delivery.createdAt)}</span>
                          {delivery.rider && (
                            <span className="flex items-center">
                              <User className="h-3 w-3 mr-1" />
                              {delivery.rider.name}
                            </span>
                          )}
                          {!delivery.rider && delivery.status !== "pending" && (
                            <span className="flex items-center text-orange-500">
                              <AlertCircle className="h-3 w-3 mr-1" />
                              Sin repartidor
                            </span>
                          )}
                        </CardDescription>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      {delivery.estimatedDeliveryTime && (
                        <div className="text-right">
                          <p className="text-xs text-muted-foreground">Estimado</p>
                          <p className="text-sm font-medium">{formatEstimatedTime(delivery.estimatedDeliveryTime)}</p>
                        </div>
                      )}
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setSelectedDelivery(delivery)}
                      >
                        Ver Detalles
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="flex items-start space-x-2">
                      <MapPin className="h-4 w-4 text-muted-foreground mt-0.5" />
                      <div className="text-sm">
                        <p className="font-medium">Entrega</p>
                        <p className="text-muted-foreground line-clamp-1">{delivery.deliveryAddress}</p>
                      </div>
                    </div>
                    <div className="flex items-start space-x-2">
                      <User className="h-4 w-4 text-muted-foreground mt-0.5" />
                      <div className="text-sm">
                        <p className="font-medium">Cliente</p>
                        <p className="text-muted-foreground">{delivery.customerName}</p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </TabsContent>

        <TabsContent value="map" className="space-y-4">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-center h-96 bg-muted rounded-lg">
                <div className="text-center">
                  <MapPin className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground">Vista de mapa en desarrollo</p>
                  <p className="text-xs text-muted-foreground mt-2">
                    Integración con Google Maps / Leaflet pendiente
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Modal de detalles de entrega */}
      {selectedDelivery && (
        <Card>
          <CardHeader>
            <div className="flex justify-between items-start">
              <div>
                <CardTitle>Detalles de Entrega</CardTitle>
                <CardDescription>Orden #{selectedDelivery.orderId}</CardDescription>
              </div>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => setSelectedDelivery(null)}
              >
                Cerrar
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm font-medium">Estado</p>
                <Badge variant={getStatusColor(selectedDelivery.status)}>
                  {getStatusLabel(selectedDelivery.status)}
                </Badge>
              </div>
              <div>
                <p className="text-sm font-medium">Prioridad</p>
                <Badge variant={selectedDelivery.priority === "urgent" ? "destructive" : selectedDelivery.priority === "high" ? "default" : "secondary"}>
                  {selectedDelivery.priority}
                </Badge>
              </div>
              <div>
                <p className="text-sm font-medium">Creada</p>
                <p className="text-sm text-muted-foreground">
                  {formatRelativeTime(selectedDelivery.createdAt)}
                </p>
              </div>
              {selectedDelivery.estimatedDeliveryTime && (
                <div>
                  <p className="text-sm font-medium">Entrega Estimada</p>
                  <p className="text-sm text-muted-foreground">
                    {formatEstimatedTime(selectedDelivery.estimatedDeliveryTime)}
                  </p>
                </div>
              )}
            </div>

            {selectedDelivery.rider && (
              <div>
                <p className="text-sm font-medium mb-2">Repartidor Asignado</p>
                <div className="flex items-center space-x-3 bg-muted p-3 rounded-lg">
                  <div className="h-10 w-10 rounded-full bg-primary flex items-center justify-center text-primary-foreground font-bold">
                    {selectedDelivery.rider.name.charAt(0)}
                  </div>
                  <div className="flex-1">
                    <p className="font-medium">{selectedDelivery.rider.name}</p>
                    <p className="text-xs text-muted-foreground">{selectedDelivery.rider.phone}</p>
                  </div>
                </div>
              </div>
            )}

            <div>
              <p className="text-sm font-medium mb-2">Artículos</p>
              <ul className="space-y-1 bg-muted p-3 rounded-lg">
                {selectedDelivery.items.map((item, index) => (
                  <li key={index} className="flex justify-between text-sm">
                    <span>{item.name}</span>
                    <Badge variant="secondary">x{item.quantity}</Badge>
                  </li>
                ))}
              </ul>
            </div>

            <div className="space-y-2">
              <div className="flex items-start space-x-2">
                <MapPin className="h-4 w-4 text-blue-500 mt-0.5" />
                <div>
                  <p className="text-sm font-medium">Recogida</p>
                  <p className="text-sm text-muted-foreground">{selectedDelivery.pickupAddress}</p>
                </div>
              </div>
              <div className="flex items-start space-x-2">
                <MapPin className="h-4 w-4 text-green-500 mt-0.5" />
                <div>
                  <p className="text-sm font-medium">Entrega</p>
                  <p className="text-sm text-muted-foreground">{selectedDelivery.deliveryAddress}</p>
                </div>
              </div>
            </div>

            <div className="flex space-x-2">
              <Button className="flex-1" variant="outline">
                <User className="mr-2 h-4 w-4" />
                Contactar Repartidor
              </Button>
              <Button className="flex-1">
                <Calendar className="mr-2 h-4 w-4" />
                Reasignar
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
