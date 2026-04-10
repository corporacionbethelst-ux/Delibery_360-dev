'use client';

import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Users, Package, MapPin, Clock, Search, AlertTriangle } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';

// Tipos simulados para demo si la API falla
const MOCK_ORDERS = [
  { id: 'ORD-001', customer: 'Ana García', address: 'Av. Siempre Viva 123', status: 'pending', amount: 15.50, created_at: new Date().toISOString() },
  { id: 'ORD-002', customer: 'Carlos Ruiz', address: 'Calle Falsa 123', status: 'assigned', amount: 22.00, created_at: new Date().toISOString() },
  { id: 'ORD-003', customer: 'Lucía Méndez', address: 'Plaza Mayor 4', status: 'in_transit', amount: 8.75, created_at: new Date().toISOString() },
];

const MOCK_RIDERS = [
  { id: 'RID-001', name: 'Pedro Pascal', status: 'available', current_order: null },
  { id: 'RID-002', name: 'Sofía Vergara', status: 'busy', current_order: 'ORD-003' },
];

export default function OperatorDashboard() {
  const { user } = useAuth();
  const [orders, setOrders] = useState(MOCK_ORDERS);
  const [riders, setRiders] = useState(MOCK_RIDERS);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedOrder, setSelectedOrder] = useState<any>(null);

  useEffect(() => {
    // Simulación de fetch inicial
    const fetchData = async () => {
      try {
        // const [ordersRes, ridersRes] = await Promise.all([api.get('/orders'), api.get('/riders')]);
        // setOrders(ordersRes.data);
        // setRiders(ridersRes.data);
        setLoading(false);
      } catch (error) {
        console.error("Error cargando datos", error);
        setLoading(false);
      }
    };
    fetchData();

    // Polling cada 30s
    const interval = setInterval(fetchData, 30000);
    return () => clearInterval(interval);
  }, []);

  const handleAssign = (orderId: string, riderId: string) => {
    alert(`Orden ${orderId} asignada al repartidor ${riderId}`);
    // Aquí iría: api.post(`/orders/${orderId}/assign`, { rider_id: riderId });
    setOrders(orders.map(o => o.id === orderId ? { ...o, status: 'assigned' } : o));
  };

  const filteredOrders = orders.filter(o => 
    o.customer.toLowerCase().includes(searchTerm.toLowerCase()) || 
    o.id.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getStatusColor = (status: string) => {
    switch(status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'assigned': return 'bg-blue-100 text-blue-800';
      case 'in_transit': return 'bg-purple-100 text-purple-800';
      case 'delivered': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) return <div className="p-8 text-center">Cargando panel de operador...</div>;

  return (
    <div className="p-6 space-y-6 bg-gray-50 min-h-screen">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-gray-800">Centro de Operaciones</h1>
        <div className="flex gap-2">
          <Badge variant="outline" className="px-3 py-1">Operadores Activos: 3</Badge>
          <Badge variant="outline" className="px-3 py-1">Turno: Mañana</Badge>
        </div>
      </div>

      {/* KPIs Rápidos */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Órdenes Pendientes</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent><div className="text-2xl font-bold">{orders.filter(o => o.status === 'pending').length}</div></CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Repartidores Libres</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent><div className="text-2xl font-bold">{riders.filter(r => r.status === 'available').length}</div></CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">En Tránsito</CardTitle>
            <MapPin className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent><div className="text-2xl font-bold">{orders.filter(o => o.status === 'in_transit').length}</div></CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Incidencias</CardTitle>
            <AlertTriangle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent><div className="text-2xl font-bold text-red-600">0</div></CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Lista de Órdenes */}
        <div className="lg:col-span-2 space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Gestión de Órdenes</CardTitle>
              <div className="relative mt-2">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-gray-500" />
                <Input 
                  placeholder="Buscar por cliente o ID..." 
                  className="pl-8" 
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>ID</TableHead>
                    <TableHead>Cliente</TableHead>
                    <TableHead>Estado</TableHead>
                    <TableHead>Monto</TableHead>
                    <TableHead>Acción</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredOrders.map((order) => (
                    <TableRow key={order.id}>
                      <TableCell className="font-mono text-sm">{order.id}</TableCell>
                      <TableCell>{order.customer}<div className="text-xs text-gray-500">{order.address}</div></TableCell>
                      <TableCell>
                        <Badge className={getStatusColor(order.status)}>{order.status.replace('_', ' ').toUpperCase()}</Badge>
                      </TableCell>
                      <TableCell>${order.amount.toFixed(2)}</TableCell>
                      <TableCell>
                        {order.status === 'pending' && (
                          <Dialog>
                            <DialogTrigger asChild>
                              <Button size="sm" variant="outline" onClick={() => setSelectedOrder(order)}>Asignar</Button>
                            </DialogTrigger>
                            <DialogContent>
                              <DialogHeader>
                                <DialogTitle>Asignar Repartidor - {order.id}</DialogTitle>
                              </DialogHeader>
                              <div className="space-y-2 py-4">
                                {riders.filter(r => r.status === 'available').map(rider => (
                                  <Button 
                                    key={rider.id} 
                                    className="w-full justify-start" 
                                    variant="ghost"
                                    onClick={() => handleAssign(order.id, rider.id)}
                                  >
                                    <Users className="mr-2 h-4 w-4" /> {rider.name}
                                  </Button>
                                ))}
                                {riders.filter(r => r.status === 'available').length === 0 && (
                                  <p className="text-sm text-gray-500 text-center">No hay repartidores disponibles ahora.</p>
                                )}
                              </div>
                            </DialogContent>
                          </Dialog>
                        )}
                        {order.status !== 'pending' && <Button size="sm" variant="ghost" disabled>Ver Detalles</Button>}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </div>

        {/* Lista de Repartidores */}
        <div className="space-y-4">
          <Card>
            <CardHeader><CardTitle>Flota en Tiempo Real</CardTitle></CardHeader>
            <CardContent className="space-y-3">
              {riders.map((rider) => (
                <div key={rider.id} className="flex items-center justify-between p-3 border rounded-lg bg-white shadow-sm">
                  <div className="flex items-center gap-3">
                    <div className={`w-2 h-2 rounded-full ${rider.status === 'available' ? 'bg-green-500' : 'bg-red-500'}`} />
                    <div>
                      <p className="font-medium">{rider.name}</p>
                      <p className="text-xs text-gray-500">{rider.status === 'available' ? 'Disponible' : `Ocupado: ${rider.current_order}`}</p>
                    </div>
                  </div>
                  {rider.status === 'available' && <Button size="icon" variant="ghost" className="h-8 w-8"><Clock className="h-4 w-4"/></Button>}
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}