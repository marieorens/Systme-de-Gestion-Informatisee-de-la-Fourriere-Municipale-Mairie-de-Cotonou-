import { useState, useEffect } from 'react';
import { Search, Filter, Phone, Mail, User, Loader2 } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { 
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious
} from "@/components/ui/pagination";
import { Owner } from '@/types';
import { IdType } from '@/types/enums';
import { toast } from '@/hooks/use-toast';
import ownerService, { OwnerPaginatedResponse } from '@/services/ownerService';
import { Link } from 'react-router-dom';

export const OwnersPage = () => {
  const [loading, setLoading] = useState(true);
  const [paginatedOwners, setPaginatedOwners] = useState<OwnerPaginatedResponse | null>(null);
  const [owners, setOwners] = useState<Owner[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalOwners, setTotalOwners] = useState(0);
  const [totalEmailOwners, setTotalEmailOwners] = useState(0);
  const [totalCniOwners, setTotalCniOwners] = useState(0);
  const perPage = 10;

  // Fetch owners with pagination
  useEffect(() => {
    const fetchOwners = async () => {
      try {
        setLoading(true);
        
        const response = await ownerService.getOwners({
          search: searchTerm,
          page: currentPage,
          perPage
        });
        
        setPaginatedOwners(response);
        setOwners(response.data);
        setTotalOwners(response.meta.total);
        
        // Get counts for stats - this could be a separate API call in a real app
        if (currentPage === 1 && !searchTerm) {
          // Fetch all owners to get stats (in a real app, this would be a separate endpoint)
          try {
            const allOwners = await ownerService.getOwners({ perPage: 1000 });
            setTotalEmailOwners(allOwners.data.filter(o => o.email).length);
            setTotalCniOwners(allOwners.data.filter(o => o.id_type === IdType.NATIONAL_ID).length);
          } catch (error) {
            console.error('Error fetching owner stats:', error);
          }
        }
      } catch (error) {
        console.error('Error fetching owners:', error);
        toast({
          title: 'Erreur',
          description: 'Impossible de charger la liste des propriétaires',
          variant: 'destructive',
        });
      } finally {
        setLoading(false);
      }
    };

    fetchOwners();
  }, [currentPage, searchTerm]);

  // Handle search debounce
  useEffect(() => {
    const timer = setTimeout(() => {
      setCurrentPage(1); // Reset to first page on new search
    }, 500);
    
    return () => clearTimeout(timer);
  }, [searchTerm]);

  const getIdTypeLabel = (type?: IdType) => {
    if (!type) return 'Non spécifié';
    
    switch (type) {
      case IdType.NATIONAL_ID: return 'CNI';
      case IdType.PASSPORT: return 'Passeport';
      case IdType.DRIVERS_LICENSE: return 'Permis';
      case IdType.OTHER: return 'Autre';
      default: return type;
    }
  };

  if (loading && !paginatedOwners) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold text-foreground">Propriétaires</h1>
        <p className="text-muted-foreground">
          Gestion de la base de données des propriétaires de véhicules
        </p>
      </div>

      {/* Search */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Recherche
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Rechercher par nom, téléphone, email, ou numéro ID..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </CardContent>
      </Card>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold">{paginatedOwners?.meta.total || 0}</div>
            <p className="text-sm text-muted-foreground">Propriétaires trouvés</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold">{totalEmailOwners}</div>
            <p className="text-sm text-muted-foreground">Avec email</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold">{totalCniOwners}</div>
            <p className="text-sm text-muted-foreground">CNI enregistrées</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold">{totalOwners}</div>
            <p className="text-sm text-muted-foreground">Total propriétaires</p>
          </CardContent>
        </Card>
      </div>

      {/* Owners Table */}
      <Card>
        <CardHeader>
          <CardTitle>Liste des propriétaires</CardTitle>
          <CardDescription>
            {paginatedOwners?.meta.total} propriétaire(s) dans la base de données
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border overflow-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="min-w-[180px]">Propriétaire</TableHead>
                  <TableHead className="min-w-[150px]">Contact</TableHead>
                  <TableHead className="hidden md:table-cell min-w-[200px]">Adresse</TableHead>
                  <TableHead className="hidden lg:table-cell min-w-[150px]">Pièce d'identité</TableHead>
                  <TableHead className="hidden sm:table-cell">Date d'ajout</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={5} className="h-24 text-center">
                      <Loader2 className="h-5 w-5 mx-auto animate-spin text-primary" />
                    </TableCell>
                  </TableRow>
                ) : (
                  owners.map((owner) => (
                    <TableRow key={owner.id} className="cursor-pointer hover:bg-muted/50">
                      <TableCell>
                        <Link to={`/app/proprietaires/${owner.id}`} className="block">
                          <div className="flex items-center gap-3">
                            <Avatar>
                              <AvatarFallback>
                                {owner.first_name[0]}{owner.last_name[0]}
                              </AvatarFallback>
                            </Avatar>
                            <div>
                              <p className="font-medium">{owner.first_name} {owner.last_name}</p>
                              <p className="text-sm text-muted-foreground">ID: {owner.id.substring(0, 8)}</p>
                            </div>
                          </div>
                        </Link>
                      </TableCell>
                      <TableCell>
                        <div className="space-y-1">
                          <div className="flex items-center gap-1 text-sm">
                            <Phone className="h-3 w-3" />
                            {owner.phone}
                          </div>
                          {owner.email && (
                            <div className="flex items-center gap-1 text-sm text-muted-foreground">
                              <Mail className="h-3 w-3" />
                              {owner.email}
                            </div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="hidden md:table-cell">
                        <p className="text-sm">{owner.address || "Non renseigné"}</p>
                      </TableCell>
                      <TableCell className="hidden lg:table-cell">
                        <div className="space-y-1">
                          <Badge variant="outline">
                            {getIdTypeLabel(owner.id_type)}
                          </Badge>
                          <p className="text-sm text-muted-foreground">{owner.id_number || "Non renseigné"}</p>
                        </div>
                      </TableCell>
                      <TableCell className="hidden sm:table-cell">
                        {new Date(owner.created_at).toLocaleDateString('fr-FR')}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
            {!loading && owners.length === 0 && (
              <div className="text-center py-8 text-muted-foreground">
                Aucun propriétaire trouvé
              </div>
            )}
          </div>
          
          {/* Pagination */}
          {paginatedOwners && paginatedOwners.meta.last_page > 1 && (
            <div className="mt-4">
              <Pagination>
                <PaginationContent>
                  <PaginationItem>
                    <PaginationPrevious 
                      onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))} 
                      disabled={currentPage === 1}
                      className={currentPage === 1 ? "pointer-events-none opacity-50" : "cursor-pointer"}
                    />
                  </PaginationItem>
                  
                  {Array.from({ length: Math.min(5, paginatedOwners.meta.last_page) }).map((_, i) => {
                    let pageNumber: number;
                    
                    // Logic to show the current page and surrounding pages
                    if (paginatedOwners.meta.last_page <= 5) {
                      // If we have 5 or fewer pages, show all
                      pageNumber = i + 1;
                    } else if (currentPage <= 3) {
                      // If current page is near the beginning
                      pageNumber = i + 1;
                    } else if (currentPage >= paginatedOwners.meta.last_page - 2) {
                      // If current page is near the end
                      pageNumber = paginatedOwners.meta.last_page - 4 + i;
                    } else {
                      // Current page is in the middle
                      pageNumber = currentPage - 2 + i;
                    }
                    
                    return (
                      <PaginationItem key={pageNumber}>
                        <PaginationLink
                          onClick={() => setCurrentPage(pageNumber)}
                          isActive={currentPage === pageNumber}
                        >
                          {pageNumber}
                        </PaginationLink>
                      </PaginationItem>
                    );
                  })}
                  
                  <PaginationItem>
                    <PaginationNext 
                      onClick={() => setCurrentPage(prev => Math.min(prev + 1, paginatedOwners.meta.last_page))} 
                      disabled={currentPage === paginatedOwners.meta.last_page}
                      className={currentPage === paginatedOwners.meta.last_page ? "pointer-events-none opacity-50" : "cursor-pointer"}
                    />
                  </PaginationItem>
                </PaginationContent>
              </Pagination>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
