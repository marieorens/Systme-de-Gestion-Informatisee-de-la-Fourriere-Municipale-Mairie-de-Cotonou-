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
  getPublicPayment: async (id: string): Promise<Payment> => {
    const response = await api.get(`/public/payments/${id}`);
    return response.data.data || response.data.payment || response.data;
  },
  createKkiapayPayment: async (data: {
    id: string;
    vehicle_id: string;
    amount: number;
    payment_method: string;
    description?: string;
  }): Promise<Payment> => {
    const response = await api.post('/public/payments/kkiapay', data);
    return response.data.payment;
  },
 
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
      const response = await api.get(endpoints.generatePublicReceipt(id));
      return response.data;
    } catch (error) {
      console.log('Generating receipt locally due to API error:', error);
  const payment = await paymentService.getPublicPayment(id);
      
      const vehicleResponse = await api.get(`/vehicles/${payment.vehicle_id}`);
      const vehicle = vehicleResponse.data.data;
      const feeResponse = await api.get(`/vehicles/${payment.vehicle_id}/storage-fee`);
      const feeData = feeResponse.data;
     
    
    }
  },
  
  sendReceiptByEmail: async (paymentId: string, email: string, pdfBase64?: string): Promise<void> => {
    const payload = {
      email,
      pdf_data: pdfBase64
    };
    
    await api.post(endpoints.sendReceiptByEmail(paymentId), payload);
  }
};

export default paymentService;
