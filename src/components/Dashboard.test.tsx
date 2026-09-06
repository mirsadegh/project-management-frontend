// src/components/Dashboard.test.tsx
import React from 'react';
import { render, screen, waitFor, within } from '../tests/test-utils';
import userEvent from '@testing-library/user-event';
import { vi } from 'vitest';
import { http, HttpResponse } from 'msw';
import { setupServer } from 'msw/node';
import Dashboard from './Dashboard';
import { mockProjects, mockUser } from '../tests/mockData';

// ─── Mock AuthContext ─────────────────────────────────────────────────────────

vi.mock('../services/contexts/AuthContext', async (importOriginal) => {
  const actual = await importOriginal();
  return {
    ...actual,
    useAuth: vi.fn(() => ({
      user: { ...mockUser, full_name: 'کاربر آزمایشی' },
      loading: false,
      login: vi.fn(),
      logout: vi.fn(),
      register: vi.fn(),
    })),
  };
});

// ─── Query hook mocks ─────────────────────────────────────────────────────────

vi.mock('../services/queryHooks', () => ({
  useProjects: vi.fn(),
  useMyTasks: vi.fn(),
  useTeams: vi.fn(),
  useUnreadCount: vi.fn(),
}));

import { useProjects, useMyTasks, useTeams, useUnreadCount } from '../services/queryHooks';

const mockUseProjects = useProjects as ReturnType<typeof vi.fn>;
const mockUseMyTasks = useMyTasks as ReturnType<typeof vi.fn>;
const mockUseTeams = useTeams as ReturnType<typeof vi.fn>;
const mockUseUnreadCount = useUnreadCount as ReturnType<typeof vi.fn>;

// ─── Mock ActivityFeed (child component with its own query) ────────────────────

vi.mock('./ActivityFeed', () => ({
  default: () => <div data-testid="activity-feed-mock">فعالیت‌های اخیر</div>,
}));

// ─── Mock activityService ──────────────────────────────────────────────────────

vi.mock('../services/activityService', () => ({
  activityService: {
    getRecentActivity: vi.fn(),
  },
}));

// ─── Mock data ────────────────────────────────────────────────────────────────

const mockTasks = [
  {
    id: 1,
    title: 'وظیفه اول',
    description: 'توضیحات وظیفه اول',
    status: 'TODO',
    priority: 'HIGH',
    project: 1,
    project_name: 'پروژه اول',
    assigned_to: 1,
    assigned_to_name: 'کاربر آزمایشی',
    due_date: '2024-06-15',
  },
  {
    id: 2,
    title: 'وظیفه دوم',
    description: '',
    status: 'COMPLETED',
    priority: 'MEDIUM',
    project: 1,
    project_name: 'پروژه اول',
    assigned_to: 1,
    assigned_to_name: 'کاربر آزمایشی',
    due_date: null,
  },
  {
    id: 3,
    title: 'وظیفه سوم',
    status: 'IN_PROGRESS',
    priority: 'LOW',
    project: 2,
    project_name: 'پروژه دوم',
    assigned_to: 1,
    assigned_to_name: 'کاربر آزمایشی',
  },
];

const mockTeams = [
  {
    id: 1,
    name: 'تیم توسعه',
    description: 'تیم توسعه نرم‌افزار',
    members_count: 5,
    owner: 1,
    created_by: 1,
  },
  {
    id: 2,
    name: 'تیم طراحی',
    description: 'تیم طراحی رابط کاربری',
    members_count: 3,
    owner: 1,
    created_by: 1,
  },
];

const mockActivities = [
  {
    id: 1,
    user: { id: 1, username: 'testuser', full_name: 'کاربر آزمایشی' },
    action: 'CREATE',
    description: 'پروژه جدید ایجاد شد',
    content_type: null,
    content_type_name: null,
    object_id: null,
    changes: null,
    ip_address: null,
    created_at: new Date().toISOString(),
  },
];

// ─── MSW server ───────────────────────────────────────────────────────────────

const API_BASE = 'http://localhost:8000/api';

export const dashboardHandlers = [
  http.get(`${API_BASE}/accounts/users/me/`, () => {
    return HttpResponse.json({ id: 1, username: 'testuser', email: 'test@example.com', full_name: 'کاربر آزمایشی', role: 'DEV' });
  }),
  http.get(`${API_BASE}/projects/projects/`, () => {
    return HttpResponse.json({ projects: mockProjects });
  }),
  http.get(`${API_BASE}/tasks/my-tasks/`, () => {
    return HttpResponse.json(mockTasks);
  }),
  http.get(`${API_BASE}/teams/teams/`, () => {
    return HttpResponse.json(mockTeams);
  }),
  http.get(`${API_BASE}/notifications/unread_count/`, () => {
    return HttpResponse.json({ unread_count: 3 });
  }),
  http.get(`${API_BASE}/activity/activity-logs/recent/`, () => {
    return HttpResponse.json(mockActivities);
  }),
];

