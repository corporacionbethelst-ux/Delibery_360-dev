import React from 'react';
import { Camera, MapPin, Signature, CheckCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import type { Delivery } from '@/types/delivery';

interface ProofOfDeliveryProps {
  delivery: Delivery;
  onSubmit: (data: { photos: File[]; notes: string; customerName: string }) => void;
}

export function ProofOfDelivery({ delivery, onSubmit }: ProofOfDeliveryProps) {
  const [photos, setPhotos] = React.useState<File[]>([]);
  const [notes, setNotes] = React.useState('');
  // Inicializar con el nombre del cliente si existe en la orden asociada
  const [customerName, setCustomerName] = React.useState(delivery.order?.customerName || '');
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setPhotos(Array.from(e.target.files));
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({ photos, notes, customerName });
  };

  return (
    <Card className="w-full max-w-2xl">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <CheckCircle className="h-6 w-6 text-green-600" />
          Comprobante de Entrega
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="bg-blue-50 p-4 rounded-lg">
            <h4 className="font-semibold mb-2">Entrega #{delivery.id.slice(0, 8)}</h4>
            {/* CORRECCIÓN: Acceder a delivery.order?.customerName */}
            <p className="text-sm text-gray-600">
              Cliente: {delivery.order?.customerName || 'N/A'}
            </p>
            {/* CORRECCIÓN: Acceder a delivery.deliveryLocation.address */}
            <p className="text-sm text-gray-600">
              Dirección: {delivery.deliveryLocation?.address || 'Sin dirección'}
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="customerName">Nombre del receptor</Label>
            <Input
              id="customerName"
              value={customerName}
              onChange={(e) => setCustomerName(e.target.value)}
              placeholder="Nombre completo de quien recibe"
              required
            />
          </div>

          <div className="space-y-2">
            <Label>Fotos del comprobante</Label>
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
              <Camera className="h-10 w-10 mx-auto text-gray-400 mb-2" />
              <p className="text-sm text-gray-600 mb-2">
                {photos.length > 0 
                  ? `${photos.length} foto(s) seleccionada(s)`
                  : 'Arrastra fotos o haz clic para subir'}
              </p>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                multiple
                onChange={handlePhotoChange}
                className="hidden"
              />
              <Button
                type="button"
                variant="outline"
                onClick={() => fileInputRef.current?.click()}
              >
                Seleccionar Fotos
              </Button>
            </div>
            {photos.length > 0 && (
              <div className="grid grid-cols-3 gap-2 mt-2">
                {photos.map((photo, idx) => (
                  <div key={idx} className="relative aspect-square bg-gray-100 rounded overflow-hidden">
                    <img
                      src={URL.createObjectURL(photo)}
                      alt={`Preview ${idx + 1}`}
                      className="w-full h-full object-cover"
                    />
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">Notas adicionales</Label>
            <Textarea
              id="notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Ej: Paquete dejado en recepción, entregado en mano, etc."
              rows={3}
            />
          </div>

          <div className="flex items-center gap-2 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
            <Signature className="h-5 w-5 text-yellow-600" />
            <p className="text-sm text-yellow-800">
              Al enviar este comprobante, la entrega se marcará como completada.
            </p>
          </div>

          <Button type="submit" className="w-full bg-green-600 hover:bg-green-700">
            <CheckCircle className="h-4 w-4 mr-2" />
            Confirmar Entrega
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}

export default ProofOfDelivery;