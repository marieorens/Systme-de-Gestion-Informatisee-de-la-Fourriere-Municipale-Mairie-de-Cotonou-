import api, { endpoints } from './api';
import { User } from '@/types';
import { UserRole } from '@/types/enums';

export interface UserCreateData {
  name: string;
  email: string;
  password: string;
  password_confirmation: string;
  role: UserRole;
  phone?: string;
}

export interface UserUpdateData {
  name?: string;
  email?: string;
  password?: string;
  password_confirmation?: string;
  role?: UserRole;
  phone?: string;
  is_active?: boolean;
}

export interface UserFilters {
  role?: UserRole;
  search?: string;
  page?: number;
  perPage?: number;
}

export interface UserPaginatedResponse {
  data: User[];
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
 * User service for handling all user-related API requests (admin only)
 */
const userService = {
  /**
   * Get all users with optional filtering and pagination
   */
  getUsers: async (filters?: UserFilters): Promise<UserPaginatedResponse> => {
    const response = await api.get(endpoints.users, { params: filters });
    return response.data;
  },

  /**
   * Get a specific user by ID
   */
  getUser: async (id: string): Promise<User> => {
    const response = await api.get(endpoints.userById(id));
    return response.data.data;
  },

  /**
   * Create a new user
   */
  createUser: async (userData: UserCreateData): Promise<User> => {
    const response = await api.post(endpoints.users, userData);
    return response.data.data;
  },

  /**
   * Update an existing user
   */
  updateUser: async (id: string, userData: UserUpdateData): Promise<User> => {
    const response = await api.put(endpoints.userById(id), userData);
    return response.data.data;
  },

  /**
   * Delete a user
   */
  deleteUser: async (id: string): Promise<void> => {
    await api.delete(endpoints.userById(id));
  },

  /**
   * Toggle user active status
   */
  toggleActive: async (id: string): Promise<User> => {
    const response = await api.patch(endpoints.toggleUserActive(id));
    return response.data.data;
  },

  /**
   * Get available roles
   */
  getRoles: async (): Promise<UserRole[]> => {
    const response = await api.get(endpoints.roles);
    return response.data.roles;
  }
};

export default userService;
