import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { BarChart, Download, Calendar, TrendingUp, Users, Package } from 'lucide-react';
import { StatsCard } from '@/components/dashboard/StatsCard';

export default function ManagerReportsPage() {
  const [reportType, setReportType] = useState('orders');
  const [period, setPeriod] = useState('month');
  const [loading, setLoading] = useState(false);

  const handleGenerateReport = async () => {
    setLoading(true);
    // Simular generación de reporte
    setTimeout(() => setLoading(false), 1500);
  };

  const handleExport = (format: 'pdf' | 'excel' | 'csv') => {
    alert(`Exportando reporte en formato ${format.toUpperCase()}...`);
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center flex-wrap gap-4">
        <h1 className="text-3xl font-bold text-gray-900">Reportes y Analytics</h1>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => handleExport('excel')}>
            <Download className="w-4 h-4 mr-2" />
            Excel
          </Button>
          <Button variant="outline" onClick={() => handleExport('pdf')}>
            <Download className="w-4 h-4 mr-2" />
            PDF
          </Button>
        </div>
      </div>

      {/* Filtros de Reporte */}
      <Card>
        <CardHeader>
          <CardTitle>Configuración del Reporte</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2">Tipo de Reporte</label>
              <Select value={reportType} onValueChange={setReportType}>
                <SelectTrigger>
                  <SelectValue placeholder="Seleccionar tipo" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="orders">Pedidos</SelectItem>
                  <SelectItem value="deliveries">Entregas</SelectItem>
                  <SelectItem value="riders">Repartidores</SelectItem>
                  <SelectItem value="financial">Financiero</SelectItem>
                  <SelectItem value="productivity">Productividad</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Período</label>
              <Select value={period} onValueChange={setPeriod}>
                <SelectTrigger>
                  <Calendar className="w-4 h-4 mr-2" />
                  <SelectValue placeholder="Seleccionar período" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="today">Hoy</SelectItem>
                  <SelectItem value="week">Esta Semana</SelectItem>
                  <SelectItem value="month">Este Mes</SelectItem>
                  <SelectItem value="quarter">Este Trimestre</SelectItem>
                  <SelectItem value="year">Este Año</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-end">
              <Button 
                className="w-full" 
                onClick={handleGenerateReport}
                disabled={loading}
              >
                <BarChart className="w-4 h-4 mr-2" />
                {loading ? 'Generando...' : 'Generar Reporte'}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Métricas Principales */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatsCard 
          title="Total Pedidos" 
          value="1,234" 
          icon={Package} 
          trend={15.3} 
        />
        <StatsCard 
          title="Tasa de Entrega" 
          value="96.8%" 
          icon={TrendingUp} 
          trend={2.1} 
        />
        <StatsCard 
          title="Repartidores Activos" 
          value="45" 
          icon={Users} 
          trend={8.7} 
        />
        <StatsCard 
          title="Ingresos Totales" 
          value="$12,450" 
          icon={BarChart} 
          trend={12.5} 
        />
      </div>

      {/* Gráficos y Tablas */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Pedidos por Día</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-64 flex items-center justify-center bg-gray-50 rounded">
              <p className="text-gray-500">Gráfico de barras - Pedidos diarios</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Rendimiento por Repartidor</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-64 flex items-center justify-center bg-gray-50 rounded">
              <p className="text-gray-500">Gráfico de rendimiento - Top repartidores</p>
            </div>
          </CardContent>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Detalle de Métricas</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="text-xs text-gray-700 uppercase bg-gray-50">
                  <tr>
                    <th className="px-6 py-3">Métrica</th>
                    <th className="px-6 py-3">Valor Actual</th>
                    <th className="px-6 py-3">Período Anterior</th>
                    <th className="px-6 py-3">Variación</th>
                  </tr>
                </thead>
                <tbody>
                  <tr className="bg-white border-b">
                    <td className="px-6 py-4 font-medium">Pedidos Completados</td>
                    <td className="px-6 py-4">1,198</td>
                    <td className="px-6 py-4">1,045</td>
                    <td className="px-6 py-4 text-green-600">+14.6%</td>
                  </tr>
                  <tr className="bg-white border-b">
                    <td className="px-6 py-4 font-medium">Tiempo Promedio Entrega</td>
                    <td className="px-6 py-4">28 min</td>
                    <td className="px-6 py-4">32 min</td>
                    <td className="px-6 py-4 text-green-600">-12.5%</td>
                  </tr>
                  <tr className="bg-white border-b">
                    <td className="px-6 py-4 font-medium">Satisfacción Cliente</td>
                    <td className="px-6 py-4">4.7/5</td>
                    <td className="px-6 py-4">4.5/5</td>
                    <td className="px-6 py-4 text-green-600">+4.4%</td>
                  </tr>
                  <tr className="bg-white">
                    <td className="px-6 py-4 font-medium">Ingresos Netos</td>
                    <td className="px-6 py-4">$12,450</td>
                    <td className="px-6 py-4">$11,200</td>
                    <td className="px-6 py-4 text-green-600">+11.2%</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
