import { useState, useEffect } from 'react';
import { useAuthStore } from '@/stores/authStore';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Wallet, TrendingUp, DollarSign, Calendar } from 'lucide-react';
import { formatCurrency } from '@/lib/financial-utils';

export default function RiderEarningsPage() {
  const { user } = useAuthStore();
  const [period, setPeriod] = useState('week');
  const [earnings, setEarnings] = useState({
    total: 0,
    completedDeliveries: 0,
    tips: 0,
    bonuses: 0,
    pendingPayout: 0,
  });

  useEffect(() => {
    // Simular carga de datos de ganancias
    setEarnings({
      total: 1250.50,
      completedDeliveries: 45,
      tips: 180.00,
      bonuses: 75.00,
      pendingPayout: 320.50,
    });
  }, [period]);

  const handleRequestPayout = () => {
    alert(`Solicitando retiro de R$ ${earnings.pendingPayout.toFixed(2)}`);
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-gray-900">Mis Ganancias</h1>
        <select
          value={period}
          onChange={(e) => setPeriod(e.target.value)}
          className="border rounded-md px-3 py-2 bg-white"
        >
          <option value="today">Hoy</option>
          <option value="week">Esta Semana</option>
          <option value="month">Este Mes</option>
        </select>
      </div>

      {/* Tarjeta Principal de Ganancias */}
      <Card className="bg-gradient-to-r from-green-600 to-green-700 text-white">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Wallet className="w-6 h-6" />
            Ganancias Totales
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-5xl font-bold">{formatCurrency(earnings.total)}</div>
          <p className="text-green-100 mt-2">
            {earnings.completedDeliveries} entregas completadas en este período
          </p>
        </CardContent>
      </Card>

      {/* Desglose de Ganancias */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-blue-100 rounded-full">
                <DollarSign className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <div className="text-sm text-gray-500">Entregas</div>
                <div className="text-2xl font-bold">{formatCurrency(earnings.total - earnings.tips - earnings.bonuses)}</div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-yellow-100 rounded-full">
                <TrendingUp className="w-6 h-6 text-yellow-600" />
              </div>
              <div>
                <div className="text-sm text-gray-500">Propinas</div>
                <div className="text-2xl font-bold">{formatCurrency(earnings.tips)}</div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-purple-100 rounded-full">
                <Calendar className="w-6 h-6 text-purple-600" />
              </div>
              <div>
                <div className="text-sm text-gray-500">Bonos</div>
                <div className="text-2xl font-bold">{formatCurrency(earnings.bonuses)}</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Retiros Pendientes */}
      <Card>
        <CardHeader>
          <CardTitle>Retiro Disponible</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex justify-between items-center">
            <div>
              <div className="text-sm text-gray-500">Saldo disponible para retiro</div>
              <div className="text-3xl font-bold text-green-600">{formatCurrency(earnings.pendingPayout)}</div>
            </div>
            <Button size="lg" onClick={handleRequestPayout}>
              Solicitar Retiro
            </Button>
          </div>
          <p className="text-sm text-gray-500 mt-4">
            Los retiros se procesan en 24-48 horas hábiles
          </p>
        </CardContent>
      </Card>

      {/* Historial de Transacciones */}
      <Card>
        <CardHeader>
          <CardTitle>Historial Reciente</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {[
              { id: 1, type: 'delivery', description: 'Entrega #1234', amount: 25.50, date: '2024-01-15' },
              { id: 2, type: 'tip', description: 'Propina - Cliente Juan', amount: 8.00, date: '2024-01-15' },
              { id: 3, type: 'delivery', description: 'Entrega #1235', amount: 32.00, date: '2024-01-14' },
              { id: 4, type: 'bonus', description: 'Bono semanal', amount: 50.00, date: '2024-01-14' },
              { id: 5, type: 'payout', description: 'Retiro a cuenta', amount: -200.00, date: '2024-01-13' },
            ].map((item) => (
              <div key={item.id} className="flex justify-between items-center py-3 border-b last:border-0">
                <div>
                  <div className="font-medium">{item.description}</div>
                  <div className="text-sm text-gray-500">{new Date(item.date).toLocaleDateString()}</div>
                </div>
                <div className={`font-bold ${item.amount >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {item.amount >= 0 ? '+' : ''}{formatCurrency(item.amount)}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
