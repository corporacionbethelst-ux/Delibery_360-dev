'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import api from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, Motorbike, Bike, Car, CheckCircle } from 'lucide-react';

const vehicleOptions = [
  { value: 'bicycle', label: 'Bicicleta', icon: Bike },
  { value: 'motorcycle', label: 'Motocicleta', icon: Motorbike },
  { value: 'car', label: 'Automóvil', icon: Car },
];

const registerSchema = z.object({
  full_name: z.string().min(3, 'Nombre completo requerido'),
  email: z.string().email('Email inválido'),
  password: z.string().min(6, 'Mínimo 6 caracteres'),
  phone: z.string().min(8, 'Teléfono inválido'),
  vehicle_type: z.enum(['bicycle', 'motorcycle', 'car']),
  license_plate: z.string().optional(),
  document_id: z.string().min(5, 'Documento de identidad requerido'),
});

type RegisterForm = z.infer<typeof registerSchema>;

export default function RegisterRiderPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const { register, handleSubmit, watch, formState: { errors } } = useForm<RegisterForm>({
    resolver: zodResolver(registerSchema),
  });

  const vehicleType = watch('vehicle_type');

  const onSubmit = async (data: RegisterForm) => {
    setIsLoading(true);
    setError(null);
    try {
      // Llamada real a la API del backend
      await api.registerRider(data);
      setSuccess(true);
      setTimeout(() => router.push('/rider'), 2000);
    } catch (err: any) {
      setError(err.message || 'Error al registrar. Intente nuevamente.');
    } finally {
      setIsLoading(false);
    }
  };

  if (success) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <Card className="w-full max-w-md text-center p-6">
          <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold mb-2">¡Registro Exitoso!</h2>
          <p className="text-gray-600">Redirigiendo a tu panel de control...</p>
        </Card>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-50 p-4">
      <Card className="w-full max-w-lg">
        <CardHeader>
          <CardTitle>Registro de Repartidor</CardTitle>
          <CardDescription>Únete a Delivery360 y comienza a ganar dinero hoy.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="full_name">Nombre Completo</Label>
                <Input id="full_name" {...register('full_name')} placeholder="Juan Pérez" />
                {errors.full_name && <span className="text-red-500 text-sm">{errors.full_name.message}</span>}
              </div>
              <div className="space-y-2">
                <Label htmlFor="document_id">DNI / Pasaporte</Label>
                <Input id="document_id" {...register('document_id')} placeholder="12345678" />
                {errors.document_id && <span className="text-red-500 text-sm">{errors.document_id.message}</span>}
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">Correo Electrónico</Label>
              <Input id="email" type="email" {...register('email')} placeholder="juan@ejemplo.com" />
              {errors.email && <span className="text-red-500 text-sm">{errors.email.message}</span>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="phone">Teléfono</Label>
              <Input id="phone" type="tel" {...register('phone')} placeholder="+54 9 11..." />
              {errors.phone && <span className="text-red-500 text-sm">{errors.phone.message}</span>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Contraseña</Label>
              <Input id="password" type="password" {...register('password')} placeholder="******" />
              {errors.password && <span className="text-red-500 text-sm">{errors.password.message}</span>}
            </div>

            <div className="space-y-2">
              <Label>Tipo de Vehículo</Label>
              <Select onValueChange={(val: any) => register('vehicle_type').onChange({ target: { value: val } })}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecciona tu vehículo" />
                </SelectTrigger>
                <SelectContent>
                  {vehicleOptions.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value}>
                      <div className="flex items-center gap-2">
                        <opt.icon className="w-4 h-4" /> {opt.label}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.vehicle_type && <span className="text-red-500 text-sm">{errors.vehicle_type.message}</span>}
            </div>

            {(vehicleType === 'motorcycle' || vehicleType === 'car') && (
              <div className="space-y-2 animate-in fade-in slide-in-from-top-2">
                <Label htmlFor="license_plate">Patente / Placa</Label>
                <Input id="license_plate" {...register('license_plate')} placeholder="AB123CD" />
                {errors.license_plate && <span className="text-red-500 text-sm">{errors.license_plate.message}</span>}
              </div>
            )}

            {error && (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : 'Registrarme'}
            </Button>
          </form>
        </CardContent>
        <CardFooter className="flex justify-center">
          <p className="text-sm text-gray-500">
            ¿Ya tienes cuenta? <a href="/login" className="text-blue-600 hover:underline">Inicia sesión</a>
          </p>
        </CardFooter>
      </Card>
    </div>
  );
}