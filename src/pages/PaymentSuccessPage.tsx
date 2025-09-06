import React, { useEffect, useState } from 'react';
import { Link, useSearchParams, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Check, Download, Home, Loader2 } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { vehicleService, paymentService } from '@/services';
import { Vehicle, Payment } from '@/types';
import { VehicleType, VehicleStatus, PaymentMethod } from '@/types/enums';
import { PageTransition } from '@/components/PageTransition';

export const PaymentSuccessPage = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(true);
  const [paymentId, setPaymentId] = useState<string | null>(null);
  const [payment, setPayment] = useState<Payment | null>(null);
  const [vehicle, setVehicle] = useState<Vehicle | null>(null);
  const [isGeneratingReceipt, setIsGeneratingReceipt] = useState(false);

  useEffect(() => {
    const fetchPaymentDetails = async () => {
      setIsLoading(true);
      const paymentIdFromUrl = searchParams.get('payment_id');
      if (!paymentIdFromUrl) {
        toast({
          title: 'Erreur',
          description: 'Informations de paiement manquantes. Veuillez retourner à la page précédente.',
          variant: 'destructive',
          duration: 8000,
        });
        setTimeout(() => {
          navigate('/vehicule-lookup');
        }, 5000);
        return;
      }
      try {
        // Always use backend for payment and vehicle data
        let paymentData;
        if (paymentIdFromUrl.startsWith('kkiapay_')) {
          paymentData = await paymentService.getPublicPayment(paymentIdFromUrl);
        } else {
          paymentData = await paymentService.getPayment(paymentIdFromUrl);
        }
        setPayment(paymentData);
        setPaymentId(paymentIdFromUrl);
        if (paymentData.vehicle_id) {
          const vehicleData = await vehicleService.getVehicle(paymentData.vehicle_id);
          setVehicle(vehicleData);
        }
      } catch (error) {
        console.error('Erreur lors de la récupération des détails du paiement:', error);
        toast({
          title: 'Erreur',
          description: 'Impossible de récupérer les détails du paiement',
          variant: 'destructive',
        });
      }
      setIsLoading(false);
    };
    fetchPaymentDetails();
  }, [searchParams, navigate]);

  const downloadReceipt = async () => {
    if (!paymentId) {
      toast({
        title: 'Erreur',
        description: 'ID de paiement manquant',
        variant: 'destructive',
      });
      return;
    }
    setIsGeneratingReceipt(true);
    try {
      const receiptData = await paymentService.generateReceipt(paymentId);
      // Use fetch to download the PDF as a blob
      const response = await fetch(receiptData.receipt_url);
      if (!response.ok) throw new Error('Erreur lors du téléchargement du reçu');
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `recu-paiement-fourriere-${vehicle?.license_plate || 'vehicule'}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      toast({
        title: 'Reçu téléchargé',
        description: 'Votre reçu a été téléchargé avec succès',
        variant: 'success',
      });
    } catch (error) {
      console.error('Erreur lors du téléchargement du reçu:', error);
      toast({
        title: 'Erreur',
        description: 'Impossible de télécharger le reçu',
        variant: 'destructive',
      });
    } finally {
      setIsGeneratingReceipt(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-4 bg-muted/20">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin mx-auto mb-4 text-primary" />
          <h2 className="text-2xl font-bold mb-2">Chargement des détails du paiement</h2>
          <p className="text-muted-foreground">Veuillez patienter...</p>
        </div>
      </div>
    );
  }

  return (
    <PageTransition>
      <div className="min-h-screen flex flex-col bg-muted/20">
        <header className="bg-municipal-gradient text-white py-4 px-6 shadow-md">
          <Link to="/" className="text-2xl font-bold flex items-center space-x-2">
            <span>Fourrière Municipale</span>
          </Link>
        </header>

        <main className="flex-1 container mx-auto px-4 py-12 max-w-4xl">
          <div className="text-center mb-8">
            <div className="mx-auto bg-green-100 p-4 rounded-full w-24 h-24 flex items-center justify-center mb-6">
              <Check className="h-12 w-12 text-green-600" />
            </div>
            <h1 className="text-4xl font-bold mb-2">Paiement réussi !</h1>
            <p className="text-xl text-muted-foreground mb-8">
              Votre paiement a été traité avec succès.
            </p>
          </div>

          <Card className="mb-8 border-2 shadow-lg">
            <CardHeader className="bg-muted/50">
              <CardTitle className="flex items-center gap-2 text-2xl">
                Détails du paiement
              </CardTitle>
            </CardHeader>

            <CardContent className="space-y-6">
              <div className="space-y-4">
                <div>
                  <h3 className="text-sm font-medium text-muted-foreground mb-1 flex items-center">
                    Référence
                  </h3>
                  <p className="text-lg font-semibold">
                    {payment?.reference_number || 'Non disponible'}
                  </p>
                </div>

                <div>
                  <h3 className="text-sm font-medium text-muted-foreground mb-1 flex items-center">
                    Véhicule
                  </h3>
                  <p className="text-lg font-semibold">
                    {vehicle ? `${vehicle.license_plate} (${vehicle.make} ${vehicle.model})` : 'Non disponible'}
                  </p>
                </div>

                <div className="border-t pt-6 mt-6">
                  <div className="bg-green-50 p-4 rounded-lg">
                    <h3 className="font-semibold text-green-800 mb-2 flex items-center">
                      <Check className="h-5 w-5 mr-2" />
                      Instructions pour récupérer votre véhicule
                    </h3>
                    <ol className="list-decimal pl-5 space-y-2 text-green-800">
                      <li>Présentez-vous à la fourrière municipale avec une pièce d'identité</li>
                      <li>Montrez le reçu de paiement que vous avez téléchargé</li>
                      <li>Présentez les documents du véhicule (carte grise, assurance)</li>
                      <li>Un agent vous accompagnera pour récupérer votre véhicule</li>
                    </ol>
                  </div>
                </div>
              </div>
            </CardContent>

            <CardFooter className="bg-muted/30 flex flex-col sm:flex-row gap-4 p-6">
              <Button
                className="w-full sm:w-auto bg-primary hover:bg-primary/90"
                size="lg"
                onClick={downloadReceipt}
                disabled={isGeneratingReceipt}
              >
                {isGeneratingReceipt ? (
                  <>
                    <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                    Génération du reçu...
                  </>
                ) : (
                  <>
                    <Download className="h-5 w-5 mr-2" />
                    Télécharger la preuve de paiement
                  </>
                )}
              </Button>

              <Link to="/">
                <Button variant="outline" size="lg" className="w-full sm:w-auto">
                  <Home className="h-5 w-5 mr-2" />
                  Retour à l'accueil
                </Button>
              </Link>
            </CardFooter>
          </Card>

          <div className="text-center text-muted-foreground">
            <p>Pour toute question, contactez le service de la fourrière municipale</p>
            <p className="font-medium">+229 21 30 25 15 • fourriere@mairie-cotonou.bj</p>
          </div>
        </main>
      </div>
    </PageTransition>
  );
};

export default PaymentSuccessPage;