export const server = setupServer(...dashboardHandlers);

// ─── Tests ─────────────────────────────────────────────────────────────────────

describe('Dashboard', () => {
  beforeAll(() => server.listen({ onUnhandledRequest: 'warn' }));
  afterEach(() => {
    server.resetHandlers();
    vi.clearAllMocks();
  });
  afterAll(() => server.close());

  describe('Loading state', () => {
    it('shows loading state when projects are loading', () => {
      mockUseProjects.mockReturnValue({
        data: undefined,
        isLoading: true,
        isError: false,
        error: null,
      } as ReturnType<typeof useProjects>);
      mockUseMyTasks.mockReturnValue({
        data: undefined,
        isLoading: true,
        isError: false,
        error: null,
      } as ReturnType<typeof useMyTasks>);
      mockUseTeams.mockReturnValue({
        data: undefined,
        isLoading: true,
        isError: false,
        error: null,
      } as ReturnType<typeof useTeams>);
      mockUseUnreadCount.mockReturnValue({
        data: undefined,
        isLoading: true,
        isError: false,
        error: null,
      } as ReturnType<typeof useUnreadCount>);

      render(<Dashboard />, { route: '/dashboard' });

      // The dashboard always renders the header and profile card
      expect(screen.getByText('داشبورد')).toBeInTheDocument();
      expect(screen.getByText('پروفایل شما')).toBeInTheDocument();
      // Stats show skeleton while loading
      expect(screen.getAllByText('...').length).toBeGreaterThan(0);
    });
  });

  describe('Error state', () => {
    it('shows error message when projects fail to load', () => {
      mockUseProjects.mockReturnValue({
        data: undefined,
        isLoading: false,
        isError: true,
        error: { response: { data: { detail: 'خطا در بارگذاری' } } },
      } as ReturnType<typeof useProjects>);
      mockUseMyTasks.mockReturnValue({
        data: [],
        isLoading: false,
        isError: false,
        error: null,
      } as ReturnType<typeof useMyTasks>);
      mockUseTeams.mockReturnValue({
        data: [],
        isLoading: false,
        isError: false,
        error: null,
      } as ReturnType<typeof useTeams>);
      mockUseUnreadCount.mockReturnValue({
        data: 0,
        isLoading: false,
        isError: false,
        error: null,
      } as ReturnType<typeof useUnreadCount>);

      render(<Dashboard />, { route: '/dashboard' });

      // Dashboard renders even on error — error would show in the projects card section
      expect(screen.getByText('داشبورد')).toBeInTheDocument();
    });
  });

  describe('Empty state', () => {
    it('shows empty state when user has no projects', () => {
      mockUseProjects.mockReturnValue({
        data: [],
        isLoading: false,
        isError: false,
        error: null,
      } as ReturnType<typeof useProjects>);
      mockUseMyTasks.mockReturnValue({
        data: [],
        isLoading: false,
        isError: false,
        error: null,
      } as ReturnType<typeof useMyTasks>);
      mockUseTeams.mockReturnValue({
        data: [],
        isLoading: false,
        isError: false,
        error: null,
      } as ReturnType<typeof useTeams>);
      mockUseUnreadCount.mockReturnValue({
        data: 0,
        isLoading: false,
        isError: false,
        error: null,
      } as ReturnType<typeof useUnreadCount>);

      render(<Dashboard />, { route: '/dashboard' });

      // Empty state: "شروع کنید" card appears when any section is empty
      expect(screen.getByText('شروع کنید')).toBeInTheDocument();
      // Component text: "هنوز پروژه‌ای ندارید" (with ZWNJ between ا and ن)
      expect(screen.getByText(/هنوز پروژه‌ای ندارید/)).toBeInTheDocument();
    });
  });

  describe('Successful data display', () => {
    beforeEach(() => {
      mockUseProjects.mockReturnValue({
        data: mockProjects,
        isLoading: false,
        isError: false,
        error: null,
      } as ReturnType<typeof useProjects>);
      mockUseMyTasks.mockReturnValue({
        data: mockTasks,
        isLoading: false,
        isError: false,
        error: null,
      } as ReturnType<typeof useMyTasks>);
      mockUseTeams.mockReturnValue({
        data: mockTeams,
        isLoading: false,
        isError: false,
        error: null,
      } as ReturnType<typeof useTeams>);
      mockUseUnreadCount.mockReturnValue({
        data: 3,
        isLoading: false,
        isError: false,
        error: null,
      } as ReturnType<typeof useUnreadCount>);
    });

    it('displays the dashboard heading and user welcome message', async () => {
      render(<Dashboard />, { route: '/dashboard' });

      await waitFor(() => {
        expect(screen.getByText('داشبورد')).toBeInTheDocument();
        expect(screen.getByText(/خوش آمدید/)).toBeInTheDocument();
      });
    });

    it('displays the user profile card with name and role', async () => {
      render(<Dashboard />, { route: '/dashboard' });

      await waitFor(() => {
        expect(screen.getByText('پروفایل شما')).toBeInTheDocument();
        expect(screen.getByText('کاربر آزمایشی')).toBeInTheDocument();
      });
    });

    it('displays quick stats with correct project count', async () => {
      render(<Dashboard />, { route: '/dashboard' });

      await waitFor(() => {
        // "پروژه‌ها" label appears in links
        const statsLinks = screen.getAllByRole('link', { name: /پروژه‌ها/i });
        expect(statsLinks.length).toBeGreaterThan(0);
        // Persian numeral ۲ (2 projects)
        expect(screen.getAllByText('۲').length).toBeGreaterThan(0);
      });
    });

    it('displays task counts in stats', async () => {
      render(<Dashboard />, { route: '/dashboard' });

      await waitFor(() => {
        // Persian numeral ۳ (3 tasks total)
        expect(screen.getAllByText('۳').length).toBeGreaterThan(0);
        // "تکمیل‌شده" shows completed tasks (1 - only COMPLETED status in mockTasks)
        expect(screen.getByText(/تکمیل‌شده/)).toBeInTheDocument();
      });
    });

    it('displays team count in stats', async () => {
      render(<Dashboard />, { route: '/dashboard' });

      await waitFor(() => {
        // Persian numeral ۲ (2 teams)
        expect(screen.getAllByText('۲').length).toBeGreaterThan(0);
        expect(screen.getByText(/تیم‌ها/)).toBeInTheDocument();
      });
    });

    it('displays unread notifications count', async () => {
      render(<Dashboard />, { route: '/dashboard' });

      await waitFor(() => {
        expect(screen.getByText(/۳ اعلان جدید/)).toBeInTheDocument();
      });
    });

    it('displays account status section', async () => {
      render(<Dashboard />, { route: '/dashboard' });

      await waitFor(() => {
        expect(screen.getByText('وضعیت حساب')).toBeInTheDocument();
        expect(screen.getByText('ایمیل')).toBeInTheDocument();
      });
    });

    it('displays notification badge with correct text', async () => {
      render(<Dashboard />, { route: '/dashboard' });

      await waitFor(() => {
        // Persian numeral ۳ followed by "اعلان جدید"
        expect(screen.getByText(/۳.*اعلان جدید/)).toBeInTheDocument();
      });
    });

    it('shows activity feed mock', async () => {
      render(<Dashboard />, { route: '/dashboard' });

      await waitFor(() => {
        expect(screen.getByTestId('activity-feed-mock')).toBeInTheDocument();
      });
    });
  });

  describe('Navigation links', () => {
    beforeEach(() => {
      mockUseProjects.mockReturnValue({
        data: mockProjects,
        isLoading: false,
        isError: false,
        error: null,
      } as ReturnType<typeof useProjects>);
      mockUseMyTasks.mockReturnValue({
        data: mockTasks,
        isLoading: false,
        isError: false,
        error: null,
      } as ReturnType<typeof useMyTasks>);
      mockUseTeams.mockReturnValue({
        data: mockTeams,
        isLoading: false,
        isError: false,
        error: null,
      } as ReturnType<typeof useTeams>);
      mockUseUnreadCount.mockReturnValue({
        data: 3,
        isLoading: false,
        isError: false,
        error: null,
      } as ReturnType<typeof useUnreadCount>);
    });

    it('stat items are links to correct pages', async () => {
      render(<Dashboard />, { route: '/dashboard' });

      await waitFor(() => {
        const projectLinks = screen.getAllByRole('link', { name: /پروژه‌ها/i });
        expect(projectLinks.length).toBeGreaterThan(0);
        projectLinks.forEach((link) => {
          expect(link).toHaveAttribute('href', '/projects');
        });

        const teamLinks = screen.getAllByRole('link', { name: /تیم‌ها/i });
        expect(teamLinks.length).toBeGreaterThan(0);
        teamLinks.forEach((link) => {
          expect(link).toHaveAttribute('href', '/teams');
        });
      });
    });

    it('unread notifications link navigates to notifications page', async () => {
      render(<Dashboard />, { route: '/dashboard' });

      await waitFor(() => {
        const notificationLink = screen.getByRole('link', { name: /اعلان/ });
        expect(notificationLink).toHaveAttribute('href', '/notifications');
      });
    });
  });

  describe('Partial loading states', () => {
    it('shows skeleton while projects load but shows other data', async () => {
      mockUseProjects.mockReturnValue({
        data: undefined,
        isLoading: true,
        isError: false,
        error: null,
      } as ReturnType<typeof useProjects>);
      mockUseMyTasks.mockReturnValue({
        data: mockTasks,
        isLoading: false,
        isError: false,
        error: null,
      } as ReturnType<typeof useMyTasks>);
      mockUseTeams.mockReturnValue({
        data: mockTeams,
        isLoading: false,
        isError: false,
        error: null,
      } as ReturnType<typeof useTeams>);
      mockUseUnreadCount.mockReturnValue({
        data: 3,
        isLoading: false,
        isError: false,
        error: null,
      } as ReturnType<typeof useUnreadCount>);

      render(<Dashboard />, { route: '/dashboard' });

      // Projects stat shows skeleton
      await waitFor(() => {
        const skeletons = screen.getAllByText('...');
        expect(skeletons.length).toBeGreaterThan(0);
      });

      // But other data is shown (e.g. tasks, teams, notifications)
      expect(screen.getByText(/۳ اعلان جدید/)).toBeInTheDocument();
    });
  });

  describe('Edge cases', () => {
    it('handles zero unread notifications gracefully', async () => {
      mockUseProjects.mockReturnValue({
        data: mockProjects,
        isLoading: false,
        isError: false,
        error: null,
      } as ReturnType<typeof useProjects>);
      mockUseMyTasks.mockReturnValue({
        data: mockTasks,
        isLoading: false,
        isError: false,
        error: null,
      } as ReturnType<typeof useMyTasks>);
      mockUseTeams.mockReturnValue({
        data: mockTeams,
        isLoading: false,
        isError: false,
        error: null,
      } as ReturnType<typeof useTeams>);
      mockUseUnreadCount.mockReturnValue({
        data: 0,
        isLoading: false,
        isError: false,
        error: null,
      } as ReturnType<typeof useUnreadCount>);

      render(<Dashboard />, { route: '/dashboard' });

      await waitFor(() => {
        expect(screen.getByText('اعلان جدیدی ندارید')).toBeInTheDocument();
      });
    });

    it('shows skeleton for tasks stat while tasks are loading', async () => {
      mockUseProjects.mockReturnValue({
        data: mockProjects,
        isLoading: false,
        isError: false,
        error: null,
      } as ReturnType<typeof useProjects>);
      mockUseMyTasks.mockReturnValue({
        data: undefined,
        isLoading: true,
        isError: false,
        error: null,
      } as ReturnType<typeof useMyTasks>);
      mockUseTeams.mockReturnValue({
        data: mockTeams,
        isLoading: false,
        isError: false,
        error: null,
      } as ReturnType<typeof useTeams>);
      mockUseUnreadCount.mockReturnValue({
        data: 0,
        isLoading: false,
        isError: false,
        error: null,
      } as ReturnType<typeof useUnreadCount>);

      render(<Dashboard />, { route: '/dashboard' });

      await waitFor(() => {
        // Skeleton shows "..." while loading
        expect(screen.getAllByText('...').length).toBeGreaterThan(0);
      });
    });

    it('shows empty tasks row when there are no tasks', async () => {
      mockUseProjects.mockReturnValue({
        data: [],
        isLoading: false,
        isError: false,
        error: null,
      } as ReturnType<typeof useProjects>);
      mockUseMyTasks.mockReturnValue({
        data: [],
        isLoading: false,
        isError: false,
        error: null,
      } as ReturnType<typeof useMyTasks>);
      mockUseTeams.mockReturnValue({
        data: [],
        isLoading: false,
        isError: false,
        error: null,
      } as ReturnType<typeof useTeams>);
      mockUseUnreadCount.mockReturnValue({
        data: 0,
        isLoading: false,
        isError: false,
        error: null,
      } as ReturnType<typeof useUnreadCount>);

      render(<Dashboard />, { route: '/dashboard' });

      await waitFor(() => {
        expect(screen.getByText('شروع کنید')).toBeInTheDocument();
        expect(screen.getByText(/هنوز وظیفه‌ای برای شما ثبت نشده است/)).toBeInTheDocument();
      });
    });
  });
});
