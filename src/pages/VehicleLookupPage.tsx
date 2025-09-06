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
import { calculateImpoundFees } from '@/lib/utils';

interface VehicleWithFees extends Vehicle {
  storageFee?: {
    days: number;
    daily_rate: number;
    total_fee: number;
    removal_fee?: number;
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
  
  const downloadReceipt = useCallback(async () => {
    if (!paymentId) {
      toast({
        title: 'Erreur de téléchargement',
        description: 'Impossible de trouver les informations de paiement. Veuillez contacter la fourrière.',
        variant: 'destructive',
      });
      return;
    }
    setIsGeneratingReceipt(true);
    try {
      const receiptData = await paymentService.generateReceipt(paymentId);
      if (!receiptData || !receiptData.receipt_url || !receiptData.receipt_url.endsWith('.pdf')) {
        throw new Error('Le backend n’a pas retourné une URL PDF valide');
      }
      const response = await fetch(receiptData.receipt_url);
      if (!response.ok) throw new Error('Erreur lors du téléchargement du reçu');
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      const filename = receiptData.receipt_url.split('/').pop();
      link.download = filename || `recu-paiement-fourriere.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      toast({
        title: 'Reçu téléchargé',
        description: 'Votre reçu a été téléchargé.',
        variant: 'success',
      });
    } catch (error) {
      console.error('Erreur lors du téléchargement du reçu:', error);
      toast({
        title: 'Erreur de téléchargement',
        description: 'Impossible de générer le reçu. Veuillez contacter la fourrière.',
        variant: 'destructive',
      });
    } finally {
      setIsGeneratingReceipt(false);
    }
  }, [paymentId, searchResult]);
  
  
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const plate = urlParams.get('plate');
    const paymentStatus = urlParams.get('payment_status');
    
    console.log('URL params:', plate, paymentStatus);
    
    if (plate && paymentStatus === 'success' && !paymentCompleted) {
      setPlateNumber(plate);
      setHasSearched(true);
      
      const searchVehicle = async () => {
        setIsLoading(true);
        try {
          const vehicleData = await vehicleService.getVehicleByLicensePlate(plate);
          if (vehicleData) {
            const impoundDate = new Date(vehicleData.impound_date);
            const currentDate = new Date();
            const diffTime = Math.abs(currentDate.getTime() - impoundDate.getTime());
            const days = Math.max(Math.ceil(diffTime / (1000 * 60 * 60 * 24)), 1);
            const fees = calculateImpoundFees(vehicleData.type, days);
                        setSearchResult({
              ...vehicleData,
              storageFee: {
                days: days,
                daily_rate: fees.dailyFee,
                total_fee: fees.total,
                removal_fee: fees.removalFee
              }
            });
            
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
            window.history.replaceState({}, document.title, window.location.pathname);
    }
  }, [paymentCompleted]);

  
  useEffect(() => { 
    const cleanupResources = () => {
      const timeoutId = sessionStorage.getItem('paymentTimeoutId');
      if (timeoutId) {
        clearTimeout(parseInt(timeoutId));
        sessionStorage.removeItem('paymentTimeoutId');
      }
      setIsPaying(false);
    };
    
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

    const paymentAmount = searchResult.storageFee?.total_fee || 0;

    const paymentData = {
      vehicle_id: searchResult.id,
      amount: paymentAmount,
      method: PaymentMethod.MOBILE_MONEY,
      reference_number: response.transactionId,
      description: `Paiement en ligne via KKiaPay pour le véhicule ${searchResult.license_plate}`
    };

    console.log('Enregistrement du paiement:', paymentData);

    let publicPayment = null;
    try {
      publicPayment = await paymentService.createKkiapayPayment({
        vehicle_id: searchResult.id,
        amount: paymentAmount,
        payment_method: "kkiapay",
        id: response.transactionId,
        description: `Paiement KKiaPay pour le véhicule ${searchResult.license_plate}`
      });
      console.log('Réponse API KKiaPay:', publicPayment);
      if (!publicPayment || !publicPayment.id) {
        toast({
          title: 'Erreur KKiaPay',
          description: `La réponse de l'API ne contient pas d'identifiant de paiement. Détail: ${JSON.stringify(publicPayment)}`,
          variant: 'destructive',
        });
        throw new Error('Réponse API KKiaPay invalide');
      }
    } catch (err) {
      console.error('Erreur lors de l\'enregistrement public KKiaPay:', err);
      toast({
        title: 'Erreur KKiaPay',
        description: `Le paiement KKiaPay n'a pas pu être enregistré côté public. Détail: ${err?.message || err}`,
        variant: 'destructive',
      });
      return;
    }

    // Mettre à jour l'état local avec l'ID du paiement public
    setPaymentId(publicPayment.id);
    setPaymentCompleted(true);

    
    try {
      await vehicleService.publicUpdateVehicleByPlate(searchResult.license_plate, {
        status: VehicleStatus.CLAIMED,
        description: `${searchResult.description || ''} [FRAIS PAYÉS LE ${new Date().toLocaleDateString('fr-FR')}]`
      });
      console.log('Véhicule mis à jour avec succès');
    } catch (updateError) {
      console.error('Erreur lors de la mise à jour du véhicule:', updateError);
    }

    // Générer et télécharger le reçu directement
    try {
      const receiptData = await paymentService.generateReceipt(publicPayment.id);
      if (receiptData && receiptData.receipt_url) {
        const link = document.createElement('a');
        link.href = receiptData.receipt_url;
        link.download = `recu-paiement-fourriere-${searchResult.license_plate || 'inconnu'}.pdf`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        toast({
          title: 'Paiement réussi',
          description: 'Votre reçu a été téléchargé avec succès.',
          variant: 'success',
        });
      } else {
        toast({
          title: 'Paiement réussi',
          description: 'Impossible de générer le reçu. Veuillez contacter la fourrière.',
          variant: 'warning',
        });
      }
    } catch (receiptError) {
      toast({
        title: 'Paiement réussi',
        description: 'Erreur lors de la génération du reçu.',
        variant: 'warning',
      });
    }
  } catch (error) {
    console.error('Erreur lors de l\'enregistrement du paiement:', error);

    if (response && response.transactionId) {
      const transactionId = response.transactionId;
      // On considère le paiement comme validé même si l'ID n'est pas retourné
      setPaymentCompleted(true);
      setPaymentId(transactionId);
      toast({
        title: 'Paiement traité',
        description: `Votre paiement a été effectué (réf: ${transactionId}). Vous pouvez télécharger votre quittance ci-dessous.`,
        variant: 'success',
        duration: 10000,
      });
    } else {
      toast({
        title: 'Paiement traité',
        description: 'Le paiement a été effectué. Vous pouvez télécharger votre quittance ci-dessous.',
        variant: 'success',
        duration: 10000,
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
    
    const closeHandler = () => {
      console.log('Payment widget closed');

      cleanupResources();
      if (paymentCompleted) {
        console.log('Payment was completed, checking if we need to redirect');
  
      
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
          // Calcul du nombre de jours
          const impoundDate = new Date(vehicleData.impound_date);
          const currentDate = new Date();
          const diffTime = Math.abs(currentDate.getTime() - impoundDate.getTime());
          const days = Math.max(Math.ceil(diffTime / (1000 * 60 * 60 * 24)), 1); // Au moins 1 jour
          
          // Utiliser la grille tarifaire selon le type de véhicule
          const fees = calculateImpoundFees(vehicleData.type, days);
          
          console.log(`Jours en fourrière: ${days}, type: ${vehicleData.type}, frais d'enlèvement: ${fees.removalFee}, tarif journalier: ${fees.dailyFee}, total: ${fees.total}`);
          
          // Définir le résultat avec les frais calculés
          setSearchResult({
            ...vehicleData,
            storageFee: {
              days: days,
              daily_rate: fees.dailyFee,
              total_fee: fees.total,
              removal_fee: fees.removalFee
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
        theme: "blue",
        position: "center",
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
            Consultez votre redevance 
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
              placeholder="Ex: BN 4312 RB"
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
                        <div className="text-xs text-muted-foreground space-y-1">
                          {searchResult.storageFee?.removal_fee !== undefined && (
                            <p>
                              Frais d'enlèvement : {Number(searchResult.storageFee.removal_fee).toLocaleString()} FCFA
                            </p>
                          )}
                          <p>
                            Frais de garde : {Number(searchResult.storageFee?.days)} jours × {' '}
                            {Number(searchResult.storageFee?.daily_rate).toLocaleString()} FCFA/jour = {' '}
                            {Number((searchResult.storageFee?.days || 0) * (searchResult.storageFee?.daily_rate || 0)).toLocaleString()} FCFA
                          </p>
                        </div>
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
                          className="w-full bg-primary hover:opacity-90" 
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
                          <h4 className="font-semibold text-green-800 mb-2"> Paiement réussi</h4>
                          <p className="text-sm text-green-700 mb-3">
                            Votre paiement de <strong>{Number(searchResult.storageFee?.total_fee).toLocaleString()} FCFA</strong> a été traité avec succès. Cliquez sur le bouton ci-dessous pour télécharger votre quittance.
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
                              Télécharger la quittance
                            </>
                          )}
                        </Button>
                      </div>
                    )}

                    <div className="bg-green-50 p-4 rounded-lg">
                      <h4 className="font-semibold text-green-900 mb-2">Documents requis pour la récupération</h4>
                      <ul className="text-sm text-green-700 space-y-1 list-disc list-inside">
                        <li>Pièce d'identité du propriétaire</li>
                        <li><strong>Quittance de paiement des frais de fourrière</strong></li>
                        <li>Carte grise du véhicule</li>
                        <li>Procuration légalisée (si récupération par un tiers)</li>
                      </ul>
                    </div>

                    <div className="bg-orange-50 p-4 rounded-lg">
                      <h4 className="font-semibold text-orange-900 mb-2">Adresse de la fourrière</h4>
                      <div className="text-sm text-orange-700 space-y-1">
                        <p><strong>Fourrière Municipale de Cotonou</strong></p>
                        <p> Tél: +229 21 30 04 00</p>
                        <p> Email: fourriere@mairie-cotonou.bj</p>
                        <p> Ouvert: Lun-Ven 8h-17h, Sam 8h-12h</p>
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
                    <p className="text-sm text-muted-foreground">Tél: +229 21 30 04 00</p>
                    <p className="text-sm text-muted-foreground">Email: fourriere@mairie-cotonou.bj</p>
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