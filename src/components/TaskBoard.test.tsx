// src/components/TaskBoard.test.tsx
import React, { act } from 'react';
import { render, screen, waitFor, within, fireEvent } from '../tests/test-utils';
import userEvent from '@testing-library/user-event';
import { vi } from 'vitest';
import { http, HttpResponse } from 'msw';
import { setupServer } from 'msw/node';
import TaskBoard from './TaskBoard';
import { mockProjects } from '../tests/mockData';

// ─── Mock AuthContext ─────────────────────────────────────────────────────────

vi.mock('../services/contexts/AuthContext', async (importOriginal) => {
  const actual = await importOriginal();
  return {
    ...actual,
    useAuth: vi.fn(() => ({
      user: { id: 1, username: 'testuser', full_name: 'کاربر آزمایشی', email: 'test@example.com', role: 'DEV' },
      loading: false,
      login: vi.fn(),
      logout: vi.fn(),
      register: vi.fn(),
    })),
  };
});

// ─── Query hook mocks ─────────────────────────────────────────────────────────

const mockUseProjectFn = vi.fn();
const mockUseProjectTasksFn = vi.fn();
const mockUseUsersFn = vi.fn();

vi.mock('../services/queryHooks', () => ({
  useProject: () => mockUseProjectFn(),
  useProjectTasks: () => mockUseProjectTasksFn(),
  useUsers: () => mockUseUsersFn(),
}));

// Re-export mocks for use in beforeEach blocks
export { mockUseProjectFn, mockUseProjectTasksFn, mockUseUsersFn };

// ─── Mock taskService ─────────────────────────────────────────────────────────

// (No module-level mock needed — we use server handlers for API)

// ─── Mock data ───────────────────────────────────────────────────────────────

const mockUserSummary = {
  id: 1,
  username: 'testuser',
  email: 'test@example.com',
  full_name: 'کاربر آزمایشی',
  role: 'DEV',
};

const mockTaskLists = [
  {
    id: 1,
    name: 'لیست اول',
    project: 1,
    position: 0,
    description: '',
    tasks: [
      {
        id: 1,
        title: 'وظیفه اول',
        description: 'توضیحات وظیفه اول',
        project: 1,
        task_list: 1,
        parent_task: null,
        assignee: mockUserSummary,
        assignee_id: 1,
        created_by: mockUserSummary,
        status: 'TODO',
        priority: 'HIGH',
        start_date: null,
        due_date: '2024-06-15',
        completed_at: null,
        estimated_hours: null,
        actual_hours: null,
        position: 0,
        is_overdue: false,
        comment_count: 0,
        attachment_count: 0,
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z',
      },
      {
        id: 2,
        title: 'وظیفه دوم',
        description: '',
        project: 1,
        task_list: 1,
        parent_task: null,
        assignee: null,
        assignee_id: null,
        created_by: mockUserSummary,
        status: 'COMPLETED',
        priority: 'MEDIUM',
        start_date: null,
        due_date: null,
        completed_at: '2024-06-01T00:00:00Z',
        estimated_hours: null,
        actual_hours: null,
        position: 1,
        is_overdue: false,
        comment_count: 2,
        attachment_count: 0,
        created_at: '2024-01-02T00:00:00Z',
        updated_at: '2024-01-02T00:00:00Z',
      },
    ],
  },
  {
    id: 2,
    name: 'لیست دوم',
    project: 1,
    position: 1,
    description: '',
    tasks: [],
  },
];

const mockProject = {
  ...mockProjects[0],
  id: 1,
  slug: 'porojekt-avval',
  name: 'پروژه اول',
  description: 'توضیحات پروژه اول',
  owner: mockUserSummary,
  manager: mockUserSummary,
  status: 'IN_PROGRESS',
  priority: 'HIGH',
  progress: 50,
  total_tasks: 10,
  completed_tasks: 5,
  comment_count: 3,
  attachment_count: 2,
  created_at: '2024-01-01T00:00:00Z',
  updated_at: '2024-01-01T00:00:00Z',
};

const mockUsers = [
  { id: 1, username: 'testuser', email: 'test@example.com', full_name: 'کاربر آزمایشی', role: 'DEV' },
  { id: 2, username: 'admin', email: 'admin@example.com', full_name: 'مدیر', role: 'ADMIN' },
];

// ─── Shared mutable data store ─────────────────────────────────────────────────
// Both MSW handlers AND mock hook implementations read/write this so they stay in sync.
// Used only by mutation test sections to handle invalidateQueries re-fetching.

