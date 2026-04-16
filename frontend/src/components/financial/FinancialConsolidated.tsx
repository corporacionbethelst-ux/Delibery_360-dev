"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DollarSign,
  TrendingUp,
  Download,
  CheckCircle,
  Clock,
} from "lucide-react";
import { formatCurrency } from "@/lib/utils";

// Datos simulados de consolidado financiero
const mockFinancialData = [
  {
    id: 1,
    date: "2024-01-15",
    totalOrders: 145,
    completedOrders: 138,
    revenue: 2175.50,
    riderPayments: 1564.20,
    platformFees: 435.10,
    taxes: 176.20,
    status: "completed",
  },
  {
    id: 2,
    date: "2024-01-14",
    totalOrders: 132,
    completedOrders: 125,
    revenue: 1980.00,
    riderPayments: 1425.00,
    platformFees: 396.00,
    taxes: 159.00,
    status: "completed",
  },
  {
    id: 3,
    date: "2024-01-13",
    totalOrders: 158,
    completedOrders: 150,
    revenue: 2370.00,
    riderPayments: 1702.50,
    platformFees: 474.00,
    taxes: 193.50,
    status: "completed",
  },
];

/**
 * Componente principal para el consolidado financiero
 * Muestra resumen financiero global con métricas clave y desglose por período
 */
