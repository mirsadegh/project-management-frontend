import api from './api';

export interface Notification {
  id: number;
  recipient: number;
  notification_type: string;
  title: string;
  message: string;
  is_read: boolean;
  created_at: string;
  read_at: string | null;
}

export interface NotificationFilters {
  is_read?: boolean;
  notification_type?: string;
}

export const notificationService = {
  async getNotifications(filters?: NotificationFilters): Promise<Notification[]> {
    const params = new URLSearchParams();
    if (filters?.is_read !== undefined) {
      params.append('is_read', filters.is_read.toString());
    }
    if (filters?.notification_type) {
      params.append('notification_type', filters.notification_type);
    }
    
    const response = await api.get<Notification[]>(`/notifications/?${params.toString()}`);
    return response.data;
  },

  async getUnreadCount(): Promise<number> {
    const response = await api.get<{ count: number }>('/notifications/unread-count/');
    return response.data.count;
  },

  async markAsRead(notificationId: number): Promise<void> {
    await api.post(`/notifications/${notificationId}/mark_as_read/`);
  },

  async markAllAsRead(): Promise<void> {
    await api.post('/notifications/mark_all_as_read/');
  },

  async deleteNotification(notificationId: number): Promise<void> {
    await api.delete(`/notifications/${notificationId}/`);
  },
};
