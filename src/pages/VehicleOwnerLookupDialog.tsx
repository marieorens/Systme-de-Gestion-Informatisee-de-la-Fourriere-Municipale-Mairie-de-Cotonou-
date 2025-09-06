import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Mail, MessageSquare, AlertCircle, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import axios from 'axios';

interface OwnerInfo {
  phone: string;
  email: string;
  first_name: string;
  last_name: string;
}

export const VehicleOwnerLookupDialog = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [ownerInfo, setOwnerInfo] = useState<OwnerInfo | null>(null);
  const { toast } = useToast();
  const navigate = useNavigate();
  const location = useLocation();
  const { licensePlate, vehicleId } = location.state || {};

  // Simuler la recherche des informations du propriétaire via l'API ANATT
  const lookupOwnerInfo = async () => {
    setIsLoading(true);
    try {
      // Simulation d'un appel API à l'ANATT
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Données simulées
      setOwnerInfo({
        phone: '+229 97000000',
        email: 'proprietaire@example.com',
        first_name: 'John',
        last_name: 'Doe'
      });

    } catch (error) {
      toast({
        title: 'Erreur',
        description: 'Impossible de récupérer les informations du propriétaire',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const sendNotification = async (method: 'sms' | 'email' | 'both') => {
    if (!ownerInfo) return;

    setIsSending(true);
    try {
      const response = await axios.post(`/api/vehicles/${vehicleId}/notify`, {
        method,
        phone: ownerInfo.phone,
        email: ownerInfo.email,
        license_plate: licensePlate
      });

      toast({
        title: 'Succès',
        description: 'Notification envoyée avec succès',
      });

      // Rediriger vers la page de détails du véhicule
      navigate(`/app/vehicules/${vehicleId}`);

    } catch (error) {
      toast({
        title: 'Erreur',
        description: 'Impossible d\'envoyer la notification',
        variant: 'destructive',
      });
    } finally {
      setIsSending(false);
    }
  };

  const handleClose = () => {
    navigate(`/app/vehicules/${vehicleId}`);
  };

  return (
    <Dialog open={true} onOpenChange={handleClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Notification du propriétaire</DialogTitle>
          <DialogDescription>
            Recherche des informations du propriétaire pour le véhicule {licensePlate} via l'API ANATT
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-6">
          {!ownerInfo ? (
            <div className="flex flex-col items-center justify-center space-y-4 py-6">
              {isLoading ? (
                <div className="flex flex-col items-center space-y-4">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                  <p className="text-sm text-muted-foreground">
                    Recherche des informations...
                  </p>
                </div>
              ) : (
                <>
                  <AlertCircle className="h-12 w-12 text-blue-500" />
                  <p className="text-center text-sm text-muted-foreground max-w-sm">
                    Cliquez sur le bouton ci-dessous pour rechercher les informations du propriétaire 
                    via l'API ANATT
                  </p>
                  <Button onClick={lookupOwnerInfo}>
                    Rechercher le propriétaire
                  </Button>
                </>
              )}
            </div>
          ) : (
            <div className="space-y-6">
              <div className="rounded-lg bg-blue-50 p-4">
                <h3 className="font-semibold mb-2">Informations trouvées</h3>
                <div className="space-y-2 text-sm">
                  <p><strong>Nom:</strong> {ownerInfo.first_name} {ownerInfo.last_name}</p>
                  <p><strong>Téléphone:</strong> {ownerInfo.phone}</p>
                  <p><strong>Email:</strong> {ownerInfo.email}</p>
                </div>
              </div>

              <div className="space-y-3">
                <h3 className="font-semibold">Envoyer une notification</h3>
                <div className="flex flex-col gap-2">
                  <Button 
                    variant="outline" 
                    className="justify-start"
                    onClick={() => sendNotification('sms')}
                    disabled={isSending}
                  >
                    <MessageSquare className="mr-2 h-4 w-4" />
                    Notifier par SMS
                  </Button>
                  <Button 
                    variant="outline" 
                    className="justify-start"
                    onClick={() => sendNotification('email')}
                    disabled={isSending}
                  >
                    <Mail className="mr-2 h-4 w-4" />
                    Notifier par email
                  </Button>
                  <Button 
                    className="justify-start"
                    onClick={() => sendNotification('both')}
                    disabled={isSending}
                  >
                    <MessageSquare className="mr-2 h-4 w-4" />
                    <Mail className="mr-2 h-4 w-4" />
                    Notifier par SMS et email
                  </Button>
                </div>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};
