import React from 'react';
import { Clock, LogIn, LogOut, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import type { Rider } from '@/types/riders';

interface CheckInOutProps {
  rider: Rider & { currentShift?: { isActive: boolean; startTime?: string; type?: string } };
  onCheckIn: (riderId: string, shiftType: string) => void;
  onCheckOut: (riderId: string) => void;
}

export function CheckInOut({ rider, onCheckIn, onCheckOut }: CheckInOutProps) {
  const [selectedShift, setSelectedShift] = React.useState<string>('morning');
  const [isProcessing, setIsProcessing] = React.useState(false);
  const isActive = rider.currentShift?.isActive;

  const shiftTypes = [
    { value: 'morning', label: 'Mañana', icon: Sun },
    { value: 'afternoon', label: 'Tarde', icon: Coffee },
    { value: 'night', label: 'Noche', icon: Moon },
  ];

  const handleCheckIn = async () => {
    setIsProcessing(true);
    try {
      await onCheckIn(rider.id, selectedShift);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleCheckOut = async () => {
    setIsProcessing(true);
    try {
      await onCheckOut(rider.id);
    } finally {
      setIsProcessing(false);
    }
  };

  const getShiftDuration = () => {
    if (!rider.currentShift?.startTime) return null;
    const start = new Date(rider.currentShift.startTime);
    const now = new Date();
    const diff = Math.floor((now.getTime() - start.getTime()) / 1000 / 60);
    const hours = Math.floor(diff / 60);
    const minutes = diff % 60;
    return `${hours}h ${minutes}m`;
  };

  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Clock className="h-6 w-6" />
            Control de Acceso
          </div>
          <Badge variant={isActive ? "default" : "outline"} className={isActive ? "bg-green-600" : ""}>
            {isActive ? 'En Turno' : 'Fuera de Turno'}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Información del repartidor */}
        <div className="flex items-center gap-4 p-4 bg-gray-50 rounded-lg">
          <div className="h-12 w-12 rounded-full bg-primary flex items-center justify-center text-white font-semibold text-lg">
            {rider.user.name.charAt(0)}
          </div>
          <div>
            <p className="font-semibold">{rider.user.name}</p>
            <p className="text-sm text-gray-600">{rider.vehicle?.type || 'Sin vehículo'}</p>
            <p className="text-xs text-gray-500">{rider.phone}</p>
          </div>
        </div>

        {isActive ? (
          /* Vista cuando está en turno */
          <div className="space-y-4">
            <Alert className="bg-green-50 border-green-200">
              <LogIn className="h-4 w-4 text-green-600" />
              <AlertDescription className="text-green-800">
                Turno activo desde {new Date(rider.currentShift!.startTime!).toLocaleTimeString()}
                {getShiftDuration() && (
                  <span className="block mt-1 text-sm">
                    Duración: <strong>{getShiftDuration()}</strong>
                  </span>
                )}
              </AlertDescription>
            </Alert>

            <Button 
              variant="destructive" 
              className="w-full"
              onClick={handleCheckOut}
              disabled={isProcessing}
            >
              <LogOut className="h-4 w-4 mr-2" />
              {isProcessing ? 'Procesando...' : 'Finalizar Turno'}
            </Button>
          </div>
        ) : (
          /* Vista cuando está fuera de turno */
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium mb-2 block">Selecciona tu turno:</label>
              <div className="grid grid-cols-3 gap-2">
                {shiftTypes.map(({ value, label, icon: Icon }) => (
                  <button
                    key={value}
                    onClick={() => setSelectedShift(value)}
                    className={`p-3 border rounded-lg flex flex-col items-center gap-2 transition-all ${
                      selectedShift === value
                        ? 'border-primary bg-primary/10 text-primary'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <Icon className="h-5 w-5" />
                    <span className="text-xs font-medium">{label}</span>
                  </button>
                ))}
              </div>
            </div>

            <Alert className="bg-blue-50 border-blue-200">
              <AlertCircle className="h-4 w-4 text-blue-600" />
              <AlertDescription className="text-blue-800 text-sm">
                Al iniciar turno, quedarás disponible para recibir asignaciones de entregas.
              </AlertDescription>
            </Alert>

            <Button 
              className="w-full bg-green-600 hover:bg-green-700"
              onClick={handleCheckIn}
              disabled={isProcessing}
            >
              <LogIn className="h-4 w-4 mr-2" />
              {isProcessing ? 'Procesando...' : 'Iniciar Turno'}
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// Iconos auxiliares
function Sun({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
    </svg>
  );
}

function Moon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
    </svg>
  );
}

function Coffee({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 8h1a4 4 0 010 8h-1M2 8h16v9a4 4 0 01-4 4H6a4 4 0 01-4-4V8z" />
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 1v3M10 1v3M14 1v3" />
    </svg>
  );
}

export default CheckInOut;
