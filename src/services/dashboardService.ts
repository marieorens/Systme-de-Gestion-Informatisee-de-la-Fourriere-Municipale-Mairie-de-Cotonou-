import api, { endpoints } from './api';
import { VehicleStatus } from '@/types/enums';

export interface DashboardStats {
  total_vehicles: number;
  total_owners: number;
  total_procedures: number;
  total_payments: number;
  monthly_revenue: number;
  unclaimed_vehicles: number;
}

export interface VehicleStatusCount {
  status: VehicleStatus;
  count: number;
}

export interface MonthlyPayment {
  month: string;
  amount: number;
}

export interface RecentActivity {
  id: string;
  type: 'vehicle' | 'procedure' | 'payment' | 'notification';
  message: string;
  created_at: string;
  reference_id?: string;
  reference_type?: string;
}

/**
 * Dashboard service for retrieving dashboard statistics
 */
const dashboardService = {
  /**
   * Get dashboard statistics
   */
  getStats: async (): Promise<DashboardStats> => {
    const response = await api.get(endpoints.dashboard);
    return response.data;
  },

  /**
   * Get vehicle count by status
   */
  getVehiclesByStatus: async (): Promise<VehicleStatusCount[]> => {
    const response = await api.get('/dashboard/vehicles-by-status');
    return response.data;
  },

  /**
   * Get payments by month
   */
  getPaymentsByMonth: async (year?: number): Promise<MonthlyPayment[]> => {
    const response = await api.get('/dashboard/payments-by-month', {
      params: { year }
    });
    return response.data;
  },

  /**
   * Get recent activities
   */
  getRecentActivities: async (limit: number = 10): Promise<RecentActivity[]> => {
    const response = await api.get('/dashboard/recent-activities', {
      params: { limit }
    });
    return response.data;
  }
};

export default dashboardService;
