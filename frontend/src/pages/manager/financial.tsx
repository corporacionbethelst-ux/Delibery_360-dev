import { useState, useEffect } from 'react';
import { useFinancialStore } from '@/stores/financialStore';
import { StatsCard } from '@/components/dashboard/StatsCard';
import { formatCurrency } from '@/lib/financial-utils';
import { DollarSign, TrendingUp, CreditCard, AlertCircle } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

export default function ManagerFinancialPage() {
  const { getDailySummary, getTransactions, transactions, loading } = useFinancialStore();
  const [period, setPeriod] = useState('today');
  const [summary, setSummary] = useState<any>(null);

  useEffect(() => {
    // Simular carga de datos
    const loadData = async () => {
      const data = await getDailySummary(period);
      setSummary(data);
      await getTransactions({ period });
    };
    loadData();
  }, [period]);

  if (loading) return <div className="p-8 text-center">Cargando datos financieros...</div>;

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-gray-900">Gestión Financiera</h1>
        <Select value={period} onValueChange={setPeriod}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Seleccionar período" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="today">Hoy</SelectItem>
            <SelectItem value="week">Esta Semana</SelectItem>
            <SelectItem value="month">Este Mes</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* KPIs Financieros */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatsCard 
          title="Ingresos Totales" 
          value={summary?.totalRevenue ? formatCurrency(summary.totalRevenue) : '$0'} 
          icon={DollarSign} 
          trend={12.5} 
        />
        <StatsCard 
          title="Pagos a Repartidores" 
          value={summary?.riderPayments ? formatCurrency(summary.riderPayments) : '$0'} 
          icon={CreditCard} 
          trend={-5.2} 
          trendDown 
        />
        <StatsCard 
          title="Comisiones Netas" 
          value={summary?.netCommission ? formatCurrency(summary.netCommission) : '$0'} 
          icon={TrendingUp} 
          trend={8.4} 
        />
        <StatsCard 
          title="Pendiente de Pago" 
          value={summary?.pendingPayouts ? formatCurrency(summary.pendingPayouts) : '$0'} 
          icon={AlertCircle} 
          variant="warning"
        />
      </div>

      {/* Tabla de Transacciones Recientes */}
      <Card>
        <CardHeader>
          <CardTitle>Transacciones Recientes</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="text-xs text-gray-700 uppercase bg-gray-50">
                <tr>
                  <th className="px-6 py-3">ID</th>
                  <th className="px-6 py-3">Fecha</th>
                  <th className="px-6 py-3">Tipo</th>
                  <th className="px-6 py-3">Monto</th>
                  <th className="px-6 py-3">Estado</th>
                  <th className="px-6 py-3">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {transactions.length === 0 ? (
                  <tr><td colSpan={6} className="px-6 py-4 text-center">No hay transacciones</td></tr>
                ) : (
                  transactions.map((tx) => (
                    <tr key={tx.id} className="bg-white border-b hover:bg-gray-50">
                      <td className="px-6 py-4 font-medium">{tx.id.slice(0, 8)}</td>
                      <td className="px-6 py-4">{new Date(tx.createdAt).toLocaleDateString()}</td>
                      <td className="px-6 py-4">
                        <span className={`px-2 py-1 rounded text-xs ${
                          tx.type === 'payment' ? 'bg-green-100 text-green-800' : 'bg-blue-100 text-blue-800'
                        }`}>
                          {tx.type === 'payment' ? 'Pago' : 'Reembolso'}
                        </span>
                      </td>
                      <td className="px-6 py-4 font-medium">
                        {formatCurrency(tx.amount)}
                      </td>
                      <td className="px-6 py-4">
                        <span className={`px-2 py-1 rounded text-xs ${
                          tx.status === 'completed' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                        }`}>
                          {tx.status === 'completed' ? 'Completado' : 'Pendiente'}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <Button variant="outline" size="sm">Ver Detalle</Button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
