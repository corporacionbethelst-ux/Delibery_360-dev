import React from 'react';
import { CheckCircle, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import type { Delivery } from '@/types/delivery';

interface FinishDeliveryFormProps {
  delivery: Delivery;
  onFinish: (data: { status: 'delivered' | 'failed'; notes: string; reason?: string }) => void;
}

export function FinishDeliveryForm({ delivery, onFinish }: FinishDeliveryFormProps) {
  const [status, setStatus] = React.useState<'delivered' | 'failed'>('delivered');
  const [notes, setNotes] = React.useState('');
  const [reason, setReason] = React.useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onFinish({ 
      status, 
      notes, 
      reason: status === 'failed' ? reason : undefined 
    });
  };

  const failureReasons = [
    'Cliente no disponible',
    'Dirección incorrecta',
    'Cliente rechazó el paquete',
    'Producto dañado',
    'Otro',
  ];

  // Extraer datos de forma segura para evitar errores si order es undefined
  const customerName = delivery.order?.customerName || 'Cliente no especificado';
  const customerPhone = delivery.order?.customerPhone || 'N/A';
  // Usar la dirección de entrega completa del objeto deliveryLocation
  const deliveryAddress = delivery.deliveryLocation 
    ? `${delivery.deliveryLocation.address}, ${delivery.deliveryLocation.city}` 
    : 'Dirección no disponible';

  return (
    <Card className="w-full max-w-2xl">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <CheckCircle className="h-6 w-6 text-green-600" />
          Finalizar Entrega #{delivery.id.slice(0, 8)}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="bg-blue-50 p-4 rounded-lg">
            <h4 className="font-semibold mb-2">Detalles de la entrega</h4>
            {/* CORREGIDO: Acceso a través de delivery.order y delivery.deliveryLocation */}
            <p className="text-sm text-gray-600">Cliente: {customerName}</p>
            <p className="text-sm text-gray-600">Dirección: {deliveryAddress}</p>
            <p className="text-sm text-gray-600">Teléfono: {customerPhone}</p>
          </div>

          <div className="space-y-3">
            <Label>Estado de la entrega</Label>
            <RadioGroup value={status} onValueChange={(v) => setStatus(v as 'delivered' | 'failed')}>
              <div className="flex items-center space-x-2 p-3 border rounded-lg bg-green-50 border-green-200">
                <RadioGroupItem value="delivered" id="delivered" />
                <Label htmlFor="delivered" className="flex items-center gap-2 cursor-pointer flex-1">
                  <CheckCircle className="h-5 w-5 text-green-600" />
                  <div>
                    <p className="font-semibold">Entregado exitosamente</p>
                    <p className="text-xs text-gray-600">El cliente recibió el paquete sin problemas</p>
                  </div>
                </Label>
              </div>
              <div className="flex items-center space-x-2 p-3 border rounded-lg bg-red-50 border-red-200">
                <RadioGroupItem value="failed" id="failed" />
                <Label htmlFor="failed" className="flex items-center gap-2 cursor-pointer flex-1">
                  <AlertTriangle className="h-5 w-5 text-red-600" />
                  <div>
                    <p className="font-semibold">Entrega fallida</p>
                    <p className="text-xs text-gray-600">No se pudo completar la entrega</p>
                  </div>
                </Label>
              </div>
            </RadioGroup>
          </div>

          {status === 'failed' && (
            <div className="space-y-3 animate-in fade-in slide-in-from-top-2">
              <Label>Motivo del fallo</Label>
              <RadioGroup value={reason} onValueChange={setReason}>
                {failureReasons.map((r) => (
                  <div key={r} className="flex items-center space-x-2">
                    <RadioGroupItem value={r} id={r} />
                    <Label htmlFor={r} className="cursor-pointer">{r}</Label>
                  </div>
                ))}
              </RadioGroup>
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="notes">Notas adicionales</Label>
            <Textarea
              id="notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder={status === 'delivered' 
                ? "Ej: Entregado en mano al cliente, dejado en recepción..." 
                : "Ej: Cliente no contestó el teléfono, dirección cerrada..."}
              rows={3}
            />
          </div>

          <div className="flex gap-2">
            <Button 
              type="submit" 
              className={`flex-1 ${status === 'delivered' ? 'bg-green-600 hover:bg-green-700' : 'bg-red-600 hover:bg-red-700'}`}
            >
              {status === 'delivered' ? (
                <>
                  <CheckCircle className="h-4 w-4 mr-2" />
                  Confirmar Entrega Exitosa
                </>
              ) : (
                <>
                  <AlertTriangle className="h-4 w-4 mr-2" />
                  Registrar Entrega Fallida
                </>
              )}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}

export default FinishDeliveryForm;