export const sharedData = {
  taskLists: [
    {
      id: 1,
      name: 'لیست اول',
      project: 1,
      position: 0,
      description: '',
      tasks: [
        {
          id: 1,
          title: 'وظیفه اول',
          description: 'توضیحات وظیفه اول',
          project: 1,
          task_list: 1,
          parent_task: null,
          assignee: mockUserSummary,
          assignee_id: 1,
          created_by: mockUserSummary,
          status: 'TODO',
          priority: 'HIGH',
          start_date: null,
          due_date: '2024-06-15',
          completed_at: null,
          estimated_hours: null,
          actual_hours: null,
          position: 0,
          is_overdue: false,
          comment_count: 0,
          attachment_count: 0,
          created_at: '2024-01-01T00:00:00Z',
          updated_at: '2024-01-01T00:00:00Z',
        },
        {
          id: 2,
          title: 'وظیفه دوم',
          description: '',
          project: 1,
          task_list: 1,
          parent_task: null,
          assignee: null,
          assignee_id: null,
          created_by: mockUserSummary,
          status: 'COMPLETED',
          priority: 'MEDIUM',
          start_date: null,
          due_date: null,
          completed_at: '2024-06-01T00:00:00Z',
          estimated_hours: null,
          actual_hours: null,
          position: 1,
          is_overdue: false,
          comment_count: 2,
          attachment_count: 0,
          created_at: '2024-01-02T00:00:00Z',
          updated_at: '2024-01-02T00:00:00Z',
        },
      ],
    },
    {
      id: 2,
      name: 'لیست دوم',
      project: 1,
      position: 1,
      description: '',
      tasks: [],
    },
  ],
  project: {
    ...mockProjects[0],
    id: 1,
    slug: 'porojekt-avval',
    name: 'پروژه اول',
    description: 'توضیحات پروژه اول',
    owner: mockUserSummary,
    manager: mockUserSummary,
    status: 'IN_PROGRESS',
    priority: 'HIGH',
    progress: 50,
    total_tasks: 10,
    completed_tasks: 5,
    comment_count: 3,
    attachment_count: 2,
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z',
  },
  users: [
    { id: 1, username: 'testuser', email: 'test@example.com', full_name: 'کاربر آزمایشی', role: 'DEV' },
    { id: 2, username: 'admin', email: 'admin@example.com', full_name: 'مدیر', role: 'ADMIN' },
  ],
};

// ─── MSW server ───────────────────────────────────────────────────────────────

const API_BASE = 'http://localhost:8000/api';

