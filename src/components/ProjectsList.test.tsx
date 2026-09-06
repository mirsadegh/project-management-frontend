// src/components/ProjectsList.test.tsx
import React from 'react';
import { render, screen, waitFor, within } from '../tests/test-utils';
import userEvent from '@testing-library/user-event';
import { vi } from 'vitest';
import { http, HttpResponse } from 'msw';
import { setupServer } from 'msw/node';
import ProjectsList from './ProjectsList';
import { mockProjects, mockUser } from '../tests/mockData';

// ─── Mock AuthContext ─────────────────────────────────────────────────────────

// AuthProvider calls getCurrentUser() on mount, so we must mock useAuth too
vi.mock('../services/contexts/AuthContext', async (importOriginal) => {
  const actual = await importOriginal();
  return {
    ...actual,
    useAuth: vi.fn(() => ({
      user: mockUser,
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
  useUnreadCount: vi.fn(),
}));

import { useProjects } from '../services/queryHooks';

const mockUseProjects = useProjects as ReturnType<typeof vi.fn>;

// ─── MSW server for projects API ──────────────────────────────────────────────

const API_BASE = 'http://localhost:8000/api';

export const projectHandlers = [
  http.get(`${API_BASE}/accounts/users/me/`, () => {
    return HttpResponse.json({ id: 1, username: 'testuser', email: 'test@example.com', full_name: 'Test User', role: 'DEV' });
  }),
  http.get(`${API_BASE}/projects/projects/`, () => {
    return HttpResponse.json({ projects: mockProjects });
  }),
  http.post(`${API_BASE}/projects/projects/`, async ({ request }) => {
    const body = await request.json() as Record<string, unknown>;
    return HttpResponse.json(
      {
        id: 3,
        ...body,
        slug: `project-${Date.now()}`,
        owner: { id: 1, username: 'testuser', email: 'test@example.com', full_name: 'Test User', role: 'DEV' },
        manager: null,
        status: 'PLANNING',
        priority: 'MEDIUM',
        progress: 0,
        is_active: true,
        is_public: false,
        is_overdue: false,
        total_tasks: 0,
        completed_tasks: 0,
        comment_count: 0,
        attachment_count: 0,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
      { status: 201 }
    );
  }),
];

export const server = setupServer(...projectHandlers);

// ─── Tests ─────────────────────────────────────────────────────────────────────

describe('ProjectsList', () => {
  beforeAll(() => server.listen({ onUnhandledRequest: 'warn' }));
  afterEach(() => {
    server.resetHandlers();
    vi.clearAllMocks();
  });
  afterAll(() => server.close());

  describe('Loading state', () => {
    it('shows loading indicator while fetching projects', () => {
      mockUseProjects.mockReturnValue({
        data: undefined,
        isLoading: true,
        isError: false,
        error: null,
      } as ReturnType<typeof useProjects>);

      render(<ProjectsList />, { route: '/projects' });

      expect(screen.getByText('در حال بارگذاری پروژه‌ها...')).toBeInTheDocument();
    });
  });

  describe('Error state', () => {
    it('shows error message when fetch fails', () => {
      mockUseProjects.mockReturnValue({
        data: undefined,
        isLoading: false,
        isError: true,
        error: { response: { data: { detail: 'خطای سرور' } } },
      } as ReturnType<typeof useProjects>);

      render(<ProjectsList />, { route: '/projects' });

      expect(screen.getByText(/خطای سرور/i)).toBeInTheDocument();
    });
  });

  describe('Empty state', () => {
    it('shows empty state when no projects exist', () => {
      mockUseProjects.mockReturnValue({
        data: [],
        isLoading: false,
        isError: false,
        error: null,
      } as ReturnType<typeof useProjects>);

      render(<ProjectsList />, { route: '/projects' });

      expect(screen.getByText(/هنوز پروژه‌ای وجود ندارد/i)).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /ایجاد پروژه/i })).toBeInTheDocument();
    });
  });

  describe('Project list rendering', () => {
    it('displays list of projects with correct names', async () => {
      mockUseProjects.mockReturnValue({
        data: mockProjects,
        isLoading: false,
        isError: false,
        error: null,
      } as ReturnType<typeof useProjects>);

      render(<ProjectsList />, { route: '/projects' });

      await waitFor(() => {
        // Use getAllByText because project names appear in both the h3 and the link text
        expect(screen.getAllByText('پروژه اول')).toHaveLength(1);
        expect(screen.getAllByText('پروژه دوم')).toHaveLength(1);
      });
    });

    it('renders project cards as links to project detail pages', async () => {
      mockUseProjects.mockReturnValue({
        data: mockProjects,
        isLoading: false,
        isError: false,
        error: null,
      } as ReturnType<typeof useProjects>);

      render(<ProjectsList />, { route: '/projects' });

      await waitFor(() => {
        const firstLink = screen.getByRole('link', { name: /پروژه اول/i });
        expect(firstLink).toHaveAttribute('href', '/projects/porojekt-avval');
      });
    });

    it('shows project progress bar with correct percentage', async () => {
      mockUseProjects.mockReturnValue({
        data: mockProjects,
        isLoading: false,
        isError: false,
        error: null,
      } as ReturnType<typeof useProjects>);

      render(<ProjectsList />, { route: '/projects' });

      await waitFor(() => {
        // Use regex to match the Persian percent character (U+066A) rendered by the component
        expect(screen.getByText(/50٪/)).toBeInTheDocument();
        expect(screen.getByText(/100٪/)).toBeInTheDocument();
      });
    });

    it('shows task counts for each project', async () => {
      mockUseProjects.mockReturnValue({
        data: mockProjects,
        isLoading: false,
        isError: false,
        error: null,
      } as ReturnType<typeof useProjects>);

      render(<ProjectsList />, { route: '/projects' });

      await waitFor(() => {
        // First project: 5 completed out of 10 total
        // The Link itself is the .project-card
        const firstCard = screen.getByRole('link', { name: /پروژه اول/i }) as HTMLElement;
        expect(within(firstCard).getByText('10')).toBeInTheDocument();
        // 5 appears twice: once for completed_tasks and once for remaining (10-5)
        expect(within(firstCard).getAllByText('5')).toHaveLength(2);
        // Second project: 5 completed out of 5 total (5 appears twice: completed and total)
        const secondCard = screen.getByRole('link', { name: /پروژه دوم/i }) as HTMLElement;
        expect(within(secondCard).getAllByText('5')).toHaveLength(2);
      });
    });

    it('shows project descriptions', async () => {
      mockUseProjects.mockReturnValue({
        data: mockProjects,
        isLoading: false,
        isError: false,
        error: null,
      } as ReturnType<typeof useProjects>);

      render(<ProjectsList />, { route: '/projects' });

      await waitFor(() => {
        expect(screen.getByText('توضیحات پروژه اول')).toBeInTheDocument();
        expect(screen.getByText('توضیحات پروژه دوم')).toBeInTheDocument();
      });
    });

    it('shows status and priority badges for each project', async () => {
      mockUseProjects.mockReturnValue({
        data: mockProjects,
        isLoading: false,
        isError: false,
        error: null,
      } as ReturnType<typeof useProjects>);

      render(<ProjectsList />, { route: '/projects' });

      await waitFor(() => {
        expect(screen.getByText('در حال انجام')).toBeInTheDocument();
        // "تکمیل‌شده" appears in both a card badge and the task counts section
        expect(screen.getAllByText('تکمیل‌شده').length).toBeGreaterThanOrEqual(1);
      });
    });
  });

  describe('Search/filter functionality', () => {
    it('filters projects by name when user types in search input', async () => {
      const user = userEvent.setup();
      mockUseProjects.mockReturnValue({
        data: mockProjects,
        isLoading: false,
        isError: false,
        error: null,
      } as ReturnType<typeof useProjects>);

      render(<ProjectsList />, { route: '/projects' });

      await waitFor(() => {
        expect(screen.getByText('پروژه اول')).toBeInTheDocument();
        expect(screen.getByText('پروژه دوم')).toBeInTheDocument();
      });

      const searchInput = screen.getByPlaceholderText('جستجوی پروژه‌ها...');
      await user.type(searchInput, 'اول');

      expect(screen.getByText('پروژه اول')).toBeInTheDocument();
      expect(screen.queryByText('پروژه دوم')).not.toBeInTheDocument();
    });

    it('shows all projects when search input is cleared', async () => {
      const user = userEvent.setup();
      mockUseProjects.mockReturnValue({
        data: mockProjects,
        isLoading: false,
        isError: false,
        error: null,
      } as ReturnType<typeof useProjects>);

      render(<ProjectsList />, { route: '/projects' });

      await waitFor(() => screen.getByText('پروژه اول'));

      const searchInput = screen.getByPlaceholderText('جستجوی پروژه‌ها...');
      await user.type(searchInput, 'اول');
      expect(screen.queryByText('پروژه دوم')).not.toBeInTheDocument();

      await user.clear(searchInput);
      expect(screen.getByText('پروژه دوم')).toBeInTheDocument();
    });

    it('shows no results message when filter matches nothing', async () => {
      const user = userEvent.setup();
      mockUseProjects.mockReturnValue({
        data: mockProjects,
        isLoading: false,
        isError: false,
        error: null,
      } as ReturnType<typeof useProjects>);

      render(<ProjectsList />, { route: '/projects' });

      await waitFor(() => screen.getByText('پروژه اول'));

      const searchInput = screen.getByPlaceholderText('جستجوی پروژه‌ها...');
      await user.type(searchInput, 'xyz-not-a-project');

      await waitFor(() => {
        expect(screen.getByText(/هنوز پروژه‌ای وجود ندارد/i)).toBeInTheDocument();
      });
    });
  });

  describe('Create project modal', () => {
    it('opens the create project modal when "+ پروژه جدید" button is clicked', async () => {
      const user = userEvent.setup();
      mockUseProjects.mockReturnValue({
        data: mockProjects,
        isLoading: false,
        isError: false,
        error: null,
      } as ReturnType<typeof useProjects>);

      render(<ProjectsList />, { route: '/projects' });

      await waitFor(() => screen.getByText('پروژه اول'));

      const createButton = screen.getByRole('button', { name: /پروژه جدید/i });
      await user.click(createButton);

      await waitFor(() => {
        expect(screen.getByText('ایجاد پروژه جدید')).toBeInTheDocument();
      });
    });

    it('closes the modal when cancel button is clicked', async () => {
      const user = userEvent.setup();
      mockUseProjects.mockReturnValue({
        data: mockProjects,
        isLoading: false,
        isError: false,
        error: null,
      } as ReturnType<typeof useProjects>);

      render(<ProjectsList />, { route: '/projects' });

      await waitFor(() => screen.getByText('پروژه اول'));

      await user.click(screen.getByRole('button', { name: /پروژه جدید/i }));
      await waitFor(() => {
        expect(screen.getByText('ایجاد پروژه جدید')).toBeInTheDocument();
      });

      const closeButton = screen.getByRole('button', { name: /انصراف/i });
      await user.click(closeButton);

      await waitFor(() => {
        expect(screen.queryByText('ایجاد پروژه جدید')).not.toBeInTheDocument();
      });
    });

    it('closes modal when overlay is clicked', async () => {
      const user = userEvent.setup();
      mockUseProjects.mockReturnValue({
        data: mockProjects,
        isLoading: false,
        isError: false,
        error: null,
      } as ReturnType<typeof useProjects>);

      render(<ProjectsList />, { route: '/projects' });

      await waitFor(() => screen.getByText('پروژه اول'));
      await user.click(screen.getByRole('button', { name: /پروژه جدید/i }));
      await waitFor(() => {
        expect(screen.getByText('ایجاد پروژه جدید')).toBeInTheDocument();
      });

      // Click outside the modal content (on the overlay)
      const modal = screen.getByText('ایجاد پروژه جدید').closest('.modal-overlay');
      if (modal) {
        await user.click(modal);
      }

      await waitFor(() => {
        expect(screen.queryByText('ایجاد پروژه جدید')).not.toBeInTheDocument();
      });
    });

    it('validates that project name is required', async () => {
      const user = userEvent.setup();
      mockUseProjects.mockReturnValue({
        data: mockProjects,
        isLoading: false,
        isError: false,
        error: null,
      } as ReturnType<typeof useProjects>);

      render(<ProjectsList />, { route: '/projects' });

      await waitFor(() => screen.getByText('پروژه اول'));
      await user.click(screen.getByRole('button', { name: /پروژه جدید/i }));

      await waitFor(() => {
        expect(screen.getByText('ایجاد پروژه جدید')).toBeInTheDocument();
      });

      // Submit without filling name — browser HTML5 validation prevents submission
      const submitButton = screen.getByRole('button', { name: /ایجاد پروژه/i });
      await user.click(submitButton);

      // Modal should still be open (form didn't submit)
      await waitFor(() => {
        expect(screen.getByText('ایجاد پروژه جدید')).toBeInTheDocument();
      });
    });

    it('shows priority options in the form', async () => {
      const user = userEvent.setup();
      mockUseProjects.mockReturnValue({
        data: mockProjects,
        isLoading: false,
        isError: false,
        error: null,
      } as ReturnType<typeof useProjects>);

      render(<ProjectsList />, { route: '/projects' });

      await waitFor(() => screen.getByText('پروژه اول'));
      await user.click(screen.getByRole('button', { name: /پروژه جدید/i }));

      await waitFor(() => {
        expect(screen.getByText('ایجاد پروژه جدید')).toBeInTheDocument();
      });

      // Scope to the modal to avoid card badge conflicts
      const modal = screen.getByRole('heading', { name: 'ایجاد پروژه جدید' }).closest('.modal-content') as HTMLElement;
      expect(within(modal).getByText('کم')).toBeInTheDocument();
      expect(within(modal).getByText('متوسط')).toBeInTheDocument();
      expect(within(modal).getByText('بالا')).toBeInTheDocument();
      expect(within(modal).getByText('بحرانی')).toBeInTheDocument();
    });
  });
});
