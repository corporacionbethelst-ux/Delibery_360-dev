'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Calculator, MapPin, Clock, Bike, DollarSign } from 'lucide-react'

// Calculadora de costos de entregas según múltiples factores
export default function CostCalculator() {
  // Parámetros de cálculo
  const [params, setParams] = useState({
    distance: 5, // Distancia en km
    zone: 'urban', // Zona de entrega
    vehicleType: 'motorcycle', // Tipo de vehículo
    timeSlot: 'standard', // Franja horaria
    weight: 1, // Peso en kg
    isExpress: false // Entrega express
  })
  // Resultado del cálculo
  const [result, setResult] = useState<any>(null)
  // Estado de cálculo
  const [isCalculating, setIsCalculating] = useState(false)

  // Actualizar parámetro específico
  function updateParam(key: string, value: any) {
    setParams(prev => ({ ...prev, [key]: value })) // Actualizar parámetro específico
  }

  // Calcular costo de entrega
  async function calculateCost() {
    try {
      setIsCalculating(true) // Activar estado de cálculo
      await new Promise(resolve => setTimeout(resolve, 500)) // Simular cálculo

      // Tarifas base por zona
      const baseRates = { urban: 5.00, suburban: 7.00, rural: 10.00 }
      // Recargos por tipo de vehículo
      const vehicleRates = { motorcycle: 1.0, bicycle: 0.5, car: 2.0, van: 3.0 }
      // Multiplicadores por franja horaria
      const timeMultipliers = { standard: 1.0, peak: 1.3, night: 1.5 }

      // Calcular costo base según zona
      let cost = baseRates[params.zone as keyof typeof baseRates]
      // Agregar recargo por distancia (>5km = $0.50/km adicional)
      if (params.distance > 5) cost += (params.distance - 5) * 0.50
      // Aplicar multiplicador por tipo de vehículo
      cost *= vehicleRates[params.vehicleType as keyof typeof vehicleRates]
      // Aplicar multiplicador por franja horaria
      cost *= timeMultipliers[params.timeSlot as keyof typeof timeMultipliers]
      // Agregar recargo por peso (>5kg = $1/kg adicional)
      if (params.weight > 5) cost += (params.weight - 5) * 1.0
      // Aplicar recargo express (50% adicional)
      if (params.isExpress) cost *= 1.5

      // Generar desglose del cálculo
      const breakdown = [
        { concept: 'Tarifa Base', amount: baseRates[params.zone as keyof typeof baseRates] },
        { concept: 'Distancia Adicional', amount: params.distance > 5 ? (params.distance - 5) * 0.50 : 0 },
        { concept: 'Tipo de Vehículo', amount: cost * vehicleRates[params.vehicleType as keyof typeof vehicleRates] - cost },
        { concept: 'Franja Horaria', amount: cost * timeMultipliers[params.timeSlot as keyof typeof timeMultipliers] - cost },
        { concept: 'Peso Excedente', amount: params.weight > 5 ? (params.weight - 5) : 0 },
        { concept: 'Recargo Express', amount: params.isExpress ? cost * 0.5 : 0 }
      ]

      setResult({
        total: parseFloat(cost.toFixed(2)),
        breakdown,
        timestamp: new Date().toISOString()
      })
    } catch (error) {
      console.error('Error calculando costo:', error)
    } finally {
      setIsCalculating(false) // Finalizar estado de cálculo
    }
  }

  // Limpiar cálculo y parámetros
  function clearCalculation() {
    setParams({
      distance: 5,
      zone: 'urban',
      vehicleType: 'motorcycle',
      timeSlot: 'standard',
      weight: 1,
      isExpress: false
    })
    setResult(null) // Limpiar resultado
  }

  return (
    <div className="space-y-6">
      {/* Encabezado */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
          <CardTitle className="text-xl font-semibold flex items-center gap-2">
            <Calculator className="h-5 w-5" />
            Calculadora de Costos de Entrega
          </CardTitle>
          <Button variant="outline" onClick={clearCalculation}>
            Limpiar
          </Button>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            Calcula el costo estimado de una entrega basado en distancia, zona, vehículo y otros factores
          </p>
        </CardContent>
      </Card>

      {/* Parámetros de Cálculo */}
      <Card>
        <CardHeader>
          <CardTitle>Parámetros de la Entrega</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="distance">Distancia (km)</Label>
              <div className="relative">
                <MapPin className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  id="distance"
                  type="number"
                  className="pl-10"
                  value={params.distance}
                  onChange={(e) => updateParam('distance', parseFloat(e.target.value))}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="weight">Peso (kg)</Label>
              <Input
                id="weight"
                type="number"
                value={params.weight}
                onChange={(e) => updateParam('weight', parseFloat(e.target.value))}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="zone">Zona de Entrega</Label>
              <Select value={params.zone} onValueChange={(value) => updateParam('zone', value)}>
                <SelectTrigger id="zone">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="urban">Urbana</SelectItem>
                  <SelectItem value="suburban">Suburbana</SelectItem>
                  <SelectItem value="rural">Rural</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="vehicleType">Tipo de Vehículo</Label>
              <Select value={params.vehicleType} onValueChange={(value) => updateParam('vehicleType', value)}>
                <SelectTrigger id="vehicleType">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="bicycle">Bicicleta</SelectItem>
                  <SelectItem value="motorcycle">Motocicleta</SelectItem>
                  <SelectItem value="car">Automóvil</SelectItem>
                  <SelectItem value="van">Furgoneta</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="timeSlot">Franja Horaria</Label>
              <Select value={params.timeSlot} onValueChange={(value) => updateParam('timeSlot', value)}>
                <SelectTrigger id="timeSlot">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="standard">Estándar (6am-6pm)</SelectItem>
                  <SelectItem value="peak">Hora Pico (6pm-9pm)</SelectItem>
                  <SelectItem value="night">Nocturno (9pm-6am)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-end space-x-2 pb-2">
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="isExpress"
                  checked={params.isExpress}
                  onChange={(e) => updateParam('isExpress', e.target.checked)}
                  className="h-4 w-4"
                />
                <Label htmlFor="isExpress" className="cursor-pointer">Entrega Express (+50%)</Label>
              </div>
            </div>
          </div>

          <Button onClick={calculateCost} disabled={isCalculating} className="w-full">
            {isCalculating ? 'Calculando...' : 'Calcular Costo'}
            {!isCalculating && <Calculator className="h-4 w-4 ml-2" />}
          </Button>
        </CardContent>
      </Card>

      {/* Resultado del Cálculo */}
      {result && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <DollarSign className="h-5 w-5" />
              Resultado: ${result.total.toFixed(2)}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {result.breakdown.map((item: any, index: number) => (
                item.amount > 0 && (
                  <div key={index} className="flex justify-between text-sm">
                    <span className="text-muted-foreground">{item.concept}</span>
                    <span className="font-medium">${item.amount.toFixed(2)}</span>
                  </div>
                )
              ))}
              <div className="border-t pt-2 mt-2 flex justify-between font-semibold">
                <span>Total</span>
                <span>${result.total.toFixed(2)}</span>
              </div>
              <p className="text-xs text-muted-foreground mt-2">
                Calculado el {new Date(result.timestamp).toLocaleString()}
              </p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
