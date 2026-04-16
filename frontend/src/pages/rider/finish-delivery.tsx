import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { 
  MapPin, 
  Camera, 
  Signature, 
  CheckCircle, 
  AlertCircle,
  XCircle 
} from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';

export default function RiderFinishDeliveryPage() {
  const [step, setStep] = useState(1);
  const [otpCode, setOtpCode] = useState('');
  const [deliveryPhoto, setDeliveryPhoto] = useState<File | null>(null); // State initialized to null
  const [hasSignature, setHasSignature] = useState(false);
  const [deliveryIssue, setDeliveryIssue] = useState<string | null>(null); // State initialized to null

  const handleVerifyOTP = () => {
    if (otpCode.length !== 6) {
      alert('El código OTP debe tener 6 dígitos');
      return;
    }
    if (otpCode === '123456') { // Simular validación
      setStep(2);
    } else {
      alert('Código OTP incorrecto. Verifica con el cliente.');
    }
  };

  const handleTakeDeliveryPhoto = () => {
    alert('Abriendo cámara para tomar foto de la entrega...');
    setDeliveryPhoto(new File([''], 'delivery.jpg'));
  };

  const handleCompleteDelivery = () => {
    if (!deliveryPhoto && !hasSignature) {
      alert('Debes tomar una foto de la entrega o capturar la firma del cliente');
      return;
    }
    alert('¡Entrega completada exitosamente!');
    // Navegar al dashboard o lista de pedidos
  };

  const handleReportIssue = (issue: string) => {
    setDeliveryIssue(issue);
    alert(`Reportando incidencia: ${issue}`);
  };

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-3xl font-bold text-gray-900">Finalizar Entrega</h1>

      {/* Stepper */}
      <div className="flex items-center justify-center gap-4">
        <div className="flex items-center gap-2 text-green-600">
          <div className="w-8 h-8 rounded-full flex items-center justify-center border-2 border-green-600 bg-green-600 text-white">
            <CheckCircle className="w-4 h-4" />
          </div>
          <span className="text-sm font-medium">En Camino</span>
        </div>
        <div className="w-12 h-0.5 bg-green-600" />
        <div className={`flex items-center gap-2 ${step >= 1 ? 'text-blue-600' : 'text-gray-400'}`}>
          <div className={`w-8 h-8 rounded-full flex items-center justify-center border-2 ${
            step >= 1 ? 'border-blue-600 bg-blue-600 text-white' : 'border-gray-300'
          }`}>
            {step >= 1 ? <CheckCircle className="w-4 h-4" /> : '1'}
          </div>
          <span className="text-sm font-medium">Verificar OTP</span>
        </div>
        <div className={`w-12 h-0.5 ${step >= 2 ? 'bg-blue-600' : 'bg-gray-300'}`} />
        <div className={`flex items-center gap-2 ${step >= 2 ? 'text-blue-600' : 'text-gray-400'}`}>
          <div className={`w-8 h-8 rounded-full flex items-center justify-center border-2 ${
            step >= 2 ? 'border-blue-600 bg-blue-600 text-white' : 'border-gray-300'
          }`}>
            {step >= 2 ? <CheckCircle className="w-4 h-4" /> : '2'}
          </div>
          <span className="text-sm font-medium">Comprobante</span>
        </div>
      </div>

      {step === 1 && (
        <>
          <Alert className="bg-blue-50 border-blue-200">
            <AlertDescription className="flex items-start gap-2 text-blue-800">
              <MapPin className="w-5 h-5 flex-shrink-0 mt-0.5" />
              <div>
                <strong>Has llegado al destino</strong><br />
                Rua Augusta, 456 - Apto 82, Jardins, São Paulo<br />
                Cliente: María González - (11) 91234-5678
              </div>
            </AlertDescription>
          </Alert>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertCircle className="w-5 h-5" />
                Verificación de Seguridad
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-gray-600">
                El cliente ha generado un código OTP de 6 dígitos para verificar la entrega. 
                Pídele que te lo proporcione e ingrésalo a continuación.
              </p>

              <div>
                <Label htmlFor="otp">Código OTP</Label>
                <Input
                  id="otp"
                  value={otpCode}
                  onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                  placeholder="000000"
                  className="text-center text-2xl tracking-widest"
                  maxLength={6}
                />
                <p className="text-xs text-gray-500 mt-1">
                  Código proporcionado por el cliente en la app
                </p>
              </div>

              <Button 
                className="w-full" 
                size="lg"
                onClick={handleVerifyOTP}
                disabled={otpCode.length !== 6}
              >
                Verificar Código
              </Button>

              <div className="pt-4 border-t">
                <p className="text-sm font-medium mb-2">¿Problemas con el OTP?</p>
                <div className="grid grid-cols-2 gap-2">
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => handleReportIssue('Cliente no responde')}
                  >
                    <XCircle className="w-4 h-4 mr-2" />
                    Cliente no responde
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => handleReportIssue('Dirección incorrecta')}
                  >
                    <XCircle className="w-4 h-4 mr-2" />
                    Dirección incorrecta
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </>
      )}

      {step === 2 && (
        <>
          <Alert className="bg-green-50 border-green-200">
            <AlertDescription className="flex items-start gap-2 text-green-800">
              <CheckCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
              <div>
                <strong>OTP Verificado Correctamente</strong><br />
                Ahora debes capturar el comprobante de entrega
              </div>
            </AlertDescription>
          </Alert>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Camera className="w-5 h-5" />
                Comprobante de Entrega
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-gray-600">
                Toma una foto del pedido entregado en la puerta del cliente o captura su firma digital.
              </p>

              {/* Opción de Foto */}
              <div className="border rounded-lg p-4">
                <Label className="mb-2 block flex items-center gap-2">
                  <Camera className="w-4 h-4" />
                  Foto de la Entrega
                </Label>
                {!deliveryPhoto ? (
                  <Button onClick={handleTakeDeliveryPhoto} className="w-full" variant="outline">
                    <Camera className="w-4 h-4 mr-2" />
                    Tomar Foto
                  </Button>
                ) : (
                  <div className="border-2 border-green-500 rounded-lg p-4 text-center">
                    <CheckCircle className="w-8 h-8 text-green-500 mx-auto mb-2" />
                    <p className="text-green-600 font-medium">Foto tomada exitosamente</p>
                    <Button variant="outline" size="sm" onClick={handleTakeDeliveryPhoto} className="mt-2">
                      Volver a tomar
                    </Button>
                  </div>
                )}
              </div>

              {/* Opción de Firma */}
              <div className="border rounded-lg p-4">
                <Label className="mb-2 block flex items-center gap-2">
                  <Signature className="w-4 h-4" />
                  Firma del Cliente
                </Label>
                <div className="border-2 border-dashed border-gray-300 rounded-lg h-40 flex items-center justify-center bg-gray-50">
                  <button
                    onClick={() => setHasSignature(true)}
                    className="text-gray-500 hover:text-gray-700"
                  >
                    {hasSignature ? (
                      <div className="text-center">
                        <CheckCircle className="w-8 h-8 text-green-500 mx-auto mb-2" />
                        <p className="text-green-600 font-medium">Firma capturada</p>
                      </div>
                    ) : (
                      <div className="text-center">
                        <Signature className="w-8 h-8 mx-auto mb-2" />
                        <p>Tocar para capturar firma</p>
                      </div>
                    )}
                  </button>
                </div>
              </div>

              <div className="pt-4">
                <Label className="mb-2 block">Notas de Entrega (Opcional)</Label>
                <select className="w-full border rounded-md px-3 py-2 bg-white">
                  <option value="">Seleccionar opción</option>
                  <option value="received">Entregado directamente al cliente</option>
                  <option value="door">Dejado en la puerta</option>
                  <option value="concierge">Entregado a portero/seguridad</option>
                  <option value="neighbor">Entregado a vecino</option>
                </select>
              </div>

              <Button 
                className="w-full" 
                size="lg"
                onClick={handleCompleteDelivery}
                disabled={!deliveryPhoto && !hasSignature}
              >
                <CheckCircle className="w-4 h-4 mr-2" />
                Completar Entrega
              </Button>

              <Button 
                variant="destructive" 
                className="w-full"
                onClick={() => handleReportIssue('No se pudo completar la entrega')}
              >
                <AlertCircle className="w-4 h-4 mr-2" />
                Reportar Problema con la Entrega
              </Button>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
