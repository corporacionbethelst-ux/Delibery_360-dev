import React from 'react';
import { Clock, Sun, Moon, Coffee } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import type { Rider, Shift } from '@/types/rider';

interface ShiftControlProps {
  riders: (Rider & { currentShift?: Shift })[];
  onCheckIn: (riderId: string) => void;
  onCheckOut: (riderId: string) => void;
}

export function ShiftControl({ riders, onCheckIn, onCheckOut }: ShiftControlProps) {
  const onShift = riders.filter(r => r.currentShift?.isActive);
  const offShift = riders.filter(r => !r.currentShift?.isActive);

  const getShiftIcon = (shiftType?: string) => {
    switch (shiftType) {
      case 'morning': return <Sun className="h-4 w-4" />;
      case 'afternoon': return <Coffee className="h-4 w-4" />;
      case 'night': return <Moon className="h-4 w-4" />;
      default: return <Clock className="h-4 w-4" />;
    }
  };

  const getShiftLabel = (shiftType?: string) => {
    switch (shiftType) {
      case 'morning': return 'Mañana';
      case 'afternoon': return 'Tarde';
      case 'night': return 'Noche';
      default: return 'General';
    }
  };

  const calculateDuration = (startTime: string) => {
    const start = new Date(startTime);
    const now = new Date();
    const diff = Math.floor((now.getTime() - start.getTime()) / 1000 / 60); // minutos
    const hours = Math.floor(diff / 60);
    const minutes = diff % 60;
    return `${hours}h ${minutes}m`;
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Clock className="h-6 w-6" />
            Control de Turnos
          </div>
          <div className="flex gap-2">
            <Badge variant="default" className="bg-green-600">
              Activos: {onShift.length}
            </Badge>
            <Badge variant="outline">
              Inactivos: {offShift.length}
            </Badge>
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          {/* Repartidores en turno */}
          <div>
            <h3 className="font-semibold mb-3 flex items-center gap-2 text-green-700">
              <Sun className="h-5 w-5" />
              En Turno Ahora
            </h3>
            <div className="grid gap-3">
              {onShift.length === 0 ? (
                <p className="text-sm text-gray-500 italic">No hay repartidores activos</p>
              ) : (
                onShift.map((rider) => (
                  <div
                    key={rider.id}
                    className="flex items-center justify-between p-3 border rounded-lg bg-green-50 border-green-200"
                  >
                    <div className="flex items-center gap-3 flex-1">
                      <div className="h-10 w-10 rounded-full bg-green-600 flex items-center justify-center text-white font-semibold">
                        {rider.user.name.charAt(0)}
                      </div>
                      <div>
                        <p className="font-semibold">{rider.user.name}</p>
                        <div className="flex items-center gap-2 text-xs text-gray-600">
                          <span className="flex items-center gap-1">
                            {getShiftIcon(rider.currentShift?.type)}
                            {getShiftLabel(rider.currentShift?.type)}
                          </span>
                          <span>•</span>
                          <span className="flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            {rider.currentShift?.startTime 
                              ? calculateDuration(rider.currentShift.startTime) 
                              : '0h 0m'} en turno
                          </span>
                        </div>
                      </div>
                    </div>
                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={() => onCheckOut(rider.id)}
                    >
                      Finalizar Turno
                    </Button>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Repartidores fuera de turno */}
          <div>
            <h3 className="font-semibold mb-3 flex items-center gap-2 text-gray-700">
              <Moon className="h-5 w-5" />
              Fuera de Turno
            </h3>
            <div className="grid gap-3">
              {offShift.length === 0 ? (
                <p className="text-sm text-gray-500 italic">Todos los repartidores están activos</p>
              ) : (
                offShift.map((rider) => (
                  <div
                    key={rider.id}
                    className="flex items-center justify-between p-3 border rounded-lg bg-gray-50"
                  >
                    <div className="flex items-center gap-3 flex-1">
                      <div className="h-10 w-10 rounded-full bg-gray-400 flex items-center justify-center text-white font-semibold">
                        {rider.user.name.charAt(0)}
                      </div>
                      <div>
                        <p className="font-semibold">{rider.user.name}</p>
                        <p className="text-xs text-gray-500">
                          {rider.vehicle?.type || 'Sin vehículo asignado'}
                        </p>
                      </div>
                    </div>
                    <Button
                      size="sm"
                      variant="default"
                      onClick={() => onCheckIn(rider.id)}
                    >
                      Iniciar Turno
                    </Button>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export default ShiftControl;
