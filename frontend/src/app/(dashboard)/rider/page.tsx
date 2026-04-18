'use client';

import { useState, useEffect } from 'react';
import api from '@/lib/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Play, Square, MapPin, DollarSign, Clock, PackageCheck, Navigation } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';

const MOCK_DELIVERIES = [
  { id: 'DEL-101', address: 'Calle 10 #20-30', customer: 'Maria L.', status: 'pending', earnings: 4.50 },
  { id: 'DEL-102', address: 'Av. Libertador 500', customer: 'Jose R.', status: 'in_progress', earnings: 6.00 },
];

export default function RiderDashboard() {
  const { user } = useAuth();
  const [shiftActive, setShiftActive] = useState(false);
  const [deliveries, setDeliveries] = useState(MOCK_DELIVERIES);
  const [stats, setStats] = useState({ completed: 0, earnings: 0, hours: 0 });

  const toggleShift = () => {
    setShiftActive(!shiftActive);
    // Aquí: api.post('/shifts/toggle')
    alert(shiftActive ? "Turno finalizado. ¡Buen trabajo!" : "Turno iniciado. ¡A repartir!");
  };

  const updateStatus = (id: string, newStatus: string) => {
    setDeliveries(deliveries.map(d => d.id === id ? { ...d, status: newStatus } : d));
    // Aquí: api.patch(`/deliveries/${id}`, { status: newStatus })
  };

  return (
    <div className="p-4 space-y-6 bg-gray-100 min-h-screen pb-20">
      {/* Header de Turno */}
      <Card className={`${shiftActive ? 'bg-green-600 text-white' : 'bg-gray-800 text-white'}`}>
        <CardHeader className="pb-2">
          <div className="flex justify-between items-center">
            <CardTitle>Hola, {user?.name || 'Repartidor'}</CardTitle>
            <Badge variant="secondary" className={shiftActive ? 'bg-green-200 text-green-800' : 'bg-red-200 text-red-800'}>
              {shiftActive ? 'EN TURNO' : 'FUERA DE TURNO'}
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          <Button 
            onClick={toggleShift} 
            className={`w-full py-6 text-lg font-bold ${shiftActive ? 'bg-red-500 hover:bg-red-600' : 'bg-green-500 hover:bg-green-600'}`}
          >
            {shiftActive ? <><Square className="mr-2 fill-current" /> Finalizar Turno</> : <><Play className="mr-2 fill-current" /> Iniciar Turno</>}
          </Button>
        </CardContent>
      </Card>

      {/* Estadísticas del Día */}
      <div className="grid grid-cols-3 gap-2">
        <Card>
          <CardContent className="p-3 text-center">
            <DollarSign className="h-5 w-5 mx-auto text-green-600 mb-1" />
            <div className="text-xl font-bold">${stats.earnings}</div>
            <div className="text-xs text-gray-500">Ganado</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-3 text-center">
            <PackageCheck className="h-5 w-5 mx-auto text-blue-600 mb-1" />
            <div className="text-xl font-bold">{stats.completed}</div>
            <div className="text-xs text-gray-500">Entregas</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-3 text-center">
            <Clock className="h-5 w-5 mx-auto text-orange-600 mb-1" />
            <div className="text-xl font-bold">{stats.hours}h</div>
            <div className="text-xs text-gray-500">Tiempo</div>
          </CardContent>
        </Card>
      </div>

      {/* Lista de Entregas Activas */}
      <div className="space-y-3">
        <h2 className="text-lg font-semibold text-gray-700">Entregas Asignadas</h2>
        {deliveries.length === 0 ? (
          <div className="text-center p-8 bg-white rounded-lg text-gray-500">
            No hay entregas pendientes. ¡Espera nuevas asignaciones!
          </div>
        ) : (
          deliveries.map((delivery) => (
            <Card key={delivery.id} className="overflow-hidden">
              <div className={`h-2 w-full ${delivery.status === 'pending' ? 'bg-yellow-400' : 'bg-blue-500'}`} />
              <CardContent className="p-4">
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <h3 className="font-bold text-lg">{delivery.customer}</h3>
                    <div className="flex items-center text-gray-600 text-sm">
                      <MapPin className="h-3 w-3 mr-1" /> {delivery.address}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-bold text-green-600">+${delivery.earnings}</div>
                    <Badge variant="outline" className="text-xs">{delivery.status === 'pending' ? 'Pendiente' : 'En Curso'}</Badge>
                  </div>
                </div>
                
                <div className="flex gap-2 mt-4">
                  <Button className="flex-1" variant="outline" size="sm">
                    <Navigation className="h-4 w-4 mr-1" /> Mapa
                  </Button>
                  {delivery.status === 'pending' && (
                    <Button className="flex-1 bg-blue-600" size="sm" onClick={() => updateStatus(delivery.id, 'in_progress')}>
                      Recoger
                    </Button>
                  )}
                  {delivery.status === 'in_progress' && (
                    <Button className="flex-1 bg-green-600" size="sm" onClick={() => updateStatus(delivery.id, 'delivered')}>
                      Entregar
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}