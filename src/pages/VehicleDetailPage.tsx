import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { ArrowLeft, Edit, MapPin, Calendar, DollarSign, User, FileText, Download, MessageCircle, History } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';
import { Vehicle, Owner } from '@/types';
import { VehicleStatus, VehicleType } from '@/types/enums';
import { useAuth } from '@/contexts/AuthContext';
import vehicleService from '@/services/vehicleService';
import procedureService from '@/services/procedureService';
import { useToast } from '@/hooks/use-toast';

interface TimelineEvent {
  date: string;
  action: string;
  description: string;
  user: string;
}

export const VehicleDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { hasAnyRole } = useAuth();
  const { toast } = useToast();
  const [vehicle, setVehicle] = useState<Vehicle | null>(null);
  const [timeline, setTimeline] = useState<TimelineEvent[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [storageFee, setStorageFee] = useState<number | null>(null);

  useEffect(() => {
    const fetchVehicleData = async () => {
      if (!id) return;
      
      try {
        setIsLoading(true);
        
        // Fetch vehicle details
        const vehicleData = await vehicleService.getVehicle(id);
        setVehicle(vehicleData);
        
        // Fetch storage fee
        try {
          const feeData = await vehicleService.calculateStorageFee(id);
          setStorageFee(feeData.total_fee);
        } catch (error) {
          console.error('Failed to fetch storage fee:', error);
        }
        
        // Fetch procedures for timeline
        try {
          const procedures = await procedureService.getProceduresByVehicle(id);
          
          // Convert procedures to timeline events
          const timelineEvents: TimelineEvent[] = procedures.map(proc => ({
            date: proc.created_at,
            action: `Procédure: ${proc.type}`,
            description: proc.notes || `Statut: ${proc.status}`,
            user: proc.user?.name || 'Système'
          }));
          
          // Add vehicle impound as first event
          if (vehicleData) {
            timelineEvents.unshift({
              date: vehicleData.impound_date,
              action: 'Mise en fourrière',
              description: 'Véhicule enregistré dans le système',
              user: 'Agent municipal'
            });
          }
          
          // Sort by date (newest first)
          timelineEvents.sort((a, b) => 
            new Date(b.date).getTime() - new Date(a.date).getTime()
          );
          
          setTimeline(timelineEvents);
        } catch (error) {
          console.error('Failed to fetch procedures:', error);
        }
        
      } catch (error) {
        console.error('Failed to fetch vehicle:', error);
        toast({
          title: 'Erreur',
          description: 'Impossible de charger les détails du véhicule',
          variant: 'destructive',
        });
      } finally {
        setIsLoading(false);
      }
    };

    fetchVehicleData();
  }, [id, toast]);

  const canEdit = hasAnyRole(['admin', 'agent']);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!vehicle) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-2">Véhicule introuvable</h2>
          <p className="text-muted-foreground mb-4">Le véhicule demandé n'existe pas.</p>
          <Button onClick={() => navigate('/app/vehicules')}>
            Retour à la liste
          </Button>
        </div>
      </div>
    );
  }

  const getStatusVariant = (status: VehicleStatus): "default" | "secondary" | "destructive" | "outline" => {
    switch (status) {
      case VehicleStatus.IMPOUNDED: return 'outline';
      case VehicleStatus.CLAIMED: return 'default';
      case VehicleStatus.SOLD: return 'secondary';
      case VehicleStatus.DESTROYED: return 'destructive';
      default: return 'secondary';
    }
  };

  const getStatusLabel = (status: VehicleStatus) => {
    switch (status) {
      case VehicleStatus.IMPOUNDED: return 'En fourrière';
      case VehicleStatus.CLAIMED: return 'Réclamé';
      case VehicleStatus.RELEASED: return 'Libéré';
      case VehicleStatus.SOLD: return 'Vendu';
      case VehicleStatus.PENDING_DESTRUCTION: return 'En attente destruction';
      case VehicleStatus.DESTROYED: return 'Détruit';
      default: return status;
    }
  };

  const getVehicleTypeLabel = (type: VehicleType) => {
    switch (type) {
      case VehicleType.CAR: return 'Voiture';
      case VehicleType.MOTORCYCLE: return 'Moto';
      case VehicleType.TRUCK: return 'Camion';
      case VehicleType.OTHER: return 'Autre';
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

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('fr-FR');
  };

  const daysSinceImpound = Math.floor(
    (Date.now() - new Date(vehicle.impound_date).getTime()) / (1000 * 60 * 60 * 24)
  );

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" onClick={() => navigate('/app/vehicules')}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold text-foreground">
              {vehicle.license_plate}
            </h1>
            <p className="text-muted-foreground">
              {vehicle.make} {vehicle.model} - {vehicle.color} ({vehicle.year})
            </p>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          <Badge variant={getStatusVariant(vehicle.status)} className="text-sm">
            {getStatusLabel(vehicle.status)}
          </Badge>
          {canEdit && (
            <Button variant="outline" asChild>
              <Link to={`/app/vehicules/${vehicle.id}/edit`}>
                <Edit className="h-4 w-4 mr-2" />
                Modifier
              </Link>
            </Button>
          )}
        </div>
      </div>

      {/* Alert for days in pound */}
      {vehicle.status === VehicleStatus.IMPOUNDED && (
        <Card className="border-orange-200 bg-orange-50 dark:border-orange-800 dark:bg-orange-950/20">
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Calendar className="h-5 w-5 text-orange-600" />
              <span className="font-medium text-orange-800 dark:text-orange-200">
                Véhicule en fourrière depuis {daysSinceImpound} jour(s)
                {storageFee !== null && ` - Frais cumulés: ${formatCurrency(storageFee)}`}
              </span>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          <Tabs defaultValue="details" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="details">Détails</TabsTrigger>
              <TabsTrigger value="timeline">Chronologie</TabsTrigger>
            </TabsList>
            
            <TabsContent value="details" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Informations du véhicule</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-muted-foreground">Type</p>
                      <p className="font-medium">
                        {getVehicleTypeLabel(vehicle.type)}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Année</p>
                      <p className="font-medium">{vehicle.year}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Localisation</p>
                      <p className="font-medium flex items-center gap-1">
                        <MapPin className="h-4 w-4" />
                        {vehicle.location}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Valeur estimée</p>
                      <p className="font-medium flex items-center gap-1">
                        <DollarSign className="h-4 w-4" />
                        {formatCurrency(vehicle.estimated_value)}
                      </p>
                    </div>
                  </div>
                  
                  {vehicle.description && (
                    <div>
                      <p className="text-sm text-muted-foreground mb-2">Description</p>
                      <p className="text-sm">{vehicle.description}</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
            
            <TabsContent value="timeline" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Chronologie du dossier</CardTitle>
                  <CardDescription>
                    Historique des actions sur ce véhicule
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {timeline.length > 0 ? (
                      timeline.map((event, index) => (
                        <div key={index} className="flex gap-4">
                          <div className="flex flex-col items-center">
                            <div className="w-3 h-3 bg-primary rounded-full"></div>
                            {index < timeline.length - 1 && (
                              <div className="w-px h-12 bg-border"></div>
                            )}
                          </div>
                          <div className="flex-1 pb-4">
                            <div className="flex items-center justify-between">
                              <h4 className="font-medium">{event.action}</h4>
                              <p className="text-xs text-muted-foreground">
                                {formatDate(event.date)}
                              </p>
                            </div>
                            <p className="text-sm text-muted-foreground">
                              {event.description}
                            </p>
                            <p className="text-xs text-muted-foreground mt-1">
                              Par: {event.user}
                            </p>
                          </div>
                        </div>
                      ))
                    ) : (
                      <p className="text-center text-muted-foreground py-4">
                        Aucun événement enregistré pour ce véhicule
                      </p>
                    )}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Owner Information */}
          {vehicle.owner && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <User className="h-5 w-5" />
                  Propriétaire
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center gap-3">
                  <Avatar>
                    <AvatarImage src="" alt={`${vehicle.owner.first_name} ${vehicle.owner.last_name}`} />
                    <AvatarFallback>
                      {vehicle.owner.first_name[0]}{vehicle.owner.last_name[0]}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="font-medium">{vehicle.owner.first_name} {vehicle.owner.last_name}</p>
                    <p className="text-sm text-muted-foreground">{vehicle.owner.phone}</p>
                  </div>
                </div>
                
                <Separator />
                
                <div className="space-y-2 text-sm">
                  <div>
                    <p className="text-muted-foreground">Email</p>
                    <p>{vehicle.owner.email || 'Non renseigné'}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Adresse</p>
                    <p>{vehicle.owner.address || 'Non renseigné'}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Pièce d'identité</p>
                    <p>{vehicle.owner.id_number || 'Non renseigné'}</p>
                  </div>
                </div>
                
                <div className="flex gap-2">
                  <Button 
                    size="sm" 
                    variant="outline" 
                    className="flex-1"
                    onClick={() => {
                      if (vehicle.owner?.phone) {
                        window.open(`tel:${vehicle.owner.phone}`, '_self');
                      }
                    }}
                  >
                    <MessageCircle className="h-3 w-3 mr-1" />
                    Contacter
                  </Button>
                  <Button 
                    size="sm" 
                    variant="outline" 
                    className="flex-1"
                    asChild
                  >
                    <Link to={`/app/proprietaires/${vehicle.owner.id}`}>
                      <History className="h-3 w-3 mr-1" />
                      Historique
                    </Link>
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Quick Actions */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Actions rapides
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <Button 
                size="sm" 
                variant="outline" 
                className="w-full justify-start"
                asChild
              >
                <Link to={`/app/vehicules/${vehicle.id}/rapport`}>
                  <Download className="h-4 w-4 mr-2" />
                  Générer PV
                </Link>
              </Button>
              {hasAnyRole(['admin', 'agent']) && (
                <Button 
                  size="sm" 
                  variant="outline" 
                  className="w-full justify-start"
                  asChild
                >
                  <Link to={`/app/procedures/new?vehicle_id=${vehicle.id}`}>
                    <FileText className="h-4 w-4 mr-2" />
                    Nouvelle procédure
                  </Link>
                </Button>
              )}
              <Button 
                size="sm" 
                variant="outline" 
                className="w-full justify-start"
                asChild
              >
                <Link to={`/app/vehicules/${vehicle.id}/paiement`}>
                  <DollarSign className="h-4 w-4 mr-2" />
                  Calculer frais
                </Link>
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};
