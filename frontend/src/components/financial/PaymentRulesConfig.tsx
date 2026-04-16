'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Switch } from '@/components/ui/switch'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Plus, Trash2, Edit, Save, DollarSign, Clock, MapPin, Bike } from 'lucide-react'

// Configuración de reglas de pago para repartidores
export default function PaymentRulesConfig() {
  // Lista de reglas de pago configuradas
  const [rules, setRules] = useState<any[]>([
    {
      id: 'rule_1',
      name: 'Tarifa Base Urbana',
      type: 'base_rate',
      amount: 5.00,
      conditions: { zone: 'urban', minDistance: 0, maxDistance: 5 },
      isActive: true
    },
    {
      id: 'rule_2',
      name: 'Recargo por Distancia',
      type: 'distance_bonus',
      amount: 0.50,
      conditions: { minDistance: 5, maxDistance: 10 },
      isActive: true
    },
    {
      id: 'rule_3',
      name: 'Bono Nocturno',
      type: 'time_bonus',
      amount: 2.00,
      conditions: { startTime: '22:00', endTime: '06:00' },
      isActive: true
    }
  ])
  // Estado del formulario
  const [isEditing, setIsEditing] = useState(false)
  // Regla seleccionada para edición
  const [editingRule, setEditingRule] = useState<any | null>(null)
  // Datos del formulario
  const [formData, setFormData] = useState({
    name: '',
    type: 'base_rate',
    amount: 0,
    conditions: {} as any,
    isActive: true
  })

  // Abrir formulario para nueva regla
  function handleNewRule() {
    setEditingRule(null) // Limpiar regla en edición
    setFormData({
      name: '',
      type: 'base_rate',
      amount: 0,
      conditions: {},
      isActive: true
    })
    setIsEditing(true) // Activar modo edición
  }

  // Abrir formulario para editar regla existente
  function handleEditRule(rule: any) {
    setEditingRule(rule) // Establecer regla en edición
    setFormData({ ...rule }) // Copiar datos de la regla
    setIsEditing(true) // Activar modo edición
  }

  // Actualizar campo del formulario
  function updateFormField(field: string, value: any) {
    setFormData(prev => ({ ...prev, [field]: value })) // Actualizar campo específico
  }

  // Actualizar condición específica
  function updateCondition(key: string, value: any) {
    setFormData(prev => ({
      ...prev,
      conditions: { ...prev.conditions, [key]: value } // Actualizar condición específica
    }))
  }

  // Guardar regla (crear o actualizar)
  async function handleSave() {
    try {
      // Validar campos requeridos
      if (!formData.name || formData.amount <= 0) {
        alert('Complete los campos requeridos')
        return
      }

      // Simular guardado
      await new Promise(resolve => setTimeout(resolve, 500))

      if (editingRule) {
        // Actualizar regla existente
        setRules(prev => prev.map(r =>
          r.id === editingRule.id ? { ...formData, id: editingRule.id } : r
        ))
      } else {
        // Crear nueva regla
        const newRule = {
          ...formData,
          id: `rule_${Date.now()}`
        }
        setRules(prev => [newRule, ...prev]) // Agregar nueva regla a la lista
      }

      setIsEditing(false) // Cerrar formulario
    } catch (error) {
      console.error('Error guardando regla:', error)
    }
  }

  // Eliminar regla
  async function handleDelete(id: string) {
    if (!confirm('¿Está seguro de eliminar esta regla?')) return // Confirmar eliminación

    try {
      // Simular eliminación
      await new Promise(resolve => setTimeout(resolve, 300))
      setRules(prev => prev.filter(r => r.id !== id)) // Remover regla de la lista
    } catch (error) {
      console.error('Error eliminando regla:', error)
    }
  }

  // Tipos de reglas disponibles
  const ruleTypes = [
    { id: 'base_rate', label: 'Tarifa Base', icon: DollarSign },
    { id: 'distance_bonus', label: 'Bono por Distancia', icon: MapPin },
    { id: 'time_bonus', label: 'Bono por Horario', icon: Clock },
    { id: 'vehicle_bonus', label: 'Bono por Vehículo', icon: Bike },
    { id: 'order_bonus', label: 'Bono por Cantidad', icon: Save }
  ]

  return (
    <div className="space-y-6">
      {/* Encabezado */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
          <CardTitle className="text-xl font-semibold">Configuración de Reglas de Pago</CardTitle>
          <Button onClick={handleNewRule}>
            <Plus className="h-4 w-4 mr-2" />
            Nueva Regla
          </Button>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            Define las reglas de cálculo de pagos para repartidores según distancia, horario, zona y otros factores
          </p>
        </CardContent>
      </Card>

      {/* Formulario de Edición */}
      {isEditing && (
        <Card>
          <CardHeader>
            <CardTitle>{editingRule ? 'Editar Regla' : 'Nueva Regla de Pago'}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Nombre de la Regla *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => updateFormField('name', e.target.value)}
                placeholder="Ej: Tarifa Base Urbana"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="type">Tipo de Regla *</Label>
              <Select value={formData.type} onValueChange={(value) => updateFormField('type', value)}>
                <SelectTrigger id="type">
                  <SelectValue placeholder="Seleccionar tipo" />
                </SelectTrigger>
                <SelectContent>
                  {ruleTypes.map((type) => (
                    <SelectItem key={type.id} value={type.id}>
                      {type.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="amount">Monto/Base ($) *</Label>
              <Input
                id="amount"
                type="number"
                step="0.01"
                value={formData.amount}
                onChange={(e) => updateFormField('amount', parseFloat(e.target.value))}
                placeholder="0.00"
              />
            </div>

            {/* Condiciones según tipo */}
            {formData.type === 'base_rate' && (
              <div className="space-y-2">
                <Label>Zona de Aplicación</Label>
                <Select
                  value={formData.conditions.zone || 'urban'}
                  onValueChange={(value) => updateCondition('zone', value)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="urban">Urbana</SelectItem>
                    <SelectItem value="suburban">Suburbana</SelectItem>
                    <SelectItem value="rural">Rural</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}

            {formData.type === 'distance_bonus' && (
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Distancia Mínima (km)</Label>
                  <Input
                    type="number"
                    value={formData.conditions.minDistance || 0}
                    onChange={(e) => updateCondition('minDistance', parseFloat(e.target.value))}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Distancia Máxima (km)</Label>
                  <Input
                    type="number"
                    value={formData.conditions.maxDistance || 10}
                    onChange={(e) => updateCondition('maxDistance', parseFloat(e.target.value))}
                  />
                </div>
              </div>
            )}

            {formData.type === 'time_bonus' && (
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Hora Inicio</Label>
                  <Input
                    type="time"
                    value={formData.conditions.startTime || '22:00'}
                    onChange={(e) => updateCondition('startTime', e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Hora Fin</Label>
                  <Input
                    type="time"
                    value={formData.conditions.endTime || '06:00'}
                    onChange={(e) => updateCondition('endTime', e.target.value)}
                  />
                </div>
              </div>
            )}

            <div className="flex items-center justify-between space-x-2">
              <Label htmlFor="isActive">Estado</Label>
              <Switch
                id="isActive"
                checked={formData.isActive}
                onCheckedChange={(checked) => updateFormField('isActive', checked)}
              />
            </div>

            <div className="flex gap-2 pt-4">
              <Button onClick={handleSave} className="flex-1">
                <Save className="h-4 w-4 mr-2" />
                Guardar
              </Button>
              <Button variant="outline" onClick={() => setIsEditing(false)}>
                Cancelar
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Lista de Reglas */}
      <Card>
        <CardHeader>
          <CardTitle>Reglas Configuradas</CardTitle>
        </CardHeader>
        <CardContent>
          {rules.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-4">
              No hay reglas configuradas
            </p>
          ) : (
            <div className="space-y-3">
              {rules.map((rule) => {
                const RuleIcon = ruleTypes.find(t => t.id === rule.type)?.icon || DollarSign
                return (
                  <div
                    key={rule.id}
                    className="border rounded-lg p-4 flex items-center justify-between"
                  >
                    <div className="flex items-center gap-3">
                      <Badge variant={rule.isActive ? 'default' : 'secondary'}>
                        {rule.isActive ? 'Activa' : 'Inactiva'}
                      </Badge>
                      <RuleIcon className="h-5 w-5 text-muted-foreground" />
                      <div>
                        <h3 className="font-semibold">{rule.name}</h3>
                        <p className="text-sm text-muted-foreground">
                          ${rule.amount.toFixed(2)} • {rule.type.replace('_', ' ')}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button variant="ghost" size="sm" onClick={() => handleEditRule(rule)}>
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="sm" onClick={() => handleDelete(rule.id)}>
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
