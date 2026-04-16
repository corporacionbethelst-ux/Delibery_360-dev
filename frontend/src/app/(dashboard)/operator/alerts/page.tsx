"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { 
  AlertTriangle, 
  Bell, 
  CheckCircle, 
  Clock, 
  Filter, 
  Search,
  MapPin,
  User,
  Phone,
  TrendingUp,
  AlertCircle
} from "lucide-react"
import { api } from "@/lib/api"

// Definir tipo para las alertas del sistema
interface Alert {
  id: string
  type: "delay" | "deviation" | "incident" | "low_stock" | "system"
  priority: "low" | "medium" | "high" | "critical"
  title: string
  description: string
  createdAt: string
  status: "active" | "acknowledged" | "resolved"
  relatedEntity?: {
    type: "order" | "rider" | "location"
    id: string
    name: string
  }
  assignedTo?: string
}

export default function OperatorAlertsPage() {
  // Estado para la lista de alertas
  const [alerts, setAlerts] = useState<Alert[]>([])
  // Estado para el filtro de prioridad seleccionado
  const [priorityFilter, setPriorityFilter] = useState<string>("all")
  // Estado para el filtro de estado seleccionado
  const [statusFilter, setStatusFilter] = useState<string>("active")
  // Estado para el término de búsqueda
  const [searchTerm, setSearchTerm] = useState("")
  // Estado de carga
  const [loading, setLoading] = useState(true)
  // Estado para la alerta seleccionada para ver detalles
  const [selectedAlert, setSelectedAlert] = useState<Alert | null>(null)

  // Cargar alertas al montar el componente
  useEffect(() => {
    loadAlerts()
    // Configurar polling para actualizaciones en tiempo real (cada 30 segundos)
    const interval = setInterval(loadAlerts, 30000)
    return () => clearInterval(interval)
  }, [])

  // Función asíncrona para cargar las alertas desde la API
  async function loadAlerts() {
    try {
      setLoading(true)
      const response = await api.get("/alerts?status=all")
      setAlerts(response.data)
    } catch (error) {
      console.error("Error loading alerts:", error)
      // Datos mock para demostración
      setAlerts([
        {
          id: "1",
          type: "delay",
          priority: "high",
          title: "Entrega Retrasada",
          description: "La entrega #ORD-2024-0892 lleva 25 minutos de retraso",
          createdAt: new Date(Date.now() - 15 * 60000).toISOString(),
          status: "active",
          relatedEntity: { type: "order", id: "ORD-2024-0892", name: "Pedido Restaurante Central" }
        },
        {
          id: "2",
          type: "deviation",
          priority: "medium",
          title: "Desviación de Ruta",
          description: "El repartidor se ha desviado 2km de la ruta óptima",
          createdAt: new Date(Date.now() - 8 * 60000).toISOString(),
          status: "active",
          relatedEntity: { type: "rider", id: "RID-045", name: "Carlos Mendoza" }
        },
        {
          id: "3",
          type: "incident",
          priority: "critical",
          title: "Incidente Reportado",
          description: "Repartidor reportó vehículo averiado en zona norte",
          createdAt: new Date(Date.now() - 5 * 60000).toISOString(),
          status: "active",
          relatedEntity: { type: "rider", id: "RID-023", name: "Ana García" }
        },
        {
          id: "4",
          type: "low_stock",
          priority: "low",
          title: "Stock Bajo",
          description: "Producto 'Bebida Energética' con stock menor al 10%",
          createdAt: new Date(Date.now() - 45 * 60000).toISOString(),
          status: "acknowledged",
          relatedEntity: { type: "location", id: "LOC-003", name: "Almacén Norte" }
        }
      ])
    } finally {
      setLoading(false)
    }
  }

  // Función para reconocer una alerta
  async function acknowledgeAlert(alertId: string) {
    try {
      await api.post(`/alerts/${alertId}/acknowledge`)
      // Actualizar estado localmente
      setAlerts(alerts.map(a => 
        a.id === alertId ? { ...a, status: "acknowledged" as const } : a
      ))
    } catch (error) {
      console.error("Error acknowledging alert:", error)
    }
  }

  // Función para resolver una alerta
  async function resolveAlert(alertId: string) {
    try {
      await api.post(`/alerts/${alertId}/resolve`)
      // Actualizar estado localmente
      setAlerts(alerts.map(a => 
        a.id === alertId ? { ...a, status: "resolved" as const } : a
      ))
    } catch (error) {
      console.error("Error resolving alert:", error)
    }
  }

  // Filtrar alertas según los filtros seleccionados
  const filteredAlerts = alerts.filter(alert => {
    const matchesPriority = priorityFilter === "all" || alert.priority === priorityFilter
    const matchesStatus = statusFilter === "all" || alert.status === statusFilter
    const matchesSearch = searchTerm === "" || 
      alert.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      alert.description.toLowerCase().includes(searchTerm.toLowerCase())
    return matchesPriority && matchesStatus && matchesSearch
  })

  // Calcular estadísticas de alertas
  const stats = {
    total: alerts.length,
    active: alerts.filter(a => a.status === "active").length,
    critical: alerts.filter(a => a.priority === "critical" && a.status !== "resolved").length,
    high: alerts.filter(a => a.priority === "high" && a.status !== "resolved").length
  }

  // Obtener color del badge según prioridad
  function getPriorityColor(priority: string) {
    switch (priority) {
      case "critical": return "destructive"
      case "high": return "default"
      case "medium": return "secondary"
      case "low": return "outline"
      default: return "outline"
    }
  }

  // Obtener ícono según tipo de alerta
  function getAlertIcon(type: string) {
    switch (type) {
      case "delay": return <Clock className="h-5 w-5" />
      case "deviation": return <MapPin className="h-5 w-5" />
      case "incident": return <AlertTriangle className="h-5 w-5" />
      case "low_stock": return <TrendingUp className="h-5 w-5" />
      case "system": return <AlertCircle className="h-5 w-5" />
      default: return <Bell className="h-5 w-5" />
    }
  }

  // Formatear fecha relativa
  function formatRelativeTime(dateString: string) {
    const date = new Date(dateString)
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffMins = Math.floor(diffMs / 60000)
    
    if (diffMins < 1) return "Ahora mismo"
    if (diffMins < 60) return `Hace ${diffMins} min`
    const diffHours = Math.floor(diffMins / 60)
    if (diffHours < 24) return `Hace ${diffHours} h`
    return `Hace ${Math.floor(diffHours / 24)} d`
  }

  return (
    <div className="space-y-6">
      {/* Encabezado de la página */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Alertas</h1>
          <p className="text-muted-foreground">
            Monitorea y gestiona incidentes en tiempo real
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <Badge variant={stats.critical > 0 ? "destructive" : "default"}>
            {stats.critical} Críticas
          </Badge>
          <Badge variant={stats.high > 0 ? "default" : "secondary"}>
            {stats.high} Altas
          </Badge>
        </div>
      </div>

      {/* Tarjetas de estadísticas */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Alertas</CardTitle>
            <Bell className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
            <p className="text-xs text-muted-foreground">Últimas 24 horas</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Activas</CardTitle>
            <AlertCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.active}</div>
            <p className="text-xs text-muted-foreground">Requieren atención</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Críticas</CardTitle>
            <AlertTriangle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-destructive">{stats.critical}</div>
            <p className="text-xs text-muted-foreground">Acción inmediata</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Altas</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.high}</div>
            <p className="text-xs text-muted-foreground">Prioridad alta</p>
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
                placeholder="Buscar alertas..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <div className="flex items-center space-x-2">
              <Filter className="h-4 w-4 text-muted-foreground" />
              <select
                value={priorityFilter}
                onChange={(e) => setPriorityFilter(e.target.value)}
                className="border rounded-md px-3 py-2 text-sm"
              >
                <option value="all">Todas Prioridades</option>
                <option value="critical">Crítica</option>
                <option value="high">Alta</option>
                <option value="medium">Media</option>
                <option value="low">Baja</option>
              </select>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="border rounded-md px-3 py-2 text-sm"
              >
                <option value="active">Activas</option>
                <option value="acknowledged">Reconocidas</option>
                <option value="resolved">Resueltas</option>
                <option value="all">Todos Estados</option>
              </select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Lista de alertas */}
      <Tabs defaultValue="list" className="space-y-4">
        <TabsList>
          <TabsTrigger value="list">Lista</TabsTrigger>
          <TabsTrigger value="timeline">Línea de Tiempo</TabsTrigger>
        </TabsList>

        <TabsContent value="list" className="space-y-4">
          {loading ? (
            <div className="flex items-center justify-center h-48">
              <p className="text-muted-foreground">Cargando alertas...</p>
            </div>
          ) : filteredAlerts.length === 0 ? (
            <Card>
              <CardContent className="flex items-center justify-center h-48">
                <div className="text-center">
                  <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-4" />
                  <p className="text-muted-foreground">No hay alertas que mostrar</p>
                </div>
              </CardContent>
            </Card>
          ) : (
            filteredAlerts.map((alert) => (
              <Card key={alert.id} className={alert.status === "active" ? "border-l-4 border-l-destructive" : ""}>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex items-center space-x-3">
                      <div className={`p-2 rounded-lg ${
                        alert.priority === "critical" ? "bg-destructive text-destructive-foreground" :
                        alert.priority === "high" ? "bg-orange-500 text-white" :
                        "bg-blue-500 text-white"
                      }`}>
                        {getAlertIcon(alert.type)}
                      </div>
                      <div>
                        <CardTitle className="flex items-center space-x-2">
                          <span>{alert.title}</span>
                          <Badge variant={getPriorityColor(alert.priority)}>
                            {alert.priority}
                          </Badge>
                        </CardTitle>
                        <CardDescription className="flex items-center space-x-4 mt-1">
                          <span>{formatRelativeTime(alert.createdAt)}</span>
                          {alert.relatedEntity && (
                            <span className="flex items-center">
                              {alert.relatedEntity.type === "rider" && <User className="h-3 w-3 mr-1" />}
                              {alert.relatedEntity.type === "order" && <Clock className="h-3 w-3 mr-1" />}
                              {alert.relatedEntity.name}
                            </span>
                          )}
                        </CardDescription>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      {alert.status === "active" && (
                        <>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => acknowledgeAlert(alert.id)}
                          >
                            Reconocer
                          </Button>
                          <Button
                            size="sm"
                            onClick={() => resolveAlert(alert.id)}
                          >
                            Resolver
                          </Button>
                        </>
                      )}
                      {alert.status === "acknowledged" && (
                        <Button
                          size="sm"
                          onClick={() => resolveAlert(alert.id)}
                        >
                          Marcar Resuelta
                        </Button>
                      )}
                      {alert.status === "resolved" && (
                        <Badge variant="secondary" className="flex items-center">
                          <CheckCircle className="h-3 w-3 mr-1" />
                          Resuelta
                        </Badge>
                      )}
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-sm">{alert.description}</p>
                </CardContent>
              </Card>
            ))
          )}
        </TabsContent>

        <TabsContent value="timeline" className="space-y-4">
          <Card>
            <CardContent className="pt-6">
              <p className="text-center text-muted-foreground">
                Vista de línea de tiempo en desarrollo
              </p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Panel de detalles de alerta seleccionada */}
      {selectedAlert && (
        <Card>
          <CardHeader>
            <div className="flex justify-between items-start">
              <div>
                <CardTitle>Detalles de Alerta</CardTitle>
                <CardDescription>ID: {selectedAlert.id}</CardDescription>
              </div>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => setSelectedAlert(null)}
              >
                Cerrar
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm font-medium">Tipo</p>
                <p className="text-sm text-muted-foreground capitalize">{selectedAlert.type}</p>
              </div>
              <div>
                <p className="text-sm font-medium">Prioridad</p>
                <Badge variant={getPriorityColor(selectedAlert.priority)}>
                  {selectedAlert.priority}
                </Badge>
              </div>
              <div>
                <p className="text-sm font-medium">Estado</p>
                <p className="text-sm text-muted-foreground capitalize">{selectedAlert.status}</p>
              </div>
              <div>
                <p className="text-sm font-medium">Creada</p>
                <p className="text-sm text-muted-foreground">
                  {formatRelativeTime(selectedAlert.createdAt)}
                </p>
              </div>
            </div>
            <div>
              <p className="text-sm font-medium mb-2">Descripción</p>
              <p className="text-sm text-muted-foreground bg-muted p-3 rounded-lg">
                {selectedAlert.description}
              </p>
            </div>
            {selectedAlert.relatedEntity && (
              <div>
                <p className="text-sm font-medium mb-2">Entidad Relacionada</p>
                <div className="flex items-center space-x-2 bg-muted p-3 rounded-lg">
                  {selectedAlert.relatedEntity.type === "rider" && <User className="h-4 w-4" />}
                  {selectedAlert.relatedEntity.type === "order" && <Clock className="h-4 w-4" />}
                  <span>{selectedAlert.relatedEntity.name}</span>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  )
}
