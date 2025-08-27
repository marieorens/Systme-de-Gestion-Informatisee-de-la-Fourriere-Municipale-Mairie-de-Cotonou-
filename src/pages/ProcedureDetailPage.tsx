import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, FileText, Download, CheckCircle, Clock, AlertCircle, Edit, User, Calendar, DollarSign } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Progress } from '@/components/ui/progress';
import { procedureService, vehicleService } from '@/services';
import { Procedure, Vehicle, Owner } from '@/types';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

export const ProcedureDetailPage = () => {
  const { procedureId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [procedure, setProcedure] = useState<Procedure | null>(null);
  const [vehicle, setVehicle] = useState<Vehicle | null>(null);
  const [owner, setOwner] = useState<Owner | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProcedureDetails = async () => {
      if (!procedureId) return;
      
      try {
        setLoading(true);
        // Get procedure details
        const procedureData = await procedureService.getProcedure(procedureId);
        setProcedure(procedureData);
        
        // Get procedure documents
        const documents = await procedureService.getProcedureDocuments(procedureId);
        setProcedure(prev => prev ? { ...prev, documents } : null);
        
        // Get vehicle details
        const vehicleData = await vehicleService.getVehicle(procedureData.vehicle_id);
        setVehicle(vehicleData);
        
        // Get owner details if vehicle has owner data
        if (vehicleData.owner) {
          setOwner(vehicleData.owner);
        }
        
      } catch (error) {
        console.error('Erreur lors du chargement de la procédure:', error);
        toast.error('Erreur lors du chargement des détails');
        navigate('/app/procedures');
      } finally {
        setLoading(false);
      }
    };

    fetchProcedureDetails();
  }, [procedureId, navigate]);

  if (loading) {
    return (
      <div className="p-4 sm:p-6 max-w-6xl mx-auto">
        <div className="flex items-center gap-4 mb-6">
          <Button variant="ghost" onClick={() => navigate('/app/procedures')}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Retour aux procédures
          </Button>
        </div>
        <Card>
          <CardContent className="py-8">
            <p className="text-center text-muted-foreground">Chargement des détails...</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!procedure) {
    return (
      <div className="p-4 sm:p-6 max-w-6xl mx-auto">
        <div className="flex items-center gap-4 mb-6">
          <Button variant="ghost" onClick={() => navigate('/app/procedures')}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Retour aux procédures
          </Button>
        </div>
        <Card>
          <CardContent className="py-8">
            <p className="text-center text-muted-foreground">Procédure non trouvée</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return <Badge variant="secondary"><Clock className="w-3 h-3 mr-1" />En attente</Badge>;
      case 'in_progress':
        return <Badge variant="default"><FileText className="w-3 h-3 mr-1" />En cours</Badge>;
      case 'completed':
        return <Badge variant="secondary" className="bg-success-light text-success"><CheckCircle className="w-3 h-3 mr-1" />Terminé</Badge>;
      case 'cancelled':
        return <Badge variant="destructive"><AlertCircle className="w-3 h-3 mr-1" />Annulé</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  const getTypeLabel = (type: string) => {
    switch (type) {
      case 'release':
        return 'Libération';
      case 'sale':
        return 'Vente';
      case 'destruction':
        return 'Destruction';
      default:
        return type;
    }
  };

  const getProgressValue = (status: string) => {
    switch (status) {
      case 'pending':
        return 20;
      case 'in_progress':
        return 60;
      case 'completed':
        return 100;
      case 'cancelled':
        return 0;
      default:
        return 0;
    }
  };

  const formatCurrency = (amount: number | undefined | null) => {
    // Handle undefined, null, NaN or negative values
    if (amount === undefined || amount === null || isNaN(amount) || amount < 0) {
      return '0 FCFA';
    }
    return `${amount.toLocaleString()} FCFA`;
  };

  const canEdit = user && (user.role === 'admin' || user.role === 'agent');

  return (
    <div className="p-4 sm:p-6 max-w-6xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" onClick={() => navigate('/app/procedures')}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Retour aux procédures
          </Button>
        </div>
        
        {canEdit && procedure.status !== 'completed' && (
          <Button onClick={() => navigate(`/app/procedures/${procedure.id}/edit`)}>
            <Edit className="w-4 h-4 mr-2" />
            Modifier
          </Button>
        )}
      </div>

      <div>
        <h1 className="text-2xl sm:text-3xl font-bold text-foreground">
          Procédure #{procedure.id}
        </h1>
        <p className="text-muted-foreground">
          {getTypeLabel(procedure.type)} • Créée le {new Date(procedure.created_at).toLocaleDateString('fr-FR')}
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Status and Progress */}
        <div className="lg:col-span-3">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <FileText className="w-5 h-5" />
                  État de la procédure
                </CardTitle>
                {getStatusBadge(procedure.status)}
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between text-sm">
                <span>Progression</span>
                <span>{getProgressValue(procedure.status)}%</span>
              </div>
              <Progress value={getProgressValue(procedure.status)} className="w-full" />
              
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-6">
                <div className="p-4 bg-muted rounded-lg text-center">
                  <DollarSign className="w-6 h-6 mx-auto mb-2 text-primary" />
                  <p className="text-sm text-muted-foreground">Frais calculés</p>
                  <p className="text-lg font-bold">{formatCurrency(0)}</p>
                </div>
                
                <div className="p-4 bg-muted rounded-lg text-center">
                  <FileText className="w-6 h-6 mx-auto mb-2 text-primary" />
                  <p className="text-sm text-muted-foreground">Documents</p>
                  <p className="text-lg font-bold">{procedure.documents.length}</p>
                </div>
                
                <div className="p-4 bg-muted rounded-lg text-center">
                  <Calendar className="w-6 h-6 mx-auto mb-2 text-primary" />
                  <p className="text-sm text-muted-foreground">Dernière MAJ</p>
                  <p className="text-lg font-bold">{new Date(procedure.updated_at).toLocaleDateString('fr-FR')}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Vehicle Information */}
        {vehicle && (
          <Card>
            <CardHeader>
              <CardTitle>Véhicule concerné</CardTitle>
              <CardDescription>Informations du véhicule en fourrière</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <div>
                <span className="text-sm text-muted-foreground">Plaque d'immatriculation</span>
                <p className="font-medium">{vehicle.license_plate}</p>
              </div>
              <div>
                <span className="text-sm text-muted-foreground">Véhicule</span>
                <p className="font-medium">{vehicle.make} {vehicle.model}</p>
              </div>
              <div>
                <span className="text-sm text-muted-foreground">Couleur</span>
                <p className="font-medium">{vehicle.color}</p>
              </div>
              <div>
                <span className="text-sm text-muted-foreground">Année</span>
                <p className="font-medium">{vehicle.year}</p>
              </div>
              <div>
                <span className="text-sm text-muted-foreground">Localisation</span>
                <p className="font-medium">{vehicle.location}</p>
              </div>
              <div>
                <span className="text-sm text-muted-foreground">Mis en fourrière le</span>
                <p className="font-medium">{new Date(vehicle.impound_date).toLocaleDateString('fr-FR')}</p>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Owner Information */}
        {owner && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="w-4 h-4" />
                Propriétaire
              </CardTitle>
              <CardDescription>Informations du propriétaire</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <div>
                <span className="text-sm text-muted-foreground">Nom complet</span>
                <p className="font-medium">{owner.first_name} {owner.last_name}</p>
              </div>
              <div>
                <span className="text-sm text-muted-foreground">Téléphone</span>
                <p className="font-medium">{owner.phone}</p>
              </div>
              {owner.email && (
                <div>
                  <span className="text-sm text-muted-foreground">Email</span>
                  <p className="font-medium">{owner.email}</p>
                </div>
              )}
              <div>
                <span className="text-sm text-muted-foreground">Adresse</span>
                <p className="font-medium">{owner.address}</p>
              </div>
              <div>
                <span className="text-sm text-muted-foreground">Pièce d'identité</span>
                <p className="font-medium">{owner.id_number} ({owner.id_type.toUpperCase()})</p>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Documents */}
        <Card>
          <CardHeader>
            <CardTitle>Documents associés</CardTitle>
            <CardDescription>Pièces justificatives et documents administratifs</CardDescription>
          </CardHeader>
          <CardContent>
            {procedure.documents.length === 0 ? (
              <p className="text-muted-foreground text-center py-4">Aucun document associé</p>
            ) : (
              <div className="space-y-3">
                {procedure.documents.map((doc) => (
                  <div key={doc.id} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex items-center gap-3">
                      <FileText className="w-4 h-4 text-muted-foreground" />
                      <div>
                        <p className="font-medium text-sm">{doc.name}</p>
                        <p className="text-xs text-muted-foreground">
                          Ajouté le {new Date(doc.created_at).toLocaleDateString('fr-FR')}
                        </p>
                      </div>
                    </div>
                    <Button variant="ghost" size="sm">
                      <Download className="w-4 h-4" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Procedure Details */}
      <Card>
        <CardHeader>
          <CardTitle>Détails de la procédure</CardTitle>
          <CardDescription>Informations administratives complètes</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h4 className="font-medium mb-3">Informations générales</h4>
              <div className="space-y-2">
                <div>
                  <span className="text-sm text-muted-foreground">ID Procédure</span>
                  <p className="font-medium">#{procedure.id}</p>
                </div>
                <div>
                  <span className="text-sm text-muted-foreground">Type</span>
                  <p className="font-medium">{getTypeLabel(procedure.type)}</p>
                </div>
                <div>
                  <span className="text-sm text-muted-foreground">Statut</span>
                  <div className="mt-1">{getStatusBadge(procedure.status)}</div>
                </div>
              </div>
            </div>
            
            <div>
              <h4 className="font-medium mb-3">Historique</h4>
              <div className="space-y-2">
                <div>
                  <span className="text-sm text-muted-foreground">Créée le</span>
                  <p className="font-medium">{new Date(procedure.created_at).toLocaleDateString('fr-FR')}</p>
                </div>
                <div>
                  <span className="text-sm text-muted-foreground">Dernière modification</span>
                  <p className="font-medium">{new Date(procedure.updated_at).toLocaleDateString('fr-FR')}</p>
                </div>
                <div>
                  <span className="text-sm text-muted-foreground">Créée par</span>
                  <p className="font-medium">Utilisateur #{procedure.user_id || 'N/A'}</p>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};