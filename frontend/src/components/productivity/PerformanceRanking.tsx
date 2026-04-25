import React from 'react';
import { Trophy, Medal, Award, TrendingUp, TrendingDown } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import type { Rider } from '@/types/rider';

interface PerformanceRankingProps {
  riders: (Rider & { 
    metrics?: {
      totalDeliveries: number;
      onTimeRate: number;
      avgDeliveryTime: number;
      customerRating: number;
    } 
  })[];
  period?: string;
  onRiderClick?: (riderId: string) => void;
}

export function PerformanceRanking({ riders, period = 'Este mes', onRiderClick }: PerformanceRankingProps) {
  // Calcular puntuación compuesta para cada repartidor
  const rankedRiders = riders
    .map(rider => {
      const m = rider.metrics;
      if (!m) return null;
      
      // Puntuación compuesta (ponderada)
      // Ajuste: (100 - avgDeliveryTime) asume que el tiempo es < 100. Si es mayor, la fórmula podría dar negativos.
      const score = 
        (m.totalDeliveries * 0.3) +
        (m.onTimeRate * 0.3) +
        (Math.max(0, 100 - m.avgDeliveryTime) * 0.2) + // Protegido contra negativos
        (m.customerRating * 20 * 0.2);
      
      return { ...rider, score };
    })
    .filter(Boolean) as (Rider & { score: number; metrics: any })[];

  // Ordenar por puntuación descendente
  rankedRiders.sort((a, b) => b.score - a.score);

  const getRankIcon = (rank: number) => {
    switch (rank) {
      case 1: return <Trophy className="h-6 w-6 text-yellow-500" />;
      case 2: return <Medal className="h-6 w-6 text-gray-400" />;
      case 3: return <Award className="h-6 w-6 text-amber-600" />;
      default: return <span className="text-lg font-bold text-gray-600">#{rank}</span>;
    }
  };

  const getTrend = (score: number, idx: number) => {
    // Simular tendencia (en producción vendría de datos históricos)
    if (idx < 3) return { icon: TrendingUp, color: 'text-green-600' };
    if (idx > rankedRiders.length - 4) return { icon: TrendingDown, color: 'text-red-600' };
    return null;
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Trophy className="h-6 w-6 text-yellow-600" />
            Ranking de Rendimiento
          </CardTitle>
          <Badge variant="outline">{period}</Badge>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {rankedRiders.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <Award className="h-12 w-12 mx-auto mb-2 opacity-50" />
              <p>No hay datos de rendimiento disponibles</p>
            </div>
          ) : (
            rankedRiders.map((rider, idx) => {
              const rank = idx + 1;
              const trend = getTrend(rider.score, idx);
              
              // CORRECCIÓN: Usar rider.fullName en lugar de rider.user.name
              const displayName = rider.fullName || 'Sin nombre';
              const initial = displayName.charAt(0).toUpperCase();

              return (
                <div
                  key={rider.id}
                  onClick={() => onRiderClick?.(rider.id)}
                  className={`flex items-center gap-4 p-4 rounded-lg border transition-all cursor-pointer hover:shadow-md ${
                    rank <= 3 
                      ? rank === 1 ? 'bg-yellow-50 border-yellow-300' 
                      : rank === 2 ? 'bg-gray-50 border-gray-300' 
                      : 'bg-amber-50 border-amber-300'
                      : 'bg-white hover:bg-gray-50'
                  }`}
                >
                  {/* Rank */}
                  <div className="w-12 flex justify-center">
                    {getRankIcon(rank)}
                  </div>

                  {/* Avatar e información */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <div className={`h-10 w-10 rounded-full flex items-center justify-center text-white font-semibold ${
                        rank <= 3 
                          ? rank === 1 ? 'bg-yellow-600' 
                            : rank === 2 ? 'bg-gray-600' 
                            : 'bg-amber-600'
                          : 'bg-blue-600'
                      }`}>
                        {initial}
                      </div>
                      <div className="flex-1 min-w-0">
                        {/* CORRECCIÓN: Usar displayName */}
                        <p className="font-semibold truncate">{displayName}</p>
                        <div className="flex items-center gap-2 text-xs text-gray-600">
                          <span>{rider.vehicle?.type || 'Sin vehículo'}</span>
                          {trend && (
                            <span className={`flex items-center gap-1 ${trend.color}`}>
                              <trend.icon className="h-3 w-3" />
                              {trend.icon === TrendingUp ? 'Subiendo' : 'Bajando'}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Métricas principales */}
                  <div className="hidden md:flex items-center gap-6 text-sm">
                    <div className="text-center">
                      <div className="font-bold text-lg">{rider.metrics.totalDeliveries}</div>
                      <div className="text-xs text-gray-600">Entregas</div>
                    </div>
                    <div className="text-center">
                      <div className={`font-bold text-lg ${rider.metrics.onTimeRate >= 95 ? 'text-green-600' : rider.metrics.onTimeRate >= 85 ? 'text-yellow-600' : 'text-red-600'}`}>
                        {rider.metrics.onTimeRate.toFixed(0)}%
                      </div>
                      <div className="text-xs text-gray-600">A tiempo</div>
                    </div>
                    <div className="text-center">
                      <div className="font-bold text-lg">{rider.metrics.avgDeliveryTime.toFixed(0)}m</div>
                      <div className="text-xs text-gray-600">Promedio</div>
                    </div>
                    <div className="text-center">
                      <div className="font-bold text-lg flex items-center gap-1">
                        ⭐ {rider.metrics.customerRating.toFixed(1)}
                      </div>
                      <div className="text-xs text-gray-600">Calificación</div>
                    </div>
                  </div>

                  {/* Puntuación total */}
                  <div className="text-right">
                    <div className="text-2xl font-bold text-primary">{rider.score.toFixed(0)}</div>
                    <div className="text-xs text-gray-600">puntos</div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Leyenda de métricas */}
        <div className="mt-6 pt-4 border-t">
          <h4 className="text-sm font-semibold mb-2">Criterios de evaluación:</h4>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded bg-blue-600"></div>
              <span>Volumen de entregas (30%)</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded bg-green-600"></div>
              <span>Puntualidad (30%)</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded bg-yellow-600"></div>
              <span>Tiempo promedio (20%)</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded bg-purple-600"></div>
              <span>Calificación cliente (20%)</span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export default PerformanceRanking;