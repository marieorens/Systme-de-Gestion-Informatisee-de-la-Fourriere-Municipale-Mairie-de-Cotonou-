import { useEffect, useState } from 'react';
import { Car, AlertTriangle, CreditCard, FileText, Loader2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Vehicle } from '@/types';
import { VehicleStatus } from '@/types/enums';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from '@/hooks/use-toast';
import dashboardService, { DashboardStats, RecentActivity } from '@/services/dashboardService';
import vehicleService from '@/services/vehicleService';

export const DashboardPage = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [recentVehicles, setRecentVehicles] = useState<Vehicle[]>([]);
  const [recentActivities, setRecentActivities] = useState<RecentActivity[]>([]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        
        // Fetch all data in parallel for better performance
        const [statsData, vehiclesData, activitiesData] = await Promise.all([
          dashboardService.getStats(),
          vehicleService.getVehicles({ perPage: 5, page: 1 }),
          dashboardService.getRecentActivities(5)
        ]);
        
        setRecentVehicles(vehiclesData.data);
        setStats(statsData);
        setRecentActivities(activitiesData);
        
      } catch (error) {
        console.error('Error fetching dashboard data:', error);
        toast({
          title: 'Erreur',
          description: 'Impossible de charger les données du tableau de bord',
          variant: 'destructive',
        });
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const getStatusVariant = (status: VehicleStatus): "default" | "secondary" | "destructive" | "outline" => {
    switch (status) {
      case VehicleStatus.IMPOUNDED: return 'destructive';
      case VehicleStatus.CLAIMED: return 'secondary';
      case VehicleStatus.RELEASED: return 'default';
      default: return 'outline';
    }
  };

  const getStatusLabel = (status: VehicleStatus) => {
    switch (status) {
      case VehicleStatus.IMPOUNDED: return 'En fourrière';
      case VehicleStatus.CLAIMED: return 'Réclamé';
      case VehicleStatus.RELEASED: return 'Libéré';
      case VehicleStatus.SOLD: return 'Vendu';
      case VehicleStatus.PENDING_DESTRUCTION: return 'En attente de destruction';
      case VehicleStatus.DESTROYED: return 'Détruit';
      default: return status;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-foreground">
          Tableau de bord
        </h1>
        <p className="text-muted-foreground">
          Bienvenue, {user?.name}. Voici un aperçu de l'activité de la fourrière.
        </p>
      </div>

      {/* Stats Overview */}
      {stats && (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Total Véhicules
              </CardTitle>
              <Car className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.total_vehicles}</div>
              <p className="text-xs text-muted-foreground">
                En fourrière municipale
              </p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Non réclamés
              </CardTitle>
              <AlertTriangle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.unclaimed_vehicles}</div>
              <p className="text-xs text-muted-foreground">
                En attente de réclamation
              </p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Revenus du mois
              </CardTitle>
              <CreditCard className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {(stats.monthly_revenue !== undefined && !isNaN(stats.monthly_revenue) 
                  ? stats.monthly_revenue 
                  : 0).toLocaleString()} FCFA
              </div>
              <p className="text-xs text-muted-foreground">
                Frais de fourrière
              </p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Procédures en cours
              </CardTitle>
              <FileText className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.total_procedures}</div>
              <p className="text-xs text-muted-foreground">
                À traiter
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Recent Vehicles */}
      <Card>
        <CardHeader>
          <CardTitle>Véhicules récents</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {recentVehicles.map((vehicle) => (
              <div key={vehicle.id} className="flex items-center justify-between p-4 border rounded-lg">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
                    <Car className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <p className="font-medium">{vehicle.license_plate}</p>
                    <p className="text-sm text-muted-foreground">
                      {vehicle.make} {vehicle.model} - {vehicle.color}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <Badge variant={getStatusVariant(vehicle.status)}>
                    {getStatusLabel(vehicle.status)}
                  </Badge>
                  <p className="text-sm text-muted-foreground mt-1">
                    {new Date(vehicle.impound_date).toLocaleDateString('fr-FR')}
                  </p>
                </div>
              </div>
            ))}
            {recentVehicles.length === 0 && (
              <p className="text-center text-muted-foreground py-8">
                Aucun véhicule enregistré
              </p>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
