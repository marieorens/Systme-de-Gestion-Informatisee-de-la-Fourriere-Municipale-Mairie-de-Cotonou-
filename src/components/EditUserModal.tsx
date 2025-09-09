import { useState } from 'react';
import { Dialog, DialogHeader, DialogContent, DialogFooter, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { User } from '@/types';
import { UserRole } from '@/types/enums';
import { userService } from '@/services';
import { toast } from '@/hooks/use-toast';

interface EditUserModalProps {
  user: User;
  open: boolean;
  onClose: () => void;
  onUserUpdated: () => void;
}

export const EditUserModal = ({ user, open, onClose, onUserUpdated }: EditUserModalProps) => {
  const [form, setForm] = useState({
    name: user.name,
    email: user.email,
    phone: user.phone || '',
    role: user.role,
    is_active: user.is_active,
    password: '',
    password_confirmation: ''
  });
  const [loading, setLoading] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleRoleChange = (value: string) => {
    setForm({ ...form, role: value as UserRole });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await userService.updateUser(user.id, form);
      toast({ title: 'Utilisateur modifié', description: 'Les informations ont été mises à jour.' });
      onUserUpdated();
      onClose();
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Erreur lors de la modification.';
      toast({ title: 'Erreur', description: errorMessage, variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent>
        <DialogTitle>Modifier l'utilisateur</DialogTitle>
        <form onSubmit={handleSubmit} className="space-y-4">
          <label htmlFor="name" className="block text-sm font-medium">Nom</label>
          <Input name="name" value={form.name} onChange={handleChange} required />
          <label htmlFor="email" className="block text-sm font-medium">Email</label>
          <Input name="email" value={form.email} onChange={handleChange} required type="email" />
          <label htmlFor="phone" className="block text-sm font-medium">Téléphone</label>
          <Input name="phone" value={form.phone} onChange={handleChange} />
          <label htmlFor="role" className="block text-sm font-medium">Rôle</label>
          <Select value={form.role} onValueChange={handleRoleChange}>
            <SelectTrigger><SelectValue placeholder="Rôle" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="admin">Admin</SelectItem>
              <SelectItem value="agent">Agent</SelectItem>
              <SelectItem value="finance">Finance</SelectItem>
            </SelectContent>
          </Select>
          <label htmlFor="password" className="block text-sm font-medium">Nouveau mot de passe</label>
          <Input name="password" value={form.password} onChange={handleChange} type="password" autoComplete="new-password" />
          <label htmlFor="password_confirmation" className="block text-sm font-medium">Confirmer le mot de passe</label>
          <Input name="password_confirmation" value={form.password_confirmation} onChange={handleChange} type="password" autoComplete="new-password" />
          <DialogFooter className="flex gap-2 mt-4">
            <Button type="button" variant="outline" onClick={onClose} disabled={loading}>Annuler</Button>
            <Button type="submit" disabled={loading}>Enregistrer</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};
