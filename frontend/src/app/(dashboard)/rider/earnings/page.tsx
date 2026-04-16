"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { DollarSign, TrendingUp, Calendar, Truck, Clock, Award } from "lucide-react"
import { useAuth } from "@/contexts/AuthContext"
import { api } from "@/lib/api"
import { formatCurrency } from "@/lib/financial-utils"

// Página de ganancias del repartidor con resumen y historial
export default function RiderEarningsPage() {
  const { user } = useAuth()
  const [loading, setLoading] = useState(true)
  const [earnings, setEarnings] = useState({
    total_today: 0,
    total_week: 0,
    total_month: 0,
    pending_payment: 0,
    completed_deliveries: 0,
    average_per_delivery: 0,
  })
  const [history, setHistory] = useState<any[]>([])

  // Cargar datos de ganancias al montar el componente
  useEffect(() => {
    loadEarningsData()
  }, [user])

  // Obtener datos de ganancias desde el backend
  async function loadEarningsData() {
    try {
      // Fetch resumen de ganancias
      const summaryResponse = await api.get(`/riders/${user?.id}/earnings/summary`)
      setEarnings(summaryResponse.data)

      // Fetch historial de pagos
      const historyResponse = await api.get(`/riders/${user?.id}/earnings/history`)
      setHistory(historyResponse.data)
    } catch (error) {
      console.error("Error al cargar ganancias:", error)
    } finally {
      setLoading(false)
    }
  }

  // Calcular porcentaje de cambio entre periodos
  function calculateChange(current: number, previous: number) {
    if (previous === 0) return 100
    return ((current - previous) / previous) * 100
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p>Cargando tus ganancias...</p>
      </div>
    )
  }

  return (
    <div className="container mx-auto p-4 max-w-6xl space-y-6">
      {/* Encabezado */}
      <div>
        <h1 className="text-3xl font-bold">Mis Ganancias</h1>
        <p className="text-muted-foreground">Resumen de ingresos y historial de pagos</p>
      </div>

      {/* Tarjetas de resumen */}
      <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Ganancia del día */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Hoy</CardTitle>
            <DollarSign className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(earnings.total_today)}</div>
            <p className="text-xs text-muted-foreground mt-1">
              {earnings.completed_deliveries} entregas completadas
            </p>
          </CardContent>
        </Card>

        {/* Ganancia de la semana */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Esta Semana</CardTitle>
            <TrendingUp className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(earnings.total_week)}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Promedio: {formatCurrency(earnings.average_per_delivery)}/entrega
            </p>
          </CardContent>
        </Card>

        {/* Ganancia del mes */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Este Mes</CardTitle>
            <Calendar className="h-4 w-4 text-purple-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(earnings.total_month)}</div>
            <p className="text-xs text-muted-foreground mt-1">
              {earnings.completed_deliveries} entregas totales
            </p>
          </CardContent>
        </Card>

        {/* Pendiente de pago */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Pendiente de Pago</CardTitle>
            <Clock className="h-4 w-4 text-orange-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(earnings.pending_payment)}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Próximo pago: Viernes
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Estadísticas adicionales */}
      <div className="grid md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center gap-2">
            <Truck className="h-5 w-5 text-blue-500" />
            <CardTitle className="text-base">Entregas Completadas</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{earnings.completed_deliveries}</p>
            <p className="text-sm text-muted-foreground">Total en el periodo seleccionado</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center gap-2">
            <Award className="h-5 w-5 text-yellow-500" />
            <CardTitle className="text-base">Promedio por Entrega</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{formatCurrency(earnings.average_per_delivery)}</p>
            <p className="text-sm text-muted-foreground">Ganancia promedio</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center gap-2">
            <DollarSign className="h-5 w-5 text-green-500" />
            <CardTitle className="text-base">Eficiencia</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">
              {earnings.completed_deliveries > 0 ? Math.round(earnings.total_week / earnings.completed_deliveries * 10) / 10 : 0}
            </p>
            <p className="text-sm text-muted-foreground">Entregas/hora estimadas</p>
          </CardContent>
        </Card>
      </div>

      {/* Historial de pagos */}
      <Card>
        <CardHeader>
          <CardTitle>Historial de Pagos</CardTitle>
        </CardHeader>
        <CardContent>
          {history.length === 0 ? (
            <p className="text-muted-foreground text-center py-8">No hay pagos registrados aún</p>
          ) : (
            <div className="space-y-3">
              {history.map((payment) => (
                <div key={payment.id} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className="bg-green-100 p-2 rounded-full">
                      <DollarSign className="h-4 w-4 text-green-600" />
                    </div>
                    <div>
                      <p className="font-medium">{formatCurrency(payment.amount)}</p>
                      <p className="text-sm text-muted-foreground">
                        {payment.deliveries_count} entregas • {new Date(payment.payment_date).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  <Badge variant={payment.status === "paid" ? "default" : "secondary"}>
                    {payment.status === "paid" ? "Pagado" : "Pendiente"}
                  </Badge>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
