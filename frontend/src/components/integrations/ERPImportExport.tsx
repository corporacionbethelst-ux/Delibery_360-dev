'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Progress } from '@/components/ui/progress'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Upload, Download, Database, FileSpreadsheet, CheckCircle, AlertCircle, Loader2 } from 'lucide-react'

// Componente para importar/exportar datos con sistemas ERP externos
export default function ERPImportExport() {
  // Estado de operación actual (import/export)
  const [operationType, setOperationType] = useState<'import' | 'export'>('export')
  // Tipo de datos a procesar
  const [dataType, setDataType] = useState<string>('orders')
  // Archivo seleccionado para importación
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  // Progreso de la operación
  const [progress, setProgress] = useState(0)
  // Estado de procesamiento
  const [isProcessing, setIsProcessing] = useState(false)
  // Mensajes de resultado
  const [result, setResult] = useState<{ success: boolean; message: string } | null>(null)
  // Historial de operaciones
  const [history, setHistory] = useState<any[]>([])

  // Manejar selección de archivo para importación
  function handleFileSelect(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0] // Obtener primer archivo seleccionado
    if (file) {
      setSelectedFile(file) // Almacenar archivo en estado
      setResult(null) // Limpiar resultados anteriores
    }
  }

  // Iniciar proceso de importación desde archivo
  async function handleImport() {
    if (!selectedFile) return // Validar que haya archivo seleccionado

    try {
      setIsProcessing(true) // Activar estado de procesamiento
      setProgress(0) // Reiniciar barra de progreso
      setResult(null) // Limpiar resultados previos

      // Simular progreso de importación
      for (let i = 0; i <= 100; i += 10) {
        await new Promise(resolve => setTimeout(resolve, 300))
        setProgress(i) // Actualizar barra de progreso
      }

      console.log('Importando archivo:', selectedFile.name, dataType)
      
      // Registrar operación en historial
      const operation = {
        id: `IMP-${Date.now()}`,
        type: 'import',
        dataType,
        fileName: selectedFile.name,
        timestamp: new Date().toISOString(),
        status: 'success',
        records: Math.floor(Math.random() * 500) + 100
      }
      
      setHistory(prev => [operation, ...prev.slice(0, 9)]) // Agregar al historial
      setResult({ success: true, message: `Importación completada: ${operation.records} registros procesados` })
      setSelectedFile(null) // Limpiar archivo seleccionado
    } catch (error) {
      console.error('Error importando datos:', error)
      setResult({ success: false, message: 'Error durante la importación. Verifique el formato del archivo.' })
    } finally {
      setIsProcessing(false) // Finalizar estado de procesamiento
    }
  }

  // Iniciar proceso de exportación de datos
  async function handleExport() {
    try {
      setIsProcessing(true) // Activar estado de procesamiento
      setProgress(0) // Reiniciar barra de progreso
      setResult(null) // Limpiar resultados previos

      // Simular progreso de exportación
      for (let i = 0; i <= 100; i += 10) {
        await new Promise(resolve => setTimeout(resolve, 200))
        setProgress(i) // Actualizar barra de progreso
      }

      console.log('Exportando datos:', dataType)
      
      // Crear archivo ficticio para descarga
      const blob = new Blob([JSON.stringify({ data: 'mock', type: dataType }, null, 2)], { type: 'application/json' })
      const url = URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = `delivery360_${dataType}_${new Date().toISOString().split('T')[0]}.json`
      link.click()
      URL.revokeObjectURL(url) // Liberar memoria

      // Registrar operación en historial
      const operation = {
        id: `EXP-${Date.now()}`,
        type: 'export',
        dataType,
        timestamp: new Date().toISOString(),
        status: 'success',
        records: Math.floor(Math.random() * 1000) + 200
      }
      
      setHistory(prev => [operation, ...prev.slice(0, 9)]) // Agregar al historial
      setResult({ success: true, message: `Exportación completada: ${operation.records} registros exportados` })
    } catch (error) {
      console.error('Error exportando datos:', error)
      setResult({ success: false, message: 'Error durante la exportación. Intente nuevamente.' })
    } finally {
      setIsProcessing(false) // Finalizar estado de procesamiento
    }
  }

  // Sincronizar datos con ERP externo
  async function handleSync() {
    try {
      setIsProcessing(true) // Activar estado de procesamiento
      setProgress(0) // Reiniciar barra de progreso

      // Simular sincronización bidireccional
      for (let i = 0; i <= 100; i += 5) {
        await new Promise(resolve => setTimeout(resolve, 150))
        setProgress(i) // Actualizar barra de progreso
      }

      console.log('Sincronización completada')
      setResult({ success: true, message: 'Sincronización con ERP completada exitosamente' })
    } catch (error) {
      console.error('Error sincronizando:', error)
      setResult({ success: false, message: 'Error durante la sincronización.' })
    } finally {
      setIsProcessing(false) // Finalizar estado de procesamiento
    }
  }

  return (
    <div className="space-y-6">
      {/* Configuración de Operación */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
          <CardTitle className="text-xl font-semibold flex items-center gap-2">
            <Database className="h-5 w-5" />
            Integración ERP - Importar/Exportar Datos
          </CardTitle>
          <Badge variant="outline">v2.0</Badge>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Selector de Tipo de Operación */}
          <div className="grid grid-cols-2 gap-4">
            <Button
              variant={operationType === 'import' ? 'default' : 'outline'}
              onClick={() => setOperationType('import')}
              className="w-full"
            >
              <Upload className="h-4 w-4 mr-2" />
              Importar
            </Button>
            <Button
              variant={operationType === 'export' ? 'default' : 'outline'}
              onClick={() => setOperationType('export')}
              className="w-full"
            >
              <Download className="h-4 w-4 mr-2" />
              Exportar
            </Button>
          </div>

          {/* Selector de Tipo de Datos */}
          <div className="space-y-2">
            <Label htmlFor="dataType">Tipo de Datos</Label>
            <Select value={dataType} onValueChange={setDataType}>
              <SelectTrigger id="dataType">
                <SelectValue placeholder="Seleccionar tipo de datos" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="orders">Órdenes de Entrega</SelectItem>
                <SelectItem value="customers">Clientes</SelectItem>
                <SelectItem value="products">Productos</SelectItem>
                <SelectItem value="riders">Repartidores</SelectItem>
                <SelectItem value="inventory">Inventario</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Área de Importación */}
          {operationType === 'import' && (
            <div className="space-y-2">
              <Label htmlFor="fileInput">Archivo a Importar (JSON, CSV, XML)</Label>
              <div className="border-2 border-dashed rounded-lg p-6 text-center">
                <input
                  id="fileInput"
                  type="file"
                  accept=".json,.csv,.xml"
                  onChange={handleFileSelect}
                  className="hidden"
                />
                <label htmlFor="fileInput" className="cursor-pointer">
                  <FileSpreadsheet className="h-10 w-10 mx-auto mb-2 text-muted-foreground" />
                  <p className="text-sm text-muted-foreground">
                    {selectedFile ? selectedFile.name : 'Arrastra tu archivo o haz clic para seleccionar'}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Formatos soportados: JSON, CSV, XML
                  </p>
                </label>
              </div>
              <Button
                onClick={handleImport}
                disabled={!selectedFile || isProcessing}
                className="w-full"
              >
                {isProcessing ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Upload className="h-4 w-4 mr-2" />}
                Importar Datos
              </Button>
            </div>
          )}

          {/* Botón de Exportación */}
          {operationType === 'export' && (
            <Button onClick={handleExport} disabled={isProcessing} className="w-full">
              {isProcessing ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Download className="h-4 w-4 mr-2" />}
              Exportar Datos
            </Button>
          )}

          {/* Barra de Progreso */}
          {isProcessing && (
            <div className="space-y-2">
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>Procesando...</span>
                <span>{progress}%</span>
              </div>
              <Progress value={progress} className="w-full" />
            </div>
          )}

          {/* Mensaje de Resultado */}
          {result && (
            <Alert variant={result.success ? 'default' : 'destructive'}>
              {result.success ? <CheckCircle className="h-4 w-4" /> : <AlertCircle className="h-4 w-4" />}
              <AlertDescription>{result.message}</AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>

      {/* Sincronización Rápida */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <RefreshCw className="h-5 w-5" />
            Sincronización Bidireccional
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground mb-4">
            Sincroniza automáticamente todos los datos con el sistema ERP conectado
          </p>
          <Button onClick={handleSync} disabled={isProcessing} className="w-full">
            {isProcessing ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <RefreshCw className="h-4 w-4 mr-2" />}
            Sincronizar Ahora
          </Button>
        </CardContent>
      </Card>

      {/* Historial de Operaciones */}
      <Card>
        <CardHeader>
          <CardTitle>Historial de Operaciones</CardTitle>
        </CardHeader>
        <CardContent>
          {history.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-4">
              No hay operaciones recientes
            </p>
          ) : (
            <div className="space-y-2">
              {history.map((op) => (
                <div
                  key={op.id}
                  className="flex items-center justify-between p-3 border rounded-lg"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <Badge variant={op.type === 'import' ? 'default' : 'secondary'}>
                        {op.type === 'import' ? 'IMPORT' : 'EXPORT'}
                      </Badge>
                      <p className="text-sm font-medium">{op.id}</p>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {op.dataType} • {new Date(op.timestamp).toLocaleString()}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-semibold">{op.records} registros</p>
                    <Badge variant="outline" className="mt-1">
                      {op.status === 'success' ? 'Completado' : 'Fallido'}
                    </Badge>
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
