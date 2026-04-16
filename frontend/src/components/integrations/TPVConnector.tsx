'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Switch } from '@/components/ui/switch'
import { CheckCircle2, XCircle, RefreshCw, Settings, CreditCard } from 'lucide-react'

// Conector de Terminal Punto de Venta (TPV) para pagos con tarjeta
export default function TPVConnector() {
  // Estado de conexión con el TPV
  const [isConnected, setIsConnected] = useState(false)
  // Estado de carga para operaciones
  const [isLoading, setIsLoading] = useState(false)
  // Configuración del TPV
  const [config, setConfig] = useState({
    terminalId: '',
    merchantId: '',
    apiKey: '',
    autoConnect: false,
    timeout: 30
  })
  // Historial de transacciones recientes
  const [transactions, setTransactions] = useState<any[]>([])

  // Verificar conexión al montar el componente
  useEffect(() => {
    checkConnection()
  }, [])

  // Verificar estado de conexión con el TPV
  async function checkConnection() {
    try {
      setIsLoading(true)
      // Simular verificación de conexión
      await new Promise(resolve => setTimeout(resolve, 1000))
      setIsConnected(true)
    } catch (error) {
      console.error('Error verificando conexión TPV:', error)
      setIsConnected(false)
    } finally {
      setIsLoading(false)
    }
  }

  // Conectar con el terminal TPV
  async function connectTPV() {
    try {
      setIsLoading(true)
      // Simular conexión con el terminal
      await new Promise(resolve => setTimeout(resolve, 1500))
      setIsConnected(true)
    } catch (error) {
      console.error('Error conectando TPV:', error)
    } finally {
      setIsLoading(false)
    }
  }

  // Desconectar del terminal TPV
  async function disconnectTPV() {
    try {
      setIsLoading(true)
      // Simular desconexión
      await new Promise(resolve => setTimeout(resolve, 500))
      setIsConnected(false)
    } catch (error) {
      console.error('Error desconectando TPV:', error)
    } finally {
      setIsLoading(false)
    }
  }

  // Actualizar configuración del TPV
  function updateConfig(key: string, value: any) {
    setConfig(prev => ({ ...prev, [key]: value })) // Actualizar campo específico de la configuración
  }

  // Guardar configuración del TPV
  async function saveConfig() {
    try {
      setIsLoading(true)
      // Simular guardado de configuración
      await new Promise(resolve => setTimeout(resolve, 1000))
      console.log('Configuración guardada:', config)
    } catch (error) {
      console.error('Error guardando configuración:', error)
    } finally {
      setIsLoading(false)
    }
  }

  // Procesar pago a través del TPV
  async function processPayment(amount: number, orderId: string) {
    try {
      setIsLoading(true)
      // Simular procesamiento de pago
      await new Promise(resolve => setTimeout(resolve, 2000))
      
      const transaction = {
        id: `TXN-${Date.now()}`,
        amount,
        orderId,
        status: 'approved',
        timestamp: new Date().toISOString(),
        method: 'credit_card'
      }
      
      setTransactions(prev => [transaction, ...prev.slice(0, 9)]) // Agregar transacción al historial
      return transaction
    } catch (error) {
      console.error('Error procesando pago:', error)
      throw error
    } finally {
      setIsLoading(false)
    }
  }

  // Reembolsar transacción
  async function refundTransaction(transactionId: string) {
    try {
      setIsLoading(true)
      // Simular proceso de reembolso
      await new Promise(resolve => setTimeout(resolve, 1500))
      console.log('Reembolso procesado:', transactionId)
    } catch (error) {
      console.error('Error procesando reembolso:', error)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* Estado de Conexión */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
          <CardTitle className="text-xl font-semibold flex items-center gap-2">
            <CreditCard className="h-5 w-5" />
            Conector TPV - Pagos con Tarjeta
          </CardTitle>
          <Badge variant={isConnected ? 'default' : 'destructive'} className="flex items-center gap-1">
            {isConnected ? <CheckCircle2 className="h-3 w-3" /> : <XCircle className="h-3 w-3" />}
            {isConnected ? 'Conectado' : 'Desconectado'}
          </Badge>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">Estado del terminal</p>
              <p className="text-xs text-muted-foreground">
                {isConnected ? 'Terminal listo para procesar pagos' : 'Terminal no disponible'}
              </p>
            </div>
            <Button
              onClick={isConnected ? disconnectTPV : connectTPV}
              disabled={isLoading}
              variant={isConnected ? 'outline' : 'default'}
            >
              {isLoading ? (
                <RefreshCw className="h-4 w-4 animate-spin mr-2" />
              ) : (
                <Settings className="h-4 w-4 mr-2" />
              )}
              {isConnected ? 'Desconectar' : 'Conectar'}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Configuración del TPV */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            Configuración del Terminal
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="terminalId">ID del Terminal</Label>
              <Input
                id="terminalId"
                value={config.terminalId}
                onChange={(e) => updateConfig('terminalId', e.target.value)}
                placeholder="Ej: TPV-001"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="merchantId">ID del Comercio</Label>
              <Input
                id="merchantId"
                value={config.merchantId}
                onChange={(e) => updateConfig('merchantId', e.target.value)}
                placeholder="Ej: MERCH-12345"
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="apiKey">API Key</Label>
            <Input
              id="apiKey"
              type="password"
              value={config.apiKey}
              onChange={(e) => updateConfig('apiKey', e.target.value)}
              placeholder="••••••••••••••••"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="flex items-center justify-between space-x-2">
              <Label htmlFor="autoConnect">Conexión Automática</Label>
              <Switch
                id="autoConnect"
                checked={config.autoConnect}
                onCheckedChange={(checked) => updateConfig('autoConnect', checked)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="timeout">Timeout (segundos)</Label>
              <Input
                id="timeout"
                type="number"
                value={config.timeout}
                onChange={(e) => updateConfig('timeout', parseInt(e.target.value))}
              />
            </div>
          </div>
          <Button onClick={saveConfig} disabled={isLoading} className="w-full">
            {isLoading ? <RefreshCw className="h-4 w-4 animate-spin mr-2" /> : null}
            Guardar Configuración
          </Button>
        </CardContent>
      </Card>

      {/* Transacciones Recientes */}
      <Card>
        <CardHeader>
          <CardTitle>Transacciones Recientes</CardTitle>
        </CardHeader>
        <CardContent>
          {transactions.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-4">
              No hay transacciones recientes
            </p>
          ) : (
            <div className="space-y-2">
              {transactions.map((txn) => (
                <div
                  key={txn.id}
                  className="flex items-center justify-between p-3 border rounded-lg"
                >
                  <div className="space-y-1">
                    <p className="text-sm font-medium">{txn.id}</p>
                    <p className="text-xs text-muted-foreground">
                      Orden: {txn.orderId} • {new Date(txn.timestamp).toLocaleString()}
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <Badge variant={txn.status === 'approved' ? 'default' : 'destructive'}>
                      {txn.status === 'approved' ? 'Aprobado' : 'Rechazado'}
                    </Badge>
                    <p className="text-sm font-semibold">${txn.amount.toFixed(2)}</p>
                    {txn.status === 'approved' && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => refundTransaction(txn.id)}
                        disabled={isLoading}
                      >
                        Reembolsar
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
