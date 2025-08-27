import api, { endpoints } from './api';
import { Notification } from '@/types';
import { NotificationType, NotificationStatus, NotificationChannel } from '@/types/enums';

export interface NotificationFilters {
  status?: NotificationStatus;
  type?: NotificationType;
  page?: number;
  perPage?: number;
}

export interface NotificationCreateData {
  title: string;
  content: string;
  type: NotificationType;
  owner_id?: string;
  vehicle_id?: string;
  channel?: NotificationChannel;
}

export interface NotificationPaginatedResponse {
  data: Notification[];
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
 * Notification service for handling all notification-related API requests
 */
const notificationService = {
  /**
   * Get all notifications with optional filtering and pagination
   */
  getNotifications: async (filters?: NotificationFilters): Promise<NotificationPaginatedResponse> => {
    const response = await api.get(endpoints.notifications, { params: filters });
    return response.data;
  },

  /**
   * Get unread notification count
   */
  getUnreadCount: async (): Promise<{ count: number }> => {
    const response = await api.get('/notifications/unread-count');
    return response.data;
  },

  /**
   * Get a specific notification by ID
   */
  getNotification: async (id: string): Promise<Notification> => {
    const response = await api.get(`/notifications/${id}`);
    return response.data.data;
  },

  /**
   * Mark a notification as read
   */
  markAsRead: async (id: string): Promise<Notification> => {
    const response = await api.post(`/notifications/${id}/read`);
    return response.data.data;
  },

  /**
   * Mark all notifications as read
   */
  markAllAsRead: async (): Promise<void> => {
    await api.post('/notifications/mark-all-read');
  },

  /**
   * Send a new notification
   */
  sendNotification: async (notificationData: NotificationCreateData): Promise<Notification> => {
    const response = await api.post(endpoints.sendNotification, notificationData);
    return response.data.data;
  }
};

export default notificationService;
