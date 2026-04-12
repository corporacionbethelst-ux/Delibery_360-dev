import { useState, useEffect } from 'react';
import { useRidersStore } from '@/stores/ridersStore';
import { RiderCard } from '@/components/riders/RiderCard';
import { RiderList } from '@/components/riders/RiderList';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus, Search, Filter } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export default function ManagerRidersPage() {
  const { riders, loading, getRiders, updateRiderStatus } = useRidersStore();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('list');

  useEffect(() => {
    getRiders();
  }, []);

  const filteredRiders = riders.filter(rider => {
    const matchesSearch = rider.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         rider.email?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || rider.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const handleAddRider = () => {
    // TODO: Implementar modal de agregar repartidor
    alert('Funcionalidad de agregar repartidor - Pendiente de implementar modal');
  };

  if (loading) return <div className="p-8 text-center">Cargando repartidores...</div>;

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center flex-wrap gap-4">
        <h1 className="text-3xl font-bold text-gray-900">Gestión de Repartidores</h1>
        <Button onClick={handleAddRider}>
          <Plus className="w-4 h-4 mr-2" />
          Agregar Repartidor
        </Button>
      </div>

      {/* Filtros y Búsqueda */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <Input
                placeholder="Buscar por nombre o email..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[180px]">
                <Filter className="w-4 h-4 mr-2" />
                <SelectValue placeholder="Filtrar por estado" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                <SelectItem value="available">Disponibles</SelectItem>
                <SelectItem value="busy">Ocupados</SelectItem>
                <SelectItem value="offline">Offline</SelectItem>
              </SelectContent>
            </Select>
            <div className="flex gap-2">
              <Button
                variant={viewMode === 'grid' ? 'default' : 'outline'}
                onClick={() => setViewMode('grid')}
              >
                Grid
              </Button>
              <Button
                variant={viewMode === 'list' ? 'default' : 'outline'}
                onClick={() => setViewMode('list')}
              >
                Lista
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Estadísticas Rápidas */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold">{riders.length}</div>
            <div className="text-sm text-gray-500">Total Repartidores</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold text-green-600">
              {riders.filter(r => r.status === 'available').length}
            </div>
            <div className="text-sm text-gray-500">Disponibles</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold text-blue-600">
              {riders.filter(r => r.status === 'busy').length}
            </div>
            <div className="text-sm text-gray-500">En Entrega</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold text-gray-600">
              {riders.filter(r => r.status === 'offline').length}
            </div>
            <div className="text-sm text-gray-500">Offline</div>
          </CardContent>
        </Card>
      </div>

      {/* Lista de Repartidores */}
      {viewMode === 'list' ? (
        <RiderList riders={filteredRiders} />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredRiders.map(rider => (
            <RiderCard key={rider.id} rider={rider} />
          ))}
        </div>
      )}

      {filteredRiders.length === 0 && (
        <div className="text-center py-12 text-gray-500">
          No se encontraron repartidores que coincidan con los filtros
        </div>
      )}
    </div>
  );
}
