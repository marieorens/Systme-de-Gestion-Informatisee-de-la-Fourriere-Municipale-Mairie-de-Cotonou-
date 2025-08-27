'use client';
import { useState, useEffect, useCallback } from 'react';
import { Search, Car, ArrowLeft, Download, Loader2, CreditCard } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useKKiaPay } from 'kkiapay-react';
import { toast } from '@/hooks/use-toast';
import { vehicleService, paymentService } from '@/services';
import { Vehicle } from '@/types';
import { VehicleStatus, PaymentMethod } from '@/types/enums';

interface VehicleWithFees extends Vehicle {
  storageFee?: {
    days: number;
    daily_rate: number;
    total_fee: number;
  };
}

interface PaymentResponse {
  transactionId: string;
  status: string;
  amount: number;
}

export const VehicleLookupPage = () => {
  const [plateNumber, setPlateNumber] = useState('');
  const [searchResult, setSearchResult] = useState<VehicleWithFees | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const [isPaying, setIsPaying] = useState(false);
  const [isGeneratingReceipt, setIsGeneratingReceipt] = useState(false);
  const [paymentCompleted, setPaymentCompleted] = useState(false);
  const [paymentId, setPaymentId] = useState<string | null>(null);
  
  const navigate = useNavigate();
  const { 
    openKkiapayWidget, 
    addKkiapayListener, 
    removeKkiapayListener,
    addKkiapayCloseListener 
  } = useKKiaPay();
  
  // Fonction pour télécharger le reçu
  const downloadReceipt = useCallback(async () => {
    if (!paymentId) {
      console.error('Aucun ID de paiement disponible pour télécharger le reçu');
      
      // Essayer de récupérer l'ID de paiement depuis sessionStorage
      const storedPaymentId = sessionStorage.getItem('last_payment_id');
      if (storedPaymentId) {
        console.log('Utilisation de l\'ID de paiement stocké:', storedPaymentId);
        setPaymentId(storedPaymentId);
        toast({
          title: 'Récupération du paiement',
          description: 'Nous essayons de récupérer les informations de votre paiement...',
        });
        return; // Le useEffect se déclenchera avec le nouveau paymentId
      } else {
        toast({
          title: 'Erreur de téléchargement',
          description: 'Impossible de trouver les informations de paiement. Veuillez contacter la fourrière.',
          variant: 'destructive',
        });
        return;
      }
    }
    
    console.log('Téléchargement du reçu pour le paiement:', paymentId);
    setIsGeneratingReceipt(true);
    
    try {
      // Générer le reçu via le service API ou localement si l'API échoue
      const receiptData = await paymentService.generateReceipt(paymentId);
      console.log('Reçu généré avec succès:', receiptData);
      
      if (!receiptData || !receiptData.receipt_url) {
        throw new Error('Reçu généré mais URL manquante');
      }
      
      // Create a link to download the receipt
      const link = document.createElement('a');
      link.href = receiptData.receipt_url;
      link.download = `recu-paiement-fourriere-${searchResult?.license_plate || 'inconnu'}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      // Envoyer le reçu par email si nous avons l'adresse email du propriétaire
      if (searchResult?.owner?.email) {
        try {
          // Extraire la partie Base64 de l'URL data si c'est une URL data
          let pdfBase64 = receiptData.receipt_url;
          if (receiptData.receipt_url.startsWith('data:application/pdf;base64,')) {
            pdfBase64 = receiptData.receipt_url.split(',')[1];
          }
          
          await paymentService.sendReceiptByEmail(paymentId, searchResult.owner.email, pdfBase64)
            .catch(emailError => {
              console.error('Erreur lors de l\'envoi du reçu par email:', emailError);
              // On ne bloque pas le processus si l'envoi d'email échoue
            });
            
          toast({
            title: 'Reçu envoyé par email',
            description: `Votre reçu a également été envoyé à l'adresse ${searchResult.owner.email}`,
          });
        } catch (emailError) {
          console.error('Erreur lors de l\'envoi du reçu par email:', emailError);
          // On ne montre pas d'erreur à l'utilisateur si l'envoi d'email échoue
          // car il a déjà son reçu téléchargé
        }
      }
      
      toast({
        title: 'Reçu téléchargé',
        description: 'Votre reçu a été téléchargé avec succès.',
        variant: 'success',
      });
      
    } catch (error) {
      console.error('Error downloading receipt:', error);
      
      toast({
        title: 'Problème avec le téléchargement',
        description: 'Nous tentons de générer le reçu localement...',
        variant: 'warning',
      });
      
      try {
        // Essayer de récupérer les informations nécessaires pour la génération locale
        const payment = await paymentService.getPayment(paymentId);
        const vehicleData = searchResult || await vehicleService.getVehicle(payment.vehicle_id);
        const feeData = await vehicleService.getStorageFee(vehicleData.id);
        
        // Importer dynamiquement le générateur de reçu
        const { generateReceiptPDF } = await import('@/utils/receiptGenerator');
        
        // Générer le reçu localement
        const pdfUrl = generateReceiptPDF({
          payment,
          vehicle: vehicleData,
          daysCount: feeData.days,
          dailyRate: feeData.daily_rate
        });
        
        const link = document.createElement('a');
        link.href = await pdfUrl;
        link.download = `recu-paiement-fourriere-${vehicleData.license_plate || 'inconnu'}.pdf`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        
        toast({
          title: 'Reçu généré localement',
          description: 'Votre reçu a été généré et téléchargé avec succès.',
          variant: 'success',
        });
        
        // Ne pas rediriger l'utilisateur
      } catch (fallbackError) {
        console.error('Error generating local receipt:', fallbackError);
        toast({
          title: 'Erreur de téléchargement',
          description: 'Impossible de générer le reçu. Veuillez contacter la fourrière.',
          variant: 'destructive',
        });
      }
    } finally {
      setIsGeneratingReceipt(false);
    }
  }, [paymentId, searchResult]);
  
  // Effet pour gérer le retour depuis la passerelle de paiement via l'URL
  useEffect(() => {
    // Récupérer les paramètres de l'URL
    const urlParams = new URLSearchParams(window.location.search);
    const plate = urlParams.get('plate');
    const paymentStatus = urlParams.get('payment_status');
    
    console.log('URL params:', plate, paymentStatus);
    
    // Si nous revenons d'un paiement réussi
    if (plate && paymentStatus === 'success' && !paymentCompleted) {
      // Essayer de récupérer l'ID de paiement stocké dans la session
      const lastPaymentId = sessionStorage.getItem('last_payment_id');
      
      console.log('Last payment ID from session:', lastPaymentId);
      if (lastPaymentId) {
        setPaymentId(lastPaymentId);
      }
      
      // Rechercher automatiquement le véhicule
      setPlateNumber(plate);
      setHasSearched(true);
      
      // Effectuer la recherche automatiquement
      const searchVehicle = async () => {
        setIsLoading(true);
        try {
          const vehicleData = await vehicleService.getVehicleByLicensePlate(plate);
          if (vehicleData) {
            // Calculer les frais
            const impoundDate = new Date(vehicleData.impound_date);
            const currentDate = new Date();
            const diffTime = Math.abs(currentDate.getTime() - impoundDate.getTime());
            const days = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
            const dailyRate = 2000;
            const totalFee = Math.max(days, 1) * dailyRate;
            
            // Définir le résultat
            setSearchResult({
              ...vehicleData,
              storageFee: {
                days: Math.max(days, 1),
                daily_rate: dailyRate,
                total_fee: totalFee
              }
            });
            
            // Marquer comme payé
            setPaymentCompleted(true);
            setHasSearched(true);
            
            toast({
              title: 'Paiement confirmé',
              description: 'Votre paiement a été traité avec succès. Vous pouvez télécharger votre reçu.',
              variant: 'default',
            });
          }
        } catch (error) {
          console.error('Error loading vehicle after payment:', error);
        } finally {
          setIsLoading(false);
        }
      };
      
      searchVehicle();
      
      // Nettoyer les paramètres d'URL pour éviter de retraiter ce paiement lors d'un rafraîchissement
      window.history.replaceState({}, document.title, window.location.pathname);
    }
  }, [paymentCompleted]);

  
  useEffect(() => { 
    // Fonction pour nettoyer les ressources
    const cleanupResources = () => {
      const timeoutId = sessionStorage.getItem('paymentTimeoutId');
      if (timeoutId) {
        clearTimeout(parseInt(timeoutId));
        sessionStorage.removeItem('paymentTimeoutId');
      }
      setIsPaying(false);
    };
    
    // Gestionnaire de succès optimisé
    const successHandler = async (response: PaymentResponse) => {
      console.log('KKiaPay success callback:', response);
      
      // Nettoyage des ressources
      cleanupResources();
      
      // Vérifier si la réponse contient un ID de transaction valide
      if (!response || !response.transactionId) {
        console.error('Réponse de paiement invalide:', response);
        toast({
          title: 'Erreur de paiement',
          description: 'Nous n\'avons pas pu confirmer votre paiement. Veuillez réessayer.',
          variant: 'destructive',
        });
        return;
      }
      
      try {
        // Traiter le paiement seulement si searchResult existe
        if (!searchResult) {
          throw new Error('Informations du véhicule manquantes');
        }
        
        // Récupérer le montant actuel des frais
        const paymentAmount = searchResult.storageFee?.total_fee || 0;
        
        // Préparer les données de paiement
        const paymentData = {
          vehicle_id: searchResult.id,
          amount: paymentAmount,
          method: PaymentMethod.MOBILE_MONEY,
          reference_number: response.transactionId,
          description: `Paiement en ligne via KKiaPay pour le véhicule ${searchResult.license_plate}`
        };
        
        // Enregistrer le paiement dans le système
        console.log('Enregistrement du paiement:', paymentData);
        const payment = await paymentService.createPayment(paymentData);
        
        // Mettre à jour l'état local
        setPaymentId(payment.id);
        setPaymentCompleted(true);
        
        // Stocker les informations pour la récupération après redirection
        console.log('Stockage du payment ID dans sessionStorage:', payment.id);
        sessionStorage.setItem('last_payment_id', payment.id);
        sessionStorage.setItem('last_payment_vehicle', searchResult.license_plate);
        
        // Stocker des informations supplémentaires pour la génération de reçu hors ligne
        sessionStorage.setItem('last_payment_amount', searchResult.storageFee?.total_fee.toString() || '0');
        sessionStorage.setItem('last_payment_days', searchResult.storageFee?.days.toString() || '1');
        sessionStorage.setItem('last_payment_daily_rate', searchResult.storageFee?.daily_rate.toString() || '2000');
        sessionStorage.setItem('last_payment_date', new Date().toISOString());
        
        // Mettre à jour les informations du véhicule
        try {
          await vehicleService.updateVehicle(searchResult.id, {
            // Conserver le statut IMPOUNDED mais ajouter une indication que les frais sont payés
            description: `${searchResult.description || ''} [FRAIS PAYÉS LE ${new Date().toLocaleDateString('fr-FR')}]`
          });
          
          console.log('Véhicule mis à jour avec succès');
        } catch (updateError) {
          console.error('Erreur lors de la mise à jour du véhicule:', updateError);
          // Ne pas bloquer le processus si la mise à jour échoue
        }
        
        // Informer l'utilisateur
        toast({
          title: 'Paiement réussi',
          description: 'Redirection vers la page de confirmation...',
          variant: 'success',
          duration: 5000, // Afficher plus longtemps (5 secondes)
        });
        
        // Redirection vers la page de confirmation avec l'ID du paiement
        console.log('Préparation de la redirection vers:', `/paiement/confirmation?payment_id=${payment.id}`);
        
        // Utiliser setTimeout pour permettre à l'utilisateur de voir le message
        setTimeout(() => {
          const redirectUrl = `/paiement/confirmation?payment_id=${payment.id}`;
          console.log('Redirection vers:', redirectUrl);
          window.location.href = redirectUrl;
        }, 3000); // Attendre 3 secondes avant de rediriger
      } catch (error) {
        console.error('Erreur lors de l\'enregistrement du paiement:', error);
        
        // Vérifier si nous avons l'ID de transaction pour permettre une vérification manuelle
        if (response && response.transactionId) {
          // Même en cas d'échec d'enregistrement dans notre système, nous stockons les informations du paiement
          // pour que l'utilisateur puisse accéder au reçu
          const transactionId = response.transactionId;
          
          // Créer un ID temporaire pour ce paiement (basé sur la transaction KKiaPay)
          const tempPaymentId = `kkiapay_${transactionId}_${Date.now()}`;
          console.log('Stockage d\'un ID de paiement temporaire:', tempPaymentId);
          
          // Stocker les informations essentielles
          sessionStorage.setItem('last_payment_id', tempPaymentId);
          sessionStorage.setItem('last_payment_transaction_id', transactionId);
          sessionStorage.setItem('last_payment_amount', searchResult.storageFee?.total_fee.toString() || '0');
          sessionStorage.setItem('last_payment_vehicle', searchResult.license_plate);
          sessionStorage.setItem('last_payment_date', new Date().toISOString());
          
          // Définir comme complété pour permettre les redirections de secours
          setPaymentCompleted(true);
          
          toast({
            title: 'Paiement traité',
            description: `Votre paiement a été effectué (réf: ${transactionId}). Nous vous redirigerons vers votre reçu.`,
            variant: 'warning',
            duration: 10000, // Afficher plus longtemps pour permettre à l'utilisateur de noter la référence
          });
          
          // Redirection avec retard pour permettre à l'utilisateur de voir le message
          setTimeout(() => {
            const redirectUrl = `/paiement/confirmation?payment_id=${tempPaymentId}&transaction_id=${transactionId}`;
            console.log('Redirection de secours vers:', redirectUrl);
            window.location.href = redirectUrl;
          }, 5000);
        } else {
          toast({
            title: 'Erreur d\'enregistrement',
            description: 'Le paiement a été effectué mais nous n\'avons pas pu l\'enregistrer. Veuillez contacter la fourrière.',
            variant: 'destructive',
          });
        }
      }
    };

    // Gestionnaire d'échec optimisé
    const failureHandler = (error: unknown) => {
      console.error('Payment failed:', error);
      
      // Nettoyage des ressources
      cleanupResources();
      
      // Informer l'utilisateur
      toast({
        title: 'Échec du paiement',
        description: 'Le paiement n\'a pas pu être traité. Veuillez réessayer ou contacter votre banque.',
        variant: 'destructive',
      });
    };
    
    // Gestionnaire de fermeture optimisé
    const closeHandler = () => {
      console.log('Payment widget closed');
      
      cleanupResources();
            if (paymentCompleted) {
        console.log('Payment was completed, checking if we need to redirect');
        const storedPaymentId = sessionStorage.getItem('last_payment_id');
        if (storedPaymentId) {
          console.log('Redirecting to confirmation page with stored payment ID');
          window.location.href = `/paiement/confirmation?payment_id=${storedPaymentId}`;
        }
      } else {
        console.log('Payment was likely canceled by user');
      }
    };
    
    // Ajout des écouteurs d'événements
    console.log('Adding KKiaPay event listeners');
    addKkiapayListener('success', successHandler);
    addKkiapayListener('failed', failureHandler);
    addKkiapayCloseListener(closeHandler);
    
    return () => {
      // Nettoyage des écouteurs lors du démontage
      console.log('Removing KKiaPay event listeners');
      removeKkiapayListener('success');
      removeKkiapayListener('failed');
      
      // Nettoyer le timeout si le composant est démonté
      cleanupResources();
    };
  }, [addKkiapayListener, removeKkiapayListener, addKkiapayCloseListener, searchResult, paymentCompleted]);
  
  // Nous avons déplacé la redirection directement dans le gestionnaire de succès du paiement

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!plateNumber.trim()) return;

    setIsLoading(true);
    setHasSearched(true);
    setPaymentCompleted(false);
    setPaymentId(null);
    
    try {
      // Formater et nettoyer le numéro de plaque (supprimer les espaces supplémentaires, mettre en majuscule)
      const formattedPlate = plateNumber.trim().toUpperCase().replace(/\s+/g, ' ');
      console.log('Searching for vehicle with plate:', formattedPlate);
      
      // Call the real API to search for vehicle by license plate
      const vehicleData = await vehicleService.getVehicleByLicensePlate(formattedPlate);
      console.log('Vehicle data received:', vehicleData);
      
      // Only show vehicles that are in the pound (status is 'impounded')
      if (vehicleData && vehicleData.status === VehicleStatus.IMPOUNDED) {
        try {
          // Calcul direct des jours de fourrière
          const impoundDate = new Date(vehicleData.impound_date);
          const currentDate = new Date();
          const diffTime = Math.abs(currentDate.getTime() - impoundDate.getTime());
          const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
          
          // Tarif journalier fixe
          const dailyRate = 2000; // 2000 FCFA par jour
          
          // Calcul du total (jours * tarif)
          const days = Math.max(diffDays, 1); // Au moins 1 jour
          const totalFee = days * dailyRate;
          
          console.log(`Jours en fourrière: ${days}, tarif journalier: ${dailyRate}, total: ${totalFee}`);
          
          // Définir le résultat avec les frais calculés
          setSearchResult({
            ...vehicleData,
            storageFee: {
              days: days,
              daily_rate: dailyRate,
              total_fee: totalFee
            }
          });
          
        } catch (feeError) {
          console.error('Error calculating storage fee:', feeError);
          // En cas d'erreur de calcul des frais, afficher quand même le véhicule
          setSearchResult(vehicleData);
          toast({
            title: 'Information partielle',
            description: 'Les frais de stockage n\'ont pas pu être calculés.',
            variant: 'default',
          });
        }
      } else if (vehicleData) {
        setSearchResult(vehicleData);
        toast({
          title: 'Véhicule trouvé',
          description: 'Ce véhicule n\'est pas actuellement en fourrière.',
          variant: 'default',
        });
      } else {
        setSearchResult(null);
        toast({
          title: 'Véhicule non trouvé',
          description: 'Aucun véhicule correspondant à cette immatriculation.',
          variant: 'destructive',
        });
      }
    } catch (error) {
      console.error('Error searching for vehicle:', error);
      setSearchResult(null);
      toast({
        title: 'Erreur de recherche',
        description: 'Impossible de trouver le véhicule. Veuillez vérifier le numéro d\'immatriculation.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handlePayment = () => {
    if (!searchResult) return;
    
    if (!searchResult.storageFee) {
      const impoundDate = new Date(searchResult.impound_date);
      const currentDate = new Date();
      const diffTime = Math.abs(currentDate.getTime() - impoundDate.getTime());
      const days = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      const dailyRate = 2000;
      const totalFee = Math.max(days, 1) * dailyRate;
      
      searchResult.storageFee = {
        days: Math.max(days, 1),
        daily_rate: dailyRate,
        total_fee: totalFee
      };
    }
    
    const paymentAmount = searchResult.storageFee.total_fee;
    console.log('Payment amount:', paymentAmount);
    setIsPaying(true);
    
    try {
      const oldTimeoutId = sessionStorage.getItem('paymentTimeoutId');
      if (oldTimeoutId) {
        clearTimeout(parseInt(oldTimeoutId));
        sessionStorage.removeItem('paymentTimeoutId');
      }
      
      // Mettre en place un timeout de sécurité
      const timeoutId = setTimeout(() => {
        setIsPaying(false);
        toast({
          title: 'Problème de communication',
          description: 'La passerelle de paiement ne répond pas. Veuillez réessayer plus tard.',
          variant: 'destructive',
        });
      }, 60000); // 60 secondes pour compléter le paiement
      
      // Stocker l'ID du timeout
      sessionStorage.setItem('paymentTimeoutId', timeoutId.toString());
      
      
      const baseUrl = window.location.origin;
      sessionStorage.setItem('current_vehicle_plate', searchResult.license_plate);
      sessionStorage.setItem('current_vehicle_id', searchResult.id);
      console.log('Ouverture du widget KKiaPay...');
      

      openKkiapayWidget({
        amount: paymentAmount,
        key: "0a9be610652111efbf02478c5adba4b8",
        sandbox: true,
        phone: searchResult.owner?.phone || '',
        email: searchResult.owner?.email || '',
        theme: "green",
        position: "center",
        callback: `${baseUrl}/paiement/confirmation`, 
        data: JSON.stringify({
          vehicleId: searchResult.id,
          vehicleInfo: searchResult.license_plate,
          days: searchResult.storageFee.days,
          dailyRate: searchResult.storageFee.daily_rate
        }),
      });
    } catch (error) {
      console.error('Error opening payment widget:', error);
      setIsPaying(false);
      toast({
        title: 'Erreur de paiement',
        description: 'Impossible d\'ouvrir la fenêtre de paiement. Veuillez réessayer plus tard.',
        variant: 'destructive',
        duration: 5000,
      });
    }
  };

  const getStatusBadge = (status: VehicleStatus) => {
    switch (status) {
      case VehicleStatus.IMPOUNDED:
        return <Badge variant="destructive">En fourrière</Badge>;
      case VehicleStatus.CLAIMED:
        return <Badge variant="secondary">Réclamé</Badge>;
      case VehicleStatus.SOLD:
        return <Badge variant="outline">Vendu</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  return (
    <div className="min-h-screen bg-background animate-fade-in">
      {/* Header */}
      <header className="border-b border-border bg-card/50 backdrop-blur">
        <div className="max-w-4xl mx-auto px-6 h-16 flex items-center justify-between">
          <Button variant="ghost" asChild>
            <Link to="/">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Retour à l'accueil
            </Link>
          </Button>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto px-6 py-12">
        <div className="text-center mb-8">
          <h1 className="text-3xl lg:text-4xl font-bold text-foreground mb-4">
            Consultez l'état de votre véhicule
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Entrez votre numéro d'immatriculation pour vérifier si votre véhicule se trouve en fourrière municipale
          </p>
        </div>

        {/* Search Form */}
        <form onSubmit={handleSearch} className="max-w-md mx-auto mb-8">
          <div className="flex gap-2">
            <Input
              type="text"
              placeholder="Ex: AB 1234 CD"
              value={plateNumber}
              onChange={(e) => setPlateNumber(e.target.value)}
              className="text-center text-lg font-semibold uppercase"
              disabled={isLoading}
            />
            <Button type="submit" size="lg" disabled={isLoading || !plateNumber.trim()}>
              {isLoading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <>
                  <Search className="h-4 w-4 mr-2" />
                  Rechercher
                </>
              )}
            </Button>
          </div>
        </form>

        {/* Results */}
        {hasSearched && !isLoading && (
          <div className="max-w-2xl mx-auto">
            {searchResult ? (
              <Card className="border-2 border-primary/20">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="flex items-center gap-2">
                      <Car className="h-5 w-5" />
                      {searchResult.license_plate}
                    </CardTitle>
                    {getStatusBadge(searchResult.status)}
                  </div>
                  <CardDescription>
                    {searchResult.make} {searchResult.model} - {searchResult.color}
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <h4 className="font-semibold text-sm text-muted-foreground mb-1">Date d'entrée</h4>
                      <p className="text-foreground">{new Date(searchResult.impound_date).toLocaleDateString('fr-FR')}</p>
                    </div>
                    <div>
                      <h4 className="font-semibold text-sm text-muted-foreground mb-1">Localisation</h4>
                      <p className="text-foreground">{searchResult.location}</p>
                    </div>
                    <div>
                      <h4 className="font-semibold text-sm text-muted-foreground mb-1">Frais à payer</h4>
                      <div className="space-y-1">
                        <p className="text-lg font-semibold text-primary">
                          {Number(searchResult.storageFee?.total_fee).toLocaleString()} FCFA
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {Number(searchResult.storageFee?.days)} jours × {' '}
                          {Number(searchResult.storageFee?.daily_rate).toLocaleString()} FCFA/jour
                        </p>
                      </div>
                    </div>
                    {searchResult.owner && (
                      <div>
                        <h4 className="font-semibold text-sm text-muted-foreground mb-1">Propriétaire</h4>
                        <p className="text-foreground">
                          {searchResult.owner.first_name} {searchResult.owner.last_name}
                        </p>
                        {searchResult.owner.phone && (
                          <p className="text-sm text-muted-foreground">{searchResult.owner.phone}</p>
                        )}
                      </div>
                    )}
                  </div>
                  
                  {/* Payment Information Section */}
                  <div className="pt-4 border-t border-border space-y-4">
                    {!paymentCompleted ? (
                      <div className="bg-primary/5 p-4 rounded-lg space-y-4">
                        <div>
                          <h4 className="font-semibold text-primary mb-2">Payer les frais de fourrière</h4>
                          <p className="text-sm text-muted-foreground mb-3">
                            Vous pouvez payer les frais de fourrière en ligne via notre partenaire de paiement sécurisé KKiaPay.
                          </p>
                        </div>
                        
                        <Button 
                          className="w-full bg-municipal-gradient hover:opacity-90" 
                          size="lg"
                          onClick={handlePayment}
                          disabled={isPaying}
                        >
                          {isPaying ? (
                            <>
                              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                              Traitement en cours...
                            </>
                          ) : (
                            <>
                              <CreditCard className="h-4 w-4 mr-2" />
                              Payer {Number(searchResult.storageFee?.total_fee).toLocaleString()} FCFA
                            </>
                          )}
                        </Button>
                        
                        <p className="text-xs text-center text-muted-foreground">
                          Paiement sécurisé via Mobile Money, Carte bancaire ou portefeuille électronique
                        </p>
                      </div>
                    ) : (
                      <div className="bg-green-50 p-4 rounded-lg space-y-4">
                        <div>
                          <h4 className="font-semibold text-green-800 mb-2">✅ Paiement réussi</h4>
                          <p className="text-sm text-green-700 mb-3">
                            Votre paiement de <strong>{Number(searchResult.storageFee?.total_fee).toLocaleString()} FCFA</strong> a été traité avec succès. Cliquez sur le bouton ci-dessous pour télécharger votre reçu.
                          </p>
                        </div>
                        
                        <Button 
                          className="w-full bg-green-600 hover:bg-green-700 text-white" 
                          size="lg"
                          onClick={downloadReceipt}
                          disabled={isGeneratingReceipt}
                        >
                          {isGeneratingReceipt ? (
                            <>
                              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                              Génération du reçu...
                            </>
                          ) : (
                            <>
                              <Download className="h-4 w-4 mr-2" />
                              Télécharger le reçu
                            </>
                          )}
                        </Button>
                      </div>
                    )}

                    <div className="bg-green-50 p-4 rounded-lg">
                      <h4 className="font-semibold text-green-900 mb-2">Documents requis pour la récupération</h4>
                      <ul className="text-sm text-green-700 space-y-1 list-disc list-inside">
                        <li>Pièce d'identité du propriétaire</li>
                        <li><strong>Reçu de paiement des frais de fourrière</strong></li>
                        <li>Carte grise du véhicule</li>
                        <li>Procuration légalisée (si récupération par un tiers)</li>
                      </ul>
                    </div>

                    <div className="bg-orange-50 p-4 rounded-lg">
                      <h4 className="font-semibold text-orange-900 mb-2">📍 Adresse de la fourrière</h4>
                      <div className="text-sm text-orange-700 space-y-1">
                        <p><strong>Fourrière Municipale de Cotonou</strong></p>
                        <p>📞 Tél: +229 21 30 04 00</p>
                        <p>📧 Email: fourriere@mairie-cotonou.bj</p>
                        <p>🕐 Ouvert: Lun-Ven 8h-17h, Sam 8h-12h</p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ) : (
              <Card>
                <CardHeader>
                  <CardTitle className="text-center">Véhicule non trouvé</CardTitle>
                  <CardDescription className="text-center">
                    Aucun véhicule avec l'immatriculation "{plateNumber.toUpperCase()}" n'a été trouvé en fourrière.
                  </CardDescription>
                </CardHeader>
                <CardContent className="text-center">
                  <p className="text-sm text-muted-foreground mb-4">
                    Si vous pensez qu'il y a une erreur, contactez directement la fourrière municipale.
                  </p>
                  <div className="space-y-2">
                    <p className="text-sm font-semibold">Fourrière Municipale de Cotonou</p>
                    <p className="text-sm text-muted-foreground">📞Tél: +229 21 30 04 00</p>
                    <p className="text-sm text-muted-foreground">📧Email: fourriere@mairie-cotonou.bj</p>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        )}
      </main>
    </div>
  );
};
