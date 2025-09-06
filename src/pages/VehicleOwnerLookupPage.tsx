import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Mail, MessageSquare, AlertCircle, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import axios from 'axios';

interface OwnerInfo {
  phone: string;
  email: string;
  first_name: string;
  last_name: string;
}

interface Props {
  licensePlate: string;
  vehicleId: number;
  onComplete: () => void;
}

export const VehicleOwnerLookupPage = ({ licensePlate, vehicleId, onComplete }: Props) => {
  const [isLoading, setIsLoading] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [ownerInfo, setOwnerInfo] = useState<OwnerInfo | null>(null);
  const { toast } = useToast();
  const navigate = useNavigate();

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
      const endpoint = '/api/vehicles/' + vehicleId + '/notify';
      const response = await axios.post(endpoint, {
        method,
        phone: ownerInfo.phone,
        email: ownerInfo.email,
        license_plate: licensePlate
      });

      toast({
        title: 'Succès',
        description: 'Notification envoyée avec succès',
      });

      // Continuer le processus
      onComplete();

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

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gray-50/90">
      <Card className="w-full max-w-lg">
        <CardHeader>
          <CardTitle>Recherche du propriétaire</CardTitle>
          <CardDescription>
            Recherche des informations du propriétaire pour le véhicule {licensePlate} via l'API ANATT
          </CardDescription>
        </CardHeader>
        <CardContent>
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
        </CardContent>
      </Card>
    </div>
  );
};
