"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Clock, Plus, Calendar, Users, CheckCircle, XCircle } from "lucide-react"
import { useAuth } from "@/contexts/AuthContext"
import api from "@/lib/api"

// Página de gestión de turnos para operadores
export default function OperatorShiftsPage() {
  const { user } = useAuth()
  const [loading, setLoading] = useState(true)
  const [shifts, setShifts] = useState<any[]>([])
  const [showDialog, setShowDialog] = useState(false)
  const [formData, setFormData] = useState({
    date: "",
    start_time: "",
    end_time: "",
    rider_ids: [] as string[],
    notes: "",
  })

  // Cargar turnos al montar el componente
  useEffect(() => {
    loadShifts()
  }, [])

  // Obtener lista de turnos desde el backend
  async function loadShifts() {
    try {
      const response = await api.get("/shifts")
      setShifts(response.data)
    } catch (error) {
      console.error("Error al cargar turnos:", error)
    } finally {
      setLoading(false)
    }
  }

  // Manejar cambios en inputs del formulario
  function handleInputChange(field: string, value: any) {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  // Crear nuevo turno
  async function handleCreateShift() {
    try {
      await api.post("/shifts", {
        ...formData,
        created_by: user?.id,
      })
      setShowDialog(false)
      loadShifts()
      // Limpiar formulario
      setFormData({ date: "", start_time: "", end_time: "", rider_ids: [], notes: "" })
    } catch (error) {
      console.error("Error al crear turno:", error)
    }
  }

  // Aprobar o rechazar turno
  async function handleShiftAction(shiftId: string, action: "approve" | "reject") {
    try {
      await api.patch(`/shifts/${shiftId}/${action}`, { operator_id: user?.id })
      loadShifts()
    } catch (error) {
      console.error("Error al actualizar turno:", error)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p>Cargando turnos...</p>
      </div>
    )
  }

  return (
    <div className="container mx-auto p-4 max-w-6xl space-y-6">
      {/* Encabezado */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold">Turnos</h1>
          <p className="text-muted-foreground">Gestiona los turnos de repartidores</p>
        </div>
        <Dialog open={showDialog} onOpenChange={setShowDialog}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Nuevo Turno
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Crear Nuevo Turno</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="date">Fecha</Label>
                <Input
                  id="date"
                  type="date"
                  value={formData.date}
                  onChange={(e) => handleInputChange("date", e.target.value)}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="start_time">Hora Inicio</Label>
                  <Input
                    id="start_time"
                    type="time"
                    value={formData.start_time}
                    onChange={(e) => handleInputChange("start_time", e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="end_time">Hora Fin</Label>
                  <Input
                    id="end_time"
                    type="time"
                    value={formData.end_time}
                    onChange={(e) => handleInputChange("end_time", e.target.value)}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="notes">Notas</Label>
                <Input
                  id="notes"
                  value={formData.notes}
                  onChange={(e) => handleInputChange("notes", e.target.value)}
                  placeholder="Notas adicionales"
                />
              </div>
              <Button onClick={handleCreateShift} className="w-full">
                Crear Turno
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Lista de turnos */}
      {shifts.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Clock className="h-12 w-12 text-muted-foreground mb-4" />
            <p className="text-muted-foreground">No hay turnos registrados</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {shifts.map((shift) => (
            <Card key={shift.id}>
              <CardContent className="p-4">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                  {/* Información del turno */}
                  <div className="flex-1 space-y-2">
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-muted-foreground" />
                      <span className="font-semibold">{new Date(shift.date).toLocaleDateString()}</span>
                      <Badge variant={shift.status === "approved" ? "default" : shift.status === "rejected" ? "destructive" : "secondary"}>
                        {shift.status === "approved" ? "Aprobado" : shift.status === "rejected" ? "Rechazado" : "Pendiente"}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {shift.start_time} - {shift.end_time}
                      </span>
                      <span className="flex items-center gap-1">
                        <Users className="h-3 w-3" />
                        {shift.riders?.length || 0} repartidores
                      </span>
                    </div>
                    {shift.notes && <p className="text-sm text-muted-foreground">{shift.notes}</p>}
                  </div>

                  {/* Acciones */}
                  {shift.status === "pending" && (
                    <div className="flex gap-2">
                      <Button
                        onClick={() => handleShiftAction(shift.id, "approve")}
                        size="sm"
                        className="bg-green-600 hover:bg-green-700"
                      >
                        <CheckCircle className="h-4 w-4 mr-1" />
                        Aprobar
                      </Button>
                      <Button
                        onClick={() => handleShiftAction(shift.id, "reject")}
                        size="sm"
                        variant="outline"
                      >
                        <XCircle className="h-4 w-4 mr-1" />
                        Rechazar
                      </Button>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
