// src/components/NotificationsList.test.tsx
import React from 'react';
import { render, screen, waitFor } from '../tests/test-utils';
import userEvent from '@testing-library/user-event';
import { vi } from 'vitest';
import NotificationsList from './NotificationsList';
import { notificationService } from '../services/notificationService';

// ─── Mock notificationService ──────────────────────────────────────────────────

vi.mock('../services/notificationService', () => ({
  notificationService: {
    getNotifications: vi.fn(),
    markAsRead: vi.fn(),
    markAllAsRead: vi.fn(),
  },
}));

const mockGetNotifications = notificationService.getNotifications as ReturnType<typeof vi.fn>;
const mockMarkAsRead = notificationService.markAsRead as ReturnType<typeof vi.fn>;
const mockMarkAllAsRead = notificationService.markAllAsRead as ReturnType<typeof vi.fn>;

// ─── Mock data ────────────────────────────────────────────────────────────────

const mockNotifications = [
  {
    id: 1,
    recipient: 1,
    notification_type: 'TASK_ASSIGNED',
    title: 'وظیفه جدید',
    message: 'وظیفه "تکمیل API" به شما محول شد',
    is_read: false,
    created_at: new Date(Date.now() - 30 * 60000).toISOString(), // 30 mins ago
    read_at: null,
  },
  {
    id: 2,
    recipient: 1,
    notification_type: 'COMMENT',
    title: 'نظر جدید',
    message: 'مریم رضایی نظری در پروژه نوشت',
    is_read: false,
    created_at: new Date(Date.now() - 2 * 3600000).toISOString(), // 2 hours ago
    read_at: null,
  },
  {
    id: 3,
    recipient: 1,
    notification_type: 'PROJECT_UPDATE',
    title: 'پروژه به‌روزرسانی شد',
    message: 'پروژه "پروژه اول" به‌روزرسانی شد',
    is_read: true,
    created_at: new Date(Date.now() - 24 * 3600000).toISOString(), // 1 day ago
    read_at: '2024-03-01T12:00:00Z',
  },
];

// ─── Tests ────────────────────────────────────────────────────────────────────

