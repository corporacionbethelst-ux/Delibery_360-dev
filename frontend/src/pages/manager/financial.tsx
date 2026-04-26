"use client";

import { useState, useEffect } from 'react';
import { useFinancialStore } from '@/stores/financialStore';
import { formatCurrency } from '@/lib/financial-utils';
import { DollarSign, TrendingUp, CreditCard, AlertCircle } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
// Importamos el componente compartido correcto
import { StatsCard } from '@/components/dashboard/StatsCards'; 
import type { Transaction } from '@/types/financial';

export default function ManagerFinancialPage() {
  const { getFinancialReport, getTransactions, report, transactions, loading } = useFinancialStore();
  const [period, setPeriod] = useState('month');

  useEffect(() => {
    const loadData = async () => {
      const now = new Date();
      let start = new Date();
      
      if (period === 'today') start.setHours(0,0,0,0);
      if (period === 'week') start.setDate(now.getDate() - 7);
      if (period === 'month') start.setDate(1);

      await getFinancialReport({ dateFrom: start, dateTo: now });
      await getTransactions({ dateFrom: start, dateTo: now });
    };
    loadData();
  }, [period, getFinancialReport, getTransactions]);

  if (loading) return <div className="p-8 text-center">Cargando datos financieros...</div>;

  // Valores seguros con fallback a 0
  const totalRevenue = report?.totalRevenue || 0;
  const riderPayments = report?.totalRiderPayments || 0;
  const netProfit = report?.netProfit || 0;
  const pendingPayouts = 0; 

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

      {/* KPIs Financieros usando StatsCard compartido */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatsCard 
          title="Ingresos Totales" 
          value={formatCurrency(totalRevenue)} 
          icon={<DollarSign className="h-4 w-4 text-muted-foreground" />}
          trend={{ value: 12.5, label: 'vs mes anterior' }}
        />
        <StatsCard 
          title="Pagos a Repartidores" 
          value={formatCurrency(riderPayments)} 
          icon={<CreditCard className="h-4 w-4 text-muted-foreground" />}
          trend={{ value: -5.2, label: 'vs mes anterior' }}
        />
        <StatsCard 
          title="Beneficio Neto" 
          value={formatCurrency(netProfit)} 
          icon={<TrendingUp className="h-4 w-4 text-muted-foreground" />}
          trend={{ value: 8.4, label: 'vs mes anterior' }}
        />
        <StatsCard 
          title="Pendiente de Pago" 
          value={formatCurrency(pendingPayouts)} 
          icon={<AlertCircle className="h-4 w-4 text-muted-foreground" />}
          description="Requiere atención"
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
                  transactions.map((tx: Transaction) => (
                    <tr key={tx.id} className="bg-white border-b hover:bg-gray-50">
                      <td className="px-6 py-4 font-medium">{tx.id.slice(0, 8)}</td>
                      <td className="px-6 py-4">{new Date(tx.createdAt).toLocaleDateString()}</td>
                      <td className="px-6 py-4">
                        <Badge variant="outline">
                          {tx.type.replace('_', ' ')}
                        </Badge>
                      </td>
                      <td className="px-6 py-4 font-medium">
                        {formatCurrency(tx.amount)}
                      </td>
                      <td className="px-6 py-4">
                        <Badge variant={tx.status === 'PAGADO' ? 'default' : 'secondary'}>
                          {tx.status}
                        </Badge>
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