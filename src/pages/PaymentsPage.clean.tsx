// Fichier temporaire supprimé après migration du clean code dans PaymentsPage.tsx

// Note: This file has been removed as part of the cleanup process.
import React, { useState, useEffect } from 'react';
import { Loader2, Eye, Download } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import paymentService from '@/services/paymentService';
import { Payment } from '@/types';

const formatCurrency = (amount: number | undefined | null) => {
  if (amount === undefined || amount === null || isNaN(amount) || amount < 0) {
    return '0 FCFA';
  }
  const rounded = Math.round(amount);
  return `${rounded.toLocaleString()} FCFA`;
};

export const PaymentsPage = () => {
  const [loading, setLoading] = useState(true);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [selectedPayment, setSelectedPayment] = useState<Payment | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const paymentsResponse = await paymentService.getPayments({ perPage: 100, search: searchTerm });
        setPayments(paymentsResponse.data);
      } catch (error) {
        setPayments([]);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [searchTerm]);

  return (
    <div className="p-4 sm:p-6 space-y-6">
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold text-foreground">Liste des paiements</h1>
        <p className="text-muted-foreground">Affichage brut de la table payments</p>
      </div>
      <div className="flex flex-col sm:flex-row gap-4 mb-4">
        <Input
          placeholder="Rechercher par référence, méthode, etc."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="max-w-md"
        />
        <Button
          variant="outline"
          onClick={() => {
            if (payments.length === 0) return;
            const csvData = payments.map(p => ({
              Date: p.payment_date ? new Date(p.payment_date).toLocaleDateString('fr-FR') : '-',
              Montant: p.amount,
              Méthode: p.payment_method,
              Référence: p.reference,
              Reçu: p.receipt_url || '-'
            }));
            const csv = [
              Object.keys(csvData[0]).join(','),
              ...csvData.map(row => Object.values(row).join(','))
            ].join('\n');
            const blob = new Blob([csv], { type: 'text/csv' });
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `paiements_${new Date().toLocaleDateString('fr-FR')}.csv`;
            a.click();
            window.URL.revokeObjectURL(url);
          }}
        >
          <Download className="w-4 h-4 mr-2" />
          Exporter Excel
        </Button>
      </div>
      <Card>
        <CardContent>
          <div className="overflow-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Montant</TableHead>
                  <TableHead>Méthode</TableHead>
                  <TableHead>Référence</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8">
                      <Loader2 className="h-6 w-6 animate-spin mx-auto" />
                    </TableCell>
                  </TableRow>
                ) : payments.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8">Aucun paiement trouvé</TableCell>
                  </TableRow>
                ) : (
                  payments.map((p) => (
                    <TableRow key={p.id}>
                      <TableCell>{p.payment_date ? new Date(p.payment_date).toLocaleDateString('fr-FR') : '-'}</TableCell>
                      <TableCell>{formatCurrency(p.amount)}</TableCell>
                      <TableCell>{p.payment_method}</TableCell>
                      <TableCell>{p.reference}</TableCell>
                      <TableCell>
                        {p.receipt_url ? (
                          <a href={p.receipt_url} target="_blank" rel="noopener noreferrer" className="text-blue-600 underline">Télécharger</a>
                        ) : '-'}
                      </TableCell>
                      <TableCell>
                        <Button variant="ghost" size="sm" onClick={() => setSelectedPayment(p)}>
                          <Eye className="w-4 h-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
      <Dialog open={!!selectedPayment} onOpenChange={() => setSelectedPayment(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Détail du paiement</DialogTitle>
          </DialogHeader>
          {selectedPayment && (
            <div className="space-y-4">
              <div>
                <span className="text-sm text-muted-foreground">Date:</span>
                <p className="font-medium">{selectedPayment.payment_date ? new Date(selectedPayment.payment_date).toLocaleDateString('fr-FR') : '-'}</p>
              </div>
              <div>
                <span className="text-sm text-muted-foreground">Montant:</span>
                <p className="font-medium">{formatCurrency(selectedPayment.amount)}</p>
              </div>
              <div>
                <span className="text-sm text-muted-foreground">Méthode:</span>
                <p className="font-medium">{selectedPayment.payment_method}</p>
              </div>
              <div>
                <span className="text-sm text-muted-foreground">Référence:</span>
                <p className="font-medium">{selectedPayment.reference}</p>
              </div>
              <div>
                <span className="text-sm text-muted-foreground">Reçu:</span>
                {selectedPayment.receipt_url ? (
                  <a href={selectedPayment.receipt_url} target="_blank" rel="noopener noreferrer" className="text-blue-600 underline">Télécharger</a>
                ) : <span>-</span>}
              </div>
              {selectedPayment.description && (
                <div>
                  <span className="text-sm text-muted-foreground">Description:</span>
                  <p className="font-medium">{selectedPayment.description}</p>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};