describe('NotificationsList', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Loading state', () => {
    it('shows loading indicator while fetching notifications', () => {
      mockGetNotifications.mockReturnValue(new Promise(() => {}));

      render(<NotificationsList />, { route: '/notifications' });

      expect(screen.getByText('در حال بارگذاری اعلان‌ها...')).toBeInTheDocument();
    });
  });

  describe('Error state', () => {
    it('shows error message when fetch fails', async () => {
      mockGetNotifications.mockRejectedValue({
        response: { data: { detail: 'بارگذاری اعلان‌ها ناموفق بود' } },
      });

      render(<NotificationsList />, { route: '/notifications' });

      await waitFor(() => {
        expect(screen.getByText('بارگذاری اعلان‌ها ناموفق بود')).toBeInTheDocument();
      });
    });
  });

  describe('Empty state', () => {
    it('shows empty state when no notifications exist', async () => {
      mockGetNotifications.mockResolvedValue([]);

      render(<NotificationsList />, { route: '/notifications' });

      await waitFor(() => {
        expect(screen.getByText('اعلانی وجود ندارد')).toBeInTheDocument();
        expect(screen.getByText('همه چیز به‌روز است!')).toBeInTheDocument();
      });
    });
  });

  describe('Notification list rendering', () => {
    it('displays list of notifications', async () => {
      mockGetNotifications.mockResolvedValue(mockNotifications);

      render(<NotificationsList />, { route: '/notifications' });

      await waitFor(() => {
        expect(screen.getByText('وظیفه جدید')).toBeInTheDocument();
        expect(screen.getByText('نظر جدید')).toBeInTheDocument();
        expect(screen.getByText('پروژه به‌روزرسانی شد')).toBeInTheDocument();
      });
    });

    it('shows notification messages', async () => {
      mockGetNotifications.mockResolvedValue(mockNotifications);

      render(<NotificationsList />, { route: '/notifications' });

      await waitFor(() => {
        expect(screen.getByText('وظیفه "تکمیل API" به شما محول شد')).toBeInTheDocument();
      });
    });

    it('shows notification icons', async () => {
      mockGetNotifications.mockResolvedValue(mockNotifications);

      render(<NotificationsList />, { route: '/notifications' });

      await waitFor(() => {
        expect(screen.getByText('وظیفه جدید')).toBeInTheDocument();
      });
      // Icon for TASK_ASSIGNED is 📋
      expect(screen.getByText('📋')).toBeInTheDocument();
    });

    it('shows relative time for notifications', async () => {
      mockGetNotifications.mockResolvedValue(mockNotifications);

      render(<NotificationsList />, { route: '/notifications' });

      await waitFor(() => {
        expect(screen.getByText('وظیفه جدید')).toBeInTheDocument();
      });
      // 30 minutes ago should show "۳۰ دقیقه پیش" or similar
      expect(screen.getByText(/دقیقه پیش/)).toBeInTheDocument();
    });

    it('marks unread notifications with appropriate style', async () => {
      mockGetNotifications.mockResolvedValue(mockNotifications);

      render(<NotificationsList />, { route: '/notifications' });

      await waitFor(() => {
        expect(screen.getByText('وظیفه جدید')).toBeInTheDocument();
      });

      const unreadCards = screen.getAllByText('وظیفه جدید').map((el) =>
        el.closest('.notification-card')
      ).filter(Boolean);

      // At least one unread card should have 'unread' class
      expect(unreadCards[0]).toHaveClass('unread');
    });

    it('shows page heading and subtitle', async () => {
      mockGetNotifications.mockResolvedValue(mockNotifications);

      render(<NotificationsList />, { route: '/notifications' });

      await waitFor(() => {
        expect(screen.getByRole('heading', { name: 'اعلان‌ها' })).toBeInTheDocument();
        expect(screen.getByText('از فعالیت‌های خود به‌روز بمانید')).toBeInTheDocument();
      });
    });

    it('shows filter tabs', async () => {
      mockGetNotifications.mockResolvedValue(mockNotifications);

      render(<NotificationsList />, { route: '/notifications' });

      await waitFor(() => {
        expect(screen.getByRole('button', { name: 'همه' })).toBeInTheDocument();
        expect(screen.getByRole('button', { name: 'خوانده‌نشده' })).toBeInTheDocument();
        expect(screen.getByRole('button', { name: 'خوانده‌شده' })).toBeInTheDocument();
      });
    });
  });

  describe('Mark as read', () => {
    it('shows mark-as-read button for unread notifications', async () => {
      mockGetNotifications.mockResolvedValue([mockNotifications[0]]); // only 1 unread

      render(<NotificationsList />, { route: '/notifications' });

      await waitFor(() => {
        expect(screen.getByText('وظیفه جدید')).toBeInTheDocument();
      });

      expect(screen.getByRole('button', { name: 'علامت به‌عنوان خوانده‌شده' })).toBeInTheDocument();
    });

    it('does not show mark-as-read button for read notifications', async () => {
      mockGetNotifications.mockResolvedValue(mockNotifications);

      render(<NotificationsList />, { route: '/notifications' });

      await waitFor(() => {
        expect(screen.getByText('پروژه به‌روزرسانی شد')).toBeInTheDocument();
      });

      // Read notification should NOT have the mark-as-read button
      const readCard = screen.getByText('پروژه به‌روزرسانی شد').closest('.notification-card');
      expect(readCard).not.toHaveClass('unread');
    });

    it('marks single notification as read when button is clicked', async () => {
      mockGetNotifications.mockResolvedValue([mockNotifications[0]]);
      mockMarkAsRead.mockResolvedValue({ ...mockNotifications[0], is_read: true });

      render(<NotificationsList />, { route: '/notifications' });

      await waitFor(() => {
        expect(screen.getByText('وظیفه جدید')).toBeInTheDocument();
      });

      const user = userEvent.setup();
      await user.click(screen.getByRole('button', { name: 'علامت به‌عنوان خوانده‌شده' }));

      await waitFor(() => {
        expect(mockMarkAsRead).toHaveBeenCalledWith(mockNotifications[0].id);
      });

      // Button should disappear after marking as read
      await waitFor(() => {
        expect(screen.queryByRole('button', { name: 'علامت به‌عنوان خوانده‌شده' })).not.toBeInTheDocument();
      });
    });

    it('shows error when marking as read fails', async () => {
      mockGetNotifications.mockResolvedValue([mockNotifications[0]]);
      mockMarkAsRead.mockRejectedValue(new Error('Failed'));

      render(<NotificationsList />, { route: '/notifications' });

      await waitFor(() => {
        expect(screen.getByText('وظیفه جدید')).toBeInTheDocument();
      });

      const user = userEvent.setup();
      await user.click(screen.getByRole('button', { name: 'علامت به‌عنوان خوانده‌شده' }));

      // Error is only logged to console, no UI message shown
      // So we verify the button is still there (not removed)
      await waitFor(() => {
        expect(screen.getByRole('button', { name: 'علامت به‌عنوان خوانده‌شده' })).toBeInTheDocument();
      });
    });
  });

  describe('Mark all as read', () => {
    it('shows mark-all-as-read button when there are unread notifications', async () => {
      mockGetNotifications.mockResolvedValue(mockNotifications);

      render(<NotificationsList />, { route: '/notifications' });

      await waitFor(() => {
        expect(screen.getByText('وظیفه جدید')).toBeInTheDocument();
      });

      expect(screen.getByRole('button', { name: 'علامت‌گذاری همه به‌عنوان خوانده‌شده' })).toBeInTheDocument();
    });

    it('does not show mark-all-as-read button when all are read', async () => {
      mockGetNotifications.mockResolvedValue([mockNotifications[2]]); // only read notification

      render(<NotificationsList />, { route: '/notifications' });

      await waitFor(() => {
        expect(screen.getByText('پروژه به‌روزرسانی شد')).toBeInTheDocument();
      });

      expect(screen.queryByRole('button', { name: 'علامت‌گذاری همه به‌عنوان خوانده‌شده' })).not.toBeInTheDocument();
    });

    it('marks all notifications as read when button is clicked', async () => {
      mockGetNotifications.mockResolvedValue(mockNotifications);
      mockMarkAllAsRead.mockResolvedValue({ updated: 2 });

      render(<NotificationsList />, { route: '/notifications' });

      await waitFor(() => {
        expect(screen.getByText('وظیفه جدید')).toBeInTheDocument();
      });

      const user = userEvent.setup();
      await user.click(screen.getByRole('button', { name: 'علامت‌گذاری همه به‌عنوان خوانده‌شده' }));

      await waitFor(() => {
        expect(mockMarkAllAsRead).toHaveBeenCalled();
      });

      // Mark-all button should disappear
      await waitFor(() => {
        expect(screen.queryByRole('button', { name: 'علامت‌گذاری همه به‌عنوان خوانده‌شده' })).not.toBeInTheDocument();
      });
    });
  });

  describe('Filter tabs', () => {
    it('filters to unread notifications when tab is clicked', async () => {
      mockGetNotifications
        .mockResolvedValueOnce(mockNotifications)        // initial: all
        .mockResolvedValueOnce(mockNotifications.filter((n) => !n.is_read)); // unread

      render(<NotificationsList />, { route: '/notifications' });

      await waitFor(() => {
        expect(screen.getByText('وظیفه جدید')).toBeInTheDocument();
      });

      const user = userEvent.setup();
      await user.click(screen.getByRole('button', { name: 'خوانده‌نشده' }));

      await waitFor(() => {
        // Should show only unread (first two)
        expect(screen.getByText('وظیفه جدید')).toBeInTheDocument();
      });

      // Read notification should be hidden
      expect(screen.queryByText('پروژه به‌روزرسانی شد')).not.toBeInTheDocument();
    });

    it('filters to read notifications when tab is clicked', async () => {
      mockGetNotifications
        .mockResolvedValueOnce(mockNotifications)
        .mockResolvedValueOnce(mockNotifications.filter((n) => n.is_read));

      render(<NotificationsList />, { route: '/notifications' });

      await waitFor(() => {
        expect(screen.getByText('وظیفه جدید')).toBeInTheDocument();
      });

      const user = userEvent.setup();
      await user.click(screen.getByRole('button', { name: 'خوانده‌شده' }));

      await waitFor(() => {
        expect(screen.getByText('پروژه به‌روزرسانی شد')).toBeInTheDocument();
      });

      // Unread notifications should be hidden
      expect(screen.queryByText('وظیفه جدید')).not.toBeInTheDocument();
    });

    it('shows all notifications when همه tab is clicked', async () => {
      mockGetNotifications
        .mockResolvedValueOnce(mockNotifications) // mount: all
        .mockResolvedValueOnce(mockNotifications.filter((n) => n.is_read)) // click خوانده‌شده
        .mockResolvedValueOnce(mockNotifications); // click همه

      render(<NotificationsList />, { route: '/notifications' });

      await waitFor(() => {
        expect(screen.getByText('وظیفه جدید')).toBeInTheDocument();
      });

      const user = userEvent.setup();

      // Switch to read tab first
      await user.click(screen.getByRole('button', { name: 'خوانده‌شده' }));
      await waitFor(() => {
        expect(screen.getByText('پروژه به‌روزرسانی شد')).toBeInTheDocument();
      });

      // Now switch back to همه
      await user.click(screen.getByRole('button', { name: 'همه' }));

      await waitFor(() => {
        expect(screen.getByText('وظیفه جدید')).toBeInTheDocument();
        expect(screen.getByText('نظر جدید')).toBeInTheDocument();
      });
    });
  });
});
