'use client'

import { useState, useEffect } from 'react'
import { Clock, User, Monitor, Search, Filter, Calendar } from 'lucide-react'

// Tipo para registros de historial de acceso
interface AccessRecord {
  id: string
  user_id: string
  user_name: string
  user_email: string
  action: 'login' | 'logout' | 'failed_login'
  timestamp: string
  ip_address: string
  user_agent: string
  location?: string
}

// Componente para mostrar historial de accesos con filtros avanzados
export default function AccessHistory() {
  const [records, setRecords] = useState<AccessRecord[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [filterAction, setFilterAction] = useState('all')
  const [dateRange, setDateRange] = useState({ start: '', end: '' })

  // Cargar historial inicial desde la API
  useEffect(() => {
    loadAccessHistory()
  }, [])

  // Obtener lista de registros de acceso
  async function loadAccessHistory() {
    try {
      setLoading(true)
      const params = new URLSearchParams({ limit: '100' })
      if (dateRange.start) params.append('start_date', dateRange.start)
      if (dateRange.end) params.append('end_date', dateRange.end)
      
      const response = await fetch(`/api/audit/access?${params.toString()}`)
      const data = await response.json()
      setRecords(data.records || [])
    } catch (error) {
      console.error('Error al cargar historial de accesos:', error)
    } finally {
      setLoading(false)
    }
  }

  // Filtrar registros según criterios de búsqueda
  function filteredRecords() {
    return records.filter(record => {
      const matchesSearch = 
        record.user_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        record.user_email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        record.ip_address.includes(searchTerm)
      const matchesAction = filterAction === 'all' || record.action === filterAction
      
      let matchesDate = true
      if (dateRange.start) {
        matchesDate = matchesDate && new Date(record.timestamp) >= new Date(dateRange.start)
      }
      if (dateRange.end) {
        matchesDate = matchesDate && new Date(record.timestamp) <= new Date(dateRange.end)
      }
      
      return matchesSearch && matchesAction && matchesDate
    })
  }

  // Obtener color según tipo de acción
  function getActionColor(action: string) {
    switch (action) {
      case 'login': return 'bg-green-100 text-green-800'
      case 'logout': return 'bg-gray-100 text-gray-800'
      case 'failed_login': return 'bg-red-100 text-red-800'
      default: return 'bg-blue-100 text-blue-800'
    }
  }

  // Obtener ícono según tipo de acción
  function getActionIcon(action: string) {
    switch (action) {
      case 'login': return '🔓'
      case 'logout': return '🔒'
      case 'failed_login': return '⚠️'
      default: return '📝'
    }
  }

  if (loading) {
    return <div className="flex items-center justify-center p-8">Cargando historial...</div>
  }

  return (
    <div className="bg-white rounded-lg shadow border border-gray-200">
      {/* Header con título */}
      <div className="flex items-center justify-between p-4 border-b border-gray-200">
        <div className="flex items-center space-x-2">
          <Clock className="h-5 w-5 text-gray-600" />
          <h3 className="font-semibold text-gray-800">Historial de Accesos</h3>
        </div>
        <button
          onClick={loadAccessHistory}
          className="text-blue-600 hover:text-blue-800 text-sm font-medium"
        >
          Actualizar
        </button>
      </div>

      {/* Filtros avanzados */}
      <div className="p-4 border-b border-gray-200 bg-gray-50">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {/* Búsqueda por usuario */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="Buscar usuario o IP..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          
          {/* Filtro por acción */}
          <div className="relative">
            <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <select
              value={filterAction}
              onChange={(e) => setFilterAction(e.target.value)}
              className="w-full pl-10 pr-8 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent appearance-none"
            >
              <option value="all">Todas las acciones</option>
              <option value="login">Inicios de sesión</option>
              <option value="logout">Cierres de sesión</option>
              <option value="failed_login">Intentos fallidos</option>
            </select>
          </div>
          
          {/* Fecha inicio */}
          <div className="relative">
            <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="date"
              value={dateRange.start}
              onChange={(e) => setDateRange(prev => ({ ...prev, start: e.target.value }))}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          
          {/* Fecha fin */}
          <div className="relative">
            <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="date"
              value={dateRange.end}
              onChange={(e) => setDateRange(prev => ({ ...prev, end: e.target.value }))}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
        </div>
      </div>

      {/* Lista de registros */}
      <div className="divide-y divide-gray-200">
        {filteredRecords().length === 0 ? (
          <div className="p-8 text-center text-gray-500">
            No se encontraron registros de acceso
          </div>
        ) : (
          filteredRecords().map((record) => (
            <div key={record.id} className="p-4 hover:bg-gray-50 transition">
              <div className="flex items-start justify-between">
                <div className="flex items-start space-x-3 flex-1">
                  {/* Ícono de acción */}
                  <div className="text-2xl">{getActionIcon(record.action)}</div>
                  
                  {/* Información del usuario */}
                  <div className="flex-1">
                    <div className="flex items-center space-x-2 mb-1">
                      <User className="h-4 w-4 text-gray-400" />
                      <span className="font-medium text-gray-900">{record.user_name}</span>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getActionColor(record.action)}`}>
                        {record.action === 'login' ? 'Inicio de sesión' : 
                         record.action === 'logout' ? 'Cierre de sesión' : 'Intento fallido'}
                      </span>
                    </div>
                    <p className="text-sm text-gray-600">{record.user_email}</p>
                    <div className="flex items-center space-x-4 mt-2 text-xs text-gray-500">
                      <div className="flex items-center space-x-1">
                        <Monitor className="h-3 w-3" />
                        <span className="font-mono">{record.ip_address}</span>
                      </div>
                      {record.location && (
                        <span>📍 {record.location}</span>
                      )}
                    </div>
                  </div>
                </div>
                
                {/* Timestamp */}
                <div className="text-sm text-gray-500 text-right">
                  <div className="flex items-center space-x-1 justify-end">
                    <Clock className="h-3 w-3" />
                    <span>{new Date(record.timestamp).toLocaleDateString()}</span>
                  </div>
                  <span className="text-xs">{new Date(record.timestamp).toLocaleTimeString()}</span>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  )
}
