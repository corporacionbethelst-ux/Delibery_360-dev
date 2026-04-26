'use client';

import { useState, useEffect } from 'react';
import { useProductivity } from '@/hooks/useProductivity';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { TrendingUp, Clock, Target, Award, Package, Star } from 'lucide-react';

export default function RiderProductivityPage() {
  // Corregido: usamos las variables directas que devuelve el hook
  const { metrics, riderProductivity, loading, fetchMetrics } = useProductivity();
  
  // Obtenemos los datos del primer repartidor (o usamos un objeto vacío por defecto)
  // Asumiendo que riderProductivity es un array y tomamos el índice 0
  const riderData = riderProductivity?.[0] || null;

  useEffect(() => {
    // Corregido: llamamos a fetchMetrics sin argumentos extraños
    fetchMetrics();
  }, [fetchMetrics]);

  if (loading) return <div className="p-8 text-center">Cargando métricas...</div>;

  // Valores seguros con fallback a 0 si no hay datos
  const totalDeliveries = riderData?.totalDeliveries || metrics?.totalDeliveries || 0;
  const avgDeliveryTime = riderData?.averageDeliveryTime || metrics?.averageDeliveryTime || 0;
  const rating = riderData?.customerRating || metrics?.customerRating || 0;
  const slaCompliance = riderData?.slaCompliance || metrics?.onTimeRate || 0;

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
                {/* Corregido: usamos la variable extraída correctamente */}
                <div className="text-2xl font-bold">{totalDeliveries}</div>
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
                {/* Corregido: usamos averageDeliveryTime */}
                <div className="text-2xl font-bold">{avgDeliveryTime} min</div>
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
                <div className="text-2xl font-bold">{rating.toFixed(1)}/5</div>
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
                <div className="text-2xl font-bold">{slaCompliance}%</div>
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
                <span className="text-sm text-gray-500">{totalDeliveries}/50 entregas</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2.5">
                <div 
                  className="bg-blue-600 h-2.5 rounded-full" 
                  style={{ width: `${Math.min((totalDeliveries / 50) * 100, 100)}%` }} 
                />
              </div>
            </div>

            <div>
              <div className="flex justify-between mb-2">
                <span className="text-sm font-medium">Cumplimiento SLA</span>
                <span className="text-sm text-gray-500">{slaCompliance}% objetivo: 95%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2.5">
                <div 
                  className="bg-green-600 h-2.5 rounded-full" 
                  style={{ width: `${slaCompliance}%` }} 
                />
              </div>
            </div>

            <div>
              <div className="flex justify-between mb-2">
                <span className="text-sm font-medium">Calificación Promedio</span>
                <span className="text-sm text-gray-500">{rating.toFixed(1)}/5 objetivo: 4.5</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2.5">
                <div 
                  className="bg-yellow-500 h-2.5 rounded-full" 
                  style={{ width: `${(rating / 5) * 100}%` }} 
                />
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
              <span className="font-medium">{riderData?.totalDistance || 0} km</span>
            </div>
            <div className="flex justify-between py-2 border-b">
              <span className="text-gray-600">Horas Activas</span>
              <span className="font-medium">{riderData?.totalHours || 0} hrs</span>
            </div>
            <div className="flex justify-between py-2 border-b">
              <span className="text-gray-600">Entregas por Hora</span>
              <span className="font-medium">{riderData?.ordersPerHour || 0}</span>
            </div>
            <div className="flex justify-between py-2 border-b">
              <span className="text-gray-600">Propinas Recibidas</span>
              <span className="font-medium">R$ {(riderData?.tips || 0).toFixed(2)}</span>
            </div>
            <div className="flex justify-between py-2 border-b">
              <span className="text-gray-600">Cancelaciones</span>
              <span className="font-medium text-red-600">{riderData?.cancelledDeliveries || 0}</span>
            </div>
            <div className="flex justify-between py-2">
              <span className="text-gray-600">Clientes Satisfechos</span>
              <span className="font-medium text-green-600">{riderData?.onTimePercentage || 0}%</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}