"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { 
  TrendingUp, 
  TrendingDown, 
  Package, 
  Clock, 
  Star, 
  Award,
  Calendar,
  Target
} from "lucide-react"
import { api } from "@/lib/api"

// Definir tipos para las métricas de productividad
interface ProductivityMetrics {
  totalDeliveries: number
  onTimeDeliveries: number
  lateDeliveries: number
  averageDeliveryTime: number
  customerRating: number
  completionRate: number
  weeklyGoal: number
  weeklyProgress: number
}

interface DailyStats {
  date: string
  deliveries: number
  onTime: number
  earnings: number
  hours: number
}

export default function RiderProductivityPage() {
  // Estado para las métricas de productividad
  const [metrics, setMetrics] = useState<ProductivityMetrics | null>(null)
  // Estado para las estadísticas diarias
  const [dailyStats, setDailyStats] = useState<DailyStats[]>([])
  // Estado para el período seleccionado
  const [selectedPeriod, setSelectedPeriod] = useState<"week" | "month" | "year">("week")
  // Estado de carga
  const [loading, setLoading] = useState(true)

  // Cargar datos de productividad al montar el componente
  useEffect(() => {
    loadProductivityData()
  }, [selectedPeriod])

  // Función asíncrona para cargar los datos de productividad desde la API
  async function loadProductivityData() {
    try {
      setLoading(true)
      // Simulación de llamada a API - reemplazar con endpoint real
      const response = await api.get(`/riders/productivity?period=${selectedPeriod}`)
      setMetrics(response.data.metrics)
      setDailyStats(response.data.dailyStats)
    } catch (error) {
      console.error("Error loading productivity data:", error)
      // Datos mock para demostración
      setMetrics({
        totalDeliveries: 127,
        onTimeDeliveries: 118,
        lateDeliveries: 9,
        averageDeliveryTime: 28,
        customerRating: 4.7,
        completionRate: 98.5,
        weeklyGoal: 150,
        weeklyProgress: 127
      })
      setDailyStats([
        { date: "Lun", deliveries: 18, onTime: 17, earnings: 145.50, hours: 7.5 },
        { date: "Mar", deliveries: 22, onTime: 21, earnings: 178.00, hours: 8.0 },
        { date: "Mié", deliveries: 19, onTime: 18, earnings: 152.75, hours: 7.0 },
        { date: "Jue", deliveries: 24, onTime: 23, earnings: 195.25, hours: 8.5 },
        { date: "Vie", deliveries: 21, onTime: 20, earnings: 168.50, hours: 7.5 },
        { date: "Sáb", deliveries: 15, onTime: 14, earnings: 125.00, hours: 6.0 },
        { date: "Dom", deliveries: 8, onTime: 5, earnings: 68.00, hours: 4.0 }
      ])
    } finally {
      setLoading(false)
    }
  }

  // Calcular porcentaje de entregas a tiempo
  const onTimePercentage = metrics ? Math.round((metrics.onTimeDeliveries / metrics.totalDeliveries) * 100) : 0
  // Calcular porcentaje de progreso semanal
  const weeklyProgressPercentage = metrics ? Math.round((metrics.weeklyProgress / metrics.weeklyGoal) * 100) : 0

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <p className="text-muted-foreground">Cargando datos de productividad...</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Encabezado de la página */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Mi Productividad</h1>
          <p className="text-muted-foreground">
            Visualiza tu rendimiento y estadísticas de entregas
          </p>
        </div>
        <Button variant="outline">
          <Calendar className="mr-2 h-4 w-4" />
          Exportar Reporte
        </Button>
      </div>

      {/* Selector de período */}
      <Tabs value={selectedPeriod} onValueChange={(v) => setSelectedPeriod(v as any)} className="w-full">
        <TabsList>
          <TabsTrigger value="week">Esta Semana</TabsTrigger>
          <TabsTrigger value="month">Este Mes</TabsTrigger>
          <TabsTrigger value="year">Este Año</TabsTrigger>
        </TabsList>

        <TabsContent value={selectedPeriod} className="space-y-6">
          {/* Tarjetas de métricas principales */}
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {/* Total de entregas */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Entregas</CardTitle>
                <Package className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{metrics?.totalDeliveries || 0}</div>
                <p className="text-xs text-muted-foreground">
                  +{metrics?.totalDeliveries ? Math.round(metrics.totalDeliveries * 0.15) : 0}% vs período anterior
                </p>
              </CardContent>
            </Card>

            {/* Entregas a tiempo */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">A Tiempo</CardTitle>
                <Clock className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{onTimePercentage}%</div>
                <p className="text-xs text-muted-foreground">
                  {metrics?.lateDeliveries || 0} entregas tarde
                </p>
              </CardContent>
            </Card>

            {/* Calificación del cliente */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Calificación</CardTitle>
                <Star className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{metrics?.customerRating || 0}</div>
                <div className="flex items-center text-xs text-muted-foreground">
                  <TrendingUp className="mr-1 h-3 w-3 text-green-500" />
                  +0.2 este mes
                </div>
              </CardContent>
            </Card>

            {/* Tasa de completitud */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Completitud</CardTitle>
                <Target className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{metrics?.completionRate || 0}%</div>
                <p className="text-xs text-muted-foreground">
                  {metrics?.totalDeliveries ? metrics.totalDeliveries - (metrics.lateDeliveries || 0) : 0} exitosas
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Progreso de la meta semanal */}
          <Card>
            <CardHeader>
              <CardTitle>Progreso Semanal</CardTitle>
              <CardDescription>Meta: {metrics?.weeklyGoal || 0} entregas esta semana</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>{metrics?.weeklyProgress || 0} completadas</span>
                  <span>{weeklyProgressPercentage}%</span>
                </div>
                <Progress value={weeklyProgressPercentage} className="h-3" />
                <p className="text-xs text-muted-foreground mt-2">
                  {metrics?.weeklyGoal && metrics.weeklyProgress ? metrics.weeklyGoal - metrics.weeklyProgress : 0} entregas restantes para alcanzar la meta
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Estadísticas detalladas */}
          <div className="grid gap-4 md:grid-cols-2">
            {/* Tiempo promedio de entrega */}
            <Card>
              <CardHeader>
                <CardTitle>Tiempo Promedio</CardTitle>
                <CardDescription>Tiempo promedio por entrega</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-center space-x-4">
                  <div className="text-4xl font-bold">{metrics?.averageDeliveryTime || 0}<span className="text-lg text-muted-foreground ml-1">min</span></div>
                  <Badge variant={metrics && metrics.averageDeliveryTime < 30 ? "default" : "destructive"}>
                    {metrics && metrics.averageDeliveryTime < 30 ? "Excelente" : "Mejorable"}
                  </Badge>
                </div>
                <p className="text-sm text-muted-foreground mt-2">
                  Objetivo: &lt;30 minutos por entrega
                </p>
              </CardContent>
            </Card>

            {/* Reconocimientos */}
            <Card>
              <CardHeader>
                <CardTitle>Reconocimientos</CardTitle>
                <CardDescription>Logros y medallas obtenidas</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex space-x-4">
                  <div className="text-center">
                    <Award className="h-12 w-12 text-yellow-500 mx-auto mb-2" />
                    <p className="text-xs font-medium">Top Rider</p>
                    <p className="text-xs text-muted-foreground">Semana 12</p>
                  </div>
                  <div className="text-center">
                    <Star className="h-12 w-12 text-blue-500 mx-auto mb-2" />
                    <p className="text-xs font-medium">5 Estrellas</p>
                    <p className="text-xs text-muted-foreground">100 reseñas</p>
                  </div>
                  <div className="text-center">
                    <Clock className="h-12 w-12 text-green-500 mx-auto mb-2" />
                    <p className="text-xs font-medium">Puntualidad</p>
                    <p className="text-xs text-muted-foreground">95%+ on-time</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Gráfico de actividad semanal */}
          <Card>
            <CardHeader>
              <CardTitle>Actividad Semanal</CardTitle>
              <CardDescription>Entregas realizadas por día</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {dailyStats.map((stat, index) => (
                  <div key={index} className="flex items-center justify-between">
                    <span className="text-sm font-medium w-12">{stat.date}</span>
                    <div className="flex-1 mx-4">
                      <div className="flex items-center h-8">
                        <div 
                          className="bg-primary rounded-l-md h-full" 
                          style={{ width: `${(stat.deliveries / 25) * 100}%` }}
                        />
                        {stat.onTime < stat.deliveries && (
                          <div 
                            className="bg-destructive rounded-r-md h-full" 
                            style={{ width: `${((stat.deliveries - stat.onTime) / 25) * 100}%` }}
                          />
                        )}
                      </div>
                    </div>
                    <div className="text-right min-w-[120px]">
                      <p className="text-sm font-medium">{stat.deliveries} entregas</p>
                      <p className="text-xs text-muted-foreground">
                        {stat.onTime}/{stat.deliveries} a tiempo · ${stat.earnings.toFixed(2)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
              <div className="flex items-center justify-center space-x-6 mt-4 text-xs text-muted-foreground">
                <div className="flex items-center">
                  <div className="w-3 h-3 bg-primary rounded mr-2" />
                  <span>A tiempo</span>
                </div>
                <div className="flex items-center">
                  <div className="w-3 h-3 bg-destructive rounded mr-2" />
                  <span>Tarde</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Recomendaciones de mejora */}
          <Card>
            <CardHeader>
              <CardTitle>Recomendaciones</CardTitle>
              <CardDescription>Sugerencias para mejorar tu rendimiento</CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="space-y-3">
                <li className="flex items-start space-x-3">
                  <TrendingUp className="h-5 w-5 text-green-500 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium">¡Excelente trabajo en puntualidad!</p>
                    <p className="text-xs text-muted-foreground">
                      Mantén tu ritmo actual para conservar tu calificación de 4.7 estrellas.
                    </p>
                  </div>
                </li>
                <li className="flex items-start space-x-3">
                  <Target className="h-5 w-5 text-blue-500 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium">Objetivo semanal alcanzable</p>
                    <p className="text-xs text-muted-foreground">
                      Te faltan {metrics?.weeklyGoal && metrics.weeklyProgress ? metrics.weeklyGoal - metrics.weeklyProgress : 0} entregas. ¡Tú puedes!
                    </p>
                  </div>
                </li>
                <li className="flex items-start space-x-3">
                  <Clock className="h-5 w-5 text-orange-500 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium">Optimiza tus rutas</p>
                    <p className="text-xs text-muted-foreground">
                      Considera agrupar entregas por zona para reducir tiempos de viaje.
                    </p>
                  </div>
                </li>
              </ul>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
