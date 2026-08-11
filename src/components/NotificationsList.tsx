import React, { useState, useEffect } from 'react';
import { notificationService, type Notification } from '../services/notificationService';

const NotificationsList: React.FC = () => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<'all' | 'unread' | 'read'>('all');

  useEffect(() => {
    loadNotifications();
  }, [filter]);

  const loadNotifications = async () => {
    try {
      setLoading(true);
      const isRead = filter === 'read' ? true : filter === 'unread' ? false : undefined;
      const data = await notificationService.getNotifications({ is_read: isRead });
      setNotifications(data);
    } catch (err: any) {
      setError(err.response?.data?.detail || 'بارگذاری اعلان‌ها ناموفق بود');
    } finally {
      setLoading(false);
    }
  };

  const handleMarkAsRead = async (id: number) => {
    try {
      await notificationService.markAsRead(id);
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, is_read: true } : n))
      );
    } catch (err: any) {
      console.error('Failed to mark notification as read:', err);
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      await notificationService.markAllAsRead();
      setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
    } catch (err: any) {
      console.error('Failed to mark all as read:', err);
    }
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'TASK_ASSIGNED': return '📋';
      case 'PROJECT_UPDATE': return '📁';
      case 'COMMENT': return '💬';
      case 'MENTION': return '@';
      case 'TEAM_INVITE': return '👥';
      case 'STATUS_CHANGE': return '🔄';
      default: return '🔔';
    }
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'همین الان';
    if (diffMins < 60) return `${diffMins} دقیقه پیش`;
    if (diffHours < 24) return `${diffHours} ساعت پیش`;
    if (diffDays < 7) return `${diffDays} روز پیش`;
    return date.toLocaleDateString('fa-IR');
  };

  if (loading) {
    return <div className="page-loading">در حال بارگذاری اعلان‌ها...</div>;
  }

  return (
    <div className="notifications-page">
      <div className="page-header">
        <div className="header-left">
          <h1>اعلان‌ها</h1>
          <p className="page-subtitle">از فعالیت‌های خود به‌روز بمانید</p>
        </div>
        <div className="header-actions">
          {notifications.some((n) => !n.is_read) && (
            <button className="btn-secondary" onClick={handleMarkAllAsRead}>
              علامت‌گذاری همه به‌عنوان خوانده‌شده
            </button>
          )}
        </div>
      </div>

      <div className="tabs">
        <button
          className={`tab ${filter === 'all' ? 'active' : ''}`}
          onClick={() => setFilter('all')}
        >
          همه
        </button>
        <button
          className={`tab ${filter === 'unread' ? 'active' : ''}`}
          onClick={() => setFilter('unread')}
        >
          خوانده‌نشده
        </button>
        <button
          className={`tab ${filter === 'read' ? 'active' : ''}`}
          onClick={() => setFilter('read')}
        >
          خوانده‌شده
        </button>
      </div>

      {error && <div className="error-message">{error}</div>}

      {notifications.length === 0 ? (
        <div className="empty-notifications">
          <div className="empty-icon">🔔</div>
          <h3>اعلانی وجود ندارد</h3>
          <p>همه چیز به‌روز است!</p>
        </div>
      ) : (
        <div className="notifications-list">
          {notifications.map((notification) => (
            <div
              key={notification.id}
              className={`notification-card ${!notification.is_read ? 'unread' : ''}`}
            >
              <div className="notification-icon">
                {getNotificationIcon(notification.notification_type)}
              </div>
              <div className="notification-content">
                <h4 className="notification-title">{notification.title}</h4>
                <p className="notification-message">{notification.message}</p>
                <span className="notification-time">{formatTime(notification.created_at)}</span>
              </div>
              <div className="notification-actions">
                {!notification.is_read && (
                  <button
                    className="mark-read-btn"
                    onClick={() => handleMarkAsRead(notification.id)}
                  >
                    علامت به‌عنوان خوانده‌شده
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default NotificationsList;
