import { useState } from 'react';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
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

export const VehicleNotifyPage = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [ownerInfo, setOwnerInfo] = useState<OwnerInfo | null>(null);
  const { toast } = useToast();
  const navigate = useNavigate();
  const { id } = useParams();
  const location = useLocation();
  const { licensePlate } = location.state || {};

  const lookupOwnerInfo = async () => {
    setIsLoading(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      setOwnerInfo({
        phone: '+229 43126928',
        email: 'proprietaire@example.com',
        first_name: 'Henri',
        last_name: 'DOMINGO'
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
    if (!ownerInfo || !id) return;

    setIsSending(true);
    try {
  const response = await axios.post(`http://127.0.0.1:8000/api/vehicles/${id}/notify`, {
        method,
        phone: ownerInfo.phone,
        email: ownerInfo.email,
        license_plate: licensePlate
      });

      toast({
        title: 'Succès',
        description: 'Notification envoyée avec succès',
      });

      navigate(`/app/vehicules/${id}`);

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

  const handleSkip = () => {
    navigate(`/app/vehicules/${id}`);
  };

  return (
    <div className="container mx-auto py-6 max-w-2xl">
      <Card>
        <CardHeader>
          <CardTitle>Notification du propriétaire</CardTitle>
          <CardDescription>
            Recherche des informations du propriétaire pour le véhicule {licensePlate} via l'API ANATT
          </CardDescription>
        </CardHeader>
        <CardContent>
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
                      via les données de l'ANATT
                    </p>
                    <div className="flex gap-4">
                      <Button onClick={lookupOwnerInfo}>
                        Rechercher le propriétaire
                      </Button>
                      <Button variant="outline" onClick={handleSkip}>
                        Ignorer cette étape
                      </Button>
                    </div>
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
                  <div className="flex justify-end mt-4">
                    <Button variant="outline" onClick={handleSkip}>
                      Ignorer
                    </Button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
