"use client"

import { useState, useEffect } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { 
  MapPin, 
  Package, 
  Clock, 
  Phone, 
  Navigation,
  CheckCircle,
  AlertCircle,
  Camera
} from "lucide-react"
import { api } from "@/lib/api"

// Definir tipo para los detalles de la entrega
interface DeliveryDetails {
  id: string
  orderId: string
  customerName: string
  customerPhone: string
  pickupAddress: string
  deliveryAddress: string
  estimatedDistance: number
  estimatedDuration: number
  items: Array<{ name: string; quantity: number }>
  specialInstructions?: string
  paymentMethod: string
  totalAmount: number
}

export default function StartDeliveryPage() {
  // Obtener router para navegación
  const router = useRouter()
  // Obtener parámetros de búsqueda de la URL
  const searchParams = useSearchParams()
  // Estado para los detalles de la entrega
  const [delivery, setDelivery] = useState<DeliveryDetails | null>(null)
  // Estado para el código de recogida (opcional)
  const [pickupCode, setPickupCode] = useState("")
  // Estado para observaciones iniciales
  const [observations, setObservations] = useState("")
  // Estado de carga
  const [loading, setLoading] = useState(true)
  // Estado para errores
  const [error, setError] = useState<string | null>(null)
  // Estado para el proceso de inicio
  const [starting, setStarting] = useState(false)

  // Cargar detalles de la entrega al montar el componente
  useEffect(() => {
    const deliveryId = searchParams.get("id")
    if (deliveryId) {
      loadDeliveryDetails(deliveryId)
    } else {
      setError("No se proporcionó ID de entrega")
      setLoading(false)
    }
  }, [searchParams])

  // Función asíncrona para cargar los detalles de la entrega desde la API
  async function loadDeliveryDetails(deliveryId: string) {
    try {
      setLoading(true)
      const response = await api.get(`/deliveries/${deliveryId}`)
      setDelivery(response.data)
    } catch (error) {
      console.error("Error loading delivery details:", error)
      setError("No se pudieron cargar los detalles de la entrega")
    } finally {
      setLoading(false)
    }
  }

  // Función asíncrona para iniciar la entrega
  async function handleStartDelivery() {
    if (!delivery) return
    
    try {
      setStarting(true)
      // Enviar solicitud para iniciar la entrega
      await api.post(`/deliveries/${delivery.id}/start`, {
        pickupCode,
        observations,
        startTime: new Date().toISOString()
      })
      // Redirigir a la página de seguimiento de entrega
      router.push(`/rider/my-orders?status=in-progress`)
    } catch (error: any) {
      setError(error.response?.data?.message || "Error al iniciar la entrega")
    } finally {
      setStarting(false)
    }
  }

  // Mostrar estado de carga
  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <p className="text-muted-foreground">Cargando detalles de la entrega...</p>
      </div>
    )
  }

  // Mostrar mensaje de error si no hay entrega
  if (!delivery && error) {
    return (
      <div className="flex items-center justify-center h-full">
        <Alert variant="destructive" className="max-w-md">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      </div>
    )
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Encabezado de la página */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Iniciar Entrega</h1>
        <p className="text-muted-foreground">
          Confirma los detalles y comienza la entrega
        </p>
      </div>

      {/* Alerta informativa */}
      <Alert>
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          Verifica que todos los datos sean correctos antes de iniciar. Una vez iniciada, deberás completar la entrega o reportar incidencias.
        </AlertDescription>
      </Alert>

      {/* Tarjeta de información del cliente */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Package className="mr-2 h-5 w-5" />
            Información del Pedido
          </CardTitle>
          <CardDescription>Orden #{delivery?.orderId}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Lista de artículos */}
          <div>
            <h3 className="text-sm font-medium mb-2">Artículos</h3>
            <ul className="space-y-1">
              {delivery?.items.map((item, index) => (
                <li key={index} className="flex justify-between text-sm">
                  <span>{item.name}</span>
                  <Badge variant="secondary">x{item.quantity}</Badge>
                </li>
              ))}
            </ul>
          </div>
          
          {/* Método de pago y total */}
          <div className="flex justify-between items-center pt-2 border-t">
            <span className="text-sm text-muted-foreground">Método de pago</span>
            <Badge>{delivery?.paymentMethod}</Badge>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-sm font-medium">Total</span>
            <span className="text-lg font-bold">${delivery?.totalAmount.toFixed(2)}</span>
          </div>
        </CardContent>
      </Card>

      {/* Tarjeta de ubicación de recogida */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <MapPin className="mr-2 h-5 w-5 text-blue-500" />
            Punto de Recogida
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-start space-x-3">
            <MapPin className="h-5 w-5 text-muted-foreground mt-0.5" />
            <div className="flex-1">
              <p className="font-medium">{delivery?.pickupAddress}</p>
            </div>
          </div>
          
          {/* Campo para código de recogida */}
          <div className="space-y-2">
            <Label htmlFor="pickup-code">Código de Recogida (opcional)</Label>
            <Input
              id="pickup-code"
              placeholder="Ingresa el código proporcionado por el comercio"
              value={pickupCode}
              onChange={(e) => setPickupCode(e.target.value)}
              maxLength={6}
            />
            <p className="text-xs text-muted-foreground">
              Algunos comercios requieren un código para liberar el pedido
            </p>
          </div>
          
          {/* Botón para navegar */}
          <Button variant="outline" className="w-full">
            <Navigation className="mr-2 h-4 w-4" />
            Abrir en Maps
          </Button>
        </CardContent>
      </Card>

      {/* Tarjeta de ubicación de entrega */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <MapPin className="mr-2 h-5 w-5 text-green-500" />
            Punto de Entrega
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-start space-x-3">
            <MapPin className="h-5 w-5 text-muted-foreground mt-0.5" />
            <div className="flex-1">
              <p className="font-medium">{delivery?.deliveryAddress}</p>
            </div>
          </div>
          
          {/* Información del cliente */}
          <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
            <div className="flex items-center space-x-3">
              <div className="h-10 w-10 rounded-full bg-primary flex items-center justify-center text-primary-foreground font-bold">
                {delivery?.customerName.charAt(0)}
              </div>
              <div>
                <p className="font-medium">{delivery?.customerName}</p>
                <p className="text-xs text-muted-foreground">Cliente</p>
              </div>
            </div>
            <Button size="icon" variant="outline">
              <Phone className="h-4 w-4" />
            </Button>
          </div>
          
          {/* Estimaciones de tiempo y distancia */}
          <div className="grid grid-cols-2 gap-4">
            <div className="flex items-center space-x-2">
              <Clock className="h-4 w-4 text-muted-foreground" />
              <div>
                <p className="text-xs text-muted-foreground">Duración estimada</p>
                <p className="font-medium">{delivery?.estimatedDuration} min</p>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <Navigation className="h-4 w-4 text-muted-foreground" />
              <div>
                <p className="text-xs text-muted-foreground">Distancia</p>
                <p className="font-medium">{delivery?.estimatedDistance} km</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Instrucciones especiales */}
      {delivery?.specialInstructions && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <AlertCircle className="mr-2 h-5 w-5 text-orange-500" />
              Instrucciones Especiales
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm bg-orange-50 dark:bg-orange-950 p-3 rounded-lg border border-orange-200 dark:border-orange-800">
              {delivery.specialInstructions}
            </p>
          </CardContent>
        </Card>
      )}

      {/* Campo de observaciones */}
      <Card>
        <CardHeader>
          <CardTitle>Observaciones Iniciales</CardTitle>
          <CardDescription>
            Agrega cualquier nota relevante antes de comenzar
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-2">
          <Textarea
            placeholder="Ej: El comercio está cerrado, el cliente no contesta, etc."
            value={observations}
            onChange={(e) => setObservations(e.target.value)}
            rows={3}
          />
          <div className="flex items-center space-x-2">
            <Camera className="h-4 w-4 text-muted-foreground" />
            <p className="text-xs text-muted-foreground">
              Podrás tomar fotos al recoger y entregar
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Botón de acción */}
      <div className="flex space-x-4">
        <Button 
          variant="outline" 
          className="flex-1"
          onClick={() => router.back()}
        >
          Cancelar
        </Button>
        <Button 
          className="flex-1" 
          size="lg"
          onClick={handleStartDelivery}
          disabled={starting || !delivery}
        >
          {starting ? (
            <>Iniciando...</>
          ) : (
            <>
              <CheckCircle className="mr-2 h-5 w-5" />
              Comenzar Entrega
            </>
          )}
        </Button>
      </div>

      {/* Recordatorio final */}
      <p className="text-xs text-center text-muted-foreground">
        Al iniciar, el temporizador comenzará a contar. Asegúrate de estar listo para recoger el pedido.
      </p>
    </div>
  )
}
