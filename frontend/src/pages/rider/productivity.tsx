import { useState, useEffect } from 'react';
import { useProductivity } from '@/hooks/useProductivity';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { TrendingUp, Clock, Target, Award, Package, Star } from 'lucide-react';

export default function RiderProductivityPage() {
  const { getMetrics, loading } = useProductivity();
  const [metrics, setMetrics] = useState<any>(null); // State initialized to null

  useEffect(() => {
    const loadMetrics = async () => {
      const data = await getMetrics('rider', 'week');
      setMetrics(data);
    };
    loadMetrics();
  }, []);

  if (loading) return <div className="p-8 text-center">Cargando métricas...</div>;

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-3xl font-bold text-gray-900">Mi Productividad</h1>

      {/* KPIs Principales */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-blue-100 rounded-full">
                <Package className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <div className="text-sm text-gray-500">Entregas Completadas</div>
                <div className="text-2xl font-bold">{metrics?.completedDeliveries || 0}</div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-green-100 rounded-full">
                <Clock className="w-6 h-6 text-green-600" />
              </div>
              <div>
                <div className="text-sm text-gray-500">Tiempo Promedio</div>
                <div className="text-2xl font-bold">{metrics?.avgDeliveryTime || 0} min</div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-yellow-100 rounded-full">
                <Star className="w-6 h-6 text-yellow-600" />
              </div>
              <div>
                <div className="text-sm text-gray-500">Calificación</div>
                <div className="text-2xl font-bold">{metrics?.rating || 0}/5</div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-purple-100 rounded-full">
                <Target className="w-6 h-6 text-purple-600" />
              </div>
              <div>
                <div className="text-sm text-gray-500">Cumplimiento SLA</div>
                <div className="text-2xl font-bold">{metrics?.slaCompliance || 0}%</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Progreso Semanal */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="w-5 h-5" />
            Progreso Semanal
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <div className="flex justify-between mb-2">
                <span className="text-sm font-medium">Meta de Entregas</span>
                <span className="text-sm text-gray-500">35/50 entregas</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2.5">
                <div className="bg-blue-600 h-2.5 rounded-full" style={{ width: '70%' }}></div>
              </div>
            </div>

            <div>
              <div className="flex justify-between mb-2">
                <span className="text-sm font-medium">Cumplimiento SLA</span>
                <span className="text-sm text-gray-500">92% objetivo: 95%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2.5">
                <div className="bg-green-600 h-2.5 rounded-full" style={{ width: '92%' }}></div>
              </div>
            </div>

            <div>
              <div className="flex justify-between mb-2">
                <span className="text-sm font-medium">Calificación Promedio</span>
                <span className="text-sm text-gray-500">4.7/5 objetivo: 4.5</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2.5">
                <div className="bg-yellow-500 h-2.5 rounded-full" style={{ width: '94%' }}></div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Logros y Reconocimientos */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Award className="w-5 h-5" />
            Logros Recientes
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { icon: '🚀', title: 'Velocidad', description: 'Top 10% en tiempo de entrega' },
              { icon: '⭐', title: 'Excelencia', description: '50 entregas sin incidentes' },
              { icon: '🔥', title: 'Racha', description: '7 días consecutivos activos' },
              { icon: '💯', title: 'Perfección', description: '100% SLA esta semana' },
            ].map((achievement, index) => (
              <div key={index} className="text-center p-4 bg-gray-50 rounded-lg">
                <div className="text-4xl mb-2">{achievement.icon}</div>
                <div className="font-bold text-sm">{achievement.title}</div>
                <div className="text-xs text-gray-500 mt-1">{achievement.description}</div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Estadísticas Detalladas */}
      <Card>
        <CardHeader>
          <CardTitle>Estadísticas Detalladas</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="flex justify-between py-2 border-b">
              <span className="text-gray-600">Distancia Total Recorrida</span>
              <span className="font-medium">145.8 km</span>
            </div>
            <div className="flex justify-between py-2 border-b">
              <span className="text-gray-600">Horas Activas</span>
              <span className="font-medium">32.5 hrs</span>
            </div>
            <div className="flex justify-between py-2 border-b">
              <span className="text-gray-600">Entregas por Hora</span>
              <span className="font-medium">1.4</span>
            </div>
            <div className="flex justify-between py-2 border-b">
              <span className="text-gray-600">Propinas Recibidas</span>
              <span className="font-medium">R$ 180.00</span>
            </div>
            <div className="flex justify-between py-2 border-b">
              <span className="text-gray-600">Cancelaciones</span>
              <span className="font-medium text-red-600">2</span>
            </div>
            <div className="flex justify-between py-2">
              <span className="text-gray-600">Cliente Satisfechos</span>
              <span className="font-medium text-green-600">98%</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
