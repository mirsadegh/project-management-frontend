import api from './api';
import { unwrapList } from './pagination';

export interface Notification {
  id: number;
  recipient: number;
  sender?: number | null;
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

export interface NotificationPreference {
  id: number;
  notification_type: string;
  in_app_enabled: boolean;
  email_enabled: boolean;
  push_enabled: boolean;
  created_at: string;
  updated_at: string;
}

export interface NotificationTemplate {
  id: number;
  notification_type: string;
  title_template: string;
  message_template: string;
  email_subject_template: string;
  is_active: boolean;
}

export interface NotificationStatistics {
  total_notifications: number;
  unread_count: number;
  by_type: Record<string, number>;
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

    const query = params.toString();
    const response = await api.get<Notification[] | { results: Notification[] }>(
      `/notifications/${query ? `?${query}` : ''}`
    );
    return unwrapList(response.data);
  },

  async getNotification(notificationId: number): Promise<Notification> {
    const response = await api.get<Notification>(`/notifications/${notificationId}/`);
    return response.data;
  },

  async getUnreadCount(): Promise<number> {
    const response = await api.get<{ unread_count?: number; count?: number }>(
      '/notifications/unread_count/'
    );
    return response.data.unread_count ?? response.data.count ?? 0;
  },

  async getStatistics(): Promise<NotificationStatistics> {
    const response = await api.get<NotificationStatistics>('/notifications/statistics/');
    return response.data;
  },

  async markAsRead(notificationId: number): Promise<Notification> {
    const response = await api.post<Notification>(`/notifications/${notificationId}/mark_read/`);
    return response.data;
  },

  async markAllAsRead(): Promise<{ updated: number }> {
    const response = await api.post<{ updated: number }>('/notifications/mark_all_read/');
    return response.data;
  },

  async deleteNotification(notificationId: number): Promise<void> {
    await api.delete(`/notifications/${notificationId}/`);
  },

  async getPreferences(): Promise<NotificationPreference[]> {
    const response = await api.get<NotificationPreference[] | { results: NotificationPreference[] }>(
      '/notifications/preferences/'
    );
    return unwrapList(response.data);
  },

  async updatePreference(
    preferenceId: number,
    data: Partial<Pick<NotificationPreference, 'in_app_enabled' | 'email_enabled' | 'push_enabled'>>
  ): Promise<NotificationPreference> {
    const response = await api.patch<NotificationPreference>(
      `/notifications/preferences/${preferenceId}/`,
      data
    );
    return response.data;
  },

  async createPreference(
    data: Pick<NotificationPreference, 'notification_type' | 'in_app_enabled' | 'email_enabled' | 'push_enabled'>
  ): Promise<NotificationPreference> {
    const response = await api.post<NotificationPreference>('/notifications/preferences/', data);
    return response.data;
  },

  async deletePreference(preferenceId: number): Promise<void> {
    await api.delete(`/notifications/preferences/${preferenceId}/`);
  },

  async getTemplates(): Promise<NotificationTemplate[]> {
    const response = await api.get<NotificationTemplate[] | { results: NotificationTemplate[] }>(
      '/notifications/templates/'
    );
    return unwrapList(response.data);
  },
};
