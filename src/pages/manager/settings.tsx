import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Settings, Bell, Users, CreditCard, MapPin, Shield, Save, RotateCcw } from 'lucide-react';

export default function ManagerSettingsPage() {
  const [activeTab, setActiveTab] = useState('general');
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    setSaving(true);
    setTimeout(() => setSaving(false), 1000);
  };

  const tabs = [
    { id: 'general', label: 'General', icon: Settings },
    { id: 'notifications', label: 'Notificaciones', icon: Bell },
    { id: 'team', label: 'Equipo', icon: Users },
    { id: 'payments', label: 'Pagos', icon: CreditCard },
    { id: 'zones', label: 'Zonas', icon: MapPin },
    { id: 'security', label: 'Seguridad', icon: Shield },
  ];

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-gray-900">Configuración del Sistema</h1>
        <div className="flex gap-2">
          <Button variant="outline">
            <RotateCcw className="w-4 h-4 mr-2" />
            Restaurar Defaults
          </Button>
          <Button onClick={handleSave} disabled={saving}>
            <Save className="w-4 h-4 mr-2" />
            {saving ? 'Guardando...' : 'Guardar Cambios'}
          </Button>
        </div>
      </div>

      <Alert>
        <AlertDescription>
          Configura los parámetros generales del sistema Delivery360. Los cambios se aplicarán inmediatamente.
        </AlertDescription>
      </Alert>

      {/* Tabs de Navegación */}
      <div className="border-b">
        <div className="flex gap-4 overflow-x-auto">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-2 border-b-2 transition-colors whitespace-nowrap ${
                activeTab === tab.id
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              <tab.icon className="w-4 h-4" />
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Contenido de las Tabs */}
      <div className="space-y-6">
        {activeTab === 'general' && (
          <Card>
            <CardHeader>
              <CardTitle>Configuración General</CardTitle>
              <CardDescription>Parámetros básicos del sistema</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="companyName">Nombre de la Empresa</Label>
                  <Input id="companyName" defaultValue="Delivery360" />
                </div>
                <div>
                  <Label htmlFor="timezone">Zona Horaria</Label>
                  <Select defaultValue="America/Sao_Paulo">
                    <SelectTrigger>
                      <SelectValue placeholder="Seleccionar zona horaria" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="America/Sao_Paulo">São Paulo (GMT-3)</SelectItem>
                      <SelectItem value="America/Mexico_City">Ciudad de México (GMT-6)</SelectItem>
                      <SelectItem value="America/Bogota">Bogotá (GMT-5)</SelectItem>
                      <SelectItem value="America/Lima">Lima (GMT-5)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="currency">Moneda</Label>
                  <Select defaultValue="BRL">
                    <SelectTrigger>
                      <SelectValue placeholder="Seleccionar moneda" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="BRL">Real Brasileño (R$)</SelectItem>
                      <SelectItem value="USD">Dólar Americano ($)</SelectItem>
                      <SelectItem value="EUR">Euro (€)</SelectItem>
                      <SelectItem value="MXN">Peso Mexicano ($)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="language">Idioma</Label>
                  <Select defaultValue="es">
                    <SelectTrigger>
                      <SelectValue placeholder="Seleccionar idioma" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="es">Español</SelectItem>
                      <SelectItem value="pt">Portugués</SelectItem>
                      <SelectItem value="en">Inglés</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <Switch id="maintenanceMode" />
                <Label htmlFor="maintenanceMode">Modo de Mantenimiento</Label>
              </div>
            </CardContent>
          </Card>
        )}

        {activeTab === 'notifications' && (
          <Card>
            <CardHeader>
              <CardTitle>Configuración de Notificaciones</CardTitle>
              <CardDescription>Controla las notificaciones del sistema</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {[
                { id: 'emailOrders', label: 'Email por nuevo pedido' },
                { id: 'emailDeliveries', label: 'Email por entrega completada' },
                { id: 'smsAlerts', label: 'SMS para alertas críticas' },
                { id: 'pushNotifications', label: 'Notificaciones Push' },
                { id: 'dailyReports', label: 'Reportes diarios por email' },
              ].map((item) => (
                <div key={item.id} className="flex items-center justify-between">
                  <Label htmlFor={item.id}>{item.label}</Label>
                  <Switch id={item.id} defaultChecked />
                </div>
              ))}
            </CardContent>
          </Card>
        )}

        {activeTab === 'payments' && (
          <Card>
            <CardHeader>
              <CardTitle>Configuración de Pagos</CardTitle>
              <CardDescription>Métodos de pago y comisiones</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="commissionRate">Comisión Estándar (%)</Label>
                  <Input id="commissionRate" type="number" defaultValue="15" />
                </div>
                <div>
                  <Label htmlFor="minOrderValue">Valor Mínimo del Pedido (R$)</Label>
                  <Input id="minOrderValue" type="number" defaultValue="10" />
                </div>
                <div>
                  <Label htmlFor="deliveryFeeBase">Tarifa Base de Entrega (R$)</Label>
                  <Input id="deliveryFeeBase" type="number" defaultValue="5" />
                </div>
                <div>
                  <Label htmlFor="freeDeliveryThreshold">Envío Gratis a partir de (R$)</Label>
                  <Input id="freeDeliveryThreshold" type="number" defaultValue="50" />
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <Switch id="surgePricing" defaultChecked />
                <Label htmlFor="surgePricing">Habilitar Precio Dinámico (Surge Pricing)</Label>
              </div>
            </CardContent>
          </Card>
        )}

        {activeTab === 'zones' && (
          <Card>
            <CardHeader>
              <CardTitle>Gestión de Zonas de Reparto</CardTitle>
              <CardDescription>Define las áreas de cobertura</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="h-64 bg-gray-100 rounded flex items-center justify-center">
                <div className="text-center text-gray-500">
                  <MapPin className="w-12 h-12 mx-auto mb-2" />
                  <p>Mapa interactivo de zonas de reparto</p>
                  <p className="text-sm">Próximamente: Editor de polígonos</p>
                </div>
              </div>
              <Button variant="outline" className="w-full">
                Agregar Nueva Zona
              </Button>
            </CardContent>
          </Card>
        )}

        {activeTab === 'security' && (
          <Card>
            <CardHeader>
              <CardTitle>Configuración de Seguridad</CardTitle>
              <CardDescription>Control de acceso y autenticación</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center space-x-2">
                <Switch id="twoFactor" />
                <Label htmlFor="twoFactor">Autenticación de Dos Factores (2FA)</Label>
              </div>
              <div className="flex items-center space-x-2">
                <Switch id="sessionTimeout" defaultChecked />
                <Label htmlFor="sessionTimeout">Timeout de Sesión (30 min)</Label>
              </div>
              <div className="flex items-center space-x-2">
                <Switch id="passwordPolicy" defaultChecked />
                <Label htmlFor="passwordPolicy">Política de Contraseñas Fuertes</Label>
              </div>
              <div className="flex items-center space-x-2">
                <Switch id="auditLog" defaultChecked />
                <Label htmlFor="auditLog">Registro de Auditoría (Audit Log)</Label>
              </div>
              <div className="pt-4">
                <Button variant="destructive">Cerrar Todas las Sesiones Activas</Button>
              </div>
            </CardContent>
          </Card>
        )}

        {activeTab === 'team' && (
          <Card>
            <CardHeader>
              <CardTitle>Gestión de Equipo</CardTitle>
              <CardDescription>Administradores y operadores del sistema</CardDescription>
            </CardHeader>
            <CardContent>
              <Button className="w-full">Invitar Nuevo Miembro al Equipo</Button>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
