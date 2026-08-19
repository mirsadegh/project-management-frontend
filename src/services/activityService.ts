import api from './api';
import { unwrapList } from './pagination';

export interface ActivityUser {
  id: number;
  username: string;
  full_name?: string;
  email?: string;
}

export interface ActivityLog {
  id: number;
  user: ActivityUser;
  action: string;
  description: string;
  content_type: number | null;
  content_type_name?: string;
  object_id: number | null;
  changes?: Record<string, unknown> | null;
  ip_address?: string | null;
  created_at: string;
}

export interface ActivityFeedItem {
  id: number;
  activity: ActivityLog;
  is_read: boolean;
  is_important: boolean;
  created_at: string;
}

export interface ActivityLogFilters {
  content_type?: string;
  object_id?: number;
  action?: string;
  user_id?: number;
}

export const activityService = {
  async getActivityLogs(filters?: ActivityLogFilters): Promise<ActivityLog[]> {
    const response = await api.get<ActivityLog[] | { results: ActivityLog[] }>(
      '/activity/activity-logs/',
      { params: filters }
    );
    return unwrapList(response.data);
  },

  async getActivityLog(id: number): Promise<ActivityLog> {
    const response = await api.get<ActivityLog>(`/activity/activity-logs/${id}/`);
    return response.data;
  },

  async getMyActivity(): Promise<ActivityLog[]> {
    const response = await api.get<ActivityLog[] | { results: ActivityLog[] }>(
      '/activity/activity-logs/my_activity/'
    );
    return unwrapList(response.data);
  },

  async getRecentActivity(): Promise<ActivityLog[]> {
    const response = await api.get<ActivityLog[] | { results: ActivityLog[] }>(
      '/activity/activity-logs/recent/'
    );
    return unwrapList(response.data);
  },

  async getFeed(): Promise<ActivityFeedItem[]> {
    const response = await api.get<ActivityFeedItem[] | { results: ActivityFeedItem[] }>(
      '/activity/activity-feed/'
    );
    return unwrapList(response.data);
  },

  async getFeedItem(id: number): Promise<ActivityFeedItem> {
    const response = await api.get<ActivityFeedItem>(`/activity/activity-feed/${id}/`);
    return response.data;
  },

  async markFeedItemRead(id: number): Promise<void> {
    await api.post(`/activity/activity-feed/${id}/mark_read/`);
  },

  async markAllFeedRead(): Promise<{ message: string }> {
    const response = await api.post<{ message: string }>('/activity/activity-feed/mark_all_read/');
    return response.data;
  },

  async getUnreadFeedCount(): Promise<number> {
    const response = await api.get<{ unread_count: number }>('/activity/activity-feed/unread_count/');
    return response.data.unread_count;
  },
};
