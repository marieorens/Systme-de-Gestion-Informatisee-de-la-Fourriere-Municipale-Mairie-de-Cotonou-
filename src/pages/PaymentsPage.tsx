import React, { useState, useEffect } from 'react';
import { CreditCard, Search, Filter, Download, Loader2, Eye, Calendar, AlertTriangle, Clock, ExternalLink } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious
} from "@/components/ui/pagination";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { toast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import paymentService from '@/services/paymentService';
import vehicleService, { VehicleStorageFeeResponse } from '@/services/vehicleService';
import { VehicleStatus, PaymentMethod, UserRole } from '@/types/enums';
import { Vehicle, Payment, PaginatedResponse } from '@/types';
import { Link } from 'react-router-dom';

interface VehicleWithFinancialData extends Vehicle {
  daysSinceImpound: number;
  storageFees: number;
  adminFees: number;
  penaltyFees: number;
  totalDue: number;
  isPaid: boolean;
  amountPaid: number;
  remainingAmount: number;
  urgency: 'normal' | 'warning' | 'critical';
}

export const PaymentsPage = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [vehicles, setVehicles] = useState<VehicleWithFinancialData[]>([]);
  const [filteredVehicles, setFilteredVehicles] = useState<VehicleWithFinancialData[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [urgencyFilter, setUrgencyFilter] = useState<string>('all');
  const [selectedVehicle, setSelectedVehicle] = useState<VehicleWithFinancialData | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalVehicles, setTotalVehicles] = useState(0);
  const perPage = 10;

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        
        // Fetch payments and vehicles in parallel
        const [paymentsResponse, vehiclesResponse] = await Promise.all([
          paymentService.getPayments({ perPage: 100 }),
          vehicleService.getVehicles({
            page: currentPage,
            perPage,
            search: searchTerm,
            // Add status filter if needed
            ...(statusFilter === 'paid' ? { status: VehicleStatus.CLAIMED } : {}),
            ...(statusFilter === 'unpaid' ? { status: VehicleStatus.IMPOUNDED } : {})
          })
        ]);
        
        setPayments(paymentsResponse.data);
        setTotalPages(vehiclesResponse.meta.last_page);
        setTotalVehicles(vehiclesResponse.meta.total);
        
        // Process each vehicle to add financial data
        const enhancedVehicles = await Promise.all(
          vehiclesResponse.data.map(async (vehicle) => {
            // Calculate days since impound
            let daysSinceImpound = 0;
            try {
              const impoundDate = new Date(vehicle.impound_date);
              if (!isNaN(impoundDate.getTime())) {
                daysSinceImpound = Math.floor(
                  (Date.now() - impoundDate.getTime()) / (1000 * 60 * 60 * 24)
                );
                // Ensure daysSinceImpound is never negative
                daysSinceImpound = Math.max(0, daysSinceImpound);
              }
            } catch (error) {
              console.error(`Invalid impound date for vehicle ${vehicle.id}:`, error);
              daysSinceImpound = 0;
            }
            
            let storageFees = 0;
            const adminFees = 15000;
            let penaltyFees = 0;
            
            // Get storage fee calculation from API
            try {
              const feeData: VehicleStorageFeeResponse = await vehicleService.calculateStorageFee(vehicle.id);
              storageFees = feeData.total_fee || 0;
              penaltyFees = daysSinceImpound > 30 ? 10000 : 0; // Add penalty after 30 days
            } catch (error) {
              console.error(`Failed to get storage fee for vehicle ${vehicle.id}:`, error);
              // Use fallback calculation if API fails
              storageFees = daysSinceImpound * 2000; // 2000 FCFA per day
              penaltyFees = daysSinceImpound > 30 ? 10000 : 0; // Add penalty after 30 days
            }
            
            // Ensure we never have NaN values
            storageFees = isNaN(storageFees) ? 0 : storageFees;
            penaltyFees = isNaN(penaltyFees) ? 0 : penaltyFees;
            
            const totalDue = (storageFees + adminFees + penaltyFees) || 0;
            
            // Check if there are payments for this vehicle
            const vehiclePayments = paymentsResponse.data.filter(p => p.vehicle_id === vehicle.id);
            let amountPaid = 0;
            try {
              amountPaid = vehiclePayments.reduce((sum, payment) => {
                const paymentAmount = payment.amount || 0;
                return isNaN(paymentAmount) ? sum : sum + paymentAmount;
              }, 0);
            } catch (error) {
              console.error(`Error calculating paid amount for vehicle ${vehicle.id}:`, error);
            }
            
            // Ensure values are numbers
            const normalizedTotalDue = isNaN(totalDue) ? 0 : totalDue;
            const normalizedAmountPaid = isNaN(amountPaid) ? 0 : amountPaid;
            
            const isPaid = normalizedAmountPaid >= normalizedTotalDue;
            const remainingAmount = Math.max(0, normalizedTotalDue - normalizedAmountPaid);
            
            // Set urgency level
            let urgency: 'normal' | 'warning' | 'critical' = 'normal';
            if (daysSinceImpound > 30) {
              urgency = 'critical';
            } else if (daysSinceImpound > 15) {
              urgency = 'warning';
            }
            
            return {
              ...vehicle,
              daysSinceImpound,
              storageFees,
              adminFees,
              penaltyFees,
              totalDue,
              isPaid,
              amountPaid,
              remainingAmount,
              urgency
            };
          })
        );
        
        setVehicles(enhancedVehicles);
        
        // Apply filters for urgency
        let filtered = enhancedVehicles;
        
        if (urgencyFilter !== 'all') {
          filtered = filtered.filter(v => v.urgency === urgencyFilter);
        }
        
        setFilteredVehicles(filtered);

      } catch (error) {
        console.error('Error fetching data:', error);
        toast({
          title: 'Erreur',
          description: 'Impossible de charger les données financières',
          variant: 'destructive',
        });
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [currentPage, searchTerm, statusFilter, urgencyFilter]);

  // Apply local filtering for urgency filter
  useEffect(() => {
    let filtered = vehicles;

    if (urgencyFilter !== 'all') {
      filtered = filtered.filter(v => v.urgency === urgencyFilter);
    }

    setFilteredVehicles(filtered);
  }, [vehicles, urgencyFilter]);

  // Handle search debounce
  useEffect(() => {
    const timer = setTimeout(() => {
      setCurrentPage(1); // Reset to first page on new search
    }, 500);
    
    return () => clearTimeout(timer);
  }, [searchTerm]);

  const formatCurrency = (amount: number | undefined | null) => {
    // Handle undefined, null, NaN or negative values
    if (amount === undefined || amount === null || isNaN(amount) || amount < 0) {
      return '0 FCFA';
    }
    return `${amount.toLocaleString()} FCFA`;
  };

  const getUrgencyBadge = (urgency: string) => {
    switch (urgency) {
      case 'critical':
        return <Badge variant="destructive" className="gap-1"><AlertTriangle className="w-3 h-3" />Critique</Badge>;
      case 'warning':
        return <Badge variant="secondary" className="gap-1 bg-orange-100 text-orange-800"><Clock className="w-3 h-3" />Attention</Badge>;
      default:
        return <Badge variant="outline">Normal</Badge>;
    }
  };

  const getStatusBadge = (isPaid: boolean) => {
    return isPaid 
      ? <Badge variant="secondary" className="bg-green-100 text-green-800">Payé</Badge>
      : <Badge variant="destructive">Non payé</Badge>;
  };

  
  const totalRevenue = payments.reduce((sum, p) => {
    const amount = p.amount || 0;
    return isNaN(amount) ? sum : sum + amount;
  }, 0);
  
  const totalDue = vehicles.reduce((sum, v) => {
    const amount = v.remainingAmount || 0;
    return isNaN(amount) ? sum : sum + amount;
  }, 0);
  
  const unpaidVehicles = vehicles.filter(v => !v.isPaid).length;
  const criticalVehicles = vehicles.filter(v => v.urgency === 'critical').length;

  if (loading && vehicles.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 space-y-6">
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold text-foreground">Suivi Financier</h1>
        <p className="text-muted-foreground">Surveillance des montants dus et délais de paiement</p>
        <div className="mt-2 p-3 bg-blue-50 border border-blue-200 rounded-lg">
          <p className="text-sm text-blue-800">
            <ExternalLink className="w-4 h-4 inline mr-1" />
            Les paiements se font exclusivement via le site du Trésor Public du Bénin
          </p>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Revenus perçus</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {formatCurrency(totalRevenue)}
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Montants dus</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">
              {formatCurrency(totalDue)}
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Véhicules non payés</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              {unpaidVehicles}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Situations critiques</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-800">
              {criticalVehicles}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters and Actions */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
          <Input
            placeholder="Rechercher par immatriculation, marque..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-9"
          />
        </div>
        
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-40">
            <SelectValue placeholder="Statut" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tous</SelectItem>
            <SelectItem value="paid">Payés</SelectItem>
            <SelectItem value="unpaid">Non payés</SelectItem>
          </SelectContent>
        </Select>

        <Select value={urgencyFilter} onValueChange={setUrgencyFilter}>
          <SelectTrigger className="w-40">
            <SelectValue placeholder="Urgence" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Toutes</SelectItem>
            <SelectItem value="normal">Normal</SelectItem>
            <SelectItem value="warning">Attention</SelectItem>
            <SelectItem value="critical">Critique</SelectItem>
          </SelectContent>
        </Select>
        
        {(user?.role === UserRole.ADMIN || user?.role === UserRole.FINANCE) && (
          <Button 
            variant="outline"
            onClick={() => {
              if (filteredVehicles.length === 0) {
                toast({
                  title: 'Aucune donnée',
                  description: 'Il n\'y a pas de données à exporter',
                  variant: 'destructive',
                });
                return;
              }
              
              const csvData = filteredVehicles.map(v => ({
                Immatriculation: v.license_plate || '',
                Vehicule: `${v.make || ''} ${v.model || ''}`,
                JoursEnFourriere: v.daysSinceImpound || 0,
                MontantDu: v.remainingAmount || 0,
                Statut: v.isPaid ? 'Payé' : 'Non payé',
                Urgence: v.urgency || 'normal',
                DateEntree: v.impound_date ? new Date(v.impound_date).toLocaleDateString('fr-FR') : ''
              }));
              
              const csv = [
                Object.keys(csvData[0]).join(','),
                ...csvData.map(row => Object.values(row).join(','))
              ].join('\n');
              
              const blob = new Blob([csv], { type: 'text/csv' });
              const url = window.URL.createObjectURL(blob);
              const a = document.createElement('a');
              a.href = url;
              a.download = `suivi_financier_${new Date().toLocaleDateString('fr-FR')}.csv`;
              a.click();
              window.URL.revokeObjectURL(url);
            }}
          >
            <Download className="w-4 h-4 mr-2" />
            Exporter rapport
          </Button>
        )}
      </div>

      {/* Financial Monitoring Table */}
      <Card>
        <CardHeader>
          <CardTitle>Suivi des créances par véhicule</CardTitle>
          <CardDescription>
            Montants dus, délais et statuts de paiement (paiements via Trésor Public)
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="min-w-[120px]">Immatriculation</TableHead>
                  <TableHead className="hidden sm:table-cell">Véhicule</TableHead>
                  <TableHead className="min-w-[100px]">Jours</TableHead>
                  <TableHead className="min-w-[120px]">Montant dû</TableHead>
                  <TableHead className="hidden md:table-cell">Frais stockage</TableHead>
                  <TableHead className="min-w-[100px]">Statut</TableHead>
                  <TableHead className="min-w-[100px]">Urgence</TableHead>
                  <TableHead className="min-w-[60px]">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-8">
                      <Loader2 className="h-6 w-6 animate-spin mx-auto" />
                    </TableCell>
                  </TableRow>
                ) : filteredVehicles.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-8">
                      Aucun véhicule trouvé
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredVehicles.map((vehicle) => (
                    <TableRow key={vehicle.id}>
                      <TableCell className="font-medium">
                        <Link to={`/app/vehicules/${vehicle.id}`} className="hover:underline">
                          {vehicle.license_plate}
                        </Link>
                      </TableCell>
                      <TableCell className="hidden sm:table-cell">{vehicle.make} {vehicle.model}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <Calendar className="w-3 h-3 text-muted-foreground" />
                          {vehicle.daysSinceImpound}
                        </div>
                      </TableCell>
                      <TableCell className="font-semibold">{formatCurrency(vehicle.remainingAmount)}</TableCell>
                      <TableCell className="hidden md:table-cell text-sm text-muted-foreground">
                        {formatCurrency(vehicle.storageFees)}
                      </TableCell>
                      <TableCell>
                        {getStatusBadge(vehicle.isPaid)}
                      </TableCell>
                      <TableCell>
                        {getUrgencyBadge(vehicle.urgency)}
                      </TableCell>
                      <TableCell>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setSelectedVehicle(vehicle)}
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
          
          {/* Pagination */}
          {totalPages > 1 && (
            <div className="mt-4 flex justify-center">
              <Pagination>
                <PaginationContent>
                  <PaginationItem>
                    <PaginationPrevious 
                      onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))} 
                      disabled={currentPage === 1 || loading}
                      className={currentPage === 1 || loading ? "pointer-events-none opacity-50" : "cursor-pointer"}
                    />
                  </PaginationItem>
                  
                  {Array.from({ length: Math.min(5, totalPages) }).map((_, i) => {
                    let pageNumber: number;
                    
                    // Logic to show the current page and surrounding pages
                    if (totalPages <= 5) {
                      // If we have 5 or fewer pages, show all
                      pageNumber = i + 1;
                    } else if (currentPage <= 3) {
                      // If current page is near the beginning
                      pageNumber = i + 1;
                    } else if (currentPage >= totalPages - 2) {
                      // If current page is near the end
                      pageNumber = totalPages - 4 + i;
                    } else {
                      // Current page is in the middle
                      pageNumber = currentPage - 2 + i;
                    }
                    
                    return (
                      <PaginationItem key={pageNumber}>
                        <PaginationLink
                          onClick={() => setCurrentPage(pageNumber)}
                          isActive={currentPage === pageNumber}
                          disabled={loading}
                          className={loading ? "pointer-events-none" : ""}
                        >
                          {pageNumber}
                        </PaginationLink>
                      </PaginationItem>
                    );
                  })}
                  
                  <PaginationItem>
                    <PaginationNext 
                      onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))} 
                      disabled={currentPage === totalPages || loading}
                      className={currentPage === totalPages || loading ? "pointer-events-none opacity-50" : "cursor-pointer"}
                    />
                  </PaginationItem>
                </PaginationContent>
              </Pagination>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Vehicle Financial Detail Dialog */}
      <Dialog open={!!selectedVehicle} onOpenChange={() => setSelectedVehicle(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Détails financiers - {selectedVehicle?.license_plate}</DialogTitle>
            <DialogDescription>
              Calcul détaillé des frais et information de paiement
            </DialogDescription>
          </DialogHeader>
          {selectedVehicle && (
            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <span className="text-sm text-muted-foreground">Véhicule:</span>
                  <p className="font-medium">{selectedVehicle.make || ''} {selectedVehicle.model || ''}</p>
                </div>
                <div>
                  <span className="text-sm text-muted-foreground">Date d'entrée:</span>
                  <p className="font-medium">
                    {selectedVehicle.impound_date 
                      ? (() => {
                          try {
                            const date = new Date(selectedVehicle.impound_date);
                            return isNaN(date.getTime()) 
                              ? 'Date invalide' 
                              : date.toLocaleDateString('fr-FR');
                          } catch (e) {
                            return 'Date invalide';
                          }
                        })()
                      : 'Non spécifiée'
                    }
                  </p>
                </div>
                <div>
                  <span className="text-sm text-muted-foreground">Jours en fourrière:</span>
                  <p className="font-medium">{selectedVehicle.daysSinceImpound || 0} jours</p>
                </div>
                <div>
                  <span className="text-sm text-muted-foreground">Statut:</span>
                  {getStatusBadge(selectedVehicle.isPaid)}
                </div>
              </div>
              
              <div className="border-t pt-4">
                <h4 className="font-semibold mb-3">Calcul des frais</h4>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span>Frais administratifs:</span>
                    <span className="font-medium">{formatCurrency(selectedVehicle.adminFees)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Frais de stockage ({selectedVehicle.daysSinceImpound} jours):</span>
                    <span className="font-medium">{formatCurrency(selectedVehicle.storageFees)}</span>
                  </div>
                  {selectedVehicle.penaltyFees > 0 && (
                    <div className="flex justify-between">
                      <span>Frais de pénalité:</span>
                      <span className="font-medium">{formatCurrency(selectedVehicle.penaltyFees)}</span>
                    </div>
                  )}
                  <div className="border-t pt-2 flex justify-between font-semibold">
                    <span>Total à payer:</span>
                    <span>{formatCurrency(selectedVehicle.totalDue)}</span>
                  </div>
                  {selectedVehicle.isPaid && (
                    <>
                      <div className="flex justify-between text-green-600">
                        <span>Montant payé:</span>
                        <span>-{formatCurrency(selectedVehicle.amountPaid)}</span>
                      </div>
                      <div className="border-t pt-2 flex justify-between font-semibold">
                        <span>Restant dû:</span>
                        <span>{formatCurrency(selectedVehicle.remainingAmount)}</span>
                      </div>
                    </>
                  )}
                </div>
              </div>

              <div className="border-t pt-4">
                <h4 className="font-semibold mb-3">Informations de paiement</h4>
                <div className="bg-blue-50 p-4 rounded-lg space-y-2">
                  <p className="text-sm text-blue-800">
                    <strong>Les paiements se font exclusivement via le Trésor Public du Bénin</strong>
                  </p>
                  <div className="space-y-1 text-sm">
                    <p><strong>Compte bancaire: BJ6600100100000010179081 </strong> </p>
                    <p><strong>Site web:</strong> <a href="https://tresorbenin.bj" className="text-blue-600 underline">tresorbenin.bj</a></p>
                    <p><strong>Le compte est intitulé:</strong>MISP/FRAIS FOURRIERE</p>
                  </div>
                </div>
                
                <div className="mt-4 flex justify-end">
    
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};
