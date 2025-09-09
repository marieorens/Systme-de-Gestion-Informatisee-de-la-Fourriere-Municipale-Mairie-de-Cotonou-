import React, { useState, useEffect } from 'react';
import { Vehicle, Payment } from '@/types';
import { Loader2, Eye, Download } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import paymentService from '@/services/paymentService';

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
  const [selectedVehicle, setSelectedVehicle] = useState<Vehicle | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  // Récupération des paiements
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const paymentsResponse = await paymentService.getPayments({
          perPage: 10000,
          search: searchTerm,
        });
        setPayments(paymentsResponse.data.map((p: Payment) => ({
          ...p,
          amount: Number(p.amount || 0),
        })));
      } catch {
        setPayments([]);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [searchTerm]);

  useEffect(() => {
    const fetchVehicle = async () => {
      if (selectedPayment && selectedPayment.vehicle_id) {
        try {
          const vehicle = await (
            await import('@/services/vehicleService')
          ).default.getVehicle(selectedPayment.vehicle_id);
          setSelectedVehicle(vehicle);
        } catch {
          setSelectedVehicle(null);
        }
      } else {
        setSelectedVehicle(null);
      }
    };
    fetchVehicle();
  }, [selectedPayment]);

  // Export CSV
  const handleExportCSV = () => {
    if (payments.length === 0) return;

    const csvData = payments.map((p) => ({
      Date: p.payment_date
        ? new Date(p.payment_date).toLocaleDateString('fr-FR')
        : '-',
      Montant: p.amount,
      Méthode: p.payment_method,
      Référence: p.reference,
      Reçu: p.receipt_url ? p.receipt_url : 'Aucun',
    }));

    const csv = [
      Object.keys(csvData[0]).join(','),
      ...csvData.map((row) => Object.values(row).join(',')),
    ].join('\n');

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `paiements_${new Date().toLocaleDateString('fr-FR')}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  return (
    <div className="p-4 sm:p-6 space-y-6">
      {/* Barre de recherche + export */}
      <div className="flex flex-col sm:flex-row gap-4 mb-4">
        <Input
          placeholder="Rechercher par référence, méthode, etc."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="max-w-md"
        />
        <Button variant="outline" onClick={handleExportCSV}>
          <Download className="w-4 h-4 mr-2" />
          Exporter Excel
        </Button>
      </div>

      {/* Statistiques */}
      {(() => {
        const totalPayments = payments.length;
        const totalAmount = payments.reduce(
          (sum, p) => sum + (p.amount),
          0
        );
        const averageAmount =
          totalPayments > 0 ? Math.round(totalAmount / totalPayments) : 0;

        return (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-4">
            <Card>
              <CardContent>
                 <div className="text-sm text-muted-foreground mt-4">
                  Total encaissé
                </div><br/>
                <div className="text-lg font-bold text-green-700">
                  {formatCurrency(totalAmount)}
                </div>
               
              </CardContent>
            </Card>
            <Card>
              <CardContent>
                 <div className="text-sm text-muted-foreground mt-4">
                  Nombre de paiements
                </div><br/>
                <div className="text-lg font-bold">{totalPayments}</div>

              </CardContent>
            </Card>
          </div>
        );
      })()}

      {/* Tableau des paiements */}
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
                  <TableHead>Quittance</TableHead>
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
                    <TableCell colSpan={6} className="text-center py-8">
                      Aucun paiement trouvé
                    </TableCell>
                  </TableRow>
                ) : (
                  payments.map((p) => (
                    <TableRow key={p.id}>
                      <TableCell>
                        {p.payment_date
                          ? new Date(p.payment_date).toLocaleDateString('fr-FR')
                          : '-'}
                      </TableCell>
                      <TableCell>{formatCurrency(p.amount)}</TableCell>
                      <TableCell>{p.payment_method}</TableCell>
                      <TableCell>{p.reference}</TableCell>
                      <TableCell>
                        {p.receipt_url ? (
                          <Button
                            asChild
                            variant="secondary"
                            size="sm"
                            className="px-3 py-1 text-xs font-semibold"
                          >
                            <a
                              href={p.receipt_url}
                              target="_blank"
                              rel="noopener noreferrer"
                            >
                              <span className="flex items-center gap-1">
                                <Download className="w-4 h-4" />
                                Télécharger
                              </span>
                            </a>
                          </Button>
                        ) : (
                          <span>Aucun</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setSelectedPayment(p)}
                        >
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

      {/* Dialog détails du paiement */}
      <Dialog
        open={!!selectedPayment}
        onOpenChange={() => setSelectedPayment(null)}
      >
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Détails du paiement</DialogTitle>
          </DialogHeader>
          {selectedPayment && (
            <div className="space-y-4">
              <div>
                <div className="font-semibold">Référence :</div>
                <div>{selectedPayment.reference}</div>
              </div>
              <div>
                <div className="font-semibold">Montant :</div>
                <div>{formatCurrency(selectedPayment.amount)}</div>
              </div>
              <div>
                <div className="font-semibold">Méthode :</div>
                <div>{selectedPayment.payment_method}</div>
              </div>
              <div>
                <div className="font-semibold">Date :</div>
                <div>
                  {selectedPayment.payment_date
                    ? new Date(
                        selectedPayment.payment_date
                      ).toLocaleString('fr-FR')
                    : '-'}
                </div>
              </div>
              <div>
                <div className="font-semibold">Reçu :</div>
                <div>
                  {selectedPayment.receipt_url ? (
                    <a
                      href={selectedPayment.receipt_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 underline"
                    >
                      Télécharger
                    </a>
                  ) : (
                    'Aucun'
                  )}
                </div>
              </div>

              {selectedVehicle && (
                <div className="pt-4 border-t">
                  <div className="font-semibold mb-2">Véhicule associé</div>
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div><span className="font-medium">Immatriculation :</span> {selectedVehicle.license_plate}</div>
                    <div><span className="font-medium">Marque :</span> {selectedVehicle.make}</div>
                    <div><span className="font-medium">Modèle :</span> {selectedVehicle.model}</div>
                    <div><span className="font-medium">Couleur :</span> {selectedVehicle.color}</div>
                    <div><span className="font-medium">Année :</span> {selectedVehicle.year}</div>
                    <div><span className="font-medium">Type :</span> {selectedVehicle.type}</div>
                    <div><span className="font-medium">Statut :</span> {selectedVehicle.status}</div>
                    <div><span className="font-medium">Lieu :</span> {selectedVehicle.location}</div>
                  </div>
                  {/* Affiche le propriétaire si présent */}
                  {selectedVehicle.owner && (
                    <div className="mt-2">
                      <span className="font-medium">Propriétaire :</span> {selectedVehicle.owner.first_name} {selectedVehicle.owner.last_name}
                      {selectedVehicle.owner.phone && (
                        <span className="ml-2 text-muted-foreground">({selectedVehicle.owner.phone})</span>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};
