import React, { useEffect, useState } from 'react';
import { Link, useSearchParams, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Check, Download, Home, ChevronLeft, Receipt, Clock, Calendar, Car, Loader2 } from 'lucide-react';
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
      const transactionId = searchParams.get('transaction_id');
      const storedPaymentId = sessionStorage.getItem('last_payment_id');
      const storedTransactionId = sessionStorage.getItem('last_payment_transaction_id');
      const finalPaymentId = paymentIdFromUrl || storedPaymentId;
      const finalTransactionId = transactionId || storedTransactionId;

      console.log("Récupération du paiement - ID depuis URL:", paymentIdFromUrl);
      console.log("Récupération du paiement - Transaction ID:", transactionId);
      console.log("Récupération du paiement - ID depuis sessionStorage:", storedPaymentId);
      console.log("Récupération du paiement - ID final:", finalPaymentId);

      if (!finalPaymentId) {
        console.error("Aucun ID de paiement trouvé");
        toast({
          title: 'Erreur',
          description: 'Informations de paiement manquantes. Veuillez retourner à la page précédente.',
          variant: 'destructive',
          duration: 8000,
        });
        
        // Instead of redirecting immediately, give the user a button
        setTimeout(() => {
          navigate('/vehicule-lookup');
        }, 5000);
        return;
      }

      try {
        // Try to get payment details from API
        const paymentData = await paymentService.getPayment(finalPaymentId);
        setPayment(paymentData);
        setPaymentId(finalPaymentId);

        if (paymentData.vehicle_id) {
          const vehicleData = await vehicleService.getVehicle(paymentData.vehicle_id);
          setVehicle(vehicleData);
        }
      } catch (error) {
        console.error('Erreur lors de la récupération des détails du paiement:', error);
        
        // Fallback to session storage data if API call fails
        if (finalPaymentId && finalPaymentId.startsWith('kkiapay_')) {
          console.log('Utilisation des données de session pour le paiement KKiaPay');
          
          // Create payment object from session storage
          const amount = sessionStorage.getItem('last_payment_amount');
          const vehiclePlate = sessionStorage.getItem('last_payment_vehicle');
          const paymentDate = sessionStorage.getItem('last_payment_date') || new Date().toISOString();
          
          const fallbackPayment: Payment = {
            id: finalPaymentId,
            vehicle_id: 'unknown',
            amount: amount ? parseFloat(amount) : 0,
            method: PaymentMethod.MOBILE_MONEY,
            reference_number: finalTransactionId || 'unknown',
            receipt_number: `{Date.now()}`, 
            created_at: paymentDate,
            updated_at: paymentDate,
          };
          
          setPayment(fallbackPayment);
          setPaymentId(finalPaymentId);
          
          // Try to get vehicle data if we have the license plate
          if (vehiclePlate) {
            try {
              const vehicleData = await vehicleService.getVehicleByLicensePlate(vehiclePlate);
              setVehicle(vehicleData);
            } catch (vehicleError) {
              console.error('Erreur lors de la récupération des détails du véhicule:', vehicleError);
            }
          }
        } else {
          toast({
            title: 'Erreur',
            description: 'Impossible de récupérer les détails du paiement',
            variant: 'destructive',
          });
        }
      } finally {
        setIsLoading(false);
      }
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
      let receiptData;
      
      try {
        // Try to get receipt from API first
        receiptData = await paymentService.generateReceipt(paymentId);
      } catch (apiError) {
        console.error('Erreur API pour le reçu, génération locale:', apiError);
        
        // If API fails, generate receipt locally
        if (!payment) {
          throw new Error('Données de paiement manquantes');
        }
        
        // Import receipt generator dynamically
        const { generateReceiptPDF } = await import('@/utils/receiptGenerator');
        
        // Prepare data for receipt with proper type handling
        let receiptVehicle: Vehicle;
        if (vehicle) {
          receiptVehicle = vehicle;
        } else {
          // Create a complete Vehicle object to satisfy the interface
          receiptVehicle = {
            id: 'local-' + Date.now(),
            license_plate: sessionStorage.getItem('last_payment_vehicle') || 'inconnu',
            make: 'Non disponible',
            model: 'Non disponible',
            color: 'Non disponible',
            year: new Date().getFullYear(),
            type: VehicleType.CAR,
            status: VehicleStatus.IMPOUNDED,
            impound_date: new Date().toISOString(),
            location: 'Fourrière Municipale de Cotonou',
            photos: [],
            estimated_value: 0,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          };
        }
        
        const days = parseInt(sessionStorage.getItem('last_payment_days') || '1');
        const dailyRate = parseInt(sessionStorage.getItem('last_payment_daily_rate') || '2000');
        
        // Generate receipt locally
        const pdfUrl = await generateReceiptPDF({
          payment,
          vehicle: receiptVehicle,
          daysCount: days,
          dailyRate: dailyRate
        });
        
        receiptData = { receipt_url: pdfUrl };
      }
      
      if (!receiptData || !receiptData.receipt_url) {
        throw new Error('URL du reçu manquante');
      }
      
      const link = document.createElement('a');
      link.href = receiptData.receipt_url;
      link.download = `recu-paiement-fourriere-${vehicle?.license_plate || sessionStorage.getItem('last_payment_vehicle') || 'véhicule'}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
    
      if (vehicle?.owner?.email) {
        try {
          let pdfBase64 = receiptData.receipt_url;
          if (receiptData.receipt_url.startsWith('data:application/pdf;base64,')) {
            pdfBase64 = receiptData.receipt_url.split(',')[1];
          }
          
          await paymentService.sendReceiptByEmail(paymentId, vehicle.owner.email, pdfBase64);
          
          toast({
            title: 'Reçu envoyé par email',
            description: `Votre reçu a également été envoyé à l'adresse ${vehicle.owner.email}`,
            variant: 'success',
          });
        } catch (error) {
          console.error('Erreur lors de l\'envoi du reçu par email:', error);
        }
      }
      
      toast({
        title: 'Reçu téléchargé',
        description: 'Votre reçu a été téléchargé avec succès',
        variant: 'success',
      });
    } catch (error) {
      console.error('Erreur lors du téléchargement du reçu:', error);
      
      toast({
        title: 'Erreur',
        description: 'Impossible de télécharger le reçu. Génération locale en cours...',
        variant: 'warning',
      });
      
      try {
       
        if (!vehicle) {
          throw new Error('Informations du véhicule manquantes');
        }
        
        const feeData = await vehicleService.getStorageFee(vehicle.id);
        
        const { generateReceiptPDF } = await import('@/utils/receiptGenerator');
        
        const pdfUrl = await generateReceiptPDF({
          payment: payment!,
          vehicle: vehicle,
          daysCount: feeData.days,
          dailyRate: feeData.daily_rate
        });
        
        const link = document.createElement('a');
        link.href = pdfUrl;
        link.download = `Reçu-paiement-fourriere-${vehicle.license_plate}.pdf`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        
        toast({
          title: 'Reçu généré localement',
          description: 'Votre reçu a été généré et téléchargé avec succès',
          variant: 'success',
        });
      } catch (fallbackError) {
        console.error('Erreur lors de la génération locale du reçu:', fallbackError);
        toast({
          title: 'Échec de génération du reçu',
          description: 'Veuillez contacter la fourrière pour obtenir votre reçu',
          variant: 'destructive',
        });
      }
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
        {/* Header */}
        <header className="bg-municipal-gradient text-white py-4 px-6 shadow-md">
          <div>
            <Link to="/" className="text-2xl font-bold flex items-center space-x-2">   
              <span>Fourrière Municipale</span>
            </Link>
          </div>
        </header>

        <main className="flex-1 container mx-auto px-4 py-12 max-w-4xl">
          {/* Success Message */}
          <div className="text-center mb-8">
            <div className="mx-auto bg-green-100 p-4 rounded-full w-24 h-24 flex items-center justify-center mb-6">
              <Check className="h-12 w-12 text-green-600" />
            </div>
            <h1 className="text-4xl font-bold mb-2">Paiement réussi !</h1>
            <p className="text-xl text-muted-foreground mb-8">
              Votre paiement a été traité avec succès.
            </p>
          </div>

          {/* Payment Details Card */}
          <Card className="mb-8 border-2 shadow-lg">
            <CardHeader className="bg-muted/50">
              <CardTitle className="flex items-center gap-2 text-2xl">
                Détails du paiement
              </CardTitle>
            </CardHeader>
            <CardContent className="py-6">
              {payment && (
                <div className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <h3 className="text-sm font-medium text-muted-foreground mb-1 flex items-center">
                        <Calendar className="h-4 w-4 mr-2" />
                        Date du paiement
                      </h3>
                      <p className="text-lg font-semibold">
                        {new Date(payment.created_at).toLocaleDateString('fr-FR', {
                          day: 'numeric',
                          month: 'long',
                          year: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </p>
                    </div>
                    
                    <div>
                      <h3 className="text-sm font-medium text-muted-foreground mb-1 flex items-center">
                        Montant
                      </h3>
                      <p className="text-lg font-semibold text-green-600">
                        {Number(payment.amount).toLocaleString()} FCFA
                      </p>
                    </div>
                    
                    <div>
                      <h3 className="text-sm font-medium text-muted-foreground mb-1 flex items-center">
                        Référence de paiement
                      </h3>
                      <p className="text-lg font-semibold">
                        {payment.reference_number || 'Non disponible'}
                      </p>
                    </div>
                    
                    <div>
                      <h3 className="text-sm font-medium text-muted-foreground mb-1 flex items-center">
                        Véhicule
                      </h3>
                      <p className="text-lg font-semibold">
                        {vehicle ? (
                          <span>{vehicle.license_plate} ({vehicle.make} {vehicle.model})</span>
                        ) : (
                          'Non disponible'
                        )}
                      </p>
                    </div>
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
              )}
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
                <Button 
                  variant="outline" 
                  size="lg" 
                  className="w-full sm:w-auto"
                >
                  <Home className="h-5 w-5 mr-2" />
                  Retour à l'accueil
                </Button>
              </Link>
            </CardFooter>
          </Card>

          {/* Contact Info */}
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
