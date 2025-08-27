import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Plus, Search, Filter, Download, Eye, Edit, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Vehicle } from '@/types';
import { VehicleStatus, VehicleType } from '@/types/enums';
import { useAuth } from '@/contexts/AuthContext';
import { vehicleService } from '@/services';
import { toast } from '@/hooks/use-toast';

export const VehiclesListPage = () => {
  const { hasAnyRole } = useAuth();
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [filteredVehicles, setFilteredVehicles] = useState<Vehicle[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<VehicleStatus | 'all'>('all');
  const [typeFilter, setTypeFilter] = useState<VehicleType | 'all'>('all');
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);

  useEffect(() => {
    const fetchVehicles = async () => {
      try {
        setLoading(true);
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const params: any = { page };
        
        if (searchTerm) params.search = searchTerm;
        if (statusFilter !== 'all') params.status = statusFilter;
        if (typeFilter !== 'all') params.type = typeFilter;
        
        const response = await vehicleService.getVehicles(params);
        setVehicles(response.data);
        setFilteredVehicles(response.data);
        setTotalPages(response.meta.last_page);
        setTotalItems(response.meta.total);
      } catch (error) {
        console.error('Erreur lors du chargement des véhicules:', error);
        toast({
          title: 'Erreur',
          description: 'Impossible de charger la liste des véhicules',
          variant: 'destructive',
        });
      } finally {
        setLoading(false);
      }
    };

    fetchVehicles();
  }, [page, searchTerm, statusFilter, typeFilter]);

  useEffect(() => {
    let filtered = vehicles;

    // Filter by search term
    if (searchTerm) {
      filtered = filtered.filter(vehicle =>
        vehicle.license_plate.toLowerCase().includes(searchTerm.toLowerCase()) ||
        vehicle.make.toLowerCase().includes(searchTerm.toLowerCase()) ||
        vehicle.model.toLowerCase().includes(searchTerm.toLowerCase()) ||
        vehicle.color.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Filter by status
    if (statusFilter !== 'all') {
      filtered = filtered.filter(vehicle => vehicle.status === statusFilter);
    }

    // Filter by type
    if (typeFilter !== 'all') {
      filtered = filtered.filter(vehicle => vehicle.type === typeFilter);
    }

    setFilteredVehicles(filtered);
  }, [vehicles, searchTerm, statusFilter, typeFilter]);

  const getStatusVariant = (status: VehicleStatus): "default" | "secondary" | "destructive" | "outline" => {
    switch (status) {
      case 'impounded': return 'outline';
      case 'claimed': return 'default';
      case 'sold': return 'secondary';
      case 'destroyed': return 'destructive';
      default: return 'secondary';
    }
  };

  const getStatusLabel = (status: VehicleStatus) => {
    switch (status) {
      case 'impounded': return 'En fourrière';
      case 'claimed': return 'Réclamé';
      case 'sold': return 'Vendu';
      case 'destroyed': return 'Détruit';
      case 'pending_destruction': return 'En attente destruction';
      default: return status;
    }
  };

  const getTypeLabel = (type: VehicleType) => {
    switch (type) {
      case 'car': return 'Voiture';
      case 'motorcycle': return 'Moto';
      case 'truck': return 'Camion';
      case 'other': return 'Autre';
      default: return type;
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'XOF',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const canEditVehicles = hasAnyRole(['admin', 'agent']);

  // Statistics
  const totalVehicles = vehicles.length;
  const impoundedCount = vehicles.filter(v => v.status === 'impounded').length;
  const claimedCount = vehicles.filter(v => v.status === 'claimed').length;
  const totalValue = vehicles.reduce((sum, v) => sum + v.estimated_value, 0);

  const exportToCSV = () => {
    const headers = ['Plaque', 'Marque', 'Modèle', 'Couleur', 'Année', 'Type', 'Statut', 'Location', 'Valeur estimée'];
    const csvContent = [
      headers.join(','),
      ...filteredVehicles.map(vehicle => [
        vehicle.license_plate,
        vehicle.make,
        vehicle.model,
        vehicle.color,
        vehicle.year,
        getTypeLabel(vehicle.type),
        getStatusLabel(vehicle.status),
        vehicle.location,
        vehicle.estimated_value
      ].join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `vehicules_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (loading) {
    return (
      <div className="p-4 sm:p-6 space-y-6">
        <Card>
          <CardContent className="py-8">
            <p className="text-center text-muted-foreground">Chargement des véhicules...</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-foreground">Véhicules en fourrière</h1>
          <p className="text-muted-foreground">Gestion des véhicules mis en fourrière</p>
        </div>
        
        <div className="flex flex-col sm:flex-row gap-2">
          <Button onClick={exportToCSV} variant="outline">
            <Download className="h-4 w-4 mr-2" />
            Exporter CSV
          </Button>
          {canEditVehicles && (
            <Button asChild>
              <Link to="/app/vehicules/nouveau">
                <Plus className="h-4 w-4 mr-2" />
                Nouveau véhicule
              </Link>
            </Button>
          )}
        </div>
      </div>

      {/* Statistics */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Total véhicules</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalVehicles}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>En fourrière</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-warning">{impoundedCount}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Réclamés</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-success">{claimedCount}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Valeur totale</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(totalValue)}</div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Filtres
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
              <Input
                placeholder="Rechercher par plaque, marque, modèle..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9"
              />
            </div>
            
            <Select value={statusFilter} onValueChange={(value) => setStatusFilter(value as VehicleStatus | 'all')}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="Statut" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tous les statuts</SelectItem>
                <SelectItem value="impounded">En fourrière</SelectItem>
                <SelectItem value="claimed">Réclamé</SelectItem>
                <SelectItem value="sold">Vendu</SelectItem>
                <SelectItem value="destroyed">Détruit</SelectItem>
              </SelectContent>
            </Select>

            <Select value={typeFilter} onValueChange={(value) => setTypeFilter(value as VehicleType | 'all')}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tous les types</SelectItem>
                <SelectItem value="car">Voiture</SelectItem>
                <SelectItem value="motorcycle">Moto</SelectItem>
                <SelectItem value="truck">Camion</SelectItem>
                <SelectItem value="other">Autre</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Vehicles Table */}
      <Card>
        <CardHeader>
          <CardTitle>Liste des véhicules</CardTitle>
          <CardDescription>
            {filteredVehicles.length} véhicule(s) trouvé(s)
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="min-w-[120px]">Plaque</TableHead>
                  <TableHead className="hidden sm:table-cell min-w-[150px]">Véhicule</TableHead>
                  <TableHead className="hidden md:table-cell">Type</TableHead>
                  <TableHead className="min-w-[100px]">Statut</TableHead>
                  <TableHead className="hidden lg:table-cell">Location</TableHead>
                  <TableHead className="hidden xl:table-cell">Valeur</TableHead>
                  <TableHead className="min-w-[100px]">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredVehicles.map((vehicle) => (
                  <TableRow key={vehicle.id}>
                    <TableCell className="font-medium">{vehicle.license_plate}</TableCell>
                    <TableCell className="hidden sm:table-cell">
                      <div>
                        <p className="font-medium">{vehicle.make} {vehicle.model}</p>
                        <p className="text-sm text-muted-foreground">{vehicle.color} • {vehicle.year}</p>
                      </div>
                    </TableCell>
                    <TableCell className="hidden md:table-cell">
                      <Badge variant="outline">{getTypeLabel(vehicle.type)}</Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant={getStatusVariant(vehicle.status)}>
                        {getStatusLabel(vehicle.status)}
                      </Badge>
                    </TableCell>
                    <TableCell className="hidden lg:table-cell">{vehicle.location}</TableCell>
                    <TableCell className="hidden xl:table-cell">
                      {formatCurrency(vehicle.estimated_value)}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <Button variant="ghost" size="sm" asChild>
                          <Link to={`/app/vehicules/${vehicle.id}`}>
                            <Eye className="h-3 w-3 sm:h-4 sm:w-4" />
                          </Link>
                        </Button>
                        {canEditVehicles && (
                          <Button variant="ghost" size="sm" asChild>
                            <Link to={`/app/vehicules/${vehicle.id}/edit`}>
                              <Edit className="h-3 w-3 sm:h-4 sm:w-4" />
                            </Link>
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};