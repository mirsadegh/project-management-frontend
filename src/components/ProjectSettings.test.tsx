// src/components/ProjectSettings.test.tsx
import React from 'react';
import { render, screen, waitFor } from '../tests/test-utils';
import userEvent from '@testing-library/user-event';
import { vi } from 'vitest';
import { createMemoryRouter, RouterProvider, Outlet } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider } from '../services/contexts/AuthContext';
import ProjectSettings from './ProjectSettings';
import { useAuth } from '../services/contexts/AuthContext';
import { projectService } from '../services/projectService';

// ─── Mock AuthContext ──────────────────────────────────────────────────────────

vi.mock('../services/contexts/AuthContext', async (importOriginal) => {
  const actual = await importOriginal();
  return {
    ...actual,
    useAuth: vi.fn(),
  };
});

// ─── Mock projectService ───────────────────────────────────────────────────────

vi.mock('../services/projectService', () => ({
  projectService: {
    getProject: vi.fn(),
    getProjects: vi.fn(),
    createProject: vi.fn(),
    updateProject: vi.fn(),
    deleteProject: vi.fn(),
    getProjectMembers: vi.fn(),
    addMember: vi.fn(),
    removeMember: vi.fn(),
    getStatistics: vi.fn(),
    getReports: vi.fn(),
    getTeamInfo: vi.fn(),
    archive: vi.fn(),
    closeProject: vi.fn(),
    forceDelete: vi.fn(),
    getComments: vi.fn(),
    addComment: vi.fn(),
    getAttachments: vi.fn(),
    uploadFile: vi.fn(),
  },
}));

const mockUseAuth = useAuth as ReturnType<typeof vi.fn>;
const mockGetProject = projectService.getProject as ReturnType<typeof vi.fn>;
const mockUpdateProject = projectService.updateProject as ReturnType<typeof vi.fn>;
const mockDeleteProject = projectService.deleteProject as ReturnType<typeof vi.fn>;

// ─── Mock data ────────────────────────────────────────────────────────────────

const mockProject = {
  id: 1,
  name: 'پروژه اول',
  slug: 'porojekt-avval',
  description: 'توضیحات پروژه اول',
  owner: {
    id: 1,
    username: 'admin',
    email: 'admin@example.com',
    full_name: 'مدیر سیستم',
    role: 'ADMIN',
  },
  manager: {
    id: 1,
    username: 'admin',
    email: 'admin@example.com',
    full_name: 'مدیر سیستم',
    role: 'ADMIN',
  },
  status: 'IN_PROGRESS' as const,
  priority: 'HIGH' as const,
  progress: 50,
  start_date: '2024-01-01',
  due_date: '2024-06-01',
  completed_date: null,
  budget: 10000,
  is_active: true,
  is_public: false,
  is_overdue: false,
  total_tasks: 10,
  completed_tasks: 5,
  comment_count: 3,
  attachment_count: 2,
  members: [],
  created_at: '2024-01-01T00:00:00Z',
  updated_at: '2024-06-01T00:00:00Z',
};

// ─── Test setup ───────────────────────────────────────────────────────────────

const adminUser = {
  id: 1,
  username: 'admin',
  email: 'admin@example.com',
  first_name: 'مدیر',
  last_name: 'سیستم',
  full_name: 'مدیر سیستم',
  role: 'ADMIN' as const,
  department: 'فنی',
  is_available: true,
  job_title: 'مدیر پروژه',
  phone_number: '۰۹۱۲۱۲۳۴۵۶۷',
  bio: 'مدیر سیستم',
  profile_picture: null,
  date_joined: '2024-01-01T00:00:00Z',
  last_login: '2024-06-01T00:00:00Z',
};

const devUser = {
  id: 2,
  username: 'dev',
  email: 'dev@example.com',
  first_name: 'توسعه',
  last_name: 'دهنده',
  full_name: 'توسعه‌دهنده',
  role: 'DEV' as const,
  department: 'فنی',
  is_available: true,
  job_title: 'توسعه‌دهنده',
  phone_number: '۰۹۱۲۱۲۳۴۵۶۷',
  bio: 'توسعه‌دهنده',
  profile_picture: null,
  date_joined: '2024-01-01T00:00:00Z',
  last_login: '2024-06-01T00:00:00Z',
};

const AllTheProviders = ({ children }: { children: React.ReactNode }) => (
  <QueryClientProvider client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}>
    <AuthProvider>{children}</AuthProvider>
  </QueryClientProvider>
);

// ─── Tests ────────────────────────────────────────────────────────────────────

