import React, { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, Plus } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { mockService } from '@/services/mockService';
import { toast } from '@/hooks/use-toast';

interface CreateUserModalProps {
  onUserCreated: () => void;
}

export const CreateUserModal: React.FC<CreateUserModalProps> = ({ onUserCreated }) => {
  const { user } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    role: 'agent' as 'admin' | 'agent' | 'finance'
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.email || !formData.password || !formData.role) {
      setError('Veuillez remplir tous les champs');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      // Create user with mock service
      await mockService.createUser({
        name: formData.name,
        email: formData.email,
        role: formData.role
      });

      toast({
        title: 'Utilisateur créé avec succès',
        description: `L'utilisateur ${formData.name} a été créé.`
      });

      // Reset form and close modal
      setFormData({
        name: '',
        email: '',
        password: '',
        role: 'agent'
      });
      setIsOpen(false);
      onUserCreated();
    } catch (err: any) {
      setError(err.message || 'Erreur lors de la création de l\'utilisateur');
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (error) setError('');
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button>
          <Plus className="w-4 h-4 mr-2" />
          Nouvel utilisateur
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Créer un utilisateur</DialogTitle>
          <DialogDescription>
            Ajouter un nouvel utilisateur au système
          </DialogDescription>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
          
          <div>
            <Label htmlFor="name">Nom complet</Label>
            <Input 
              id="name" 
              name="name"
              value={formData.name}
              onChange={handleInputChange}
              placeholder="Nom et prénom"
              disabled={isLoading}
              required
            />
          </div>
          
          <div>
            <Label htmlFor="email">Email</Label>
            <Input 
              id="email" 
              name="email"
              type="email" 
              value={formData.email}
              onChange={handleInputChange}
              placeholder="email@mairie-cotonou.bj"
              disabled={isLoading}
              required
            />
          </div>
          
          <div>
            <Label htmlFor="role">Rôle</Label>
            <Select 
              value={formData.role} 
              onValueChange={(value) => setFormData(prev => ({ ...prev, role: value as 'admin' | 'agent' | 'finance' }))}
              disabled={isLoading}
            >
              <SelectTrigger>
                <SelectValue placeholder="Sélectionner un rôle" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="agent">Agent de saisie</SelectItem>
                <SelectItem value="finance">Responsable financier</SelectItem>
                <SelectItem value="admin">Administrateur</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <div>
            <Label htmlFor="password">Mot de passe temporaire</Label>
            <Input 
              id="password" 
              name="password"
              type="password" 
              value={formData.password}
              onChange={handleInputChange}
              placeholder="Mot de passe"
              disabled={isLoading}
              required
            />
          </div>
          
          <Button 
            type="submit"
            className="w-full"
            disabled={isLoading}
          >
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Création en cours...
              </>
            ) : (
              'Créer l\'utilisateur'
            )}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
};