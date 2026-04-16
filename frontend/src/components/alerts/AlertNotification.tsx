'use client'

import { useState, useEffect } from 'react'
import { Bell, X, AlertTriangle, AlertCircle, Info } from 'lucide-react'
import type { Alert, AlertType } from '@/types/alerts';

// Componente para mostrar notificaciones de alertas en tiempo real
export default function AlertNotification() {
  const [alerts, setAlerts] = useState<Alert[]>([])
  const [visible, setVisible] = useState(true)

  // Cargar alertas iniciales desde la API
  useEffect(() => {
    loadAlerts()
    const interval = setInterval(loadAlerts, 30000) // Actualizar cada 30 segundos
    return () => clearInterval(interval)
  }, [])

  // Obtener lista de alertas no leídas
  async function loadAlerts() {
    try {
      const response = await fetch('/api/alerts?unread=true&limit=5')
      const data = await response.json()
      setAlerts(data.alerts || [])
    } catch (error) {
      console.error('Error al cargar alertas:', error)
    }
  }

  // Marcar alerta como leída
  async function markAsRead(alertId: string) {
    try {
      await fetch(`/api/alerts/${alertId}/read`, { method: 'POST' })
      setAlerts(prev => prev.filter(a => a.id !== alertId))
    } catch (error) {
      console.error('Error al marcar alerta como leída:', error)
    }
  }

  // Eliminar alerta individual
  function dismissAlert(alertId: string) {
    setAlerts(prev => prev.filter(a => a.id !== alertId))
  }

  // Ocultar panel de notificaciones
  function hidePanel() {
    setVisible(false)
  }

  // Obtener ícono según tipo de alerta
  function getAlertIcon(type: AlertType) {
    switch (type) {
      case 'critical':
        return <AlertTriangle className="h-5 w-5 text-red-500" />
      case 'warning':
        return <AlertCircle className="h-5 w-5 text-yellow-500" />
      default:
        return <Info className="h-5 w-5 text-blue-500" />
    }
  }

  if (!visible || alerts.length === 0) return null

  return (
    <div className="fixed top-4 right-4 z-50 w-96 bg-white rounded-lg shadow-lg border border-gray-200">
      {/* Header con título y botón cerrar */}
      <div className="flex items-center justify-between p-4 border-b border-gray-200">
        <div className="flex items-center space-x-2">
          <Bell className="h-5 w-5 text-gray-600" />
          <h3 className="font-semibold text-gray-800">Notificaciones</h3>
          {alerts.length > 0 && (
            <span className="bg-red-500 text-white text-xs px-2 py-1 rounded-full">
              {alerts.length}
            </span>
          )}
        </div>
        <button
          onClick={hidePanel}
          className="text-gray-400 hover:text-gray-600 transition"
        >
          <X className="h-5 w-5" />
        </button>
      </div>

      {/* Lista de alertas */}
      <div className="max-h-96 overflow-y-auto">
        {alerts.map((alert) => (
          <div
            key={alert.id}
            className="p-4 border-b border-gray-100 hover:bg-gray-50 transition"
          >
            <div className="flex items-start space-x-3">
              {getAlertIcon(alert.type)}
              <div className="flex-1">
                <h4 className="font-medium text-gray-800 text-sm">{alert.title}</h4>
                <p className="text-gray-600 text-xs mt-1">{alert.message}</p>
                <p className="text-gray-400 text-xs mt-2">
                  {new Date(alert.created_at).toLocaleString()}
                </p>
              </div>
              <div className="flex space-x-2">
                <button
                  onClick={() => markAsRead(alert.id)}
                  className="text-blue-600 hover:text-blue-800 text-xs"
                >
                  Leer
                </button>
                <button
                  onClick={() => dismissAlert(alert.id)}
                  className="text-gray-400 hover:text-gray-600 text-xs"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
