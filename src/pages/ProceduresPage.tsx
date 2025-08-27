import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, FileText, Upload, CheckCircle, Clock, AlertCircle, Plus, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious
} from "@/components/ui/pagination";
import { Procedure } from '@/types';
import { ProcedureStatus, ProcedureType, UserRole } from '@/types/enums';
import { useAuth } from '@/contexts/AuthContext';
import procedureService, { ProcedurePaginatedResponse } from '@/services/procedureService';
import { toast } from '@/hooks/use-toast';

export const ProceduresPage = () => {
  const { user, hasAnyRole } = useAuth();
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [paginatedProcedures, setPaginatedProcedures] = useState<ProcedurePaginatedResponse | null>(null);
  const [procedures, setProcedures] = useState<Procedure[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [activeTab, setActiveTab] = useState('all');
  const perPage = 10;

  useEffect(() => {
    const fetchProcedures = async () => {
      try {
        setLoading(true);
        
        const filters: {
          page: number;
          perPage: number;
          search: string;
          status?: ProcedureStatus;
        } = {
          page: currentPage,
          perPage,
          search: searchTerm,
        };
        
        
        if (activeTab === 'in-progress') {
          filters.status = ProcedureStatus.APPROVED;
        } else if (activeTab === 'completed') {
          filters.status = ProcedureStatus.COMPLETED;
        }
        
        const response = await procedureService.getProcedures(filters);
        setPaginatedProcedures(response);
        setProcedures(response.data);
        setTotalPages(response.meta.last_page);
        
      } catch (error) {
        console.error('Erreur lors du chargement des procédures:', error);
        toast({
          title: 'Erreur',
          description: 'Impossible de charger les procédures',
          variant: 'destructive',
        });
      } finally {
        setLoading(false);
      }
    };

    fetchProcedures();
  }, [currentPage, searchTerm, activeTab]);

  
  useEffect(() => {
    const timer = setTimeout(() => {
      setCurrentPage(1); 
    }, 500);
    
    return () => clearTimeout(timer);
  }, [searchTerm]);

  const getStatusBadge = (status: ProcedureStatus) => {
    switch (status) {
      case ProcedureStatus.PENDING:
        return <Badge variant="secondary"><Clock className="w-3 h-3 mr-1" />En attente</Badge>;
      case ProcedureStatus.APPROVED:
        return <Badge variant="default"><FileText className="w-3 h-3 mr-1" />En cours</Badge>;
      case ProcedureStatus.COMPLETED:
        return <Badge variant="secondary" className="bg-green-100 text-green-800"><CheckCircle className="w-3 h-3 mr-1" />Terminé</Badge>;
      case ProcedureStatus.CANCELLED:
        return <Badge variant="destructive"><AlertCircle className="w-3 h-3 mr-1" />Annulée</Badge>;
      case ProcedureStatus.REJECTED:
        return <Badge variant="destructive"><AlertCircle className="w-3 h-3 mr-1" />Rejetée</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  const getTypeLabel = (type: ProcedureType) => {
    switch (type) {
      case ProcedureType.RELEASE:
        return 'Libération';
      case ProcedureType.AUCTION:
        return 'Vente aux enchères';
      case ProcedureType.DESTRUCTION:
        return 'Destruction';
      case ProcedureType.TRANSFER:
        return 'Transfert';
      default:
        return type;
    }
  };

  const getProgressValue = (status: ProcedureStatus) => {
    switch (status) {
      case ProcedureStatus.PENDING:
        return 20;
      case ProcedureStatus.APPROVED:
        return 60;
      case ProcedureStatus.COMPLETED:
        return 100;
      case ProcedureStatus.CANCELLED:
      case ProcedureStatus.REJECTED:
        return 0;
      default:
        return 0;
    }
  };

  const formatCurrency = (amount: number | undefined | null) => {
    // Handle undefined, null, NaN or negative values
    if (amount === undefined || amount === null || isNaN(amount) || amount < 0) {
      return '0 FCFA';
    }
    return `${amount.toLocaleString()} FCFA`;
  };

  
  const inProgressCount = paginatedProcedures?.meta.total 
    ? procedures.filter(p => p.status === ProcedureStatus.APPROVED).length
    : 0;
    
  const completedCount = paginatedProcedures?.meta.total 
    ? procedures.filter(p => p.status === ProcedureStatus.COMPLETED).length
    : 0;
    
  const pendingCount = paginatedProcedures?.meta.total 
    ? procedures.filter(p => p.status === ProcedureStatus.PENDING).length
    : 0;

  return (
    <div className="p-4 sm:p-6 space-y-6">
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold text-foreground">Procédures</h1>
        <p className="text-muted-foreground">Gestion des procédures administratives</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Total procédures</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{paginatedProcedures?.meta.total || 0}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>En attente</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">{pendingCount}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>En cours</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-primary">{inProgressCount}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Terminées</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{completedCount}</div>
          </CardContent>
        </Card>
      </div>

      <Tabs 
        defaultValue="all" 
        className="space-y-6"
        value={activeTab}
        onValueChange={(value) => {
          setActiveTab(value);
          setCurrentPage(1); 
        }}
      >
        <TabsList>
          <TabsTrigger value="all">Toutes les procédures</TabsTrigger>
          <TabsTrigger value="in-progress">En cours</TabsTrigger>
          <TabsTrigger value="completed">Terminées</TabsTrigger>
        </TabsList>

        <div className="flex items-center gap-4">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
            <Input
              placeholder="Rechercher par ID procédure ou véhicule..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9"
            />
          </div>
          {hasAnyRole([UserRole.ADMIN, UserRole.AGENT]) && (
            <Button
              onClick={() => navigate('/app/procedures/new')}
            >
              <Plus className="w-4 h-4 mr-2" />
              Nouvelle procédure
            </Button>
          )}
        </div>

        <TabsContent value="all" className="space-y-4">
          <div className="grid gap-4">
            {loading ? (
              <Card>
                <CardContent className="py-8 flex justify-center">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </CardContent>
              </Card>
            ) : procedures.length === 0 ? (
              <Card>
                <CardContent className="py-8">
                  <p className="text-center text-muted-foreground">Aucune procédure trouvée</p>
                </CardContent>
              </Card>
            ) : (
              procedures.map((procedure) => (
                <Card key={procedure.id} className="cursor-pointer hover:shadow-md transition-shadow"
                      onClick={() => navigate(`/app/procedures/${procedure.id}`)}>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div>
                        <CardTitle className="text-lg">Procédure {String(procedure.id).substring(0, 8)}</CardTitle>
                        <CardDescription>
                          {procedure.vehicle?.license_plate 
                            ? `Véhicule: ${procedure.vehicle.license_plate} • ` 
                            : ''}
                          Type: {getTypeLabel(procedure.type)} • 
                          Créé le {new Date(procedure.created_at).toLocaleDateString('fr-FR')}
                        </CardDescription>
                      </div>
                      {getStatusBadge(procedure.status)}
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <Progress value={getProgressValue(procedure.status)} className="h-2" />
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4">
                        <div>
                          <span className="text-sm text-muted-foreground">Notes:</span>
                          <p className="font-medium line-clamp-2">{procedure.notes || "Pas de notes"}</p>
                        </div>
                        <div>
                          <span className="text-sm text-muted-foreground">Documents:</span>
                          <p className="font-medium flex items-center">
                            <Upload className="h-4 w-4 mr-1 text-muted-foreground" />
                            {procedure.documents?.length || 0} document(s)
                          </p>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
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
        </TabsContent>

        <TabsContent value="in-progress" className="space-y-4">
          <div className="grid gap-4">
            {loading ? (
              <Card>
                <CardContent className="py-8 flex justify-center">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </CardContent>
              </Card>
            ) : procedures.length === 0 ? (
              <Card>
                <CardContent className="py-8">
                  <p className="text-center text-muted-foreground">Aucune procédure en cours trouvée</p>
                </CardContent>
              </Card>
            ) : (
              procedures.map((procedure) => (
                <Card key={procedure.id} className="cursor-pointer hover:shadow-md transition-shadow"
                      onClick={() => navigate(`/app/procedures/${procedure.id}`)}>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div>
                        <CardTitle className="text-lg">Procédure {String(procedure.id).substring(0, 8)}</CardTitle>
                        <CardDescription>
                          {procedure.vehicle?.license_plate 
                            ? `Véhicule: ${procedure.vehicle.license_plate} • ` 
                            : ''}
                          Type: {getTypeLabel(procedure.type)} • 
                          Mis à jour le {new Date(procedure.updated_at).toLocaleDateString('fr-FR')}
                        </CardDescription>
                      </div>
                      {getStatusBadge(procedure.status)}
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <Progress value={getProgressValue(procedure.status)} className="h-2" />
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4">
                        <div>
                          <span className="text-sm text-muted-foreground">Notes:</span>
                          <p className="font-medium line-clamp-2">{procedure.notes || "Pas de notes"}</p>
                        </div>
                        <div>
                          <span className="text-sm text-muted-foreground">Documents:</span>
                          <p className="font-medium flex items-center">
                            <Upload className="h-4 w-4 mr-1 text-muted-foreground" />
                            {procedure.documents?.length || 0} document(s)
                          </p>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
          
          {/* Pagination for in-progress */}
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
                    
                    if (totalPages <= 5) {
                      pageNumber = i + 1;
                    } else if (currentPage <= 3) {
                      pageNumber = i + 1;
                    } else if (currentPage >= totalPages - 2) {
                      pageNumber = totalPages - 4 + i;
                    } else {
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
        </TabsContent>

        <TabsContent value="completed" className="space-y-4">
          <div className="grid gap-4">
            {loading ? (
              <Card>
                <CardContent className="py-8 flex justify-center">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </CardContent>
              </Card>
            ) : procedures.length === 0 ? (
              <Card>
                <CardContent className="py-8">
                  <p className="text-center text-muted-foreground">Aucune procédure terminée trouvée</p>
                </CardContent>
              </Card>
            ) : (
              procedures.map((procedure) => (
                <Card key={procedure.id} className="cursor-pointer hover:shadow-md transition-shadow"
                      onClick={() => navigate(`/app/procedures/${procedure.id}`)}>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div>
                        <CardTitle className="text-lg">Procédure {String(procedure.id).substring(0, 8)}</CardTitle>
                        <CardDescription>
                          {procedure.vehicle?.license_plate 
                            ? `Véhicule: ${procedure.vehicle.license_plate} • ` 
                            : ''}
                          Type: {getTypeLabel(procedure.type)} • 
                          Terminée le {new Date(procedure.updated_at).toLocaleDateString('fr-FR')}
                        </CardDescription>
                      </div>
                      {getStatusBadge(procedure.status)}
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <Progress value={getProgressValue(procedure.status)} className="h-2" />
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4">
                        <div>
                          <span className="text-sm text-muted-foreground">Notes:</span>
                          <p className="font-medium line-clamp-2">{procedure.notes || "Pas de notes"}</p>
                        </div>
                        <div>
                          <span className="text-sm text-muted-foreground">Documents:</span>
                          <p className="font-medium flex items-center">
                            <Upload className="h-4 w-4 mr-1 text-muted-foreground" />
                            {procedure.documents?.length || 0} document(s)
                          </p>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
          
          {/* Pagination for completed */}
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
                    
                    if (totalPages <= 5) {
                      pageNumber = i + 1;
                    } else if (currentPage <= 3) {
                      pageNumber = i + 1;
                    } else if (currentPage >= totalPages - 2) {
                      pageNumber = totalPages - 4 + i;
                    } else {
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
        </TabsContent>
      </Tabs>
    </div>
  );
};