describe('ProjectSettings', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Loading state', () => {
    it('shows loading indicator while fetching project', () => {
      mockUseAuth.mockReturnValue({
        user: adminUser,
        loading: false,
        login: vi.fn(),
        logout: vi.fn(),
        register: vi.fn(),
      });
      mockGetProject.mockReturnValue(new Promise(() => {}));

      render(<ProjectSettings />, { route: '/projects/porojekt-avval/settings' });

      expect(screen.getByText('در حال بارگذاری تنظیمات...')).toBeInTheDocument();
    });
  });

  describe('Permission gate', () => {
    it('shows error when user does not have permission', async () => {
      mockGetProject.mockResolvedValue(mockProject);
      mockUseAuth.mockReturnValue({
        user: devUser,
        loading: false,
        login: vi.fn(),
        logout: vi.fn(),
        register: vi.fn(),
      });

      render(<ProjectSettings />, { route: '/projects/porojekt-avval/settings' });

      await waitFor(() => {
        expect(screen.getByText('شما دسترسی لازم برای مدیریت تنظیمات پروژه را ندارید.')).toBeInTheDocument();
      });
    });

    it('allows ADMIN to access settings', async () => {
      mockUseAuth.mockReturnValue({
        user: adminUser,
        loading: false,
        login: vi.fn(),
        logout: vi.fn(),
        register: vi.fn(),
      });
      mockGetProject.mockResolvedValue(mockProject);

      render(<ProjectSettings />, { route: '/projects/porojekt-avval/settings' });

      await waitFor(() => {
        expect(screen.getByRole('heading', { name: 'تنظیمات پروژه' })).toBeInTheDocument();
      });
    });

    it('allows PM to access settings', async () => {
      const pmUser = { ...adminUser, role: 'PM' as const };
      mockUseAuth.mockReturnValue({
        user: pmUser,
        loading: false,
        login: vi.fn(),
        logout: vi.fn(),
        register: vi.fn(),
      });
      mockGetProject.mockResolvedValue(mockProject);

      render(<ProjectSettings />, { route: '/projects/porojekt-avval/settings' });

      await waitFor(() => {
        expect(screen.getByRole('heading', { name: 'تنظیمات پروژه' })).toBeInTheDocument();
      });
    });

    it('allows TL to access settings', async () => {
      const tlUser = { ...adminUser, role: 'TL' as const };
      mockUseAuth.mockReturnValue({
        user: tlUser,
        loading: false,
        login: vi.fn(),
        logout: vi.fn(),
        register: vi.fn(),
      });
      mockGetProject.mockResolvedValue(mockProject);

      render(<ProjectSettings />, { route: '/projects/porojekt-avval/settings' });

      await waitFor(() => {
        expect(screen.getByRole('heading', { name: 'تنظیمات پروژه' })).toBeInTheDocument();
      });
    });
  });

  describe('Page layout', () => {
    it('displays page heading and subtitle', async () => {
      mockUseAuth.mockReturnValue({
        user: adminUser,
        loading: false,
        login: vi.fn(),
        logout: vi.fn(),
        register: vi.fn(),
      });
      mockGetProject.mockResolvedValue(mockProject);

      render(<ProjectSettings />, { route: '/projects/porojekt-avval/settings' });

      await waitFor(() => {
        expect(screen.getByRole('heading', { name: 'تنظیمات پروژه' })).toBeInTheDocument();
        expect(screen.getByText('مدیریت دید پروژه و داده‌ها')).toBeInTheDocument();
      });
    });

    it('displays back link to project', async () => {
      mockUseAuth.mockReturnValue({
        user: adminUser,
        loading: false,
        login: vi.fn(),
        logout: vi.fn(),
        register: vi.fn(),
      });
      mockGetProject.mockResolvedValue(mockProject);

      render(<ProjectSettings />, { route: '/projects/porojekt-avval/settings' });

      await waitFor(() => {
        expect(screen.getByText('→ بازگشت به پروژه')).toBeInTheDocument();
      });
    });
  });

  describe('Visibility settings', () => {
    it('displays current visibility status as private', async () => {
      mockUseAuth.mockReturnValue({
        user: adminUser,
        loading: false,
        login: vi.fn(),
        logout: vi.fn(),
        register: vi.fn(),
      });
      mockGetProject.mockResolvedValue({ ...mockProject, is_public: false });

      render(<ProjectSettings />, { route: '/projects/porojekt-avval/settings' });

      await waitFor(() => {
        expect(screen.getByText('پروژه عمومی')).toBeInTheDocument();
        expect(screen.getByText('خصوصی')).toBeInTheDocument();
        expect(screen.getByText('این پروژه فقط برای اعضای پروژه قابل مشاهده است.')).toBeInTheDocument();
      });
    });

    it('displays current visibility status as public', async () => {
      mockUseAuth.mockReturnValue({
        user: adminUser,
        loading: false,
        login: vi.fn(),
        logout: vi.fn(),
        register: vi.fn(),
      });
      mockGetProject.mockResolvedValue({ ...mockProject, is_public: true });

      render(<ProjectSettings />, { route: '/projects/porojekt-avval/settings' });

      await waitFor(() => {
        expect(screen.getByText('پروژه عمومی')).toBeInTheDocument();
        expect(screen.getByText('عمومی')).toBeInTheDocument();
        expect(screen.getByText('این پروژه برای همه کاربران قابل مشاهده است.')).toBeInTheDocument();
      });
    });

    it('toggles visibility when button is clicked', async () => {
      mockUseAuth.mockReturnValue({
        user: adminUser,
        loading: false,
        login: vi.fn(),
        logout: vi.fn(),
        register: vi.fn(),
      });
      mockGetProject.mockResolvedValue({ ...mockProject, is_public: false });
      mockUpdateProject.mockResolvedValue({ ...mockProject, is_public: true });

      render(<ProjectSettings />, { route: '/projects/porojekt-avval/settings' });

      await waitFor(() => {
        expect(screen.getByText('پروژه عمومی')).toBeInTheDocument();
      });

      const user = userEvent.setup();
      await user.click(screen.getByRole('button', { name: 'عمومی کردن' }));

      await waitFor(() => {
        expect(mockUpdateProject).toHaveBeenCalledWith('porojekt-avval', { is_public: true });
      });
    });

    it('shows error when toggle fails', async () => {
      mockUseAuth.mockReturnValue({
        user: adminUser,
        loading: false,
        login: vi.fn(),
        logout: vi.fn(),
        register: vi.fn(),
      });
      mockGetProject.mockResolvedValue({ ...mockProject, is_public: false });
      mockUpdateProject.mockRejectedValue({
        response: { data: { detail: 'به‌روزرسانی دید ناموفق بود' } },
      });

      render(<ProjectSettings />, { route: '/projects/porojekt-avval/settings' });

      await waitFor(() => {
        expect(screen.getByText('پروژه عمومی')).toBeInTheDocument();
      });

      const user = userEvent.setup();
      await user.click(screen.getByRole('button', { name: 'عمومی کردن' }));

      await waitFor(() => {
        expect(screen.getByText('به‌روزرسانی دید ناموفق بود')).toBeInTheDocument();
      });
    });

    it('shows success message after toggling visibility', async () => {
      mockUseAuth.mockReturnValue({
        user: adminUser,
        loading: false,
        login: vi.fn(),
        logout: vi.fn(),
        register: vi.fn(),
      });
      mockGetProject.mockResolvedValue({ ...mockProject, is_public: false });
      mockUpdateProject.mockResolvedValue({ ...mockProject, is_public: true });

      render(<ProjectSettings />, { route: '/projects/porojekt-avval/settings' });

      await waitFor(() => {
        expect(screen.getByText('پروژه عمومی')).toBeInTheDocument();
      });

      const user = userEvent.setup();
      await user.click(screen.getByRole('button', { name: 'عمومی کردن' }));

      await waitFor(() => {
        expect(screen.getByText('پروژه اکنون عمومی است')).toBeInTheDocument();
      });
    });
  });

  describe('Project info section', () => {
    it('displays owner information', async () => {
      mockUseAuth.mockReturnValue({
        user: adminUser,
        loading: false,
        login: vi.fn(),
        logout: vi.fn(),
        register: vi.fn(),
      });
      mockGetProject.mockResolvedValue(mockProject);

      render(<ProjectSettings />, { route: '/projects/porojekt-avval/settings' });

      await waitFor(() => {
        expect(screen.getByText('مالک')).toBeInTheDocument();
        expect(screen.getAllByText('مدیر سیستم').length).toBeGreaterThanOrEqual(1);
      });
    });

    it('displays project dates', async () => {
      mockUseAuth.mockReturnValue({
        user: adminUser,
        loading: false,
        login: vi.fn(),
        logout: vi.fn(),
        register: vi.fn(),
      });
      mockGetProject.mockResolvedValue(mockProject);

      render(<ProjectSettings />, { route: '/projects/porojekt-avval/settings' });

      await waitFor(() => {
        expect(screen.getByText('ایجاد شده')).toBeInTheDocument();
        expect(screen.getByText('آخرین به‌روزرسانی')).toBeInTheDocument();
      });
    });

    it('displays task and member counts', async () => {
      mockUseAuth.mockReturnValue({
        user: adminUser,
        loading: false,
        login: vi.fn(),
        logout: vi.fn(),
        register: vi.fn(),
      });
      mockGetProject.mockResolvedValue(mockProject);

      render(<ProjectSettings />, { route: '/projects/porojekt-avval/settings' });

      await waitFor(() => {
        expect(screen.getByText('مجموع وظایف')).toBeInTheDocument();
        expect(screen.getAllByText('10').length).toBeGreaterThanOrEqual(1);
        expect(screen.getByText('اعضا')).toBeInTheDocument();
      });
    });
  });

  describe('Danger zone', () => {
    it('displays delete section', async () => {
      mockUseAuth.mockReturnValue({
        user: adminUser,
        loading: false,
        login: vi.fn(),
        logout: vi.fn(),
        register: vi.fn(),
      });
      mockGetProject.mockResolvedValue(mockProject);

      render(<ProjectSettings />, { route: '/projects/porojekt-avval/settings' });

      await waitFor(() => {
        expect(screen.getByText('منطقه خطر')).toBeInTheDocument();
        expect(screen.getByText('حذف این پروژه')).toBeInTheDocument();
      });
    });

    it('shows confirmation dialog when delete is clicked', async () => {
      mockUseAuth.mockReturnValue({
        user: adminUser,
        loading: false,
        login: vi.fn(),
        logout: vi.fn(),
        register: vi.fn(),
      });
      mockGetProject.mockResolvedValue(mockProject);

      render(<ProjectSettings />, { route: '/projects/porojekt-avval/settings' });

      await waitFor(() => {
        expect(screen.getByText('منطقه خطر')).toBeInTheDocument();
      });

      const user = userEvent.setup();
      await user.click(screen.getByRole('button', { name: 'حذف پروژه' }));

      // Debug: capture delete-confirm inner HTML
      await new Promise(r => setTimeout(r, 500));
      const deleteConfirmEl = document.querySelector('.delete-confirm');
      console.log('delete-confirm HTML:', deleteConfirmEl?.innerHTML);

      await waitFor(() => {
        expect(document.querySelector('.delete-confirm')).toBeInTheDocument();
        expect(document.querySelector('.btn-secondary')).toBeInTheDocument();
        expect(document.querySelector('.btn-danger')).toBeInTheDocument();
      });
    });

    it('cancels delete when cancel is clicked', async () => {
      mockUseAuth.mockReturnValue({
        user: adminUser,
        loading: false,
        login: vi.fn(),
        logout: vi.fn(),
        register: vi.fn(),
      });
      mockGetProject.mockResolvedValue(mockProject);

      render(<ProjectSettings />, { route: '/projects/porojekt-avval/settings' });

      await waitFor(() => {
        expect(screen.getByText('منطقه خطر')).toBeInTheDocument();
      });

      const user = userEvent.setup();
      await user.click(screen.getByRole('button', { name: 'حذف پروژه' }));

      await waitFor(() => {
        expect(screen.getByRole('button', { name: 'انصراف' })).toBeInTheDocument();
      });

      await user.click(screen.getByRole('button', { name: 'انصراف' }));

      await waitFor(() => {
        expect(screen.queryByText(/را حذف کنید/)).not.toBeInTheDocument();
      });
    });

    it('shows loading state while deleting', async () => {
      mockUseAuth.mockReturnValue({
        user: adminUser,
        loading: false,
        login: vi.fn(),
        logout: vi.fn(),
        register: vi.fn(),
      });
      mockGetProject.mockResolvedValue(mockProject);
      mockDeleteProject.mockReturnValue(new Promise(() => {}));

      render(<ProjectSettings />, { route: '/projects/porojekt-avval/settings' });

      await waitFor(() => {
        expect(screen.getByText('منطقه خطر')).toBeInTheDocument();
      });

      const user = userEvent.setup();
      await user.click(screen.getByRole('button', { name: 'حذف پروژه' }));

      await waitFor(() => {
        expect(screen.getByRole('button', { name: 'بله، پروژه را حذف کن' })).toBeInTheDocument();
      });

      await user.click(screen.getByRole('button', { name: 'بله، پروژه را حذف کن' }));

      await waitFor(() => {
        expect(screen.getByText('در حال حذف...')).toBeInTheDocument();
      });
    });

    it('shows error when delete fails', async () => {
      mockUseAuth.mockReturnValue({
        user: adminUser,
        loading: false,
        login: vi.fn(),
        logout: vi.fn(),
        register: vi.fn(),
      });
      mockGetProject.mockResolvedValue(mockProject);
      mockDeleteProject.mockRejectedValue({
        response: { data: { detail: 'Failed to delete project' } },
      });

      render(<ProjectSettings />, { route: '/projects/porojekt-avval/settings' });

      await waitFor(() => {
        expect(screen.getByText('منطقه خطر')).toBeInTheDocument();
      });

      const user = userEvent.setup();
      await user.click(screen.getByRole('button', { name: 'حذف پروژه' }));

      await waitFor(() => {
        expect(screen.getByRole('button', { name: 'بله، پروژه را حذف کن' })).toBeInTheDocument();
      });

      await user.click(screen.getByRole('button', { name: 'بله، پروژه را حذف کن' }));

      await waitFor(() => {
        expect(screen.getByText('Failed to delete project')).toBeInTheDocument();
      });
    });
  });
});
