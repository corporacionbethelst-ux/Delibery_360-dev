"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Package,
  CheckCircle,
  Clock,
  MapPin,
  User,
  Phone,
  Search,
  Eye,
} from "lucide-react";

// Definición del tipo de datos para las entregas
interface DeliveryData {
  id: string;
  customer: string;
  address: string;
  phone: string;
  status: string;
  rider: string | null;
  estimatedTime: string;
  distance: number;
  orderValue: number;
}

// Datos simulados de entregas para tracking
const mockDeliveries: DeliveryData[] = [
  {
    id: "DEL-001",
    customer: "Juan Pérez",
    address: "Av. Principal 123, Centro",
    phone: "+58 412 1234567",
    status: "in_transit",
    rider: "Carlos Rodríguez",
    estimatedTime: "15 min",
    distance: 2.5,
    orderValue: 45.00,
  },
  {
    id: "DEL-002",
    customer: "María González",
    address: "Calle 45, Los Palos Grandes",
    phone: "+58 414 7654321",
    status: "pending",
    rider: null,
    estimatedTime: "30 min",
    distance: 4.2,
    orderValue: 62.50,
  },
  {
    id: "DEL-003",
    customer: "Pedro Martínez",
    address: "Av. Libertador 456, Chacao",
    phone: "+58 416 9876543",
    status: "delivered",
    rider: "Ana López",
    estimatedTime: "Completado",
    distance: 3.8,
    orderValue: 38.75,
  },
];

/**
 * Componente principal para el seguimiento de entregas
 * Muestra lista de entregas activas con estado en tiempo real y detalles de cada entrega
 */
