// src/components/EditProject.test.tsx
import React from 'react';
import { render, screen, waitFor } from '../tests/test-utils';
import userEvent from '@testing-library/user-event';
import { vi } from 'vitest';
import { createMemoryRouter, RouterProvider, Outlet } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider } from '../services/contexts/AuthContext';
import EditProject from './EditProject';
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

// ─── Mock projectService ──────────────────────────────────────────────────────

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
  updated_at: '2024-01-01T00:00:00Z',
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

const renderWithAuth = (ui: React.ReactElement, user: typeof adminUser) => {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });

  mockUseAuth.mockReturnValue({
    user,
    loading: false,
    login: vi.fn(),
    logout: vi.fn(),
    register: vi.fn(),
  });

  const router = createMemoryRouter(
    [
      {
        path: '/',
        element: <AllTheProviders>{ui}</AllTheProviders>,
        children: [
          { path: 'projects/:id/edit', element: ui },
        ],
      },
    ],
    { initialEntries: ['/projects/porojekt-avval/edit'] }
  );

  return render(<RouterProvider router={router} />);
};

const AllTheProviders = ({ children }: { children: React.ReactNode }) => (
  <QueryClientProvider client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}>
    <AuthProvider>{children}</AuthProvider>
  </QueryClientProvider>
);

// ─── Tests ────────────────────────────────────────────────────────────────────

