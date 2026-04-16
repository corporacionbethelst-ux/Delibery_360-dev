'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Switch } from '@/components/ui/switch'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Webhook, Plus, Trash2, Edit, CheckCircle, XCircle, Copy, ExternalLink } from 'lucide-react'

// Configuración de Webhooks para integraciones con sistemas externos
export default function WebhookConfig() {
  // Lista de webhooks configurados
  const [webhooks, setWebhooks] = useState<any[]>([])
  // Estado del formulario
  const [isEditing, setIsEditing] = useState(false)
  // Webhook seleccionado para edición
  const [editingWebhook, setEditingWebhook] = useState<any | null>(null)
  // Datos del formulario
  const [formData, setFormData] = useState({
    name: '',
    url: '',
    events: [] as string[],
    isActive: true,
    secret: ''
  })
  // URL base del servidor
  const [serverUrl, setServerUrl] = useState('https://api.delivery360.com')
  // Mensaje de notificación
  const [notification, setNotification] = useState<{ type: 'success' | 'error'; message: string } | null>(null)

  // Cargar webhooks al montar el componente
  useEffect(() => {
    loadWebhooks()
  }, [])

  // Cargar lista de webhooks desde la API
  async function loadWebhooks() {
    try {
      // Simular carga de datos
      await new Promise(resolve => setTimeout(resolve, 500))
      const mockWebhooks = [
        {
          id: 'wh_1',
          name: 'Notificaciones de Pedidos',
          url: 'https://erp.example.com/webhooks/orders',
          events: ['order.created', 'order.updated', 'order.delivered'],
          isActive: true,
          secret: 'whsec_***',
          createdAt: '2024-01-15T10:30:00Z',
          lastTriggered: '2024-01-20T14:22:00Z'
        },
        {
          id: 'wh_2',
          name: 'Actualización de Repartidores',
          url: 'https://hr.example.com/api/rider-updates',
          events: ['rider.created', 'rider.status_changed'],
          isActive: false,
          secret: 'whsec_***',
          createdAt: '2024-01-10T08:15:00Z',
          lastTriggered: null
        }
      ]
      setWebhooks(mockWebhooks) // Establecer lista de webhooks
    } catch (error) {
      console.error('Error cargando webhooks:', error)
    }
  }

  // Abrir formulario para nuevo webhook
  function handleNewWebhook() {
    setEditingWebhook(null) // Limpiar webhook en edición
    setFormData({
      name: '',
      url: '',
      events: [],
      isActive: true,
      secret: ''
    })
    setIsEditing(true) // Activar modo edición
  }

  // Abrir formulario para editar webhook existente
  function handleEditWebhook(webhook: any) {
    setEditingWebhook(webhook) // Establecer webhook en edición
    setFormData({
      name: webhook.name,
      url: webhook.url,
      events: webhook.events,
      isActive: webhook.isActive,
      secret: webhook.secret || ''
    })
    setIsEditing(true) // Activar modo edición
  }

  // Actualizar campo del formulario
  function updateFormField(field: string, value: any) {
    setFormData(prev => ({ ...prev, [field]: value })) // Actualizar campo específico
  }

  // Alternar selección de evento
  function toggleEvent(event: string) {
    setFormData(prev => ({
      ...prev,
      events: prev.events.includes(event)
        ? prev.events.filter(e => e !== event) // Remover evento si ya está seleccionado
        : [...prev.events, event] // Agregar evento si no está seleccionado
    }))
  }

  // Guardar webhook (crear o actualizar)
  async function handleSave() {
    try {
      // Validar campos requeridos
      if (!formData.name || !formData.url || formData.events.length === 0) {
        setNotification({ type: 'error', message: 'Complete todos los campos requeridos' })
        return
      }

      // Simular guardado
      await new Promise(resolve => setTimeout(resolve, 1000))

      if (editingWebhook) {
        // Actualizar webhook existente
        setWebhooks(prev => prev.map(wh =>
          wh.id === editingWebhook.id ? { ...wh, ...formData } : wh
        ))
        setNotification({ type: 'success', message: 'Webhook actualizado correctamente' })
      } else {
        // Crear nuevo webhook
        const newWebhook = {
          id: `wh_${Date.now()}`,
          ...formData,
          createdAt: new Date().toISOString(),
          lastTriggered: null
        }
        setWebhooks(prev => [newWebhook, ...prev]) // Agregar nuevo webhook a la lista
        setNotification({ type: 'success', message: 'Webhook creado correctamente' })
      }

      setIsEditing(false) // Cerrar formulario
      setNotification(null) // Limpiar notificación
    } catch (error) {
      console.error('Error guardando webhook:', error)
      setNotification({ type: 'error', message: 'Error al guardar webhook' })
    }
  }

  // Eliminar webhook
  async function handleDelete(id: string) {
    if (!confirm('¿Está seguro de eliminar este webhook?')) return // Confirmar eliminación

    try {
      // Simular eliminación
      await new Promise(resolve => setTimeout(resolve, 500))
      setWebhooks(prev => prev.filter(wh => wh.id !== id)) // Remover webhook de la lista
      setNotification({ type: 'success', message: 'Webhook eliminado correctamente' })
    } catch (error) {
      console.error('Error eliminando webhook:', error)
      setNotification({ type: 'error', message: 'Error al eliminar webhook' })
    }
  }

  // Copiar URL del webhook
  function copyWebhookUrl(url: string) {
    navigator.clipboard.writeText(url) // Copiar URL al portapapeles
    setNotification({ type: 'success', message: 'URL copiada al portapapeles' })
  }

  // Probar webhook (enviar evento de prueba)
  async function testWebhook(webhook: any) {
    try {
      // Simular envío de evento de prueba
      await new Promise(resolve => setTimeout(resolve, 1500))
      setNotification({ type: 'success', message: `Evento de prueba enviado a ${webhook.name}` })
    } catch (error) {
      console.error('Error testeando webhook:', error)
      setNotification({ type: 'error', message: 'Error al enviar evento de prueba' })
    }
  }

  // Eventos disponibles para suscripción
  const availableEvents = [
    { id: 'order.created', label: 'Orden Creada' },
    { id: 'order.updated', label: 'Orden Actualizada' },
    { id: 'order.delivered', label: 'Orden Entregada' },
    { id: 'order.cancelled', label: 'Orden Cancelada' },
    { id: 'rider.created', label: 'Repartidor Registrado' },
    { id: 'rider.status_changed', label: 'Cambio de Estado Repartidor' },
    { id: 'delivery.started', label: 'Entrega Iniciada' },
    { id: 'delivery.completed', label: 'Entrega Completada' },
    { id: 'payment.processed', label: 'Pago Procesado' }
  ]

  return (
    <div className="space-y-6">
      {/* Encabezado */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
          <CardTitle className="text-xl font-semibold flex items-center gap-2">
            <Webhook className="h-5 w-5" />
            Configuración de Webhooks
          </CardTitle>
          <Button onClick={handleNewWebhook}>
            <Plus className="h-4 w-4 mr-2" />
            Nuevo Webhook
          </Button>
        </CardHeader>
        <CardContent>
          <Alert>
            <ExternalLink className="h-4 w-4" />
            <AlertDescription>
              Los webhooks permiten notificar a sistemas externos sobre eventos en tiempo real.
              URL base del servidor: <code className="bg-muted px-2 py-1 rounded">{serverUrl}</code>
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>

      {/* Formulario de Edición */}
      {isEditing && (
        <Card>
          <CardHeader>
            <CardTitle>{editingWebhook ? 'Editar Webhook' : 'Nuevo Webhook'}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Nombre *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => updateFormField('name', e.target.value)}
                placeholder="Ej: Notificaciones ERP"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="url">URL del Endpoint *</Label>
              <Input
                id="url"
                value={formData.url}
                onChange={(e) => updateFormField('url', e.target.value)}
                placeholder="https://tu-sistema.com/webhook"
              />
            </div>
            <div className="space-y-2">
              <Label>Eventos a Suscribirse *</Label>
              <div className="grid grid-cols-2 gap-2">
                {availableEvents.map((event) => (
                  <div key={event.id} className="flex items-center space-x-2">
                    <Switch
                      checked={formData.events.includes(event.id)}
                      onCheckedChange={() => toggleEvent(event.id)}
                    />
                    <Label className="text-sm font-normal cursor-pointer">
                      {event.label}
                    </Label>
                  </div>
                ))}
              </div>
            </div>
            <div className="flex items-center justify-between space-x-2">
              <Label htmlFor="isActive">Estado</Label>
              <Switch
                id="isActive"
                checked={formData.isActive}
                onCheckedChange={(checked) => updateFormField('isActive', checked)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="secret">Secret Key (opcional)</Label>
              <Input
                id="secret"
                type="password"
                value={formData.secret}
                onChange={(e) => updateFormField('secret', e.target.value)}
                placeholder="whsec_xxxxx"
              />
            </div>
            <div className="flex gap-2">
              <Button onClick={handleSave} className="flex-1">
                Guardar
              </Button>
              <Button variant="outline" onClick={() => setIsEditing(false)}>
                Cancelar
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Lista de Webhooks */}
      <Card>
        <CardHeader>
          <CardTitle>Webhooks Configurados</CardTitle>
        </CardHeader>
        <CardContent>
          {webhooks.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-4">
              No hay webhooks configurados
            </p>
          ) : (
            <div className="space-y-4">
              {webhooks.map((webhook) => (
                <div
                  key={webhook.id}
                  className="border rounded-lg p-4 space-y-3"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Badge variant={webhook.isActive ? 'default' : 'secondary'}>
                        {webhook.isActive ? <CheckCircle className="h-3 w-3 mr-1" /> : <XCircle className="h-3 w-3 mr-1" />}
                        {webhook.isActive ? 'Activo' : 'Inactivo'}
                      </Badge>
                      <h3 className="font-semibold">{webhook.name}</h3>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button variant="ghost" size="sm" onClick={() => copyWebhookUrl(webhook.url)}>
                        <Copy className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="sm" onClick={() => testWebhook(webhook)}>
                        Probar
                      </Button>
                      <Button variant="ghost" size="sm" onClick={() => handleEditWebhook(webhook)}>
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="sm" onClick={() => handleDelete(webhook.id)}>
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  </div>
                  <div className="text-sm text-muted-foreground">
                    <p>URL: <code className="bg-muted px-2 py-1 rounded text-xs">{webhook.url}</code></p>
                    <p className="mt-1">
                      Eventos: {webhook.events.map((e: string) => e.split('.').pop()).join(', ')}
                    </p>
                    <p className="mt-1 text-xs">
                      Creado: {new Date(webhook.createdAt).toLocaleDateString()}
                      {webhook.lastTriggered && ` • Última activación: ${new Date(webhook.lastTriggered).toLocaleString()}`}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Notificación */}
      {notification && (
        <Alert variant={notification.type === 'success' ? 'default' : 'destructive'}>
          {notification.type === 'success' ? <CheckCircle className="h-4 w-4" /> : <XCircle className="h-4 w-4" />}
          <AlertDescription>{notification.message}</AlertDescription>
        </Alert>
      )}
    </div>
  )
}
