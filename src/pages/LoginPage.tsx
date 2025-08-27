import React, { useState } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, LogIn, Shield } from 'lucide-react';
import cotonouImage from '@/assets/cotonou-municipal-building.jpg';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

export const LoginPage = () => {
  const { login, isAuthenticated, isLoading } = useAuth();
  const [credentials, setCredentials] = useState({
    email: '',
    password: ''
  });
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (isAuthenticated) {
    return <Navigate to="/app/dashboard" replace />;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!credentials.email || !credentials.password) {
      setError('Veuillez remplir tous les champs');
      return;
    }

    setIsSubmitting(true);
    setError('');

    try {
      await login(credentials);
      // Redirection gérée par le composant grâce à isAuthenticated
    } catch (err) {
      let errorMessage = 'Erreur de connexion';
      
      if (err instanceof Error) {
        errorMessage = err.message;
      }
      
      setError(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setCredentials(prev => ({
      ...prev,
      [name]: value
    }));
    if (error) setError('');
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-primary" />
          <p className="text-muted-foreground">Chargement...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex animate-fade-in">
      <div className="hidden lg:flex lg:w-1/2 bg-primary">
        <div 
          className="w-full bg-cover bg-center relative"
          style={{ backgroundImage: `url(${cotonouImage})` }}
        >
          <div className="absolute inset-0 bg-primary/80 flex items-center justify-center">
            <div className="text-center text-white p-8">
              <Shield className="h-16 w-16 mx-auto mb-4" />
              <h1 className="text-3xl font-bold mb-4">
                Système de Gestion de Fourrière
              </h1>
              <p className="text-lg opacity-90">
                Mairie de Cotonou - Accès sécurisé
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="flex-1 flex items-center justify-center p-8 bg-background">
        <div className="w-full max-w-md">
          <div className="text-center mb-8">
            <LogIn className="h-12 w-12 mx-auto mb-4 text-primary" />
            <h1 className="text-2xl font-bold text-foreground">Connexion</h1>
            <p className="text-muted-foreground mt-2">
              Accédez à votre espace de travail
            </p>
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="text-center">Authentification</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                {error && (
                  <Alert variant="destructive">
                    <AlertDescription>{error}</AlertDescription>
                  </Alert>
                )}

                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    name="email"
                    type="email"
                    value={credentials.email}
                    onChange={handleInputChange}
                    placeholder="votre.email@cotonou.bj"
                    disabled={isSubmitting}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="password">Mot de passe</Label>
                  <Input
                    id="password"
                    name="password"
                    type="password"
                    value={credentials.password}
                    onChange={handleInputChange}
                    placeholder="Votre mot de passe"
                    disabled={isSubmitting}
                    required
                  />
                </div>

                <Button
                  type="submit"
                  className="w-full"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Connexion...
                    </>
                  ) : (
                    <>
                      <LogIn className="mr-2 h-4 w-4" />
                      Se connecter
                    </>
                  )}
                </Button>
              </form>

             {/* <div className="mt-6 p-4 bg-muted/50 rounded-lg">
                <h3 className="font-medium text-sm mb-2">Comptes de démonstration :</h3>
                <div className="space-y-2 text-xs">
                  <div><strong>Admin:</strong> admin@cotonou.bj / admin123</div>
                  <div><strong>Agent:</strong> agent@cotonou.bj / agent123</div>
                  <div><strong>Finance:</strong> finance@cotonou.bj / finance123</div>
                </div>
              </div> */}
              
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};