describe('EditProject', () => {
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

      render(<EditProject />, { route: '/projects/porojekt-avval/edit' });

      expect(screen.getByText('در حال بارگذاری پروژه...')).toBeInTheDocument();
    });
  });

  describe('Permission gate', () => {
    it('shows error when user does not have permission to edit', async () => {
      mockGetProject.mockResolvedValue(mockProject);
      mockUseAuth.mockReturnValue({
        user: devUser,
        loading: false,
        login: vi.fn(),
        logout: vi.fn(),
        register: vi.fn(),
      });

      render(<EditProject />, { route: '/projects/porojekt-avval/edit' });

      await waitFor(() => {
        expect(screen.getByText('شما دسترسی لازم برای ویرایش این پروژه را ندارید.')).toBeInTheDocument();
      });
    });

    it('allows ADMIN role to access edit page', async () => {
      mockUseAuth.mockReturnValue({
        user: adminUser,
        loading: false,
        login: vi.fn(),
        logout: vi.fn(),
        register: vi.fn(),
      });
      mockGetProject.mockResolvedValue(mockProject);

      render(<EditProject />, { route: '/projects/porojekt-avval/edit' });

      await waitFor(() => {
        expect(screen.getByLabelText('نام پروژه *')).toBeInTheDocument();
      });
    });

    it('allows PM role to access edit page', async () => {
      const pmUser = { ...adminUser, role: 'PM' as const };
      mockUseAuth.mockReturnValue({
        user: pmUser,
        loading: false,
        login: vi.fn(),
        logout: vi.fn(),
        register: vi.fn(),
      });
      mockGetProject.mockResolvedValue(mockProject);

      render(<EditProject />, { route: '/projects/porojekt-avval/edit' });

      await waitFor(() => {
        expect(screen.getByLabelText('نام پروژه *')).toBeInTheDocument();
      });
    });

    it('allows TL role to access edit page', async () => {
      const tlUser = { ...adminUser, role: 'TL' as const };
      mockUseAuth.mockReturnValue({
        user: tlUser,
        loading: false,
        login: vi.fn(),
        logout: vi.fn(),
        register: vi.fn(),
      });
      mockGetProject.mockResolvedValue(mockProject);

      render(<EditProject />, { route: '/projects/porojekt-avval/edit' });

      await waitFor(() => {
        expect(screen.getByLabelText('نام پروژه *')).toBeInTheDocument();
      });
    });
  });

  describe('Form display', () => {
    it('displays page heading and subtitle', async () => {
      mockUseAuth.mockReturnValue({
        user: adminUser,
        loading: false,
        login: vi.fn(),
        logout: vi.fn(),
        register: vi.fn(),
      });
      mockGetProject.mockResolvedValue(mockProject);

      render(<EditProject />, { route: '/projects/porojekt-avval/edit' });

      await waitFor(() => {
        expect(screen.getByRole('heading', { name: 'ویرایش پروژه' })).toBeInTheDocument();
        expect(screen.getByText('به‌روزرسانی جزئیات و تنظیمات پروژه')).toBeInTheDocument();
      });
    });

    it('displays back link', async () => {
      mockUseAuth.mockReturnValue({
        user: adminUser,
        loading: false,
        login: vi.fn(),
        logout: vi.fn(),
        register: vi.fn(),
      });
      mockGetProject.mockResolvedValue(mockProject);

      render(<EditProject />, { route: '/projects/porojekt-avval/edit' });

      await waitFor(() => {
        expect(screen.getByText('→ بازگشت به پروژه')).toBeInTheDocument();
      });
    });

    it('pre-fills form with existing project data', async () => {
      mockUseAuth.mockReturnValue({
        user: adminUser,
        loading: false,
        login: vi.fn(),
        logout: vi.fn(),
        register: vi.fn(),
      });
      mockGetProject.mockResolvedValue(mockProject);

      render(<EditProject />, { route: '/projects/porojekt-avval/edit' });

      await waitFor(() => {
        expect(screen.getByDisplayValue('پروژه اول')).toBeInTheDocument();
        expect(screen.getByDisplayValue('توضیحات پروژه اول')).toBeInTheDocument();
      });
    });

    it('displays priority and status selects with current values', async () => {
      mockUseAuth.mockReturnValue({
        user: adminUser,
        loading: false,
        login: vi.fn(),
        logout: vi.fn(),
        register: vi.fn(),
      });
      mockGetProject.mockResolvedValue(mockProject);

      render(<EditProject />, { route: '/projects/porojekt-avval/edit' });

      await waitFor(() => {
        expect(screen.getByLabelText('اولویت')).toBeInTheDocument();
        expect(screen.getByLabelText('وضعیت')).toBeInTheDocument();
      });

      // Check selected options
      const prioritySelect = screen.getByLabelText('اولویت') as HTMLSelectElement;
      expect(prioritySelect.value).toBe('HIGH');
    });
  });

  describe('Form interactions', () => {
    it('updates form field when user types', async () => {
      mockUseAuth.mockReturnValue({
        user: adminUser,
        loading: false,
        login: vi.fn(),
        logout: vi.fn(),
        register: vi.fn(),
      });
      mockGetProject.mockResolvedValue(mockProject);

      render(<EditProject />, { route: '/projects/porojekt-avval/edit' });

      await waitFor(() => {
        expect(screen.getByLabelText('نام پروژه *')).toBeInTheDocument();
      });

      const user = userEvent.setup();
      const nameInput = screen.getByLabelText('نام پروژه *');
      await user.clear(nameInput);
      await user.type(nameInput, 'پروژه جدید');

      expect(screen.getByDisplayValue('پروژه جدید')).toBeInTheDocument();
    });

    it('toggles is_public checkbox', async () => {
      mockUseAuth.mockReturnValue({
        user: adminUser,
        loading: false,
        login: vi.fn(),
        logout: vi.fn(),
        register: vi.fn(),
      });
      mockGetProject.mockResolvedValue(mockProject);

      render(<EditProject />, { route: '/projects/porojekt-avval/edit' });

      await waitFor(() => {
        expect(screen.getByLabelText('نام پروژه *')).toBeInTheDocument();
      });

      const checkbox = screen.getByLabelText('این پروژه عمومی باشد') as HTMLInputElement;
      expect(checkbox.checked).toBe(false);

      const user = userEvent.setup();
      await user.click(checkbox);

      expect(checkbox.checked).toBe(true);
    });
  });

  describe('Form submission', () => {
    it('shows error message when update fails', async () => {
      mockUseAuth.mockReturnValue({
        user: adminUser,
        loading: false,
        login: vi.fn(),
        logout: vi.fn(),
        register: vi.fn(),
      });
      mockGetProject.mockResolvedValue(mockProject);
      mockUpdateProject.mockRejectedValue({
        response: { data: { detail: 'به‌روزرسانی پروژه ناموفق بود' } },
      });

      render(<EditProject />, { route: '/projects/porojekt-avval/edit' });

      await waitFor(() => {
        expect(screen.getByLabelText('نام پروژه *')).toBeInTheDocument();
      });

      const user = userEvent.setup();
      await user.click(screen.getByRole('button', { name: 'ذخیره تغییرات' }));

      await waitFor(() => {
        expect(screen.getByText('به‌روزرسانی پروژه ناموفق بود')).toBeInTheDocument();
      });
    });

    it('shows loading state while saving', async () => {
      mockUseAuth.mockReturnValue({
        user: adminUser,
        loading: false,
        login: vi.fn(),
        logout: vi.fn(),
        register: vi.fn(),
      });
      mockGetProject.mockResolvedValue(mockProject);
      mockUpdateProject.mockReturnValue(new Promise(() => {}));

      render(<EditProject />, { route: '/projects/porojekt-avval/edit' });

      await waitFor(() => {
        expect(screen.getByLabelText('نام پروژه *')).toBeInTheDocument();
      });

      const user = userEvent.setup();
      await user.click(screen.getByRole('button', { name: 'ذخیره تغییرات' }));

      await waitFor(() => {
        expect(screen.getByText('در حال ذخیره...')).toBeInTheDocument();
      });

      const submitBtn = screen.getByRole('button', { name: 'در حال ذخیره...' });
      expect(submitBtn).toBeDisabled();
    });
  });
});
