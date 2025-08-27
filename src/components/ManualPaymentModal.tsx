import React, { useState } from 'react';
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Check, Receipt, AlertCircle, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { toast } from '@/hooks/use-toast';
import { PaymentMethod } from '@/types/enums';
import { paymentService } from '@/services';

const manualPaymentSchema = z.object({
  reference_number: z.string().min(1, "Le numéro de référence est requis"),
  amount: z.string().refine((val) => !isNaN(Number(val)), "Le montant doit être un nombre valide"),
  phone: z.string().min(1, "Le numéro de téléphone est requis"),
});

type ManualPaymentFormData = z.infer<typeof manualPaymentSchema>;

interface ManualPaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  vehicleId: string;
  licensePlate: string;
  expectedAmount: number;
  onPaymentSuccess: (paymentId: string) => void;
}

export const ManualPaymentModal: React.FC<ManualPaymentModalProps> = ({
  isOpen,
  onClose,
  vehicleId,
  licensePlate,
  expectedAmount,
  onPaymentSuccess,
}) => {
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<ManualPaymentFormData>({
    resolver: zodResolver(manualPaymentSchema),
    defaultValues: {
      reference_number: '',
      amount: expectedAmount.toString(),
      phone: '',
    },
  });

  const onSubmit = async (data: ManualPaymentFormData) => {
    setIsSubmitting(true);
    
    try {
      const amount = Number(data.amount);
      if (amount !== expectedAmount) {
        toast({
          title: "Montant incorrect",
          description: `Le montant saisi (${amount}) ne correspond pas au montant attendu (${expectedAmount}).`,
          variant: "destructive",
        });
        setIsSubmitting(false);
        return;
      }
      
      const paymentData = {
        vehicle_id: vehicleId,
        amount,
        method: PaymentMethod.MOBILE_MONEY,
        reference_number: data.reference_number,
        description: `Paiement manuel via téléphone ${data.phone} pour le véhicule ${licensePlate}`,
      };
      
      // Enregistrer le paiement
      const payment = await paymentService.createPayment(paymentData);
      
      // Stocker les informations du paiement
      sessionStorage.setItem('last_payment_id', payment.id);
      sessionStorage.setItem('last_payment_vehicle', licensePlate);
      
      toast({
        title: "Paiement enregistré",
        description: "Le paiement a été enregistré avec succès.",
        variant: "success",
      });
      
      // Fermer la modal et informer le parent du succès
      onClose();
      onPaymentSuccess(payment.id);
    } catch (error) {
      console.error('Erreur lors de l\'enregistrement du paiement manuel:', error);
      toast({
        title: "Erreur d'enregistrement",
        description: "Une erreur est survenue lors de l'enregistrement du paiement. Veuillez réessayer.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Receipt className="h-5 w-5 text-primary" />
            Validation d'un paiement existant
          </DialogTitle>
          <DialogDescription>
            Si vous avez déjà payé via un autre service, entrez les détails de votre transaction ici
          </DialogDescription>
        </DialogHeader>
        
        <Alert className="bg-amber-50 border-amber-200 my-2">
          <AlertCircle className="h-4 w-4 text-amber-600" />
          <AlertTitle className="text-amber-800">Important</AlertTitle>
          <AlertDescription className="text-amber-700 text-sm">
            Utilisez cette option uniquement si vous avez déjà effectué un paiement mobile 
            par un autre moyen. Le montant doit correspondre exactement à {expectedAmount.toLocaleString()} FCFA.
          </AlertDescription>
        </Alert>
        
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="reference_number"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Référence de transaction</FormLabel>
                  <FormControl>
                    <Input 
                      placeholder="Ex: TX123456789" 
                      {...field} 
                      autoComplete="off"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="amount"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Montant (FCFA)</FormLabel>
                  <FormControl>
                    <Input 
                      type="number" 
                      placeholder="Ex: 10000" 
                      {...field} 
                      className="font-medium"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="phone"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Numéro de téléphone utilisé</FormLabel>
                  <FormControl>
                    <Input 
                      type="tel" 
                      placeholder="Ex: +22900000000" 
                      {...field} 
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <DialogFooter className="pt-4">
              <Button type="button" variant="outline" onClick={onClose} disabled={isSubmitting}>
                Annuler
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Traitement...
                  </>
                ) : (
                  <>
                    <Check className="mr-2 h-4 w-4" />
                    Valider le paiement
                  </>
                )}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};

export default ManualPaymentModal;
