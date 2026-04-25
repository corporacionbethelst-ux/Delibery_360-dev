'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { useRidersStore } from '@/stores/ridersStore';
import type { RiderCreateInput, RiderVehicleType } from '@/types/rider';

// Esquema de validación actualizado con campos requeridos por el modelo Rider
const riderFormSchema = z.object({
  fullName: z.string().min(3, 'El nombre debe tener al menos 3 caracteres'),
  email: z.string().email('Email inválido'),
  phone: z.string().min(8, 'Teléfono inválido'),
  cpf: z.string().min(9, 'CPF requerido'), // Campo añadido
  birthDate: z.string().min(1, 'Fecha de nacimiento requerida'), // Campo añadido
  vehicleType: z.enum(['MOTO', 'BICICLETA', 'AUTO', 'PIE'], {
    required_error: 'Selecciona un tipo de vehículo',
  }),
  vehiclePlate: z.string().optional(),
  operatingZone: z.string().min(1, 'Zona requerida'),
  password: z.string().min(6, 'La contraseña debe tener al menos 6 caracteres'),
});

type RiderFormValues = z.infer<typeof riderFormSchema>;

interface RiderRegistrationFormProps {
  onSuccess?: () => void;
  onCancel?: () => void;
}

export default function RiderRegistrationForm({ onSuccess, onCancel }: RiderRegistrationFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { createRider } = useRidersStore();

  const form = useForm<RiderFormValues>({
    resolver: zodResolver(riderFormSchema),
    defaultValues: {
      fullName: '',
      email: '',
      phone: '',
      cpf: '',
      birthDate: '',
      vehicleType: 'MOTO',
      vehiclePlate: '',
      operatingZone: '',
      password: '',
    },
  });

  const onSubmit = async (data: RiderFormValues) => {
    setIsSubmitting(true);
    try {
      // Transformar los datos del formulario para que coincidan con RiderCreateInput
      const payload: RiderCreateInput = {
        fullName: data.fullName,
        email: data.email,
        password: data.password,
        phone: data.phone,
        cpf: data.cpf,
        cnh: undefined, // Opcional, podrías añadirlo al formulario si lo necesitas
        birthDate: new Date(data.birthDate), // Convertir string a Date
        vehicle: {
          type: data.vehicleType as RiderVehicleType,
          plate: data.vehiclePlate || undefined,
          model: undefined,
          color: undefined,
          year: undefined,
        },
        operatingZone: data.operatingZone,
      };

      await createRider(payload);
      form.reset();
      onSuccess?.();
    } catch (error: any) {
      console.error('Error al crear repartidor:', error);
      // Aquí podrías mostrar un toast de error
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Registrar Nuevo Repartidor</CardTitle>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="fullName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nombre Completo</FormLabel>
                  <FormControl>
                    <Input placeholder="Ej. Juan Pérez" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email</FormLabel>
                    <FormControl>
                      <Input type="email" placeholder="juan@ejemplo.com" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="phone"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Teléfono</FormLabel>
                    <FormControl>
                      <Input placeholder="+55 11 99999-9999" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="cpf"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>CPF / Documento</FormLabel>
                    <FormControl>
                      <Input placeholder="000.000.000-00" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="birthDate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Fecha de Nacimiento</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="vehicleType"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Tipo de Vehículo</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecciona vehículo" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="MOTO">🏍️ Moto</SelectItem>
                        <SelectItem value="BICICLETA">🚴 Bicicleta</SelectItem>
                        <SelectItem value="AUTO">🚗 Auto</SelectItem>
                        <SelectItem value="PIE">🚶 A pie</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="vehiclePlate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Placa / Patente (Opcional)</FormLabel>
                    <FormControl>
                      <Input placeholder="ABC-1234" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="operatingZone"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Zona de Operación</FormLabel>
                  <FormControl>
                    <Input placeholder="Ej. Centro, Norte, Sur..." {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="password"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Contraseña Temporal</FormLabel>
                  <FormControl>
                    <Input type="password" placeholder="******" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex gap-2 pt-4">
              <Button 
                type="button" 
                variant="outline" 
                className="flex-1"
                onClick={onCancel}
              >
                Cancelar
              </Button>
              <Button 
                type="submit" 
                className="flex-1"
                disabled={isSubmitting}
              >
                {isSubmitting ? 'Registrando...' : 'Registrar Repartidor'}
              </Button>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}