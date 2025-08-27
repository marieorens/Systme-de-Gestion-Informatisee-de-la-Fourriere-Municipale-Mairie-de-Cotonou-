import api, { endpoints } from './api';
import { Payment } from '@/types';
import { PaymentMethod } from '@/types/enums';

export interface PaymentCreateData {
  vehicle_id: string;
  amount: number;
  method: PaymentMethod;
  reference_number?: string;
  description?: string;
}

export interface PaymentFilters {
  vehicle_id?: string;
  method?: PaymentMethod;
  startDate?: string;
  endDate?: string;
  search?: string;
  page?: number;
  perPage?: number;
}

export interface PaymentPaginatedResponse {
  data: Payment[];
  meta: {
    current_page: number;
    from: number;
    last_page: number;
    path: string;
    per_page: number;
    to: number;
    total: number;
  };
  links: {
    first: string;
    last: string;
    prev: string | null;
    next: string | null;
  };
}


const paymentService = {
 
  getPayments: async (filters?: PaymentFilters): Promise<PaymentPaginatedResponse> => {
    const response = await api.get(endpoints.payments, { params: filters });
    return response.data;
  },

  
  getPayment: async (id: string): Promise<Payment> => {
    const response = await api.get(endpoints.paymentById(id));
    return response.data.data;
  },

  
  getVehiclePayments: async (vehicleId: string): Promise<Payment[]> => {
    const response = await api.get(`/vehicles/${vehicleId}/payments`);
    return response.data.data;
  },

  
  createPayment: async (paymentData: PaymentCreateData): Promise<Payment> => {
    const response = await api.post(endpoints.payments, paymentData);
    return response.data.data;
  },

  
  createVehiclePayment: async (vehicleId: string, paymentData: Omit<PaymentCreateData, 'vehicle_id'>): Promise<Payment> => {
    const response = await api.post(`/vehicles/${vehicleId}/payments`, paymentData);
    return response.data.data;
  },

 
  generateReceipt: async (id: string): Promise<{ receipt_url: string }> => {
    try {
      // Tente d'abord la route publique
      const response = await api.get(endpoints.generatePublicReceipt(id));
      return response.data;
    } catch (error) {
      console.log('Generating receipt locally due to API error:', error);
      const payment = await paymentService.getPayment(id);
      const vehicleResponse = await api.get(`/vehicles/${payment.vehicle_id}`);
      const vehicle = vehicleResponse.data.data;
      const feeResponse = await api.get(`/vehicles/${payment.vehicle_id}/storage-fee`);
      const feeData = feeResponse.data;
      const { generateReceiptPDF } = await import('@/utils/receiptGenerator');
      const pdfUrl = await generateReceiptPDF({
        payment,
        vehicle,
        daysCount: feeData.days,
        dailyRate: feeData.daily_rate
      });
      return { receipt_url: pdfUrl };
    }
  },
  
  // Méthode pour envoyer le reçu par email
  sendReceiptByEmail: async (paymentId: string, email: string, pdfBase64?: string): Promise<void> => {
    const payload = {
      email,
      pdf_data: pdfBase64
    };
    
    await api.post(endpoints.sendReceiptByEmail(paymentId), payload);
  }
};

export default paymentService;
