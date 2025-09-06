import React, { createContext, useContext, useEffect, useState } from 'react';
import { User, LoginCredentials } from '@/types';
import { UserRole } from '@/types/enums';
import { toast } from '@/hooks/use-toast';
import api, { endpoints, setToken, removeToken, getToken } from '@/services/api';
import { AxiosError } from 'axios';

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (credentials: LoginCredentials) => Promise<void>;
  signup: (userData: { name: string; email: string; password: string; password_confirmation: string; role?: UserRole; phone?: string; }) => Promise<void>;
  logout: () => void;
  hasRole: (role: string | UserRole) => boolean;
  hasAnyRole: (roles: (string | UserRole)[]) => boolean;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: React.ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const isAuthenticated = !!user;

  // Initialize auth state
  useEffect(() => {
    const checkAuth = async () => {
      const token = getToken();
      if (token) {
        try {
          setIsLoading(true);
          const response = await api.get(endpoints.profile);
          setUser(response.data.data);
        } catch (error) {
          // Token might be invalid or expired
          removeToken();
        } finally {
          setIsLoading(false);
        }
      } else {
        setIsLoading(false);
      }
    };
    
    checkAuth();
  }, []);

  const login = async (credentials: LoginCredentials) => {
    try {
      setIsLoading(true);
      
      const response = await api.post(endpoints.login, credentials);
      const { user, token } = response.data;
      
      // Save token to localStorage and set it in axios headers
      setToken(token);
      
      // Set user in state
      setUser(user);
      
      toast({
        description: `Bienvenue, ${user.name}!`,
      });
    } catch (error) {
      let message = 'Une erreur est survenue lors de la connexion';
      
      if (error instanceof AxiosError && error.response) {
        message = error.response.data.message || message;
      } else if (error instanceof Error) {
        message = error.message;
      }
      
      toast({
        title: 'Erreur de connexion',
        description: message,
        variant: 'destructive',
      });
      
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const signup = async (userData: { name: string; email: string; password: string; password_confirmation: string; role?: UserRole; phone?: string; }) => {
    try {
      setIsLoading(true);
      
      await api.post(endpoints.users, userData);
      
      toast({
        title: 'Inscription réussie',
        description: 'Votre compte a été créé avec succès',
      });
      
      // If the signup was successful, automatically log in
      if (userData.email && userData.password) {
        await login({ 
          email: userData.email, 
          password: userData.password 
        });
      }
    } catch (error) {
      let message = 'Une erreur est survenue lors de l\'inscription';
      
      if (error instanceof AxiosError && error.response) {
        message = error.response.data.message || message;
      } else if (error instanceof Error) {
        message = error.message;
      }
      
      toast({
        title: 'Erreur d\'inscription',
        description: message,
        variant: 'destructive',
      });
      
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    try {
      setIsLoading(true);
      
      // Call the logout endpoint
      await api.post(endpoints.logout);
      
      // Clear user data and token
      setUser(null);
      removeToken();
    } catch (error) {
      // Even if the API call fails, still clear local data
      setUser(null);
      removeToken();
      
      toast({
        title: 'Déconnexion',
        description: 'Vous avez été déconnecté',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const hasRole = (role: string | UserRole): boolean => {
    if (!user) return false;
    return user.role === role;
  };

  const hasAnyRole = (roles: (string | UserRole)[]): boolean => {
    if (!user) return false;
    return roles.includes(user.role);
  };

  const refreshUser = async () => {
    if (!isAuthenticated) return;
    
    try {
      setIsLoading(true);
      const response = await api.get(endpoints.profile);
      setUser(response.data.data);
    } catch (error) {
      if (error instanceof AxiosError && error.response?.status === 401) {
        // If unauthorized, log out the user
        setUser(null);
        removeToken();
        
        toast({
          title: 'Session expirée',
          description: 'Veuillez vous reconnecter',
          variant: 'destructive',
        });
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        isAuthenticated,
        login,
        signup,
        logout,
        hasRole,
        hasAnyRole,
        refreshUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};
