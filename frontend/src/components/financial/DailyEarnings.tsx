'use client'

import { useState, useEffect } from 'react'
import { DollarSign, TrendingUp, Calendar, Download, Filter } from 'lucide-react'

// Tipo para registro de ganancias diarias
interface DailyEarningRecord {
  date: string
  total_earnings: number
  deliveries_count: number
  tips: number
  bonuses: number
  deductions: number
  net_earnings: number
}

// Componente para mostrar resumen de ganancias diarias con gráficos simples
export default function DailyEarnings() {
  const [records, setRecords] = useState<DailyEarningRecord[]>([])
  const [loading, setLoading] = useState(true)
  const [dateRange, setDateRange] = useState({ start: '', end: '' })
  const [totalStats, setTotalStats] = useState({
    totalEarnings: 0,
    totalDeliveries: 0,
    averagePerDay: 0
  })

  // Cargar ganancias iniciales desde la API
  useEffect(() => {
    loadDailyEarnings()
  }, [])

  // Obtener lista de ganancias diarias
  async function loadDailyEarnings() {
    try {
      setLoading(true)
      const params = new URLSearchParams()
      if (dateRange.start) params.append('start_date', dateRange.start)
      if (dateRange.end) params.append('end_date', dateRange.end)
      
      const response = await fetch(`/api/financial/daily-earnings?${params.toString()}`)
      const data = await response.json()
      setRecords(data.records || [])
      
      // Calcular estadísticas totales
      const totalEarnings = data.records.reduce((sum: number, r: DailyEarningRecord) => sum + r.net_earnings, 0)
      const totalDeliveries = data.records.reduce((sum: number, r: DailyEarningRecord) => sum + r.deliveries_count, 0)
      const averagePerDay = data.records.length > 0 ? totalEarnings / data.records.length : 0
      
      setTotalStats({ totalEarnings, totalDeliveries, averagePerDay })
    } catch (error) {
      console.error('Error al cargar ganancias diarias:', error)
    } finally {
      setLoading(false)
    }
  }

  // Exportar reporte a CSV
  function exportToCSV() {
    const headers = ['Fecha', 'Entregas', 'Ganancias', 'Propinas', 'Bonos', 'Deducciones', 'Neto']
    const rows = records.map(r => [
      r.date,
      r.deliveries_count,
      r.total_earnings.toFixed(2),
      r.tips.toFixed(2),
      r.bonuses.toFixed(2),
      r.deductions.toFixed(2),
      r.net_earnings.toFixed(2)
    ])
    
    const csvContent = [headers, ...rows].map(row => row.join(',')).join('\n')
    const blob = new Blob([csvContent], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `ganancias-diarias-${new Date().toISOString().split('T')[0]}.csv`
    link.click()
  }

  // Formato de moneda
  function formatCurrency(amount: number) {
    return new Intl.NumberFormat('es-VE', { style: 'currency', currency: 'USD' }).format(amount)
  }

  if (loading) {
    return <div className="flex items-center justify-center p-8">Cargando ganancias...</div>
  }

  return (
    <div className="bg-white rounded-lg shadow border border-gray-200">
      {/* Header con título y acciones */}
      <div className="flex items-center justify-between p-4 border-b border-gray-200">
        <div className="flex items-center space-x-2">
          <DollarSign className="h-5 w-5 text-green-600" />
          <h3 className="font-semibold text-gray-800">Ganancias Diarias</h3>
        </div>
        <button
          onClick={exportToCSV}
          className="flex items-center space-x-2 bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg transition"
        >
          <Download className="h-4 w-4" />
          <span>Exportar</span>
        </button>
      </div>

      {/* Filtros de fecha */}
      <div className="p-4 border-b border-gray-200 bg-gray-50">
        <div className="flex gap-4 items-end">
          <div className="flex-1">
            <label className="block text-sm font-medium text-gray-700 mb-1">Fecha inicio</label>
            <input
              type="date"
              value={dateRange.start}
              onChange={(e) => setDateRange(prev => ({ ...prev, start: e.target.value }))}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
            />
          </div>
          <div className="flex-1">
            <label className="block text-sm font-medium text-gray-700 mb-1">Fecha fin</label>
            <input
              type="date"
              value={dateRange.end}
              onChange={(e) => setDateRange(prev => ({ ...prev, end: e.target.value }))}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
            />
          </div>
          <button
            onClick={loadDailyEarnings}
            className="flex items-center space-x-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition"
          >
            <Filter className="h-4 w-4" />
            <span>Filtrar</span>
          </button>
        </div>
      </div>

      {/* Estadísticas resumen */}
      <div className="grid grid-cols-3 gap-4 p-4 bg-gray-50 border-b border-gray-200">
        <StatCard
          icon={<DollarSign className="h-5 w-5 text-green-600" />}
          label="Total Ganado"
          value={formatCurrency(totalStats.totalEarnings)}
        />
        <StatCard
          icon={<TrendingUp className="h-5 w-5 text-blue-600" />}
          label="Entregas Totales"
          value={totalStats.totalDeliveries.toString()}
        />
        <StatCard
          icon={<Calendar className="h-5 w-5 text-purple-600" />}
          label="Promedio/Día"
          value={formatCurrency(totalStats.averagePerDay)}
        />
      </div>

      {/* Lista de registros diarios */}
      <div className="divide-y divide-gray-200">
        {records.length === 0 ? (
          <div className="p-8 text-center text-gray-500">
            No hay registros de ganancias en el período seleccionado
          </div>
        ) : (
          records.map((record, index) => (
            <div key={index} className="p-4 hover:bg-gray-50 transition">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <div className="text-left">
                    <div className="font-medium text-gray-900">
                      {new Date(record.date).toLocaleDateString('es-ES', { 
                        weekday: 'long', 
                        year: 'numeric', 
                        month: 'long', 
                        day: 'numeric' 
                      })}
                    </div>
                    <div className="text-sm text-gray-500">
                      {record.deliveries_count} entregas
                    </div>
                  </div>
                </div>
                
                <div className="text-right">
                  <div className="text-lg font-bold text-green-600">
                    {formatCurrency(record.net_earnings)}
                  </div>
                  <div className="text-xs text-gray-500">
                    +{formatCurrency(record.tips)} propinas
                    {record.bonuses > 0 && ` +${formatCurrency(record.bonuses)} bonos`}
                  </div>
                </div>
              </div>
              
              {/* Barra de progreso visual */}
              <div className="mt-2 h-2 bg-gray-200 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-gradient-to-r from-green-500 to-green-600 rounded-full"
                  style={{ 
                    width: `${Math.min(100, (record.net_earnings / Math.max(...records.map(r => r.net_earnings))) * 100)}%` 
                  }}
                />
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  )
}

// Componente para tarjetas de estadísticas
function StatCard({ icon, label, value }: { 
  icon: React.ReactNode
  label: string
  value: string
}) {
  return (
    <div className="bg-white rounded-lg p-4 shadow-sm border border-gray-200">
      <div className="flex items-center space-x-2 mb-2">
        {icon}
        <span className="text-sm text-gray-600">{label}</span>
      </div>
      <div className="text-xl font-bold text-gray-900">{value}</div>
    </div>
  )
}
