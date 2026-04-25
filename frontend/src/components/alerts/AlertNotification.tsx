'use client'

import { useState, useEffect } from 'react'
import { Bell, X, AlertTriangle, AlertCircle, Info, Clock, ShieldAlert, MapPinOff } from 'lucide-react'
import type { Alert, AlertType, AlertSeverity } from '@/types/alerts';

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
      // Ajusta la URL según tu backend real
      const response = await fetch('/api/alerts?status=ACTIVA&limit=5')
      const data = await response.json()
      // Asegúrate de que la API devuelva un array o una propiedad 'alerts'
      setAlerts(Array.isArray(data) ? data : (data.alerts || []))
    } catch (error) {
      console.error('Error al cargar alertas:', error)
    }
  }

  // Marcar alerta como leída (o resolver)
  async function markAsRead(alertId: string) {
    try {
      await fetch(`/api/alerts/${alertId}/read`, { method: 'POST' })
      setAlerts(prev => prev.filter(a => a.id !== alertId))
    } catch (error) {
      console.error('Error al marcar alerta como leída:', error)
    }
  }

  // Eliminar alerta individual (Descartar)
  function dismissAlert(alertId: string) {
    setAlerts(prev => prev.filter(a => a.id !== alertId))
  }

  // Ocultar panel de notificaciones
  function hidePanel() {
    setVisible(false)
  }

  // Obtener ícono según la SEVERIDAD o el TIPO de alerta
  // Corregido: Usamos lógica basada en los valores reales de AlertSeverity o palabras clave en AlertType
  function getAlertIcon(severity: AlertSeverity, type: AlertType) {
    // Prioridad 1: Icono por Severidad
    if (severity === 'CRITICA') {
      return <AlertTriangle className="h-5 w-5 text-red-600" />
    }
    if (severity === 'ALTA') {
      return <AlertCircle className="h-5 w-5 text-orange-600" />
    }

    // Prioridad 2: Icono específico por tipo (si la severidad es baja/media)
    if (type.includes('SEGURIDAD') || type.includes('DELITO')) {
      return <ShieldAlert className="h-5 w-5 text-purple-600" />
    }
    if (type.includes('DESVIDA') || type.includes('RUTA')) {
      return <MapPinOff className="h-5 w-5 text-yellow-600" />
    }
    if (type.includes('RETRASO') || type.includes('TIEMPO')) {
      return <Clock className="h-5 w-5 text-blue-600" />
    }

    // Default
    return <Info className="h-5 w-5 text-blue-500" />
  }

  // Helper para colores de borde según severidad
  function getBorderClass(severity: AlertSeverity) {
    switch (severity) {
      case 'CRITICA': return 'border-l-red-500 bg-red-50'
      case 'ALTA': return 'border-l-orange-500 bg-orange-50'
      case 'MEDIA': return 'border-l-yellow-500 bg-yellow-50'
      case 'BAJA': return 'border-l-blue-500 bg-blue-50'
      default: return 'border-l-gray-500 bg-white'
    }
  }

  if (!visible || alerts.length === 0) return null

  return (
    <div className="fixed top-4 right-4 z-50 w-96 bg-white rounded-lg shadow-xl border border-gray-200 overflow-hidden">
      {/* Header con título y botón cerrar */}
      <div className="flex items-center justify-between p-4 bg-gray-50 border-b border-gray-200">
        <div className="flex items-center space-x-2">
          <Bell className="h-5 w-5 text-gray-700" />
          <h3 className="font-semibold text-gray-800">Notificaciones</h3>
          {alerts.length > 0 && (
            <span className="bg-red-600 text-white text-xs font-bold px-2 py-0.5 rounded-full">
              {alerts.length}
            </span>
          )}
        </div>
        <button
          onClick={hidePanel}
          className="text-gray-400 hover:text-gray-600 transition p-1 rounded-md hover:bg-gray-200"
          aria-label="Cerrar notificaciones"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      {/* Lista de alertas */}
      <div className="max-h-[60vh] overflow-y-auto">
        {alerts.map((alert) => (
          <div
            key={alert.id}
            className={`p-4 border-b border-gray-100 hover:bg-gray-50 transition border-l-4 ${getBorderClass(alert.severity)}`}
          >
            <div className="flex items-start space-x-3">
              {/* Icono dinámico */}
              <div className="flex-shrink-0 mt-0.5">
                {getAlertIcon(alert.severity, alert.type)}
              </div>
              
              <div className="flex-1 min-w-0">
                <div className="flex justify-between items-start">
                  <h4 className="font-medium text-gray-900 text-sm truncate pr-2">
                    {alert.title}
                  </h4>
                </div>
                
                <p className="text-gray-600 text-xs mt-1 line-clamp-2">
                  {alert.message}
                </p>
                
                <div className="flex items-center justify-between mt-2">
                  <p className="text-gray-400 text-[10px]">
                    {new Date(alert.createdAt).toLocaleString('es-ES', { 
                      hour: '2-digit', 
                      minute: '2-digit',
                      day: 'numeric',
                      month: 'short'
                    })}
                  </p>
                  
                  <div className="flex space-x-2">
                    <button
                      onClick={() => markAsRead(alert.id)}
                      className="text-blue-600 hover:text-blue-800 text-xs font-medium px-2 py-1 bg-blue-50 rounded hover:bg-blue-100 transition"
                    >
                      Leer
                    </button>
                    <button
                      onClick={() => dismissAlert(alert.id)}
                      className="text-gray-400 hover:text-gray-600 p-1 rounded hover:bg-gray-200 transition"
                      aria-label="Descartar"
                    >
                      <X className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
      
      {/* Footer opcional si hay muchas alertas */}
      {alerts.length >= 5 && (
        <div className="p-2 bg-gray-50 text-center border-t border-gray-200">
          <button className="text-xs text-blue-600 hover:text-blue-800 font-medium">
            Ver todas las notificaciones
          </button>
        </div>
      )}
    </div>
  )
}