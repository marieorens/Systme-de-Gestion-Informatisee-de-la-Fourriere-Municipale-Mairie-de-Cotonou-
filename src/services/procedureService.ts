import api, { endpoints } from './api';
import { Procedure } from '@/types';
import { ProcedureStatus, ProcedureType } from '@/types/enums';

export interface ProcedureCreateData {
  vehicle_id: string;
  type: ProcedureType;
  status?: ProcedureStatus;
  reference_number?: string;
  notes?: string;
  scheduled_date?: string;
}

export interface ProcedureUpdateData {
  type?: ProcedureType;
  status?: ProcedureStatus;
  reference_number?: string;
  notes?: string;
  scheduled_date?: string;
}

export interface ProcedureFilters {
  vehicle_id?: string;
  type?: ProcedureType;
  status?: ProcedureStatus;
  startDate?: string;
  endDate?: string;
  search?: string;
  page?: number;
  perPage?: number;
}

export interface ProcedureDocument {
  id: string;
  procedure_id: string;
  name: string;
  file_path: string;
  file_type: string;
  file_size: number;
  created_at: string;
  updated_at: string;
}

export interface ProcedurePaginatedResponse {
  data: Procedure[];
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

/**
 * Procedure service for handling all procedure-related API requests
 */
const procedureService = {
  /**
   * Get all procedures with optional filtering and pagination
   */
  getProcedures: async (filters?: ProcedureFilters): Promise<ProcedurePaginatedResponse> => {
    const response = await api.get(endpoints.procedures, { params: filters });
    return response.data;
  },

  /**
   * Get a specific procedure by ID
   */
  getProcedure: async (id: string): Promise<Procedure> => {
    const response = await api.get(endpoints.procedureById(id));
    return response.data.data;
  },

  /**
   * Create a new procedure
   */
  createProcedure: async (procedureData: ProcedureCreateData): Promise<Procedure> => {
    const response = await api.post(endpoints.procedures, procedureData);
    return response.data.data;
  },

  /**
   * Update an existing procedure
   */
  updateProcedure: async (id: string, procedureData: ProcedureUpdateData): Promise<Procedure> => {
    const response = await api.put(endpoints.procedureById(id), procedureData);
    return response.data.data;
  },

  /**
   * Delete a procedure
   */
  deleteProcedure: async (id: string): Promise<void> => {
    await api.delete(endpoints.procedureById(id));
  },

  /**
   * Get documents for a procedure
   */
  getProcedureDocuments: async (id: string): Promise<ProcedureDocument[]> => {
    const response = await api.get(endpoints.procedureDocuments(id));
    return response.data.data;
  },

  /**
   * Upload documents for a procedure
   */
  uploadProcedureDocuments: async (id: string, documents: File[]): Promise<ProcedureDocument[]> => {
    const formData = new FormData();
    documents.forEach((document) => {
      formData.append('documents[]', document);
    });

    const response = await api.post(endpoints.procedureDocuments(id), formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });

    return response.data.documents;
  },

  /**
   * Delete a procedure document
   */
  deleteProcedureDocument: async (procedureId: string, documentId: string): Promise<void> => {
    await api.delete(`/procedures/${procedureId}/documents/${documentId}`);
  }
};

export default procedureService;
