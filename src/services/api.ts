import axios, { AxiosError, AxiosResponse } from 'axios';
import { toast } from '@/hooks/use-toast';


const API_BASE_URL = 'https://backend-fourriere.onrender.com/api';


export const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  },
});


export const getToken = (): string | null => {
  return localStorage.getItem('auth_token');
};

export const setToken = (token: string): void => {
  localStorage.setItem('auth_token', token);
  api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
};

export const removeToken = (): void => {
  localStorage.removeItem('auth_token');
  delete api.defaults.headers.common['Authorization'];
};


const token = getToken();
if (token) {
  api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
}


api.interceptors.request.use(
  (config) => {
    if (config.url && config.url.startsWith('/public/')) {
      if (config.headers) {
        delete config.headers.Authorization;
      }
    } else {
      const token = getToken();
      if (token && config.headers) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);


api.interceptors.response.use(
  (response: AxiosResponse) => {
    return response;
  },
  (error: AxiosError) => {
    const url = error.config?.url || '';
  const isPublicEndpoint = url.includes('/public/');
    
    console.log('API error URL:', url, 'isPublicEndpoint:', isPublicEndpoint);
    
    if (error.response?.status === 401 && !isPublicEndpoint) {
      console.log('Redirection vers login due à une erreur 401');
      removeToken();
      
      sessionStorage.setItem('redirect_after_login', window.location.href);
      
      window.location.href = '/login';
      toast({
        title: 'Session expirée',
        description: 'Veuillez vous reconnecter',
        variant: 'destructive',
        duration: 5000,
      });
    } else if (error.response?.status === 403) {
      toast({
        title: 'Accès refusé',
        description: 'Vous n\'avez pas les permissions nécessaires',
        variant: 'destructive',
      });
    } else if (error.response?.status >= 500) {
      toast({
        title: 'Erreur serveur',
        description: 'Une erreur est survenue. Veuillez réessayer.',
        variant: 'destructive',
      });
    }
    
    return Promise.reject(error);
  }
);


export const endpoints = {
  generatePublicReceipt: (id: string) => `/public/payments/${id}/receipt`,
  // Authentication
  login: '/auth/login',
  logout: '/auth/logout',
  changePassword: '/auth/change-password',
  profile: '/auth/profile',

  // Vehicles
  vehicles: '/vehicles',
  vehicleById: (id: string) => `/vehicles/${id}`,
  vehiclePhotos: (id: string) => `/vehicles/${id}/photos`,
  vehicleQrCode: (id: string) => `/vehicles/${id}/qr-code`,
  vehicleByPlate: (plate: string) => `/public/vehicles/${plate}`,
  vehicleStorageFee: (id: string) => `/vehicles/${id}/storage-fee`,
  publicVehicleStorageFee: (licensePlate: string) => `/public/vehicles/${licensePlate}/fees`,

  publicUpdateVehicle: (id: string) => `/public/vehicles/${id}/update`,

  publicUpdateVehicleByPlate: (licensePlate: string) => `/public/vehicles/${licensePlate}/update-by-plate`,

  // Owners
  owners: '/owners',
  ownerById: (id: string) => `/owners/${id}`,
  ownerVehicles: (id: string) => `/owners/${id}/vehicles`,

  procedures: '/procedures',
  procedureById: (id: string) => `/procedures/${id}`,
  procedureDocuments: (id: string) => `/procedures/${id}/documents`,

  payments: '/payments',
  paymentById: (id: string) => `/payments/${id}`,
  generateReceipt: (id: string) => `/payments/${id}/receipt`,
  sendReceiptByEmail: (id: string) => `/payments/${id}/send-receipt`,

  users: '/admin/users',
  userById: (id: string) => `/admin/users/${id}`,
  toggleUserActive: (id: string) => `/admin/users/${id}/toggle-active`,
  roles: '/admin/roles',

  // Notifications
  notifications: '/notifications',
  sendNotification: '/notifications/send',

  // Dashboard & Reports
  dashboard: '/dashboard/stats',
  reports: '/reports',
  export: '/export',

  // Settings
  settings: '/settings',
  updateSettings: '/settings',
};

export default api;