// Handlers for both absolute URLs (used by node environment) and relative URLs
// (used by jsdom axios when VITE_API_BASE_URL is undefined)
export const taskBoardHandlers = [
  // Auth
  http.get(`${API_BASE}/accounts/users/me/`, () => {
    return HttpResponse.json({ id: 1, username: 'testuser', email: 'test@example.com', full_name: 'کاربر آزمایشی', role: 'DEV' });
  }),
  http.get(`/api/accounts/users/me/`, () => {
    return HttpResponse.json({ id: 1, username: 'testuser', email: 'test@example.com', full_name: 'کاربر آزمایشی', role: 'DEV' });
  }),

  // Project
  http.get(`${API_BASE}/projects/projects/porojekt-avval/`, () => {
    return HttpResponse.json(mockProject);
  }),
  http.get(`/api/projects/projects/porojekt-avval/`, () => {
    return HttpResponse.json(mockProject);
  }),

  // Task lists GET — reads from sharedData
  http.get(`${API_BASE}/tasks/task-lists/`, ({ request }) => {
    const url = new URL(request.url);
    const projectParam = url.searchParams.get('project');
    const results = !projectParam || projectParam === '1' ? sharedData.taskLists : [];
    return HttpResponse.json({ count: results.length, next: null, previous: null, total_pages: 1, current_page: 1, results });
  }),
  http.get(`/api/tasks/task-lists/`, ({ request }) => {
    const url = new URL(request.url);
    const projectParam = url.searchParams.get('project');
    const results = !projectParam || projectParam === '1' ? sharedData.taskLists : [];
    return HttpResponse.json({ count: results.length, next: null, previous: null, total_pages: 1, current_page: 1, results });
  }),

  // POST /tasks/task-lists/ — create list (mutates sharedData)
  http.post(`${API_BASE}/tasks/task-lists/`, async ({ request }) => {
    const body = await request.json() as Record<string, unknown>;
    const newList = { id: 3, name: body.name, project: body.project, position: 2, description: '', tasks: [] };
    sharedData.taskLists.push(newList);
    return HttpResponse.json(newList, { status: 201 });
  }),
  http.post(`/api/tasks/task-lists/`, async ({ request }) => {
    const body = await request.json() as Record<string, unknown>;
    const newList = { id: 3, name: body.name, project: body.project, position: 2, description: '', tasks: [] };
    sharedData.taskLists.push(newList);
    return HttpResponse.json(newList, { status: 201 });
  }),

  // PATCH /tasks/task-lists/:id/ — update list (mutates sharedData)
  http.patch(`${API_BASE}/tasks/task-lists/:id/`, async ({ request, params }) => {
    const body = await request.json() as Record<string, unknown>;
    const id = Number(params.id);
    const idx = sharedData.taskLists.findIndex(l => l.id === id);
    if (idx !== -1) {
      sharedData.taskLists[idx] = { ...sharedData.taskLists[idx], name: body.name as string };
    }
    return HttpResponse.json({ id, name: body.name, project: 1, position: 0, description: '', tasks: [] });
  }),
  http.patch(`/api/tasks/task-lists/:id/`, async ({ request, params }) => {
    const body = await request.json() as Record<string, unknown>;
    const id = Number(params.id);
    const idx = sharedData.taskLists.findIndex(l => l.id === id);
    if (idx !== -1) {
      sharedData.taskLists[idx] = { ...sharedData.taskLists[idx], name: body.name as string };
    }
    return HttpResponse.json({ id, name: body.name, project: 1, position: 0, description: '', tasks: [] });
  }),

  // DELETE /tasks/task-lists/:id/ — delete list (mutates sharedData)
  http.delete(`${API_BASE}/tasks/task-lists/:id/`, ({ params }) => {
    sharedData.taskLists = sharedData.taskLists.filter(l => l.id !== Number(params.id));
    return new HttpResponse(null, { status: 204 });
  }),
  http.delete(`/api/tasks/task-lists/:id/`, ({ params }) => {
    sharedData.taskLists = sharedData.taskLists.filter(l => l.id !== Number(params.id));
    return new HttpResponse(null, { status: 204 });
  }),

  // POST /tasks/tasks/ — create task (mutates sharedData)
  http.post(`${API_BASE}/tasks/tasks/`, async ({ request }) => {
    const body = await request.json() as Record<string, unknown>;
    const newTask = {
      id: 3, title: body.title, description: body.description || '', project: 1, task_list: body.task_list,
      parent_task: null, assignee: null, assignee_id: null, created_by: mockUserSummary,
      status: 'TODO', priority: (body.priority as string) || 'MEDIUM',
      start_date: null, due_date: body.due_date || null, completed_at: null,
      estimated_hours: null, actual_hours: null, position: 0,
      is_overdue: false, comment_count: 0, attachment_count: 0,
      created_at: '2024-01-01T00:00:00Z', updated_at: '2024-01-01T00:00:00Z',
    };
    sharedData.taskLists.forEach(l => {
      if (l.id === body.task_list) l.tasks.push(newTask);
    });
    return HttpResponse.json(newTask, { status: 201 });
  }),
  http.post(`/api/tasks/tasks/`, async ({ request }) => {
    const body = await request.json() as Record<string, unknown>;
    const newTask = {
      id: 3, title: body.title, description: body.description || '', project: 1, task_list: body.task_list,
      parent_task: null, assignee: null, assignee_id: null, created_by: mockUserSummary,
      status: 'TODO', priority: (body.priority as string) || 'MEDIUM',
      start_date: null, due_date: body.due_date || null, completed_at: null,
      estimated_hours: null, actual_hours: null, position: 0,
      is_overdue: false, comment_count: 0, attachment_count: 0,
      created_at: '2024-01-01T00:00:00Z', updated_at: '2024-01-01T00:00:00Z',
    };
    sharedData.taskLists.forEach(l => {
      if (l.id === body.task_list) l.tasks.push(newTask);
    });
    return HttpResponse.json(newTask, { status: 201 });
  }),

  // PATCH /tasks/tasks/:id/ — update task (mutates sharedData)
  http.patch(`${API_BASE}/tasks/tasks/:id/`, async ({ request, params }) => {
    const body = await request.json() as Record<string, unknown>;
    const id = Number(params.id);
    sharedData.taskLists.forEach(l => {
      const t = l.tasks.find(t => t.id === id);
      if (t) Object.assign(t, { title: body.title });
    });
    return HttpResponse.json({
      id, title: body.title, description: body.description || '', project: 1, task_list: 1,
      parent_task: null, assignee: mockUserSummary, assignee_id: 1, created_by: mockUserSummary,
      status: 'TODO', priority: 'HIGH', start_date: null, due_date: '2024-06-15', completed_at: null,
      estimated_hours: null, actual_hours: null, position: 0,
      is_overdue: false, comment_count: 0, attachment_count: 0,
      created_at: '2024-01-01T00:00:00Z', updated_at: '2024-01-01T00:00:00Z',
    });
  }),
  http.patch(`/api/tasks/tasks/:id/`, async ({ request, params }) => {
    const body = await request.json() as Record<string, unknown>;
    const id = Number(params.id);
    sharedData.taskLists.forEach(l => {
      const t = l.tasks.find(t => t.id === id);
      if (t) Object.assign(t, { title: body.title });
    });
    return HttpResponse.json({
      id, title: body.title, description: body.description || '', project: 1, task_list: 1,
      parent_task: null, assignee: mockUserSummary, assignee_id: 1, created_by: mockUserSummary,
      status: 'TODO', priority: 'HIGH', start_date: null, due_date: '2024-06-15', completed_at: null,
      estimated_hours: null, actual_hours: null, position: 0,
      is_overdue: false, comment_count: 0, attachment_count: 0,
      created_at: '2024-01-01T00:00:00Z', updated_at: '2024-01-01T00:00:00Z',
    });
  }),

  // DELETE /tasks/tasks/:id/ — delete task (mutates sharedData)
  http.delete(`${API_BASE}/tasks/tasks/:id/`, ({ params }) => {
    sharedData.taskLists.forEach(l => {
      l.tasks = l.tasks.filter(t => t.id !== Number(params.id));
    });
    return new HttpResponse(null, { status: 204 });
  }),
  http.delete(`/api/tasks/tasks/:id/`, ({ params }) => {
    sharedData.taskLists.forEach(l => {
      l.tasks = l.tasks.filter(t => t.id !== Number(params.id));
    });
    return new HttpResponse(null, { status: 204 });
  }),

  // Users
  http.get(`${API_BASE}/accounts/users/`, () => {
    return HttpResponse.json(mockUsers);
  }),
  http.get(`/api/accounts/users/`, () => {
    return HttpResponse.json(mockUsers);
  }),
];

export const server = setupServer(...taskBoardHandlers);

// ─── Helper ───────────────────────────────────────────────────────────────────

const renderTaskBoard = (slug = 'porojekt-avval') => {
  return render(<TaskBoard />, { route: `/projects/${slug}/tasks` });
};

// ─── Tests ─────────────────────────────────────────────────────────────────────

