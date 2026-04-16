'use client'

import { useState, useEffect } from 'react'
import { FileText, User, Clock, Search, Filter, Download } from 'lucide-react'

// Tipo para registros de auditoría
interface AuditLog {
  id: string
  user_id: string
  user_name: string
  action: string
  resource: string
  timestamp: string
  ip_address: string
  details?: Record<string, unknown>
}

// Componente para mostrar tabla de logs de auditoría con filtros y exportación
export default function AuditLogTable() {
  const [logs, setLogs] = useState<AuditLog[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [filterAction, setFilterAction] = useState('all')

  // Cargar logs iniciales desde la API
  useEffect(() => {
    loadAuditLogs()
  }, [])

  // Obtener lista de logs de auditoría
  async function loadAuditLogs() {
    try {
      setLoading(true)
      const response = await fetch('/api/audit/logs?limit=100')
      const data = await response.json()
      setLogs(data.logs || [])
    } catch (error) {
      console.error('Error al cargar logs de auditoría:', error)
    } finally {
      setLoading(false)
    }
  }

  // Filtrar logs según búsqueda y filtro de acción
  function filteredLogs() {
    return logs.filter(log => {
      const matchesSearch = 
        log.user_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        log.resource.toLowerCase().includes(searchTerm.toLowerCase())
      const matchesAction = filterAction === 'all' || log.action === filterAction
      return matchesSearch && matchesAction
    })
  }

  // Exportar logs a CSV
  function exportToCSV() {
    const headers = ['Fecha', 'Usuario', 'Acción', 'Recurso', 'IP', 'Detalles']
    const rows = filteredLogs().map(log => [
      new Date(log.timestamp).toLocaleString(),
      log.user_name,
      log.action,
      log.resource,
      log.ip_address,
      JSON.stringify(log.details || {})
    ])
    
    const csvContent = [headers, ...rows].map(row => row.join(',')).join('\n')
    const blob = new Blob([csvContent], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `audit-logs-${new Date().toISOString().split('T')[0]}.csv`
    link.click()
  }

  if (loading) {
    return <div className="flex items-center justify-center p-8">Cargando logs...</div>
  }

  return (
    <div className="bg-white rounded-lg shadow border border-gray-200">
      {/* Header con título y acciones */}
      <div className="flex items-center justify-between p-4 border-b border-gray-200">
        <div className="flex items-center space-x-2">
          <FileText className="h-5 w-5 text-gray-600" />
          <h3 className="font-semibold text-gray-800">Registro de Auditoría</h3>
        </div>
        <button
          onClick={exportToCSV}
          className="flex items-center space-x-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition"
        >
          <Download className="h-4 w-4" />
          <span>Exportar CSV</span>
        </button>
      </div>

      {/* Filtros y búsqueda */}
      <div className="p-4 border-b border-gray-200 bg-gray-50">
        <div className="flex gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="Buscar por usuario o recurso..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          <div className="relative">
            <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <select
              value={filterAction}
              onChange={(e) => setFilterAction(e.target.value)}
              className="pl-10 pr-8 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent appearance-none"
            >
              <option value="all">Todas las acciones</option>
              <option value="create">Crear</option>
              <option value="update">Actualizar</option>
              <option value="delete">Eliminar</option>
              <option value="login">Inicio de sesión</option>
              <option value="logout">Cierre de sesión</option>
            </select>
          </div>
        </div>
      </div>

      {/* Tabla de logs */}
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Fecha</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Usuario</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Acción</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Recurso</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">IP</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Detalles</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {filteredLogs().length === 0 ? (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-gray-500">
                  No se encontraron registros de auditoría
                </td>
              </tr>
            ) : (
              filteredLogs().map((log) => (
                <tr key={log.id} className="hover:bg-gray-50 transition">
                  <td className="px-4 py-3 text-sm text-gray-900">
                    <div className="flex items-center space-x-2">
                      <Clock className="h-4 w-4 text-gray-400" />
                      <span>{new Date(log.timestamp).toLocaleString()}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-sm">
                    <div className="flex items-center space-x-2">
                      <User className="h-4 w-4 text-gray-400" />
                      <span className="text-gray-900">{log.user_name}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-sm">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      log.action === 'create' ? 'bg-green-100 text-green-800' :
                      log.action === 'update' ? 'bg-blue-100 text-blue-800' :
                      log.action === 'delete' ? 'bg-red-100 text-red-800' :
                      'bg-gray-100 text-gray-800'
                    }`}>
                      {log.action}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-900">{log.resource}</td>
                  <td className="px-4 py-3 text-sm text-gray-500 font-mono">{log.ip_address}</td>
                  <td className="px-4 py-3 text-sm text-gray-500 max-w-xs truncate">
                    {log.details ? JSON.stringify(log.details) : '-'}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