export default function FinancialConsolidated() {
  // Estado para el período seleccionado
  const [selectedPeriod, setSelectedPeriod] = useState("today");
  // Estado para los datos financieros
  const [financialData, setFinancialData] = useState(mockFinancialData);
  // Estado para el estado de carga
  const [isLoading, setIsLoading] = useState(false);

  // Calcular métricas consolidadas
  const calculateMetrics = () => {
    const totalRevenue = financialData.reduce((sum, item) => sum + item.revenue, 0);
    const totalRiderPayments = financialData.reduce(
      (sum, item) => sum + item.riderPayments,
      0
    );
    const totalPlatformFees = financialData.reduce(
      (sum, item) => sum + item.platformFees,
      0
    );
    const totalTaxes = financialData.reduce((sum, item) => sum + item.taxes, 0);
    const totalNetProfit = totalRevenue - totalRiderPayments - totalPlatformFees - totalTaxes;
    const totalOrders = financialData.reduce((sum, item) => sum + item.totalOrders, 0);
    const completedOrders = financialData.reduce(
      (sum, item) => sum + item.completedOrders,
      0
    );

    return {
      totalRevenue,
      totalRiderPayments,
      totalPlatformFees,
      totalTaxes,
      totalNetProfit,
      totalOrders,
      completedOrders,
      completionRate: totalOrders > 0 ? (completedOrders / totalOrders) * 100 : 0,
    };
  };

  // Obtener métricas consolidadas
  const metrics = calculateMetrics();

  // Cargar datos según el período seleccionado
  useEffect(() => {
    loadFinancialData();
  }, [selectedPeriod]);

  // Cargar datos financieros del backend
  const loadFinancialData = async () => {
    setIsLoading(true);
    try {
      // Simulación de carga de datos
      await new Promise((resolve) => setTimeout(resolve, 500));
      // En producción: fetch(`/api/financial/consolidated?period=${selectedPeriod}`)
    } catch (error) {
      console.error("Error loading financial data:", error);
    } finally {
      setIsLoading(false);
    }
  };

  // Exportar reporte financiero a CSV
  const exportReport = () => {
    console.log("Exportando reporte financiero...");
    // Lógica de exportación a CSV/PDF
  };

  return (
    <div className="space-y-6">
      {/* Encabezado con título y acciones */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Consolidado Financiero</h1>
          <p className="text-muted-foreground">
            Resumen financiero global de la plataforma
          </p>
        </div>
        <div className="flex gap-2">
          <Select value={selectedPeriod} onValueChange={setSelectedPeriod}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Seleccionar período" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="today">Hoy</SelectItem>
              <SelectItem value="yesterday">Ayer</SelectItem>
              <SelectItem value="week">Esta semana</SelectItem>
              <SelectItem value="month">Este mes</SelectItem>
              <SelectItem value="quarter">Este trimestre</SelectItem>
              <SelectItem value="year">Este año</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" onClick={exportReport}>
            <Download className="mr-2 h-4 w-4" />
            Exportar
          </Button>
        </div>
      </div>

      {/* Tarjetas de métricas principales */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Ingresos Totales</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(metrics.totalRevenue)}</div>
            <p className="text-xs text-muted-foreground">
              <span className="text-green-600 flex items-center">
                <TrendingUp className="mr-1 h-3 w-3" />
                +12.5%
              </span>{" "}
              vs período anterior
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pagos a Repartidores</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(metrics.totalRiderPayments)}</div>
            <p className="text-xs text-muted-foreground">
              {((metrics.totalRiderPayments / metrics.totalRevenue) * 100).toFixed(1)}% de ingresos
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Comisiones Plataforma</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(metrics.totalPlatformFees)}</div>
            <p className="text-xs text-muted-foreground">
              {((metrics.totalPlatformFees / metrics.totalRevenue) * 100).toFixed(1)}% de ingresos
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Ganancia Neta</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(metrics.totalNetProfit)}</div>
            <p className="text-xs text-muted-foreground">
              <span className="text-green-600 flex items-center">
                <TrendingUp className="mr-1 h-3 w-3" />
                +8.2%
              </span>{" "}
              margen neto
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Pestañas con diferentes vistas */}
      <Tabs defaultValue="summary" className="space-y-4">
        <TabsList>
          <TabsTrigger value="summary">Resumen</TabsTrigger>
          <TabsTrigger value="daily">Diario</TabsTrigger>
          <TabsTrigger value="detailed">Detallado</TabsTrigger>
          <TabsTrigger value="analytics">Analíticas</TabsTrigger>
        </TabsList>

        {/* Pestaña de Resumen */}
        <TabsContent value="summary" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Resumen del Período</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <div className="space-y-2">
                  <p className="text-sm text-muted-foreground">Órdenes Totales</p>
                  <p className="text-2xl font-bold">{metrics.totalOrders}</p>
                </div>
                <div className="space-y-2">
                  <p className="text-sm text-muted-foreground">Órdenes Completadas</p>
                  <p className="text-2xl font-bold">{metrics.completedOrders}</p>
                </div>
                <div className="space-y-2">
                  <p className="text-sm text-muted-foreground">Tasa de Completitud</p>
                  <p className="text-2xl font-bold">{metrics.completionRate.toFixed(1)}%</p>
                </div>
                <div className="space-y-2">
                  <p className="text-sm text-muted-foreground">Impuestos</p>
                  <p className="text-2xl font-bold">{formatCurrency(metrics.totalTaxes)}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Pestaña Diario */}
        <TabsContent value="daily" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Desglose Diario</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Fecha</TableHead>
                    <TableHead>Órdenes</TableHead>
                    <TableHead>Ingresos</TableHead>
                    <TableHead>Pagos Riders</TableHead>
                    <TableHead>Comisiones</TableHead>
                    <TableHead>Impuestos</TableHead>
                    <TableHead>Estado</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {financialData.map((item) => (
                    <TableRow key={item.id}>
                      <TableCell className="font-medium">{item.date}</TableCell>
                      <TableCell>{item.totalOrders}</TableCell>
                      <TableCell>{formatCurrency(item.revenue)}</TableCell>
                      <TableCell>{formatCurrency(item.riderPayments)}</TableCell>
                      <TableCell>{formatCurrency(item.platformFees)}</TableCell>
                      <TableCell>{formatCurrency(item.taxes)}</TableCell>
                      <TableCell>
                        <Badge
                          variant={item.status === "completed" ? "default" : "secondary"}
                        >
                          {item.status === "completed" ? (
                            <CheckCircle className="h-3 w-3 mr-1" />
                          ) : (
                            <Clock className="h-3 w-3 mr-1" />
                          )}
                          {item.status}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Pestaña Detallado */}
        <TabsContent value="detailed" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Vista Detallada</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                Vista detallada con desglose por categoría, zona geográfica y tipo de servicio.
              </p>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Pestaña Analíticas */}
        <TabsContent value="analytics" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Analíticas Financieras</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                Gráficos y tendencias financieras históricas.
              </p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
