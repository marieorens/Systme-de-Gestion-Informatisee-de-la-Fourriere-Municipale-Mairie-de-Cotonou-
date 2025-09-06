import React, { useEffect, useState } from 'react';
import { useLocation, Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Loader2, Download } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { paymentService } from '@/services';

const PaymentConfirmationPage: React.FC = () => {
  const location = useLocation();
  const [isLoading, setIsLoading] = useState(false);
  const [receiptUrl, setReceiptUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const searchParams = new URLSearchParams(location.search);
  const paymentId = searchParams.get('payment_id');

  useEffect(() => {
    if (!paymentId) {
      setError("Aucun ID de paiement trouvé dans l'URL.");
      return;
    }
    setIsLoading(true);
    // Appel de la route publique pour récupérer le reçu
    paymentService.generateReceipt(paymentId)
      .then((data) => {
        if (data && data.receipt_url) {
          setReceiptUrl(data.receipt_url);
        } else {
          setError('Impossible de générer le reçu.');
        }
      })
      .catch(() => setError('Erreur lors de la récupération du reçu.'))
      .finally(() => setIsLoading(false));
  }, [paymentId]);

  const handleDownload = () => {
    if (!receiptUrl) return;
    const link = document.createElement('a');
    link.href = receiptUrl;
    link.download = `recu-paiement-fourriere.pdf`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast({
      title: 'Reçu téléchargé',
      description: 'Votre reçu a été téléchargé avec succès.',
      variant: 'success',
    });
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-background">
      <div className="max-w-md w-full bg-card p-8 rounded shadow">
        <h1 className="text-2xl font-bold mb-4 text-center text-green-700">Paiement confirmé</h1>
        <p className="mb-6 text-center text-muted-foreground">
          Merci pour votre paiement. Vous pouvez télécharger votre reçu ci-dessous.
        </p>
        {isLoading ? (
          <Button disabled className="w-full mb-4">
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            Chargement du reçu...
          </Button>
        ) : error ? (
          <div className="text-red-600 text-center mb-4">{error}</div>
        ) : (
          <Button className="w-full mb-4 bg-green-600 hover:bg-green-700 text-white" onClick={handleDownload}>
            <Download className="h-4 w-4 mr-2" />
            Télécharger le reçu
          </Button>
        )}
        <Link to="/" className="block text-center text-primary underline">Retour à l'accueil</Link>
      </div>
    </div>
  );
};

export default PaymentConfirmationPage;