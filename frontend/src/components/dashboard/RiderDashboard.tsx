"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Package, DollarSign, Clock, TrendingUp, MapPin, Star, Award, Truck } from "lucide-react"
import { useAuth } from "@/contexts/AuthContext"
import api from "@/lib/api"
import { formatCurrency } from "@/lib/financial-utils"

// Componente de dashboard para repartidores con métricas y estadísticas
export default function RiderDashboard() {
  const { user } = useAuth()
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState({
    total_deliveries: 0,
    pending_deliveries: 0,
    completed_today: 0,
    earnings_today: 0,
    earnings_week: 0,
    average_rating: 0,
    efficiency_score: 0,
    total_hours: 0,
  })
  const [recentDeliveries, setRecentDeliveries] = useState<any[]>([])

  // Cargar datos del dashboard al montar el componente
  useEffect(() => {
    loadDashboardData()
  }, [user])

  // Obtener estadísticas y entregas recientes desde el backend
  async function loadDashboardData() {
    try {
      // Fetch estadísticas del repartidor
      const statsResponse = await api.get(`/riders/${user?.id}/dashboard/stats`)
      setStats(statsResponse.data)

      // Fetch entregas recientes
      const deliveriesResponse = await api.get(`/riders/${user?.id}/deliveries/recent?limit=5`)
      setRecentDeliveries(deliveriesResponse.data)
    } catch (error) {
      console.error("Error al cargar dashboard:", error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return <div className="p-4">Cargando dashboard...</div>
  }

  return (
    <div className="space-y-6">
      {/* Encabezado de bienvenida */}
      <div>
        <h2 className="text-2xl font-bold">Hola, {user?.full_name?.split(" ")[0] || "Repartidor"} 👋</h2>
        <p className="text-muted-foreground">Resumen de tu actividad hoy</p>
      </div>

      {/* Tarjetas de estadísticas principales */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {/* Entregas completadas hoy */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Completadas Hoy</CardTitle>
            <Package className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.completed_today}</div>
            <p className="text-xs text-muted-foreground mt-1">
              {stats.pending_deliveries} pendientes restantes
            </p>
          </CardContent>
        </Card>

        {/* Ganancias del día */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Ganancias Hoy</CardTitle>
            <DollarSign className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(stats.earnings_today)}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Semana: {formatCurrency(stats.earnings_week)}
            </p>
          </CardContent>
        </Card>

        {/* Calificación promedio */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Calificación</CardTitle>
            <Star className="h-4 w-4 text-yellow-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.average_rating.toFixed(1)}</div>
            <p className="text-xs text-muted-foreground mt-1">
              {stats.average_rating >= 4.5 ? "¡Excelente!" : "Sigue mejorando"}
            </p>
          </CardContent>
        </Card>

        {/* Eficiencia */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Eficiencia</CardTitle>
            <TrendingUp className="h-4 w-4 text-purple-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.efficiency_score}%</div>
            <p className="text-xs text-muted-foreground mt-1">
              {stats.total_hours.toFixed(1)} horas esta semana
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Métricas adicionales */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center gap-2">
            <Truck className="h-5 w-5 text-blue-500" />
            <CardTitle className="text-base">Total Entregas</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{stats.total_deliveries}</p>
            <p className="text-sm text-muted-foreground">Entregas completadas en total</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center gap-2">
            <Clock className="h-5 w-5 text-orange-500" />
            <CardTitle className="text-base">Tiempo Promedio</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">
              {stats.completed_today > 0 ? Math.round(stats.total_hours * 60 / stats.completed_today) : 0} min
            </p>
            <p className="text-sm text-muted-foreground">Por entrega</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center gap-2">
            <Award className="h-5 w-5 text-green-500" />
            <CardTitle className="text-base">Rendimiento</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">
              {stats.efficiency_score >= 90 ? "A+" : stats.efficiency_score >= 80 ? "A" : stats.efficiency_score >= 70 ? "B" : "C"}
            </p>
            <p className="text-sm text-muted-foreground">Nivel de desempeño</p>
          </CardContent>
        </Card>
      </div>

      {/* Entregas recientes */}
      <Card>
        <CardHeader>
          <CardTitle>Entregas Recientes</CardTitle>
        </CardHeader>
        <CardContent>
          {recentDeliveries.length === 0 ? (
            <p className="text-muted-foreground text-center py-8">No hay entregas recientes</p>
          ) : (
            <div className="space-y-3">
              {recentDeliveries.map((delivery) => (
                <div key={delivery.id} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-full ${delivery.status === "completed" ? "bg-green-100" : "bg-yellow-100"}`}>
                      <Package className={`h-4 w-4 ${delivery.status === "completed" ? "text-green-600" : "text-yellow-600"}`} />
                    </div>
                    <div>
                      <p className="font-medium">Orden #{delivery.order_number}</p>
                      <p className="text-sm text-muted-foreground flex items-center gap-1">
                        <MapPin className="h-3 w-3" />
                        {delivery.address}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <Badge variant={delivery.status === "completed" ? "default" : "secondary"}>
                      {delivery.status === "completed" ? "Completada" : "Pendiente"}
                    </Badge>
                    <p className="text-sm text-muted-foreground mt-1">
                      {new Date(delivery.completed_at || delivery.created_at).toLocaleTimeString()}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