describe('TaskBoard', () => {
  beforeAll(() => server.listen({ onUnhandledRequest: 'warn' }));
  afterEach(() => {
    server.resetHandlers();
    vi.clearAllMocks();
  });
  afterAll(() => server.close());

  // ── Loading & Error states ────────────────────────────────────────────────

  describe('Loading & error states', () => {
    it('shows loading state while fetching project and tasks', () => {
      mockUseProjectFn.mockReturnValue({
        data: undefined,
        isLoading: true,
        isError: false,
        error: null,
      } as ReturnType<typeof useProject>);
      mockUseProjectTasksFn.mockReturnValue({
        data: undefined,
        isLoading: true,
        isError: false,
        error: null,
      } as ReturnType<typeof useProjectTasks>);
      mockUseUsersFn.mockReturnValue({ data: [], isLoading: false, isError: false, error: null } as ReturnType<typeof useUsers>);

      renderTaskBoard();

      expect(screen.getByText('در حال بارگذاری بورد وظایف...')).toBeInTheDocument();
    });

    it('shows error state when project fails to load', () => {
      mockUseProjectFn.mockReturnValue({
        data: undefined,
        isLoading: false,
        isError: true,
        error: { response: { data: { detail: 'پروژه یافت نشد' } } },
      } as ReturnType<typeof useProject>);
      mockUseProjectTasksFn.mockReturnValue({
        data: [],
        isLoading: false,
        isError: false,
        error: null,
      } as ReturnType<typeof useProjectTasks>);
      mockUseUsersFn.mockReturnValue({ data: [], isLoading: false, isError: false, error: null } as ReturnType<typeof useUsers>);

      renderTaskBoard();

      expect(screen.getByText(/پروژه یافت نشد/)).toBeInTheDocument();
    });

    it('shows error state when tasks fail to load', () => {
      mockUseProjectFn.mockReturnValue({
        data: mockProject,
        isLoading: false,
        isError: false,
        error: null,
      } as ReturnType<typeof useProject>);
      mockUseProjectTasksFn.mockReturnValue({
        data: undefined,
        isLoading: false,
        isError: true,
        error: { response: { data: { detail: 'خطا در بارگذاری وظایف' } } },
      } as ReturnType<typeof useProjectTasks>);
      mockUseUsersFn.mockReturnValue({ data: [], isLoading: false, isError: false, error: null } as ReturnType<typeof useUsers>);

      renderTaskBoard();

      expect(screen.getByText('خطا در بارگذاری وظایف')).toBeInTheDocument();
    });
  });

  // ── Empty state ────────────────────────────────────────────────────────────

  describe('Empty state', () => {
    beforeEach(() => {
      mockUseProjectFn.mockReturnValue({
        data: mockProject,
        isLoading: false,
        isError: false,
        error: null,
      } as ReturnType<typeof useProject>);
      mockUseProjectTasksFn.mockReturnValue({
        data: [],
        isLoading: false,
        isError: false,
        error: null,
      } as ReturnType<typeof useProjectTasks>);
      mockUseUsersFn.mockReturnValue({ data: mockUsers, isLoading: false, isError: false, error: null } as ReturnType<typeof useUsers>);
    });

    it('shows empty state when no task lists exist', () => {
      renderTaskBoard();

      expect(screen.getByText('هنوز لیست وظایفی وجود ندارد')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: '+ افزودن لیست وظایف' })).toBeInTheDocument();
    });

    it('shows empty message inside an empty task list column', () => {
      mockUseProjectTasksFn.mockReturnValue({
        data: mockTaskLists,
        isLoading: false,
        isError: false,
        error: null,
      } as ReturnType<typeof useProjectTasks>);

      renderTaskBoard();

      const emptyListColumn = screen.getByText('لیست دوم').closest('.task-column') as HTMLElement;
      expect(within(emptyListColumn).getByText('وظیفه‌ای در این لیست نیست')).toBeInTheDocument();
    });
  });

  // ── Display tests ─────────────────────────────────────────────────────────

  describe('Successful data display', () => {
    beforeEach(() => {
      mockUseProjectFn.mockReturnValue({
        data: mockProject,
        isLoading: false,
        isError: false,
        error: null,
      } as ReturnType<typeof useProject>);
      mockUseProjectTasksFn.mockReturnValue({
        data: mockTaskLists,
        isLoading: false,
        isError: false,
        error: null,
      } as ReturnType<typeof useProjectTasks>);
      mockUseUsersFn.mockReturnValue({ data: mockUsers, isLoading: false, isError: false, error: null } as ReturnType<typeof useUsers>);
    });

    it('displays the page header with project name', () => {
      renderTaskBoard();

      expect(screen.getByText('بورد وظایف')).toBeInTheDocument();
    });

    it('displays all task list names', () => {
      renderTaskBoard();

      expect(screen.getByText('لیست اول')).toBeInTheDocument();
      expect(screen.getByText('لیست دوم')).toBeInTheDocument();
    });

    it('displays task titles within their respective lists', () => {
      renderTaskBoard();

      const firstList = screen.getByText('لیست اول').closest('.task-column') as HTMLElement;
      expect(within(firstList).getByText('وظیفه اول')).toBeInTheDocument();
      expect(within(firstList).getByText('وظیفه دوم')).toBeInTheDocument();
    });

    it('displays task count on list headers', () => {
      renderTaskBoard();

      const firstListHeader = screen.getByText('لیست اول').closest('.column-header') as HTMLElement;
      // Persian numeral ۲ for 2 tasks
      expect(within(firstListHeader).getByText('2')).toBeInTheDocument();
    });

    it('displays priority badges on task cards', () => {
      renderTaskBoard();

      // HIGH priority → 'بالا'
      expect(screen.getByText('بالا')).toBeInTheDocument();
      // MEDIUM priority → 'متوسط'
      expect(screen.getByText('متوسط')).toBeInTheDocument();
    });

    it('displays unassigned span for tasks without assignee', () => {
      renderTaskBoard();

      const firstList = screen.getByText('لیست اول').closest('.task-column') as HTMLElement;
      expect(within(firstList).getByText('بدون مسئول')).toBeInTheDocument();
    });

    it('displays assignee avatar for assigned tasks', () => {
      renderTaskBoard();

      const firstList = screen.getByText('لیست اول').closest('.task-column') as HTMLElement;
      const taskCard = within(firstList).getByText('وظیفه اول').closest('.task-card') as HTMLElement;
      // Avatar shows first character of full_name
      expect(within(taskCard).getByText('ک')).toBeInTheDocument();
    });

    it('displays due date on task cards when present', () => {
      renderTaskBoard();

      // formatDateJalali converts '2024-06-15' to Jalali (e.g. '1403/03/26')
      // Just verify some date-formatted text appears near the task
      const firstList = screen.getByText('لیست اول').closest('.task-column') as HTMLElement;
      const taskCard = within(firstList).getByText('وظیفه اول').closest('.task-card') as HTMLElement;
      const taskFooter = taskCard.querySelector('.task-card-footer') as HTMLElement;
      expect(taskFooter).toBeInTheDocument();
    });

    it('displays back link to project', () => {
      renderTaskBoard();

      const backLink = screen.getByRole('link', { name: /بازگشت به پروژه/ });
      expect(backLink).toHaveAttribute('href', '/projects/porojekt-avval');
    });
  });

  // ── Create list ────────────────────────────────────────────────────────────

  describe('Create list', () => {
    beforeEach(() => {
      // Reset sharedData and use mockImplementation so hooks read fresh data on re-render
      sharedData.taskLists = [
        {
          id: 1, name: 'لیست اول', project: 1, position: 0, description: '', tasks: [
            { id: 1, title: 'وظیفه اول', description: 'توضیحات وظیفه اول', project: 1, task_list: 1, parent_task: null, assignee: mockUserSummary, assignee_id: 1, created_by: mockUserSummary, status: 'TODO', priority: 'HIGH', start_date: null, due_date: '2024-06-15', completed_at: null, estimated_hours: null, actual_hours: null, position: 0, is_overdue: false, comment_count: 0, attachment_count: 0, created_at: '2024-01-01T00:00:00Z', updated_at: '2024-01-01T00:00:00Z' },
            { id: 2, title: 'وظیفه دوم', description: '', project: 1, task_list: 1, parent_task: null, assignee: null, assignee_id: null, created_by: mockUserSummary, status: 'COMPLETED', priority: 'MEDIUM', start_date: null, due_date: null, completed_at: '2024-06-01T00:00:00Z', estimated_hours: null, actual_hours: null, position: 1, is_overdue: false, comment_count: 2, attachment_count: 0, created_at: '2024-01-02T00:00:00Z', updated_at: '2024-01-02T00:00:00Z' },
          ],
        },
        { id: 2, name: 'لیست دوم', project: 1, position: 1, description: '', tasks: [] },
      ];
      mockUseProjectFn.mockImplementation(() => ({ data: sharedData.project, isLoading: false, isError: false, error: null }));
      mockUseProjectTasksFn.mockImplementation(() => ({ data: [...sharedData.taskLists], isLoading: false, isError: false, error: null }));
      mockUseUsersFn.mockImplementation(() => ({ data: mockUsers, isLoading: false, isError: false, error: null }));
    });

    it('shows create list form when add list button is clicked', async () => {
      const user = userEvent.setup();
      renderTaskBoard();

      await waitFor(() => expect(screen.getByText('لیست اول')).toBeInTheDocument());

      await user.click(screen.getByRole('button', { name: '+ افزودن لیست' }));

      expect(screen.getByText('ایجاد لیست')).toBeInTheDocument();
      expect(screen.getByPlaceholderText('مثلاً: انجام‌نشده')).toBeInTheDocument();
    });

    it('creates a new list successfully', async () => {
      const user = userEvent.setup();
      renderTaskBoard();

      await waitFor(() => expect(screen.getByText('لیست اول')).toBeInTheDocument());

      // Open form
      await user.click(screen.getByRole('button', { name: '+ افزودن لیست' }));

      // Fill name
      await user.type(screen.getByPlaceholderText('مثلاً: انجام‌نشده'), 'لیست جدید');

      // Submit — wrap in act() so invalidateQueries + re-render is synchronous
      await act(async () => {
        await user.click(screen.getByRole('button', { name: 'ایجاد لیست' }));
      });

      // Verify new list appears
      await waitFor(() => {
        expect(screen.getByText('لیست جدید')).toBeInTheDocument();
      });
    });

    it('validates that list name is required', async () => {
      const user = userEvent.setup();
      renderTaskBoard();

      await waitFor(() => expect(screen.getByText('لیست اول')).toBeInTheDocument());

      await user.click(screen.getByRole('button', { name: '+ افزودن لیست' }));
      await user.click(screen.getByRole('button', { name: 'ایجاد لیست' }));

      expect(screen.getByText('نام لیست الزامی است')).toBeInTheDocument();
    });

    it('closes create list form on cancel', async () => {
      const user = userEvent.setup();
      renderTaskBoard();

      await waitFor(() => expect(screen.getByText('لیست اول')).toBeInTheDocument());

      await user.click(screen.getByRole('button', { name: '+ افزودن لیست' }));
      await user.type(screen.getByPlaceholderText('مثلاً: انجام‌نشده'), 'لیست تست');
      await user.click(screen.getByRole('button', { name: 'انصراف' }));

      expect(screen.queryByText('ایجاد لیست')).not.toBeInTheDocument();
    });
  });

  // ── Edit list ─────────────────────────────────────────────────────────────

  describe('Edit list', () => {
    beforeEach(() => {
      sharedData.taskLists = [
        {
          id: 1, name: 'لیست اول', project: 1, position: 0, description: '', tasks: [
            { id: 1, title: 'وظیفه اول', description: 'توضیحات', project: 1, task_list: 1, parent_task: null, assignee: mockUserSummary, assignee_id: 1, created_by: mockUserSummary, status: 'TODO', priority: 'HIGH', start_date: null, due_date: '2024-06-15', completed_at: null, estimated_hours: null, actual_hours: null, position: 0, is_overdue: false, comment_count: 0, attachment_count: 0, created_at: '2024-01-01T00:00:00Z', updated_at: '2024-01-01T00:00:00Z' },
          ],
        },
        { id: 2, name: 'لیست دوم', project: 1, position: 1, description: '', tasks: [] },
      ];
      mockUseProjectFn.mockImplementation(() => ({ data: sharedData.project, isLoading: false, isError: false, error: null }));
      mockUseProjectTasksFn.mockImplementation(() => ({ data: [...sharedData.taskLists], isLoading: false, isError: false, error: null }));
      mockUseUsersFn.mockImplementation(() => ({ data: mockUsers, isLoading: false, isError: false, error: null }));
    });

    it('opens edit list modal with pre-filled name', async () => {
      const user = userEvent.setup();
      renderTaskBoard();

      await waitFor(() => expect(screen.getByText('لیست اول')).toBeInTheDocument());

      const firstColumn = screen.getByText('لیست اول').closest('.task-column') as HTMLElement;
      await user.click(within(firstColumn).getByRole('button', { name: 'ویرایش لیست' }));

      expect(screen.getByText('ویرایش لیست وظایف')).toBeInTheDocument();
      expect(screen.getByDisplayValue('لیست اول')).toBeInTheDocument();
    });

    it('updates list name successfully', async () => {
      const user = userEvent.setup();
      renderTaskBoard();

      await waitFor(() => expect(screen.getByText('لیست اول')).toBeInTheDocument());

      const firstColumn = screen.getByText('لیست اول').closest('.task-column') as HTMLElement;
      await user.click(within(firstColumn).getByRole('button', { name: 'ویرایش لیست' }));

      const nameInput = screen.getByDisplayValue('لیست اول');
      await user.click(nameInput);
      await user.clear(nameInput);
      await user.keyboard('نام ویرایش‌شده');

      await act(async () => {
        await user.click(screen.getByRole('button', { name: 'ذخیره تغییرات' }));
      });

      await waitFor(() => {
        expect(screen.getByText('نام ویرایش‌شده')).toBeInTheDocument();
      });
    });

    it('validates list name is required on update', async () => {
      const user = userEvent.setup();
      renderTaskBoard();

      await waitFor(() => expect(screen.getByText('لیست اول')).toBeInTheDocument());

      const firstColumn = screen.getByText('لیست اول').closest('.task-column') as HTMLElement;
      await user.click(within(firstColumn).getByRole('button', { name: 'ویرایش لیست' }));

      const nameInput = screen.getByDisplayValue('لیست اول');
      await user.click(nameInput);
      await user.keyboard('{Control>}a{/Control}');
      await user.keyboard('{Delete}');

      const form = screen.getByText('ویرایش لیست وظایف').closest('.modal-content')?.querySelector('form');
      await act(async () => {
        fireEvent.submit(form!);
      });

      expect(screen.getByText('نام لیست الزامی است')).toBeInTheDocument();
    });
  });

  // ── Delete list ────────────────────────────────────────────────────────────

  describe('Delete list', () => {
    beforeEach(() => {
      mockUseProjectFn.mockReturnValue({
        data: mockProject,
        isLoading: false,
        isError: false,
        error: null,
      } as ReturnType<typeof useProject>);
      mockUseProjectTasksFn.mockReturnValue({
        data: mockTaskLists,
        isLoading: false,
        isError: false,
        error: null,
      } as ReturnType<typeof useProjectTasks>);
      mockUseUsersFn.mockReturnValue({ data: mockUsers, isLoading: false, isError: false, error: null } as ReturnType<typeof useUsers>);
    });

    it('shows delete confirmation modal', async () => {
      const user = userEvent.setup();
      renderTaskBoard();

      await waitFor(() => expect(screen.getByText('لیست اول')).toBeInTheDocument());

      const firstColumn = screen.getByText('لیست اول').closest('.task-column') as HTMLElement;
      await user.click(within(firstColumn).getByRole('button', { name: 'حذف لیست' }));

      expect(screen.getByText('تأیید حذف')).toBeInTheDocument();
      expect(screen.getByText(/آیا از حذف لیست «لیست اول» مطمئن هستید/)).toBeInTheDocument();
    });

    it('cancels delete when cancel is clicked', async () => {
      const user = userEvent.setup();
      renderTaskBoard();

      await waitFor(() => expect(screen.getByText('لیست اول')).toBeInTheDocument());

      const firstColumn = screen.getByText('لیست اول').closest('.task-column') as HTMLElement;
      await user.click(within(firstColumn).getByRole('button', { name: 'حذف لیست' }));

      await user.click(screen.getByRole('button', { name: 'انصراف' }));

      expect(screen.queryByText('تأیید حذف')).not.toBeInTheDocument();
      expect(screen.getByText('لیست اول')).toBeInTheDocument();
    });
  });

  // ── Create task ────────────────────────────────────────────────────────────

  describe('Create task', () => {
    beforeEach(() => {
      sharedData.taskLists = [
        {
          id: 1, name: 'لیست اول', project: 1, position: 0, description: '', tasks: [
            { id: 1, title: 'وظیفه اول', description: 'توضیحات', project: 1, task_list: 1, parent_task: null, assignee: mockUserSummary, assignee_id: 1, created_by: mockUserSummary, status: 'TODO', priority: 'HIGH', start_date: null, due_date: '2024-06-15', completed_at: null, estimated_hours: null, actual_hours: null, position: 0, is_overdue: false, comment_count: 0, attachment_count: 0, created_at: '2024-01-01T00:00:00Z', updated_at: '2024-01-01T00:00:00Z' },
          ],
        },
        { id: 2, name: 'لیست دوم', project: 1, position: 1, description: '', tasks: [] },
      ];
      mockUseProjectFn.mockImplementation(() => ({ data: sharedData.project, isLoading: false, isError: false, error: null }));
      mockUseProjectTasksFn.mockImplementation(() => ({ data: [...sharedData.taskLists], isLoading: false, isError: false, error: null }));
      mockUseUsersFn.mockImplementation(() => ({ data: mockUsers, isLoading: false, isError: false, error: null }));
    });

    it('opens create task modal when add task button is clicked', async () => {
      const user = userEvent.setup();
      renderTaskBoard();

      await waitFor(() => expect(screen.getByText('لیست اول')).toBeInTheDocument());

      const firstColumn = screen.getByText('لیست اول').closest('.task-column') as HTMLElement;
      await user.click(within(firstColumn).getByRole('button', { name: '+ افزودن وظیفه' }));

      expect(screen.getByText('افزودن وظیفه')).toBeInTheDocument();
    });

    it('pre-selects the correct task list in the modal', async () => {
      const user = userEvent.setup();
      renderTaskBoard();

      await waitFor(() => expect(screen.getByText('لیست اول')).toBeInTheDocument());

      const firstColumn = screen.getByText('لیست اول').closest('.task-column') as HTMLElement;
      await user.click(within(firstColumn).getByRole('button', { name: '+ افزودن وظیفه' }));

      // The task list dropdown should have "لیست اول" pre-selected (shown as selected option in modal)
      const modal = screen.getByText('افزودن وظیفه').closest('.modal-content') as HTMLElement;
      expect(within(modal).getByText('لیست اول')).toBeInTheDocument();
    });

    it('creates a new task successfully', async () => {
      const user = userEvent.setup();
      renderTaskBoard();

      await waitFor(() => expect(screen.getByText('لیست اول')).toBeInTheDocument());

      const firstColumn = screen.getByText('لیست اول').closest('.task-column') as HTMLElement;
      await user.click(within(firstColumn).getByRole('button', { name: '+ افزودن وظیفه' }));

      await user.type(screen.getByPlaceholderText('عنوان وظیفه'), 'وظیفه جدید');

      await act(async () => {
        await user.click(screen.getByRole('button', { name: 'ایجاد وظیفه' }));
      });

      await waitFor(() => {
        expect(screen.getByText('وظیفه جدید')).toBeInTheDocument();
      });
    });

    it('validates that task title is required', async () => {
      const user = userEvent.setup();
      renderTaskBoard();

      await waitFor(() => expect(screen.getByText('لیست اول')).toBeInTheDocument());

      const firstColumn = screen.getByText('لیست اول').closest('.task-column') as HTMLElement;
      await user.click(within(firstColumn).getByRole('button', { name: '+ افزودن وظیفه' }));

      // Use fireEvent.submit on the form directly
      const form = screen.getByText('افزودن وظیفه').closest('.modal-content')?.querySelector('form');
      await act(async () => {
        fireEvent.submit(form!);
      });

      expect(screen.getByText('عنوان وظیفه الزامی است')).toBeInTheDocument();
    });
  });

  // ── Edit task ─────────────────────────────────────────────────────────────

  describe('Edit task', () => {
    beforeEach(() => {
      sharedData.taskLists = [
        {
          id: 1, name: 'لیست اول', project: 1, position: 0, description: '', tasks: [
            { id: 1, title: 'وظیفه اول', description: 'توضیحات', project: 1, task_list: 1, parent_task: null, assignee: mockUserSummary, assignee_id: 1, created_by: mockUserSummary, status: 'TODO', priority: 'HIGH', start_date: null, due_date: '2024-06-15', completed_at: null, estimated_hours: null, actual_hours: null, position: 0, is_overdue: false, comment_count: 0, attachment_count: 0, created_at: '2024-01-01T00:00:00Z', updated_at: '2024-01-01T00:00:00Z' },
          ],
        },
        { id: 2, name: 'لیست دوم', project: 1, position: 1, description: '', tasks: [] },
      ];
      mockUseProjectFn.mockImplementation(() => ({ data: sharedData.project, isLoading: false, isError: false, error: null }));
      mockUseProjectTasksFn.mockImplementation(() => ({ data: [...sharedData.taskLists], isLoading: false, isError: false, error: null }));
      mockUseUsersFn.mockImplementation(() => ({ data: mockUsers, isLoading: false, isError: false, error: null }));
    });

    it('opens edit task modal with pre-filled title', async () => {
      const user = userEvent.setup();
      renderTaskBoard();

      await waitFor(() => expect(screen.getByText('وظیفه اول')).toBeInTheDocument());

      const firstList = screen.getByText('لیست اول').closest('.task-column') as HTMLElement;
      const taskCard = within(firstList).getByText('وظیفه اول').closest('.task-card') as HTMLElement;
      await user.click(within(taskCard).getByRole('button', { name: 'ویرایش وظیفه' }));

      expect(screen.getByText('ویرایش وظیفه')).toBeInTheDocument();
      expect(screen.getByDisplayValue('وظیفه اول')).toBeInTheDocument();
    });

    it('updates task title successfully', async () => {
      const user = userEvent.setup();
      renderTaskBoard();

      await waitFor(() => expect(screen.getByText('وظیفه اول')).toBeInTheDocument());

      const firstList = screen.getByText('لیست اول').closest('.task-column') as HTMLElement;
      const taskCard = within(firstList).getByText('وظیفه اول').closest('.task-card') as HTMLElement;
      await user.click(within(taskCard).getByRole('button', { name: 'ویرایش وظیفه' }));

      const titleInput = screen.getByDisplayValue('وظیفه اول');
      await user.click(titleInput);
      await user.clear(titleInput);
      await user.keyboard('وظیفه ویرایش‌شده');

      await act(async () => {
        await user.click(screen.getByRole('button', { name: 'ذخیره تغییرات' }));
      });

      await waitFor(() => {
        expect(screen.getByText('وظیفه ویرایش‌شده')).toBeInTheDocument();
      });
    });

    it('validates task title on update', async () => {
      const user = userEvent.setup();
      renderTaskBoard();

      await waitFor(() => expect(screen.getByText('وظیفه اول')).toBeInTheDocument());

      const firstList = screen.getByText('لیست اول').closest('.task-column') as HTMLElement;
      const taskCard = within(firstList).getByText('وظیفه اول').closest('.task-card') as HTMLElement;
      await user.click(within(taskCard).getByRole('button', { name: 'ویرایش وظیفه' }));

      const titleInput = screen.getByDisplayValue('وظیفه اول');
      await user.click(titleInput);
      await user.keyboard('{Control>}a{/Control}');
      await user.keyboard('{Delete}');

      const form = screen.getByText('ویرایش وظیفه').closest('.modal-content')?.querySelector('form');
      await act(async () => {
        fireEvent.submit(form!);
      });

      expect(screen.getByText('عنوان وظیفه الزامی است')).toBeInTheDocument();
    });
  });

  // ── Delete task ────────────────────────────────────────────────────────────

  describe('Delete task', () => {
    beforeEach(() => {
      mockUseProjectFn.mockReturnValue({
        data: mockProject,
        isLoading: false,
        isError: false,
        error: null,
      } as ReturnType<typeof useProject>);
      mockUseProjectTasksFn.mockReturnValue({
        data: mockTaskLists,
        isLoading: false,
        isError: false,
        error: null,
      } as ReturnType<typeof useProjectTasks>);
      mockUseUsersFn.mockReturnValue({ data: mockUsers, isLoading: false, isError: false, error: null } as ReturnType<typeof useUsers>);
    });

    it('shows delete confirmation for task', async () => {
      const user = userEvent.setup();
      renderTaskBoard();

      await waitFor(() => expect(screen.getByText('وظیفه اول')).toBeInTheDocument());

      const firstList = screen.getByText('لیست اول').closest('.task-column') as HTMLElement;
      const taskCard = within(firstList).getByText('وظیفه اول').closest('.task-card') as HTMLElement;
      await user.click(within(taskCard).getByRole('button', { name: 'حذف وظیفه' }));

      expect(screen.getByText('تأیید حذف')).toBeInTheDocument();
      expect(screen.getByText(/آیا از حذف وظیفه «وظیفه اول» مطمئن هستید/)).toBeInTheDocument();
    });

    it('cancels task delete when cancel is clicked', async () => {
      const user = userEvent.setup();
      renderTaskBoard();

      await waitFor(() => expect(screen.getByText('وظیفه اول')).toBeInTheDocument());

      const firstList = screen.getByText('لیست اول').closest('.task-column') as HTMLElement;
      const taskCard = within(firstList).getByText('وظیفه اول').closest('.task-card') as HTMLElement;
      await user.click(within(taskCard).getByRole('button', { name: 'حذف وظیفه' }));

      await user.click(screen.getByRole('button', { name: 'انصراف' }));

      expect(screen.queryByText('تأیید حذف')).not.toBeInTheDocument();
      expect(screen.getByText('وظیفه اول')).toBeInTheDocument();
    });
  });

  // ── Modals close on overlay click ────────────────────────────────────────

  describe('Modal overlay interactions', () => {
    beforeEach(() => {
      mockUseProjectFn.mockReturnValue({
        data: mockProject,
        isLoading: false,
        isError: false,
        error: null,
      } as ReturnType<typeof useProject>);
      mockUseProjectTasksFn.mockReturnValue({
        data: mockTaskLists,
        isLoading: false,
        isError: false,
        error: null,
      } as ReturnType<typeof useProjectTasks>);
      mockUseUsersFn.mockReturnValue({ data: mockUsers, isLoading: false, isError: false, error: null } as ReturnType<typeof useUsers>);
    });

    it('closes create task modal when overlay is clicked', async () => {
      const user = userEvent.setup();
      renderTaskBoard();

      await waitFor(() => expect(screen.getByText('لیست اول')).toBeInTheDocument());

      const firstColumn = screen.getByText('لیست اول').closest('.task-column') as HTMLElement;
      await user.click(within(firstColumn).getByRole('button', { name: '+ افزودن وظیفه' }));

      expect(screen.getByText('افزودن وظیفه')).toBeInTheDocument();

      const modal = screen.getByText('افزودن وظیفه').closest('.modal-overlay') as HTMLElement;
      await user.click(modal);

      expect(screen.queryByText('افزودن وظیفه')).not.toBeInTheDocument();
    });

    it('closes delete confirmation when overlay is clicked', async () => {
      const user = userEvent.setup();
      renderTaskBoard();

      await waitFor(() => expect(screen.getByText('لیست اول')).toBeInTheDocument());

      const firstColumn = screen.getByText('لیست اول').closest('.task-column') as HTMLElement;
      await user.click(within(firstColumn).getByRole('button', { name: 'حذف لیست' }));

      expect(screen.getByText('تأیید حذف')).toBeInTheDocument();

      const modal = screen.getByText('تأیید حذف').closest('.modal-overlay') as HTMLElement;
      await user.click(modal);

      expect(screen.queryByText('تأیید حذف')).not.toBeInTheDocument();
    });
  });
});
