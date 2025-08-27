import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { AppLayout } from "@/components/layout/AppLayout";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { LoginPage } from "@/pages/LoginPage";
import { LandingPage } from "@/pages/LandingPage";
import { VehicleLookupPage } from "@/pages/VehicleLookupPage";
import { DashboardPage } from "@/pages/DashboardPage";
import { VehiclesListPage } from "@/pages/VehiclesListPage";
import { VehicleFormPage } from "@/pages/VehicleFormPage";
import { VehicleDetailPage } from "@/pages/VehicleDetailPage";
import { OwnersPage } from "@/pages/OwnersPage";
import { PaymentSuccessPage } from "@/pages/PaymentSuccessPage";
import { ProceduresPage } from "@/pages/ProceduresPage";
import { ProcedureFormPage } from "@/pages/ProcedureFormPage";
import { ProcedureDetailPage } from "@/pages/ProcedureDetailPage";
import { PaymentsPage } from "@/pages/PaymentsPage";
import { NotificationsPage } from "@/pages/NotificationsPage";
import { UsersPage } from "@/pages/UsersPage";
import { SettingsPage } from "@/pages/SettingsPage";
import { ChangePasswordPage } from "@/pages/ChangePasswordPage";
import { ProfilePage } from "@/pages/ProfilePage";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          {/* Public routes */}
          <Route path="/" element={<LandingPage />} />
          <Route path="/vehicule-lookup" element={<VehicleLookupPage />} />
          <Route path="/paiement/confirmation" element={<PaymentSuccessPage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/profile" element={
            <ProtectedRoute>
              <ProfilePage />
            </ProtectedRoute>
          } />
          
          {/* Legacy redirects for old URLs */}
          <Route path="/vehicules" element={<Navigate to="/app/vehicules" replace />} />
          <Route path="/proprietaires" element={<Navigate to="/app/proprietaires" replace />} />
          
          {/* Protected routes */}
          <Route path="/app" element={
            <ProtectedRoute>
              <AppLayout />
            </ProtectedRoute>
          }>
            <Route index element={<Navigate to="/app/dashboard" replace />} />
            <Route path="dashboard" element={<DashboardPage />} />
            <Route path="vehicules" element={<VehiclesListPage />} />
            <Route path="vehicules/nouveau" element={
              <ProtectedRoute roles={['admin', 'agent']}>
                <VehicleFormPage />
              </ProtectedRoute>
            } />
            <Route path="vehicules/:id/edit" element={
              <ProtectedRoute roles={['admin', 'agent']}>
                <VehicleFormPage />
              </ProtectedRoute>
            } />
            <Route path="vehicules/:id" element={<VehicleDetailPage />} />
            <Route path="proprietaires" element={<OwnersPage />} />
            <Route path="procedures" element={
              <ProtectedRoute roles={['admin', 'agent', 'finance']}>
                <ProceduresPage />
              </ProtectedRoute>
            } />
            <Route path="procedures/new" element={
              <ProtectedRoute roles={['admin', 'agent']}>
                <ProcedureFormPage />
              </ProtectedRoute>
            } />
            <Route path="procedures/:procedureId/edit" element={
              <ProtectedRoute roles={['admin', 'agent']}>
                <ProcedureFormPage />
              </ProtectedRoute>
            } />
            <Route path="procedures/:procedureId" element={
              <ProtectedRoute roles={['admin', 'agent', 'finance']}>
                <ProcedureDetailPage />
              </ProtectedRoute>
            } />
            <Route path="paiements" element={
              <ProtectedRoute roles={['admin', 'finance']}>
                <PaymentsPage />
              </ProtectedRoute>
            } />
            <Route path="notifications" element={
              <ProtectedRoute roles={['admin', 'agent']}>
                <NotificationsPage />
              </ProtectedRoute>
            } />
            <Route path="admin/utilisateurs" element={
              <ProtectedRoute roles={['admin']}>
                <UsersPage />
              </ProtectedRoute>
            } />
            <Route path="parametres" element={
              <ProtectedRoute roles={['admin']}>
                <SettingsPage />
              </ProtectedRoute>
            } />
            <Route path="change-password" element={<ChangePasswordPage />} />
          </Route>
          
          {/* Catch-all route */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
