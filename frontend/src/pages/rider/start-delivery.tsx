import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { MapPin, Package, Clock, Navigation, Camera, CheckCircle } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';

export default function RiderStartDeliveryPage() {
  const [step, setStep] = useState(1);
  const [pickupPhoto, setPickupPhoto] = useState<File | null>(null); // State initialized to null
  const [notes, setNotes] = useState('');

  const handleTakePhoto = () => {
    // Simular toma de foto
    alert('Abriendo cámara para tomar foto del pedido...');
    setPickupPhoto(new File([''], 'pickup.jpg'));
  };

  const handleConfirmPickup = () => {
    if (!pickupPhoto) {
      alert('Debes tomar una foto del pedido antes de continuar');
      return;
    }
    setStep(2);
    alert('Pedido recogido exitosamente. Dirígete al punto de entrega.');
  };

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-3xl font-bold text-gray-900">Iniciar Entrega</h1>

      {/* Stepper */}
      <div className="flex items-center justify-center gap-4">
        <div className={`flex items-center gap-2 ${step >= 1 ? 'text-blue-600' : 'text-gray-400'}`}>
          <div className={`w-8 h-8 rounded-full flex items-center justify-center border-2 ${
            step >= 1 ? 'border-blue-600 bg-blue-600 text-white' : 'border-gray-300'
          }`}>
            1
          </div>
          <span className="text-sm font-medium">Recoger Pedido</span>
        </div>
        <div className={`w-12 h-0.5 ${step >= 2 ? 'bg-blue-600' : 'bg-gray-300'}`} />
        <div className={`flex items-center gap-2 ${step >= 2 ? 'text-blue-600' : 'text-gray-400'}`}>
          <div className={`w-8 h-8 rounded-full flex items-center justify-center border-2 ${
            step >= 2 ? 'border-blue-600 bg-blue-600 text-white' : 'border-gray-300'
          }`}>
            2
          </div>
          <span className="text-sm font-medium">En Camino</span>
        </div>
        <div className={`w-12 h-0.5 bg-gray-300`} />
        <div className="flex items-center gap-2 text-gray-400">
          <div className="w-8 h-8 rounded-full flex items-center justify-center border-2 border-gray-300">
            3
          </div>
          <span className="text-sm font-medium">Entregar</span>
        </div>
      </div>

      {step === 1 && (
        <>
          <Alert>
            <AlertDescription className="flex items-start gap-2">
              <MapPin className="w-5 h-5 flex-shrink-0 mt-0.5" />
              <div>
                <strong>Punto de Recogida:</strong><br />
                Restaurante La Piazza - Rua das Flores, 123, Centro<br />
                Teléfono: (11) 98765-4321
              </div>
            </AlertDescription>
          </Alert>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Package className="w-5 h-5" />
                Detalles del Pedido
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Número de Pedido</Label>
                  <p className="font-medium">#DEL-2024-0156</p>
                </div>
                <div>
                  <Label>Cliente</Label>
                  <p className="font-medium">María González</p>
                </div>
                <div>
                  <Label>Items</Label>
                  <p className="font-medium">2 Pizzas, 1 Bebida</p>
                </div>
                <div>
                  <Label>Distancia</Label>
                  <p className="font-medium">3.2 km</p>
                </div>
              </div>

              <div className="pt-4 border-t">
                <Label className="mb-2 block">Instrucciones Especiales</Label>
                <p className="text-sm text-gray-600 bg-gray-50 p-3 rounded">
                  El cliente pidió extra servilletas. Pedido listo para recoger en mostrador principal.
                </p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Camera className="w-5 h-5" />
                Comprobante de Recogida
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="text-sm text-gray-600">
                Toma una foto del pedido antes de salir del restaurante. Esto sirve como comprobante de recogida.
              </div>

              {!pickupPhoto ? (
                <Button onClick={handleTakePhoto} className="w-full">
                  <Camera className="w-4 h-4 mr-2" />
                  Tomar Foto del Pedido
                </Button>
              ) : (
                <div className="border-2 border-green-500 rounded-lg p-4 text-center">
                  <CheckCircle className="w-8 h-8 text-green-500 mx-auto mb-2" />
                  <p className="text-green-600 font-medium">Foto tomada exitosamente</p>
                  <Button variant="outline" size="sm" onClick={handleTakePhoto} className="mt-2">
                    Volver a tomar
                  </Button>
                </div>
              )}

              <div>
                <Label htmlFor="notes">Notas Adicionales (Opcional)</Label>
                <Input
                  id="notes"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Ej: El restaurante tardó 10 min en preparar..."
                />
              </div>

              <Button 
                className="w-full" 
                size="lg"
                onClick={handleConfirmPickup}
                disabled={!pickupPhoto}
              >
                <CheckCircle className="w-4 h-4 mr-2" />
                Confirmar Recogida e Iniciar Entrega
              </Button>
            </CardContent>
          </Card>
        </>
      )}

      {step === 2 && (
        <>
          <Alert className="bg-blue-50 border-blue-200">
            <AlertDescription className="flex items-start gap-2 text-blue-800">
              <Navigation className="w-5 h-5 flex-shrink-0 mt-0.5" />
              <div>
                <strong>En camino a la entrega</strong><br />
                Tiempo estimado: 15 minutos • Distancia: 3.2 km
              </div>
            </AlertDescription>
          </Alert>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MapPin className="w-5 h-5" />
                Punto de Entrega
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="bg-gray-50 p-4 rounded-lg">
                  <p className="font-medium">Rua Augusta, 456 - Apto 82</p>
                  <p className="text-sm text-gray-600">Jardins, São Paulo - SP</p>
                  <p className="text-sm text-gray-600 mt-2">Referencia: Edificio Azul, portero 24hs</p>
                </div>

                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-2">
                    <Clock className="w-4 h-4 text-gray-500" />
                    <span className="text-sm">Entrega estimada: 19:45</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <MapPin className="w-4 h-4 text-gray-500" />
                    <span className="text-sm">3.2 km restantes</span>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <Button variant="outline" className="w-full">
                    <Navigation className="w-4 h-4 mr-2" />
                    Abrir GPS
                  </Button>
                  <Button variant="outline" className="w-full">
                    <MapPin className="w-4 h-4 mr-2" />
                    Llamar Cliente
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Información del Cliente</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex justify-between">
                <span className="text-gray-600">Nombre:</span>
                <span className="font-medium">María González</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Teléfono:</span>
                <span className="font-medium">(11) 91234-5678</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Instrucciones:</span>
                <span className="font-medium text-sm">Timbre del apto 82. Dejar en portería si no responde.</span>
              </div>
            </CardContent>
          </Card>

          <Button className="w-full" size="lg" onClick={() => setStep(3)}>
            Llegué al Destino
          </Button>
        </>
      )}
    </div>
  );
}
