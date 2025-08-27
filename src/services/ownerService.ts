import api, { endpoints } from './api';
import { Owner, Vehicle } from '@/types';
import { IdType } from '@/types/enums';

export interface OwnerCreateData {
  first_name: string;
  last_name: string;
  phone: string;
  email?: string;
  address?: string;
  id_type?: IdType;
  id_number?: string;
}

export interface OwnerUpdateData extends Partial<OwnerCreateData> {}

export interface OwnerFilters {
  search?: string;
  page?: number;
  perPage?: number;
}

export interface OwnerPaginatedResponse {
  data: Owner[];
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
 * Owner service for handling all owner-related API requests
 */
const ownerService = {
  /**
   * Get all owners with optional filtering and pagination
   */
  getOwners: async (filters?: OwnerFilters): Promise<OwnerPaginatedResponse> => {
    const response = await api.get(endpoints.owners, { params: filters });
    return response.data;
  },

  /**
   * Get a specific owner by ID
   */
  getOwner: async (id: string): Promise<Owner> => {
    const response = await api.get(endpoints.ownerById(id));
    return response.data.data;
  },

  /**
   * Get vehicles belonging to an owner
   */
  getOwnerVehicles: async (id: string): Promise<Vehicle[]> => {
    const response = await api.get(endpoints.ownerVehicles(id));
    return response.data.data;
  },

  /**
   * Create a new owner
   */
  createOwner: async (ownerData: OwnerCreateData): Promise<Owner> => {
    const response = await api.post(endpoints.owners, ownerData);
    return response.data.data;
  },

  /**
   * Update an existing owner
   */
  updateOwner: async (id: string, ownerData: OwnerUpdateData): Promise<Owner> => {
    const response = await api.put(endpoints.ownerById(id), ownerData);
    return response.data.data;
  },

  /**
   * Delete an owner
   */
  deleteOwner: async (id: string): Promise<void> => {
    await api.delete(endpoints.ownerById(id));
  }
};

export default ownerService;
