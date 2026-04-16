"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { CheckCircle, MapPin, Clock, AlertCircle } from "lucide-react"
import { useAuth } from "@/contexts/AuthContext"
import { api } from "@/lib/api"

// Página para finalizar una entrega con confirmación y observaciones
export default function FinishDeliveryPage() {
  const router = useRouter()
  const { user } = useAuth()
  const [loading, setLoading] = useState(false)
  const [observations, setObservations] = useState("")
  const [deliveryCode, setDeliveryCode] = useState("")
  const [error, setError] = useState("")

  // Obtener datos de la entrega desde localStorage o params
  const deliveryData = typeof window !== "undefined" ? JSON.parse(localStorage.getItem("currentDelivery") || "{}") : null

  // Manejar el envío del formulario de finalización
  async function handleFinishDelivery(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError("")

    try {
      // Validar código de entrega si es requerido
      if (deliveryData?.require_code && !deliveryCode) {
        throw new Error("El código de entrega es requerido")
      }

      // Enviar confirmación de entrega al backend
      await api.post("/deliveries/complete", {
        delivery_id: deliveryData?.id,
        rider_id: user?.id,
        observations,
        delivery_code: deliveryCode || null,
        completed_at: new Date().toISOString(),
      })

      // Limpiar datos de entrega actual y redirigir
      localStorage.removeItem("currentDelivery")
      router.push("/rider/my-orders")
    } catch (err: any) {
      setError(err.message || "Error al finalizar la entrega")
    } finally {
      setLoading(false)
    }
  }

  // Calcular tiempo transcurrido desde el inicio de la entrega
  function getElapsedTime() {
    if (!deliveryData?.started_at) return "0 min"
    const start = new Date(deliveryData.started_at)
    const now = new Date()
    const diff = Math.floor((now.getTime() - start.getTime()) / 60000)
    return `${diff} min`
  }

  if (!deliveryData) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertCircle className="h-6 w-6 text-yellow-500" />
              Sin entrega activa
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground mb-4">No hay ninguna entrega en curso para finalizar.</p>
            <Button onClick={() => router.push("/rider/my-orders")} className="w-full">
              Ver mis órdenes
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="container mx-auto p-4 max-w-2xl">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CheckCircle className="h-6 w-6 text-green-500" />
            Finalizar Entrega
          </CardTitle>
        </CardHeader>
        <CardContent>
          {/* Información resumida de la entrega */}
          <div className="bg-muted p-4 rounded-lg mb-6">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-muted-foreground">Orden #</p>
                <p className="font-semibold">{deliveryData.order_number}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Tiempo transcurrido</p>
                <p className="font-semibold flex items-center gap-1">
                  <Clock className="h-4 w-4" />
                  {getElapsedTime()}
                </p>
              </div>
              <div className="col-span-2">
                <p className="text-sm text-muted-foreground">Destino</p>
                <p className="font-semibold flex items-center gap-1">
                  <MapPin className="h-4 w-4" />
                  {deliveryData.customer_address}
                </p>
              </div>
            </div>
          </div>

          <form onSubmit={handleFinishDelivery} className="space-y-4">
            {/* Campo para código de entrega si es requerido */}
            {deliveryData.require_code && (
              <div className="space-y-2">
                <Label htmlFor="deliveryCode">Código de Entrega</Label>
                <Input
                  id="deliveryCode"
                  value={deliveryCode}
                  onChange={(e) => setDeliveryCode(e.target.value)}
                  placeholder="Ingresa el código proporcionado por el cliente"
                  required
                />
              </div>
            )}

            {/* Campo para observaciones opcionales */}
            <div className="space-y-2">
              <Label htmlFor="observations">Observaciones (opcional)</Label>
              <Textarea
                id="observations"
                value={observations}
                onChange={(e) => setObservations(e.target.value)}
                placeholder="Ej: Cliente recibió el paquete, entregado en recepción, etc."
                rows={4}
              />
            </div>

            {/* Mostrar mensaje de error si existe */}
            {error && (
              <div className="bg-destructive/10 text-destructive p-3 rounded-lg flex items-center gap-2">
                <AlertCircle className="h-4 w-4" />
                {error}
              </div>
            )}

            {/* Botones de acción */}
            <div className="flex gap-3 pt-4">
              <Button type="button" variant="outline" onClick={() => router.back()} className="flex-1">
                Cancelar
              </Button>
              <Button type="submit" disabled={loading} className="flex-1 bg-green-600 hover:bg-green-700">
                {loading ? "Procesando..." : "Confirmar Entrega"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
