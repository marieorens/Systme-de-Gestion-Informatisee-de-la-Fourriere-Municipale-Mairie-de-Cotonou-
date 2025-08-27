import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { User, Mail, Phone, IdCard, Calendar, Edit, Save, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';

export const ProfilePage = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  
  const [formData, setFormData] = useState({
    name: user?.name || '',
    email: user?.email || '',
    phone: '+229 97 12 34 56',
    department: 'Service de la Fourrière',
    employeeId: 'EMP' + user?.id || '',
  });

  const handleChange = (field: string) => (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData(prev => ({
      ...prev,
      [field]: e.target.value
    }));
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      // Simuler l'appel API pour mettre à jour le profil
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      toast({
        title: 'Profil mis à jour',
        description: 'Vos informations ont été modifiées avec succès',
      });
      
      setIsEditing(false);
    } catch (error) {
      toast({
        title: 'Erreur',
        description: 'Impossible de mettre à jour le profil. Veuillez réessayer.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const getRoleBadge = (role?: string) => {
    switch (role) {
      case 'admin':
        return <Badge variant="default">Administrateur</Badge>;
      case 'agent':
        return <Badge variant="secondary">Agent de saisie</Badge>;
      case 'finance':
        return <Badge variant="outline">Responsable financier</Badge>;
      default:
        return <Badge variant="outline">{role}</Badge>;
    }
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center gap-4">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => navigate('/app/dashboard')}
          className="h-9 w-9 p-0"
        >
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h1 className="text-3xl font-bold text-foreground">Mon Profil</h1>
          <p className="text-muted-foreground">Gérer vos informations personnelles</p>
        </div>
      </div>

      <div className="max-w-2xl mx-auto">
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <Avatar className="h-16 w-16">
                  <AvatarImage src="" alt={user?.name} />
                  <AvatarFallback className="bg-primary text-primary-foreground text-lg">
                    {user?.name.split(' ').map(n => n[0]).join('').toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <CardTitle className="text-xl">{user?.name}</CardTitle>
                  <div className="flex items-center gap-2">
                    {getRoleBadge(user?.role)}
                    <span>•</span>
                    <span className="text-muted-foreground">Connecté depuis: {new Date().toLocaleDateString('fr-FR')}</span>
                  </div>
                </div>
              </div>
              <Button
                variant={isEditing ? "destructive" : "outline"}
                onClick={() => setIsEditing(!isEditing)}
                disabled={isLoading}
              >
                {isEditing ? (
                  'Annuler'
                ) : (
                  <>
                    <Edit className="w-4 h-4 mr-2" />
                    Modifier
                  </>
                )}
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSave} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="name">Nom complet</Label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="name"
                      value={formData.name}
                      onChange={handleChange('name')}
                      disabled={!isEditing}
                      className="pl-9"
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="email">Email</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="email"
                      type="email"
                      value={formData.email}
                      onChange={handleChange('email')}
                      disabled={!isEditing}
                      className="pl-9"
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="phone">Téléphone</Label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="phone"
                      value={formData.phone}
                      onChange={handleChange('phone')}
                      disabled={!isEditing}
                      className="pl-9"
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="employeeId">ID Employé</Label>
                  <div className="relative">
                    <IdCard className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="employeeId"
                      value={formData.employeeId}
                      disabled
                      className="pl-9 bg-muted"
                    />
                  </div>
                </div>

                <div className="md:col-span-2">
                  <Label htmlFor="department">Département</Label>
                  <Input
                    id="department"
                    value={formData.department}
                    disabled
                    className="bg-muted"
                  />
                </div>
              </div>

              {isEditing && (
                <div className="flex justify-end gap-2 pt-4 border-t">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setIsEditing(false)}
                    disabled={isLoading}
                  >
                    Annuler
                  </Button>
                  <Button type="submit" disabled={isLoading}>
                    {isLoading ? (
                      'Sauvegarde...'
                    ) : (
                      <>
                        <Save className="w-4 h-4 mr-2" />
                        Sauvegarder
                      </>
                    )}
                  </Button>
                </div>
              )}
            </form>
          </CardContent>
        </Card>

        {/* Actions rapides */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg">Sécurité</CardTitle>
            </CardHeader>
            <CardContent>
              <Button 
                variant="outline" 
                className="w-full"
                onClick={() => navigate('/app/change-password')}
              >
                <Edit className="w-4 h-4 mr-2" />
                Changer mot de passe
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg">Compte</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 text-sm text-muted-foreground">
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4" />
                  <span>Membre depuis janvier 2024</span>
                </div>
                <div className="flex items-center gap-2">
                  <User className="h-4 w-4" />
                  <span>Dernière connexion: aujourd'hui</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};