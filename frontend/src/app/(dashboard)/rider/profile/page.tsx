"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { User, Mail, Phone, MapPin, Calendar, Edit2, Save, X, Upload } from "lucide-react"
import { useAuth } from "@/contexts/AuthContext"
import { api } from "@/lib/api"

// Página de perfil del repartidor para ver y editar información personal
export default function RiderProfilePage() {
  const router = useRouter()
  const { user, updateUser } = useAuth()
  const [editing, setEditing] = useState(false)
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    full_name: "",
    email: "",
    phone: "",
    address: "",
    vehicle_type: "",
    license_plate: "",
    emergency_contact: "",
    emergency_phone: "",
  })

  // Cargar datos del perfil al montar el componente
  useEffect(() => {
    if (user) {
      setFormData({
        full_name: user.full_name || "",
        email: user.email || "",
        phone: user.phone || "",
        address: user.address || "",
        vehicle_type: user.vehicle_type || "",
        license_plate: user.license_plate || "",
        emergency_contact: user.emergency_contact || "",
        emergency_phone: user.emergency_phone || "",
      })
    }
  }, [user])

  // Manejar cambios en los inputs del formulario
  function handleInputChange(field: string, value: string) {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  // Guardar cambios del perfil en el backend
  async function handleSaveProfile() {
    setLoading(true)
    try {
      // Enviar datos actualizados al backend
      const response = await api.put(`/riders/${user?.id}`, formData)
      // Actualizar contexto de autenticación con nuevos datos
      updateUser(response.data)
      setEditing(false)
    } catch (error) {
      console.error("Error al actualizar perfil:", error)
    } finally {
      setLoading(false)
    }
  }

  // Cancelar edición y restaurar datos originales
  function handleCancel() {
    if (user) {
      setFormData({
        full_name: user.full_name || "",
        email: user.email || "",
        phone: user.phone || "",
        address: user.address || "",
        vehicle_type: user.vehicle_type || "",
        license_plate: user.license_plate || "",
        emergency_contact: user.emergency_contact || "",
        emergency_phone: user.emergency_phone || "",
      })
    }
    setEditing(false)
  }

  // Obtener iniciales del nombre para avatar
  function getInitials(name: string) {
    return name
      .split(" ")
      .map(n => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2)
  }

  return (
    <div className="container mx-auto p-4 max-w-4xl">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
          <div>
            <CardTitle className="text-2xl">Mi Perfil</CardTitle>
            <CardDescription>Gestiona tu información personal y de contacto</CardDescription>
          </div>
          {!editing ? (
            <Button onClick={() => setEditing(true)} variant="outline">
              <Edit2 className="h-4 w-4 mr-2" />
              Editar
            </Button>
          ) : (
            <div className="flex gap-2">
              <Button onClick={handleCancel} variant="outline" disabled={loading}>
                <X className="h-4 w-4 mr-2" />
                Cancelar
              </Button>
              <Button onClick={handleSaveProfile} disabled={loading}>
                <Save className="h-4 w-4 mr-2" />
                Guardar
              </Button>
            </div>
          )}
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Sección de foto y estado */}
          <div className="flex items-center gap-4 pb-6 border-b">
            <Avatar className="h-24 w-24">
              <AvatarImage src={user?.avatar_url} />
              <AvatarFallback className="text-lg">{getInitials(formData.full_name)}</AvatarFallback>
            </Avatar>
            <div>
              <h3 className="text-xl font-semibold">{formData.full_name}</h3>
              <Badge variant={user?.status === "active" ? "default" : "secondary"} className="mt-1">
                {user?.status === "active" ? "Activo" : "Inactivo"}
              </Badge>
              <p className="text-sm text-muted-foreground mt-1">Repartidor desde {user?.created_at ? new Date(user.created_at).toLocaleDateString() : "N/A"}</p>
            </div>
          </div>

          {/* Información personal */}
          <div className="grid md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="full_name">Nombre Completo</Label>
              <div className="flex items-center gap-2">
                <User className="h-4 w-4 text-muted-foreground" />
                <Input
                  id="full_name"
                  value={formData.full_name}
                  onChange={(e) => handleInputChange("full_name", e.target.value)}
                  disabled={!editing}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">Correo Electrónico</Label>
              <div className="flex items-center gap-2">
                <Mail className="h-4 w-4 text-muted-foreground" />
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => handleInputChange("email", e.target.value)}
                  disabled={!editing}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="phone">Teléfono</Label>
              <div className="flex items-center gap-2">
                <Phone className="h-4 w-4 text-muted-foreground" />
                <Input
                  id="phone"
                  value={formData.phone}
                  onChange={(e) => handleInputChange("phone", e.target.value)}
                  disabled={!editing}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="address">Dirección</Label>
              <div className="flex items-center gap-2">
                <MapPin className="h-4 w-4 text-muted-foreground" />
                <Input
                  id="address"
                  value={formData.address}
                  onChange={(e) => handleInputChange("address", e.target.value)}
                  disabled={!editing}
                />
              </div>
            </div>
          </div>

          {/* Información del vehículo */}
          <div className="border-t pt-6">
            <h4 className="text-lg font-semibold mb-4">Información del Vehículo</h4>
            <div className="grid md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="vehicle_type">Tipo de Vehículo</Label>
                <Input
                  id="vehicle_type"
                  value={formData.vehicle_type}
                  onChange={(e) => handleInputChange("vehicle_type", e.target.value)}
                  disabled={!editing}
                  placeholder="Ej: Motocicleta, Bicicleta, Auto"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="license_plate">Placa / Patente</Label>
                <Input
                  id="license_plate"
                  value={formData.license_plate}
                  onChange={(e) => handleInputChange("license_plate", e.target.value)}
                  disabled={!editing}
                  placeholder="Ej: ABC-123"
                />
              </div>
            </div>
          </div>

          {/* Contacto de emergencia */}
          <div className="border-t pt-6">
            <h4 className="text-lg font-semibold mb-4">Contacto de Emergencia</h4>
            <div className="grid md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="emergency_contact">Nombre</Label>
                <Input
                  id="emergency_contact"
                  value={formData.emergency_contact}
                  onChange={(e) => handleInputChange("emergency_contact", e.target.value)}
                  disabled={!editing}
                  placeholder="Nombre del contacto"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="emergency_phone">Teléfono</Label>
                <div className="flex items-center gap-2">
                  <Phone className="h-4 w-4 text-muted-foreground" />
                  <Input
                    id="emergency_phone"
                    value={formData.emergency_phone}
                    onChange={(e) => handleInputChange("emergency_phone", e.target.value)}
                    disabled={!editing}
                    placeholder="Teléfono de emergencia"
                  />
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
