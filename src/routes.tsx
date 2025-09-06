import { createBrowserRouter } from 'react-router-dom';
import { AppLayout as Layout } from '@/components/layout/AppLayout';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import { LoginPage } from '@/pages/LoginPage';
import { LandingPage } from '@/pages/LandingPage';
import { DashboardPage } from '@/pages/DashboardPage';
import { VehiclesListPage } from '@/pages/VehiclesListPage';
import { VehicleFormPage } from '@/pages/VehicleFormPage';
import { VehicleDetailPage } from '@/pages/VehicleDetailPage';
import { VehicleNotifyPage } from '@/pages/VehicleNotifyPage';
import { VehicleLookupPage } from '@/pages/VehicleLookupPage';
import { OwnersPage } from '@/pages/OwnersPage';
import { PaymentsPage } from '@/pages/PaymentsPage';
import { ProceduresPage } from '@/pages/ProceduresPage';
import { NotificationsPage } from '@/pages/NotificationsPage';
import { UsersPage } from '@/pages/UsersPage';
import { SettingsPage } from '@/pages/SettingsPage';
import { ChangePasswordPage } from '@/pages/ChangePasswordPage';
import PaymentConfirmationPage from '@/pages/PaymentConfirmationPage';
import NotFound from '@/pages/NotFound';

export const router = createBrowserRouter([
  {
    path: '/',
    element: <LandingPage />,
  },
  {
    path: '/paiement/confirmation',
    element: <PaymentConfirmationPage />,
  },
  {
    path: '/login',
    element: <LoginPage />,
  },
  
  {
    path: '/app',
    element: (
      <ProtectedRoute>
        <Layout />
      </ProtectedRoute>
    ),
    children: [
      {
        path: 'tableau-de-bord',
        element: <DashboardPage />,
      },
      {
        path: 'vehicules',
        children: [
          {
            path: '',
            element: <VehiclesListPage />,
          },
          {
            path: 'nouveau',
            element: <VehicleFormPage />,
          },
          {
            path: ':id',
            element: <VehicleDetailPage />,
          },
          {
            path: ':id/edit',
            element: <VehicleFormPage />,
          },
          {
            path: ':id/notify',
            element: <VehicleNotifyPage />,
          },
        ],
      },
      {
        path: 'recherche',
        element: <VehicleLookupPage />,
      },
      {
        path: 'proprietaires',
        element: <OwnersPage />,
      },
      {
        path: 'paiements',
        element: <PaymentsPage />,
      },
      {
        path: 'procedures',
        element: <ProceduresPage />,
      },
      {
        path: 'notifications',
        element: <NotificationsPage />,
      },
      {
        path: 'utilisateurs',
        element: <UsersPage />,
      },
      {
        path: 'parametres',
        element: <SettingsPage />,
      },
      {
        path: 'changer-mot-de-passe',
        element: <ChangePasswordPage />,
      },
    ],
  },

  {
    path: '*',
    element: <NotFound />,
  },
]);
