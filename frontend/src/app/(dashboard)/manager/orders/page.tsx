'use client';

import { useState } from 'react';
import { api } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Plus, Edit, Trash2, Filter, Download } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';

// Mock Data
const INITIAL_ORDERS = [
  { id: 'ORD-001', customer: 'Ana G.', total: 25.00, status: 'delivered', date: '2023-10-25' },
  { id: 'ORD-002', customer: 'Carlos R.', total: 15.50, status: 'cancelled', date: '2023-10-24' },
];

export default function OrdersManagement() {
  const [orders, setOrders] = useState(INITIAL_ORDERS);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [filter, setFilter] = useState('all');

  const handleDelete = (id: string) => {
    if(confirm('¿Seguro que desea cancelar esta orden?')) {
      setOrders(orders.filter(o => o.id !== id));
      toast.success('Orden cancelada correctamente');
    }
  };

  const filteredOrders = orders.filter(o => filter === 'all' || o.status === filter);

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Gestión de Órdenes</h1>
        <div className="flex gap-2">
           <Button variant="outline"><Download className="mr-2 h-4 w-4" /> Exportar</Button>
           <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
             <DialogTrigger asChild>
               <Button><Plus className="mr-2 h-4 w-4" /> Nueva Orden</Button>
             </DialogTrigger>
             <DialogContent>
               <DialogHeader><DialogTitle>Crear Nueva Orden</DialogTitle></DialogHeader>
               <div className="grid gap-4 py-4">
                 <div className="grid grid-cols-4 items-center gap-4">
                   <Label htmlFor="customer" className="text-right">Cliente</Label>
                   <Input id="customer" className="col-span-3" placeholder="Nombre del cliente" />
                 </div>
                 <div className="grid grid-cols-4 items-center gap-4">
                   <Label htmlFor="total" className="text-right">Total</Label>
                   <Input id="total" type="number" className="col-span-3" placeholder="0.00" />
                 </div>
               </div>
               <DialogFooter>
                 <Button variant="outline" onClick={() => setIsCreateOpen(false)}>Cancelar</Button>
                 <Button onClick={() => { toast.success('Orden creada'); setIsCreateOpen(false); }}>Guardar</Button>
               </DialogFooter>
             </DialogContent>
           </Dialog>
        </div>
      </div>

      <div className="flex gap-2 mb-4">
        {['all', 'pending', 'delivered', 'cancelled'].map(status => (
          <Button 
            key={status} 
            variant={filter === status ? 'default' : 'outline'}
            size="sm"
            onClick={() => setFilter(status)}
          >
            {status === 'all' ? 'Todos' : status.charAt(0).toUpperCase() + status.slice(1)}
          </Button>
        ))}
      </div>

      <div className="border rounded-md">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>ID</TableHead>
              <TableHead>Cliente</TableHead>
              <TableHead>Fecha</TableHead>
              <TableHead>Total</TableHead>
              <TableHead>Estado</TableHead>
              <TableHead className="text-right">Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredOrders.map((order) => (
              <TableRow key={order.id}>
                <TableCell className="font-mono">{order.id}</TableCell>
                <TableCell>{order.customer}</TableCell>
                <TableCell>{order.date}</TableCell>
                <TableCell>${order.total.toFixed(2)}</TableCell>
                <TableCell>
                  <Badge variant={order.status === 'delivered' ? 'default' : order.status === 'cancelled' ? 'destructive' : 'secondary'}>
                    {order.status}
                  </Badge>
                </TableCell>
                <TableCell className="text-right">
                  <Button variant="ghost" size="icon"><Edit className="h-4 w-4" /></Button>
                  <Button variant="ghost" size="icon" onClick={() => handleDelete(order.id)}><Trash2 className="h-4 w-4 text-red-500" /></Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