export default function DeliveryTracker() {
  // Estado para el filtro de estado seleccionado
  const [statusFilter, setStatusFilter] = useState("all");
  // Estado para el término de búsqueda
  const [searchTerm, setSearchTerm] = useState("");
  // Estado para las entregas filtradas
  const [filteredDeliveries, setFilteredDeliveries] = useState<DeliveryData[]>(mockDeliveries);
  // Estado para la entrega seleccionada (Corregido: ahora tiene tipo)
  const [selectedDelivery, setSelectedDelivery] = useState<DeliveryData | null>(null);

  // Filtrar entregas según estado y búsqueda
  useEffect(() => {
    filterDeliveries();
  }, [statusFilter, searchTerm]);

  // Filtrar entregas por estado y término de búsqueda
  const filterDeliveries = () => {
    let filtered = mockDeliveries;

    // Filtrar por estado si no es "all"
    if (statusFilter !== "all") {
      filtered = filtered.filter((d) => d.status === statusFilter);
    }

    // Filtrar por término de búsqueda
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(
        (d) =>
          d.id.toLowerCase().includes(term) ||
          d.customer.toLowerCase().includes(term) ||
          d.rider?.toLowerCase().includes(term) ||
          d.address.toLowerCase().includes(term)
      );
    }

    setFilteredDeliveries(filtered);
  };

  // Obtener color del badge según estado
  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case "delivered":
        return "default";
      case "in_transit":
        return "secondary";
      case "pending":
        return "outline";
      default:
        return "outline";
    }
  };

  // Obtener texto del estado en español
  const getStatusText = (status: string) => {
    switch (status) {
      case "delivered":
        return "Entregado";
      case "in_transit":
        return "En camino";
      case "pending":
        return "Pendiente";
      default:
        return status;
    }
  };

  // Obtener ícono según estado
  const getStatusIcon = (status: string) => {
    switch (status) {
      case "delivered":
        return <CheckCircle className="h-3 w-3 mr-1" />;
      case "in_transit":
        return <MapPin className="h-3 w-3 mr-1" />;
      case "pending":
        return <Clock className="h-3 w-3 mr-1" />;
      default:
        return <Package className="h-3 w-3 mr-1" />;
    }
  };

  return (
    <div className="space-y-6">
      {/* Encabezado con título y controles de filtro */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Seguimiento de Entregas</h1>
          <p className="text-muted-foreground">
            Monitoreo en tiempo real de todas las entregas
          </p>
        </div>
      </div>

      {/* Controles de filtro y búsqueda */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex gap-4 items-center">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar por ID, cliente, repartidor o dirección..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[200px]">
                <SelectValue placeholder="Filtrar por estado" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos los estados</SelectItem>
                <SelectItem value="pending">Pendientes</SelectItem>
                <SelectItem value="in_transit">En camino</SelectItem>
                <SelectItem value="delivered">Entregadas</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Tabla de entregas */}
      <Card>
        <CardHeader>
          <CardTitle>Entregas Activas ({filteredDeliveries.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>ID</TableHead>
                <TableHead>Cliente</TableHead>
                <TableHead>Dirección</TableHead>
                <TableHead>Repartidor</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead>Tiempo Est.</TableHead>
                <TableHead>Distancia</TableHead>
                <TableHead>Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredDeliveries.map((delivery) => (
                <TableRow key={delivery.id}>
                  <TableCell className="font-medium">{delivery.id}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <User className="h-4 w-4 text-muted-foreground" />
                      {delivery.customer}
                    </div>
                  </TableCell>
                  <TableCell className="max-w-[200px] truncate">
                    <div className="flex items-center gap-2">
                      <MapPin className="h-4 w-4 text-muted-foreground" />
                      {delivery.address}
                    </div>
                  </TableCell>
                  <TableCell>
                    {delivery.rider ? (
                      <div className="flex items-center gap-2">
                        <User className="h-4 w-4 text-muted-foreground" />
                        {delivery.rider}
                      </div>
                    ) : (
                      <span className="text-muted-foreground">Sin asignar</span>
                    )}
                  </TableCell>
                  <TableCell>
                    <Badge variant={getStatusBadgeVariant(delivery.status)}>
                      {getStatusIcon(delivery.status)}
                      {getStatusText(delivery.status)}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Clock className="h-4 w-4 text-muted-foreground" />
                      {delivery.estimatedTime}
                    </div>
                  </TableCell>
                  <TableCell>{delivery.distance} km</TableCell>
                  <TableCell>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setSelectedDelivery(delivery)}
                    >
                      <Eye className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Detalles de entrega seleccionada */}
      {selectedDelivery && (
        <Card>
          <CardHeader>
            <CardTitle>Detalles de Entrega - {selectedDelivery.id}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <h4 className="font-semibold mb-2">Información del Cliente</h4>
                <p className="text-sm">
                  <strong>Nombre:</strong> {selectedDelivery.customer}
                </p>
                <p className="text-sm">
                  <strong>Teléfono:</strong>{" "}
                  <a href={`tel:${selectedDelivery.phone}`} className="text-blue-600">
                    {selectedDelivery.phone}
                  </a>
                </p>
                <p className="text-sm">
                  <strong>Dirección:</strong> {selectedDelivery.address}
                </p>
              </div>
              <div>
                <h4 className="font-semibold mb-2">Información de Entrega</h4>
                <p className="text-sm">
                  <strong>Estado:</strong> {getStatusText(selectedDelivery.status)}
                </p>
                <p className="text-sm">
                  <strong>Repartidor:</strong>{" "}
                  {selectedDelivery.rider || "Sin asignar"}
                </p>
                <p className="text-sm">
                  <strong>Tiempo estimado:</strong> {selectedDelivery.estimatedTime}
                </p>
                <p className="text-sm">
                  <strong>Distancia:</strong> {selectedDelivery.distance} km
                </p>
                <p className="text-sm">
                  <strong>Valor:</strong> ${selectedDelivery.orderValue.toFixed(2)}
                </p>
              </div>
            </div>
            <div className="mt-4 flex gap-2">
              <Button onClick={() => setSelectedDelivery(null)}>Cerrar</Button>
              {selectedDelivery.rider && (
                <Button variant="outline">
                  <Phone className="h-4 w-4 mr-2" />
                  Contactar Repartidor
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}