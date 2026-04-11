import { useState } from 'react';
import { Delivery } from '@/types/delivery';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Play, Pause, RotateCcw, MapPin, Clock, CheckCircle } from 'lucide-react';

interface RouteViewerProps {
  delivery?: Delivery;
  route?: Array<{ lat: number; lng: number; address?: string }>;
  onRouteComplete?: () => void;
}

export function RouteViewer({ delivery, route: propRoute, onRouteComplete }: RouteViewerProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  
  // Ruta simulada si no se proporciona
  const defaultRoute = [
    { lat: -23.5505, lng: -46.6333, address: 'Origen - Restaurante' },
    { lat: -23.5515, lng: -46.6343, address: 'Punto 1' },
    { lat: -23.5525, lng: -46.6353, address: 'Punto 2' },
    { lat: -23.5535, lng: -46.6363, address: 'Punto 3' },
    { lat: -23.5545, lng: -46.6373, address: 'Destino - Cliente' },
  ];
  
  const route = propRoute || defaultRoute;
  const totalDistance = 5.2; // km simulados
  const estimatedTime = 25; // minutos simulados

  const handlePlayPause = () => {
    setIsPlaying(!isPlaying);
  };

  const handleReset = () => {
    setIsPlaying(false);
    setProgress(0);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>Visualizador de Ruta</span>
          <div className="flex gap-2">
            <Button
              variant={isPlaying ? 'secondary' : 'default'}
              size="sm"
              onClick={handlePlayPause}
            >
              {isPlaying ? <Pause className="h-4 w-4 mr-2" /> : <Play className="h-4 w-4 mr-2" />}
              {isPlaying ? 'Pausar' : 'Reproducir'}
            </Button>
            <Button variant="outline" size="sm" onClick={handleReset}>
              <RotateCcw className="h-4 w-4 mr-2" />
              Reiniciar
            </Button>
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Mapa de la ruta */}
        <div className="relative h-64 bg-gradient-to-br from-green-50 to-blue-50 rounded-lg border overflow-hidden">
          {/* Línea de ruta (polyline simulado) */}
          <svg className="absolute inset-0 w-full h-full" viewBox="0 0 400 200">
            <path
              d="M 50 100 Q 150 50 200 100 T 350 100"
              fill="none"
              stroke="#3b82f6"
              strokeWidth="3"
              strokeDasharray="5,5"
              className="opacity-50"
            />
            {/* Progreso actual */}
            <path
              d="M 50 100 Q 150 50 200 100 T 350 100"
              fill="none"
              stroke="#22c55e"
              strokeWidth="3"
              strokeDasharray={`${progress * 4}, 1000`}
            />
            {/* Puntos de la ruta */}
            {route.map((point, index) => {
              const x = 50 + (index * 75);
              const y = index % 2 === 0 ? 100 : 50;
              return (
                <g key={index}>
                  <circle
                    cx={x}
                    cy={y}
                    r={index === 0 ? 8 : index === route.length - 1 ? 10 : 6}
                    fill={index === 0 ? '#22c55e' : index === route.length - 1 ? '#ef4444' : '#3b82f6'}
                    className="stroke-white stroke-2"
                  />
                  {index === 0 && (
                    <text x={x} y={y - 15} textAnchor="middle" className="text-xs fill-green-700 font-semibold">
                      Inicio
                    </text>
                  )}
                  {index === route.length - 1 && (
                    <text x={x} y={y - 15} textAnchor="middle" className="text-xs fill-red-700 font-semibold">
                      Destino
                    </text>
                  )}
                </g>
              );
            })}
          </svg>
          
          {/* Información flotante */}
          <div className="absolute top-2 right-2 bg-white/90 rounded-md px-3 py-1 text-sm shadow">
            <div className="flex items-center gap-2">
              <MapPin className="h-4 w-4 text-blue-500" />
              <span className="font-medium">{totalDistance.toFixed(1)} km</span>
            </div>
          </div>
        </div>

        {/* Control de progreso */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Progreso de la ruta</span>
            <span className="font-medium">{progress}%</span>
          </div>
          <Slider
            value={[progress]}
            min={0}
            max={100}
            step={1}
            onValueChange={(values) => setProgress(values[0])}
            disabled={isPlaying}
          />
        </div>

        {/* Estadísticas de la ruta */}
        <div className="grid grid-cols-3 gap-4">
          <div className="text-center p-3 bg-muted rounded-lg">
            <Clock className="h-5 w-5 mx-auto mb-1 text-blue-500" />
            <div className="text-lg font-bold">{estimatedTime} min</div>
            <div className="text-xs text-muted-foreground">Tiempo estimado</div>
          </div>
          <div className="text-center p-3 bg-muted rounded-lg">
            <MapPin className="h-5 w-5 mx-auto mb-1 text-green-500" />
            <div className="text-lg font-bold">{totalDistance.toFixed(1)} km</div>
            <div className="text-xs text-muted-foreground">Distancia total</div>
          </div>
          <div className="text-center p-3 bg-muted rounded-lg">
            <CheckCircle className="h-5 w-5 mx-auto mb-1 text-purple-500" />
            <div className="text-lg font-bold">{Math.round(progress / 20)}</div>
            <div className="text-xs text-muted-foreground">Puntos visitados</div>
          </div>
        </div>

        {/* Lista de puntos */}
        <div className="space-y-2 max-h-48 overflow-y-auto">
          <h4 className="text-sm font-semibold">Puntos de la ruta</h4>
          {route.map((point, index) => {
            const isCompleted = (index / (route.length - 1)) * 100 <= progress;
            return (
              <div
                key={index}
                className={`flex items-center gap-3 p-2 rounded-md ${
                  isCompleted ? 'bg-green-50' : 'bg-muted/50'
                }`}
              >
                <div
                  className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                    index === 0
                      ? 'bg-green-500 text-white'
                      : index === route.length - 1
                      ? 'bg-red-500 text-white'
                      : isCompleted
                      ? 'bg-blue-500 text-white'
                      : 'bg-gray-300 text-gray-600'
                  }`}
                >
                  {index === 0 ? 'I' : index === route.length - 1 ? 'D' : index}
                </div>
                <div className="flex-1">
                  <div className="text-sm font-medium">{point.address || `Punto ${index + 1}`}</div>
                  <div className="text-xs text-muted-foreground">
                    {point.lat.toFixed(4)}, {point.lng.toFixed(4)}
                  </div>
                </div>
                {isCompleted && (
                  <CheckCircle className="h-4 w-4 text-green-500" />
                )}
              </div>
            );
          })}
        </div>

        {/* Botón de completar ruta */}
        {progress >= 100 && (
          <Button className="w-full" onClick={onRouteComplete}>
            <CheckCircle className="h-4 w-4 mr-2" />
            Completar Ruta
          </Button>
        )}
      </CardContent>
    </Card>
  );
}
