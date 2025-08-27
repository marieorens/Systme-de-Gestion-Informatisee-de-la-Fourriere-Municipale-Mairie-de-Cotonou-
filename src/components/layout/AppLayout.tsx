import { useState } from 'react';
import { Outlet, Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { SidebarProvider } from '@/components/ui/sidebar';
import { AppSidebar } from './AppSidebar';
import { AppHeader } from './AppHeader';
import { AppFooter } from './AppFooter';
import { Loader2 } from 'lucide-react';

export const AppLayout = () => {
  const { isAuthenticated, isLoading } = useAuth();
  const location = useLocation();

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

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full bg-background transition-all duration-300 ease-out">
        <AppSidebar />
        
        <div className="flex-1 flex flex-col transition-all duration-300 ease-out">
          <AppHeader />
          
          <main className="flex-1 p-6 overflow-auto">
            <div className="max-w-7xl mx-auto">
              <div 
                key={location.pathname} 
                className="animate-fade-in"
                style={{
                  animationDuration: '0.6s',
                  animationFillMode: 'both'
                }}
              >
                <Outlet />
              </div>
            </div>
          </main>
          
          <AppFooter />
        </div>
      </div>
    </SidebarProvider>
  );
};