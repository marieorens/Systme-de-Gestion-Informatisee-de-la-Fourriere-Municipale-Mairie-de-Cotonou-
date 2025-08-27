import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, CreditCard, Smartphone, AlertCircle, CheckCircle } from 'lucide-react';
import { Vehicle, Owner } from '@/types';
import { PaymentMethod } from '@/types/enums';
import { paymentService } from '@/services';
import { toast } from '@/hooks/use-toast';

declare global {
  interface Window {
    kkiapay: {
      initialize: (config: any) => void;
      openKkiapayWidget: (options: any) => void;
      addSuccessListener: (callback: (data: any) => void) => void;
      addFailureListener: (callback: (error: any) => void) => void;
    };
  }
}

// You need to add your KKIAPAY API key here
const KKIAPAY_API_KEY = "your-kkiapay-api-key-here";

interface PaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  vehicle: Vehicle | null;
  owner: Owner | null;
  amount: number;
  breakdown: {
    storageFees: number;
    adminFees: number;
    penaltyFees: number;
    daysImpounded: number;
  };
  onPaymentComplete?: () => void;
}

export const PaymentModal: React.FC<PaymentModalProps> = ({
  isOpen,
  onClose,
  vehicle,
  owner,
  amount,
  breakdown,
  onPaymentComplete
}) => {
  const [isKkiapayLoaded, setIsKkiapayLoaded] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [paymentStatus, setPaymentStatus] = useState<'idle' | 'processing' | 'success' | 'failed'>('idle');
  const [paymentId, setPaymentId] = useState<string | null>(null);

  useEffect(() => {
    // Load KKiAPay script
    if (!window.kkiapay) {
      const script = document.createElement('script');
      script.src = 'https://cdn.kkiapay.me/k.js';
      script.async = true;
      script.onload = () => {
        setIsKkiapayLoaded(true);
      };
      document.head.appendChild(script);
    } else {
      setIsKkiapayLoaded(true);
    }
  }, []);

  const handlePayment = async (method: PaymentMethod) => {
    if (!vehicle || !owner || !isKkiapayLoaded) return;

    setIsProcessing(true);
    setPaymentStatus('processing');

    try {
      // Create payment record with API
      const paymentData = await paymentService.createVehiclePayment(vehicle.id, {
        amount,
        method,
        description: `Paiement pour véhicule ${vehicle.license_plate}`
      });
      
      setPaymentId(paymentData.id);

      // Create KKIAPAY widget element
      const widgetContainer = document.createElement('div');
      widgetContainer.innerHTML = `
        <kkiapay-widget 
          amount="${amount}"
          key="${KKIAPAY_API_KEY}"
          position="center"
          sandbox="true"
          data='{"email":"${owner.email || 'noreply@cotonou.bj'}","name":"${owner.first_name} ${owner.last_name}","phone":"${owner.phone}"}'
          callback="">
        </kkiapay-widget>
      `;
      
      document.body.appendChild(widgetContainer);
      
      // Add success callback
      window.addEventListener('kkiapay.success', async (event: Event) => {
        try {
          // Update payment status to completed
          setPaymentStatus('success');
          
          toast({
            title: 'Paiement réussi',
            description: 'Le paiement a été traité avec succès. Votre reçu sera généré automatiquement.'
          });

          // Generate receipt automatically
          if (paymentId) {
            try {
              await paymentService.generateReceipt(paymentId);
            } catch (error) {
              console.error('Error generating receipt:', error);
            }
          }

          // Notify parent component
          if (onPaymentComplete) {
            onPaymentComplete();
          }

          // Clean up widget
          document.body.removeChild(widgetContainer);

        } catch (error) {
          console.error('Error updating payment:', error);
          setPaymentStatus('failed');
        }
      });

      // Add failure callback
      window.addEventListener('kkiapay.failed', () => {
        setPaymentStatus('failed');
        document.body.removeChild(widgetContainer);
      });

    } catch (error) {
      console.error('Payment error:', error);
      setPaymentStatus('failed');
      toast({
        title: 'Erreur de paiement',
        description: error instanceof Error ? error.message : 'Une erreur est survenue lors du paiement',
        variant: 'destructive'
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const formatCurrency = (amount: number | undefined | null) => {
    // Handle undefined, null, NaN or negative values
    if (amount === undefined || amount === null || isNaN(amount) || amount < 0) {
      return '0 FCFA';
    }
    return `${amount.toLocaleString()} FCFA`;
  };

  if (!vehicle || !owner) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Paiement des frais de fourrière</DialogTitle>
          <DialogDescription>
            Véhicule: {vehicle.license_plate} - {vehicle.make} {vehicle.model}
          </DialogDescription>
        </DialogHeader>

        {paymentStatus === 'success' ? (
          <div className="space-y-4">
            <Alert>
              <CheckCircle className="h-4 w-4" />
              <AlertDescription>
                Paiement effectué avec succès ! Votre reçu a été généré.
              </AlertDescription>
            </Alert>
            <Button onClick={onClose} className="w-full">
              Fermer
            </Button>
          </div>
        ) : paymentStatus === 'failed' ? (
          <div className="space-y-4">
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                Le paiement a échoué. Veuillez réessayer.
              </AlertDescription>
            </Alert>
            <Button onClick={() => setPaymentStatus('idle')} variant="outline" className="w-full">
              Réessayer
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Payment summary */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Récapitulatif des frais</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="flex justify-between">
                  <span>Frais de garde ({breakdown.daysImpounded} jours)</span>
                  <span>{formatCurrency(breakdown.storageFees)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Frais administratifs</span>
                  <span>{formatCurrency(breakdown.adminFees)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Frais de pénalité</span>
                  <span>{formatCurrency(breakdown.penaltyFees)}</span>
                </div>
                <Separator />
                <div className="flex justify-between font-bold text-lg">
                  <span>Total à payer</span>
                  <span>{formatCurrency(amount)}</span>
                </div>
              </CardContent>
            </Card>

            {/* Payment methods */}
            <div className="space-y-3">
              <h3 className="font-medium">Choisissez votre méthode de paiement:</h3>
              
              <Button
                onClick={() => handlePayment(PaymentMethod.MOBILE_MONEY)}
                disabled={!isKkiapayLoaded || isProcessing}
                className="w-full h-12 text-left justify-start"
                variant="outline"
              >
                <Smartphone className="mr-3 h-5 w-5" />
                <div>
                  <div className="font-medium">Mobile Money</div>
                  <div className="text-sm text-muted-foreground">
                    MTN Mobile Money, Moov Money, Celtiis Cash
                  </div>
                </div>
              </Button>
              
              <Button
                onClick={() => handlePayment(PaymentMethod.CREDIT_CARD)}
                disabled={!isKkiapayLoaded || isProcessing}
                className="w-full h-12 text-left justify-start"
                variant="outline"
              >
                <CreditCard className="mr-3 h-5 w-5" />
                <div>
                  <div className="font-medium">Carte bancaire</div>
                  <div className="text-sm text-muted-foreground">
                    Visa, Mastercard
                  </div>
                </div>
              </Button>
            </div>

            {!isKkiapayLoaded && (
              <Alert>
                <Loader2 className="h-4 w-4 animate-spin" />
                <AlertDescription>
                  Chargement du système de paiement...
                </AlertDescription>
              </Alert>
            )}

            {paymentStatus === 'processing' && (
              <Alert>
                <Loader2 className="h-4 w-4 animate-spin" />
                <AlertDescription>
                  Traitement du paiement en cours...
                </AlertDescription>
              </Alert>
            )}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};