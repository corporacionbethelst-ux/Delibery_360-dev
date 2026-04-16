"use client"

import { useState, useEffect } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { MapPin, Navigation, Search, LocateFixed, ZoomIn, ZoomOut } from "lucide-react"
import { Input } from "@/components/ui/input"

// Componente de mapa en vivo para seguimiento de repartidores (UI lista para integrar con Leaflet/Google Maps)
export default function LiveMap() {
  const [loading, setLoading] = useState(true)
  const [riders, setRiders] = useState<any[]>([])
  const [selectedRider, setSelectedRider] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState("")
  const [zoom, setZoom] = useState(15)
  const [center, setCenter] = useState({ lat: -34.6037, lng: -58.3816 }) // Buenos Aires por defecto

  // Cargar datos de repartidores al montar el componente
  useEffect(() => {
    loadRidersData()
  }, [])

  // Simular carga de datos de repartidores (reemplazar con API real)
  async function loadRidersData() {
    try {
      // TODO: Reemplazar con llamada a API real
      // const response = await api.get("/riders/locations")
      // setRiders(response.data)
      
      // Datos mock para demostración
      setRiders([
        { id: "1", name: "Juan Pérez", lat: -34.6037, lng: -58.3816, status: "active", order: "ORD-001" },
        { id: "2", name: "María García", lat: -34.6047, lng: -58.3826, status: "busy", order: "ORD-002" },
        { id: "3", name: "Carlos López", lat: -34.6027, lng: -58.3806, status: "idle", order: null },
      ])
    } catch (error) {
      console.error("Error al cargar repartidores:", error)
    } finally {
      setLoading(false)
    }
  }

  // Centrar mapa en ubicación de repartidor específico
  function focusOnRider(riderId: string) {
    const rider = riders.find(r => r.id === riderId)
    if (rider) {
      setCenter({ lat: rider.lat, lng: rider.lng })
      setSelectedRider(riderId)
    }
  }

  // Manejar controles de zoom
  function handleZoomIn() {
    setZoom(prev => Math.min(prev + 1, 20))
  }

  function handleZoomOut() {
    setZoom(prev => Math.max(prev - 1, 1))
  }

  // Filtrar repartidores por término de búsqueda
  function filteredRiders() {
    return riders.filter(rider =>
      rider.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (rider.order && rider.order.toLowerCase().includes(searchTerm.toLowerCase()))
    )
  }

  // Obtener color del marcador según estado
  function getMarkerColor(status: string) {
    switch (status) {
      case "active": return "bg-green-500"
      case "busy": return "bg-blue-500"
      case "idle": return "bg-gray-500"
      default: return "bg-gray-500"
    }
  }

  if (loading) {
    return <div className="flex items-center justify-center h-full">Cargando mapa...</div>
  }

  return (
    <Card className="h-full flex flex-col">
      <CardContent className="p-4 flex-1 flex flex-col gap-4">
        {/* Barra de búsqueda y controles */}
        <div className="flex items-center gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar repartidor u orden..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9"
            />
          </div>
          <Button variant="outline" size="icon" onClick={handleZoomIn}>
            <ZoomIn className="h-4 w-4" />
          </Button>
          <Button variant="outline" size="icon" onClick={handleZoomOut}>
            <ZoomOut className="h-4 w-4" />
          </Button>
          <Button variant="outline" size="icon" onClick={() => setCenter({ lat: -34.6037, lng: -58.3816 })}>
            <LocateFixed className="h-4 w-4" />
          </Button>
        </div>

        {/* Área del mapa (placeholder para integración con librería de mapas) */}
        <div className="relative flex-1 bg-muted rounded-lg overflow-hidden border-2 border-dashed border-muted-foreground/25">
          {/* TODO: Integrar con Leaflet o Google Maps */}
          {/* Ejemplo de implementación:
          <MapContainer center={[center.lat, center.lng]} zoom={zoom} className="h-full w-full">
            <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
            {riders.map(rider => (
              <Marker key={rider.id} position={[rider.lat, rider.lng]}>
                <Popup>{rider.name}</Popup>
              </Marker>
            ))}
          </MapContainer>
          */}
          
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-center text-muted-foreground">
              <Navigation className="h-12 w-12 mx-auto mb-2 opacity-50" />
              <p className="text-sm">Mapa interactivo</p>
              <p className="text-xs mt-1">Integrar con Leaflet o Google Maps</p>
            </div>
          </div>

          {/* Marcadores simulados */}
          <div className="absolute inset-0 p-4">
            {filteredRiders().map((rider) => (
              <div
                key={rider.id}
                className={`absolute cursor-pointer transition-transform hover:scale-125 ${selectedRider === rider.id ? "scale-125 z-10" : ""}`}
                style={{
                  left: `${50 + (rider.lng - center.lng) * 1000}px`,
                  top: `${50 + (rider.lat - center.lat) * 1000}px`,
                }}
                onClick={() => focusOnRider(rider.id)}
              >
                <div className={`w-4 h-4 rounded-full ${getMarkerColor(rider.status)} border-2 border-white shadow-lg`} />
              </div>
            ))}
          </div>
        </div>

        {/* Lista de repartidores */}
        <div className="max-h-48 overflow-y-auto space-y-2">
          {filteredRiders().map((rider) => (
            <div
              key={rider.id}
              className={`flex items-center justify-between p-2 rounded-lg border cursor-pointer transition-colors ${selectedRider === rider.id ? "bg-primary/10 border-primary" : "hover:bg-muted"}`}
              onClick={() => focusOnRider(rider.id)}
            >
              <div className="flex items-center gap-2">
                <div className={`w-2 h-2 rounded-full ${getMarkerColor(rider.status)}`} />
                <div>
                  <p className="font-medium text-sm">{rider.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {rider.order ? `Orden: ${rider.order}` : rider.status === "idle" ? "Disponible" : "En entrega"}
                  </p>
                </div>
              </div>
              <Button variant="ghost" size="sm">
                <MapPin className="h-3 w-3 mr-1" />
                Ver
              </Button>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
