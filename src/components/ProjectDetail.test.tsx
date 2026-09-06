// src/components/ProjectDetail.test.tsx
import React, { act } from 'react';
import { render, screen, waitFor, within, fireEvent } from '../tests/test-utils';
import userEvent from '@testing-library/user-event';
import { vi } from 'vitest';
import { http, HttpResponse } from 'msw';
import { setupServer } from 'msw/node';
import ProjectDetail from './ProjectDetail';
import { mockProjects } from '../tests/mockData';

// ─── Mock AuthContext ─────────────────────────────────────────────────────────

vi.mock('../services/contexts/AuthContext', async (importOriginal) => {
  const actual = await importOriginal();
  return {
    ...actual,
    useAuth: vi.fn(() => ({
      user: { id: 1, username: 'testuser', email: 'test@example.com', full_name: 'User', role: 'DEV' },
      loading: false,
      login: vi.fn(),
      logout: vi.fn(),
      register: vi.fn(),
    })),
  };
});

// ─── Query hook mocks ─────────────────────────────────────────────────────────

const mockUseProjectFn = vi.fn();
const mockUseUsersFn = vi.fn();

vi.mock('../services/queryHooks', () => ({
  useProject: (slug: string) => mockUseProjectFn(slug),
  useUsers: () => mockUseUsersFn(),
}));

// ─── Shared mutable data store ─────────────────────────────────────────────────

export const sharedData = {
  project: null as any,
  users: [] as any[],
};

// ─── MSW server ───────────────────────────────────────────────────────────────

const API_BASE = 'http://localhost:8000/api';

export const projectDetailHandlers = [
  http.get(`${API_BASE}/accounts/users/me/`, () => {
    return HttpResponse.json({ id: 1, username: 'testuser', email: 'test@example.com', full_name: 'User', role: 'DEV' });
  }),
  http.get(`/api/accounts/users/me/`, () => {
    return HttpResponse.json({ id: 1, username: 'testuser', email: 'test@example.com', full_name: 'User', role: 'DEV' });
  }),
  http.get(`${API_BASE}/accounts/users/`, () => {
    return HttpResponse.json(sharedData.users);
  }),
  http.get(`/api/accounts/users/`, () => {
    return HttpResponse.json(sharedData.users);
  }),
  http.get(`${API_BASE}/projects/projects/test-project/`, () => {
    return HttpResponse.json(sharedData.project);
  }),
  http.get(`/api/projects/projects/test-project/`, () => {
    return HttpResponse.json(sharedData.project);
  }),
  http.get(`${API_BASE}/projects/projects/non-existent/`, () => {
    return HttpResponse.json({ detail: 'Not found' }, { status: 404 });
  }),
  http.get(`/api/projects/projects/non-existent/`, () => {
    return HttpResponse.json({ detail: 'Not found' }, { status: 404 });
  }),
  http.post(`${API_BASE}/projects/projects/test-project/add_member/`, async ({ request }) => {
    const body = await request.json() as Record<string, unknown>;
    const user = sharedData.users.find((u: any) => u.id === body.user_id);
    const newMember = { id: Date.now(), user: user || { id: body.user_id, username: '?', email: '', full_name: '?' }, role: body.role };
    sharedData.project.members.push(newMember);
    return HttpResponse.json(newMember, { status: 201 });
  }),
  http.post(`/api/projects/projects/test-project/add_member/`, async ({ request }) => {
    const body = await request.json() as Record<string, unknown>;
    const user = sharedData.users.find((u: any) => u.id === body.user_id);
    const newMember = { id: Date.now(), user: user || { id: body.user_id, username: '?', email: '', full_name: '?' }, role: body.role };
    sharedData.project.members.push(newMember);
    return HttpResponse.json(newMember, { status: 201 });
  }),
  http.delete(`${API_BASE}/projects/projects/test-project/remove_member/:memberId/`, ({ params }) => {
    sharedData.project.members = sharedData.project.members.filter((m: any) => m.id !== Number(params.memberId));
    return new HttpResponse(null, { status: 204 });
  }),
  http.delete(`/api/projects/projects/test-project/remove_member/:memberId/`, ({ params }) => {
    sharedData.project.members = sharedData.project.members.filter((m: any) => m.id !== Number(params.memberId));
    return new HttpResponse(null, { status: 204 });
  }),
];

export const server = setupServer(...projectDetailHandlers);

// ─── Helper ───────────────────────────────────────────────────────────────────

const makeProject = (overrides = {}) => ({
  id: 1,
  slug: 'test-project',
  name: 'Test Project',
  description: 'Project description text',
  owner: { id: 2, username: 'owner', email: 'owner@test.com', full_name: 'Owner User', role: 'DEV' },
  manager: { id: 3, username: 'manager', email: 'manager@test.com', full_name: 'Manager User', role: 'PM' },
  status: 'IN_PROGRESS',
  priority: 'HIGH',
  progress: 50,
  start_date: '2024-01-01',
  due_date: '2024-06-30',
  completed_date: null,
  budget: null,
  is_active: true,
  is_public: false,
  is_overdue: false,
  total_tasks: 10,
  completed_tasks: 5,
  comment_count: 3,
  attachment_count: 2,
  created_at: '2024-01-01T00:00:00Z',
  updated_at: '2024-01-01T00:00:00Z',
  members: [
    { id: 1, user: { id: 2, username: 'owner', email: 'owner@test.com', full_name: 'Owner User', role: 'DEV' }, role: 'OWNER' },
    { id: 2, user: { id: 3, username: 'manager', email: 'manager@test.com', full_name: 'Manager User', role: 'PM' }, role: 'MANAGER' },
    { id: 3, user: { id: 4, username: 'dev', email: 'dev@test.com', full_name: 'Dev User', role: 'DEV' }, role: 'MEMBER' },
  ],
  ...overrides,
});

const makeUsers = () => [
  { id: 1, username: 'testuser', email: 'test@example.com', full_name: 'User' },
  { id: 2, username: 'owner', email: 'owner@test.com', full_name: 'Owner User' },
  { id: 3, username: 'manager', email: 'manager@test.com', full_name: 'Manager User' },
  { id: 4, username: 'dev', email: 'dev@test.com', full_name: 'Dev User' },
  { id: 5, username: 'sara', email: 'sara@test.com', full_name: 'Sara' },
  { id: 6, username: 'ali', email: 'ali@test.com', full_name: 'Ali' },
];

const renderProjectDetail = (slug = 'test-project') => {
  return render(<ProjectDetail />, { route: `/projects/${slug}` });
};

// ─── Tests ─────────────────────────────────────────────────────────────────────

describe('ProjectDetail', () => {
  beforeAll(() => server.listen({ onUnhandledRequest: 'warn' }));
  beforeEach(() => {
    sharedData.project = makeProject();
    sharedData.users = makeUsers();
    mockUseProjectFn.mockImplementation((slug: string) => {
      if (slug === 'non-existent') {
        return {
          data: undefined,
          isLoading: false,
          isError: true,
          error: { response: { data: { detail: 'Not found' } } },
        };
      }
      return {
        data: sharedData.project,
        isLoading: false,
        isError: false,
        error: null,
      };
    });
    mockUseUsersFn.mockImplementation(() => ({
      data: sharedData.users,
      isLoading: false,
      isError: false,
      error: null,
    }));
  });
  afterEach(() => {
    server.resetHandlers();
    vi.clearAllMocks();
  });
  afterAll(() => server.close());

  // ── Loading & Error states ─────────────────────────────────────────────────

  it('shows loading state while fetching project', () => {
    mockUseProjectFn.mockReturnValue({
      data: undefined,
      isLoading: true,
      isError: false,
      error: null,
    } as any);
    mockUseUsersFn.mockReturnValue({
      data: [],
      isLoading: false,
      isError: false,
      error: null,
    } as any);

    renderProjectDetail();

    expect(screen.getByText(/در حال بارگذاری/)).toBeInTheDocument();
  });

  it('shows error state when project is not found', () => {
    mockUseProjectFn.mockReturnValue({
      data: undefined,
      isLoading: false,
      isError: true,
      error: { response: { data: { detail: 'Project not found' } } },
    } as any);
    mockUseUsersFn.mockReturnValue({
      data: [],
      isLoading: false,
      isError: false,
      error: null,
    } as any);

    renderProjectDetail();

    expect(screen.getByText('Project not found')).toBeInTheDocument();
  });

  it('shows error when project slug is non-existent', async () => {
    renderProjectDetail('non-existent');

    await waitFor(() => {
      expect(screen.getByText('Not found')).toBeInTheDocument();
    });
  });

  // ── Display: Header ────────────────────────────────────────────────────────

  it('displays project name in header', async () => {
    renderProjectDetail();

    await waitFor(() => {
      expect(screen.getByText('Test Project')).toBeInTheDocument();
    });
  });

  it('displays project description', async () => {
    renderProjectDetail();

    await waitFor(() => {
      expect(screen.getByText('Project description text')).toBeInTheDocument();
    });
  });

  it('shows fallback when description is empty', async () => {
    sharedData.project = makeProject({ description: '' });
    renderProjectDetail();

    await waitFor(() => {
      expect(screen.getByText(/بدون توضیحات/)).toBeInTheDocument();
    });
  });

  it('displays back link to projects list', async () => {
    renderProjectDetail();

    await waitFor(() => {
      const backLink = screen.getByRole('link', { name: /بازگشت به پروژه‌ها/ });
      expect(backLink).toHaveAttribute('href', '/projects');
    });
  });

  // ── Display: Metadata ──────────────────────────────────────────────────────

  it('displays project status badge', async () => {
    renderProjectDetail();

    await waitFor(() => {
      expect(screen.getByText(/در حال انجام/)).toBeInTheDocument();
    });
  });

  it('displays project priority', async () => {
    renderProjectDetail();

    await waitFor(() => {
      expect(screen.getByText(/بالا/)).toBeInTheDocument();
    });
  });

  it('displays project progress percentage', async () => {
    renderProjectDetail();

    await waitFor(() => {
      expect(screen.getByText('50٪')).toBeInTheDocument();
    });
  });

  it('displays task count in metadata', async () => {
    renderProjectDetail();

    await waitFor(() => {
      expect(screen.getByText('5/10')).toBeInTheDocument();
    });
  });

  it('displays owner name in members tab', async () => {
    const user = userEvent.setup();
    renderProjectDetail();

    await waitFor(() => expect(screen.getByText('Test Project')).toBeInTheDocument());
    await user.click(screen.getByRole('button', { name: 'اعضا' }));

    await waitFor(() => {
      expect(screen.getByText('Owner User')).toBeInTheDocument();
    });
  });

  it('displays manager name in members tab', async () => {
    const user = userEvent.setup();
    renderProjectDetail();

    await waitFor(() => expect(screen.getByText('Test Project')).toBeInTheDocument());
    await user.click(screen.getByRole('button', { name: 'اعضا' }));

    await waitFor(() => {
      expect(screen.getByText('Manager User')).toBeInTheDocument();
    });
  });

  // ── Tabs ─────────────────────────────────────────────────────────────────

  it('displays all four tabs', async () => {
    renderProjectDetail();

    await waitFor(() => {
      expect(screen.getByRole('button', { name: 'نمای کلی' })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'وظایف' })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'فایل‌ها' })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'اعضا' })).toBeInTheDocument();
    });
  });

  it('shows overview tab content by default', async () => {
    renderProjectDetail();

    await waitFor(() => {
      expect(screen.getByText('نمای کلی پروژه')).toBeInTheDocument();
    });
  });

  it('switches to tasks tab when clicked', async () => {
    const user = userEvent.setup();
    renderProjectDetail();

    await waitFor(() => expect(screen.getByText('نمای کلی پروژه')).toBeInTheDocument());

    await user.click(screen.getByRole('button', { name: 'وظایف' }));

    expect(screen.getByText('مدیریت وظایف پروژه')).toBeInTheDocument();
  });

  it('switches to members tab when clicked', async () => {
    const user = userEvent.setup();
    renderProjectDetail();

    await waitFor(() => expect(screen.getByText('Test Project')).toBeInTheDocument());

    await user.click(screen.getByRole('button', { name: 'اعضا' }));

    expect(screen.getByText('اعضای تیم')).toBeInTheDocument();
  });

  // ── Overview tab ─────────────────────────────────────────────────────────

  it('has link to task board from overview', async () => {
    renderProjectDetail();

    await waitFor(() => {
      const link = screen.getByRole('link', { name: 'باز کردن بورد وظایف' });
      expect(link).toHaveAttribute('href', '/projects/test-project/tasks');
    });
  });

  // ── Members tab ────────────────────────────────────────────────────────────

  it('displays all team members when members tab is open', async () => {
    const user = userEvent.setup();
    renderProjectDetail();

    await waitFor(() => expect(screen.getByText('Test Project')).toBeInTheDocument());
    await user.click(screen.getByRole('button', { name: 'اعضا' }));

    expect(screen.getByText('Owner User')).toBeInTheDocument();
    expect(screen.getByText('Manager User')).toBeInTheDocument();
    expect(screen.getByText('Dev User')).toBeInTheDocument();
  });

  it('displays member role labels', async () => {
    const user = userEvent.setup();
    renderProjectDetail();

    await waitFor(() => expect(screen.getByText('Test Project')).toBeInTheDocument());
    await user.click(screen.getByRole('button', { name: 'اعضا' }));

    // Role labels: OWNER=مالک, MANAGER=مدیر, MEMBER=عضو
    // Use getAllByText since OWNER label appears in header area too
    const ownerLabels = screen.getAllByText(/مالک/);
    const managerLabels = screen.getAllByText(/مدیر/);
    const memberLabels = screen.getAllByText(/عضو/);
    expect(ownerLabels.length).toBeGreaterThanOrEqual(1);
    expect(managerLabels.length).toBeGreaterThanOrEqual(1);
    expect(memberLabels.length).toBeGreaterThanOrEqual(1);
  });

  it('shows empty members message when no members', async () => {
    sharedData.project = makeProject({ members: [] });
    const user = userEvent.setup();
    renderProjectDetail();

    await waitFor(() => expect(screen.getByText('Test Project')).toBeInTheDocument());
    await user.click(screen.getByRole('button', { name: 'اعضا' }));

    expect(screen.getByText(/هنوز عضوی وجود ندارد/)).toBeInTheDocument();
  });

  it('does not show remove buttons when user lacks permission', async () => {
    const user = userEvent.setup();
    renderProjectDetail();

    await waitFor(() => expect(screen.getByText('Test Project')).toBeInTheDocument());
    await user.click(screen.getByRole('button', { name: 'اعضا' }));

    // No delete buttons since testuser (id=1) is not the project owner (owner id=2)
    const deleteButtons = screen.queryAllByRole('button', { name: 'حذف' });
    expect(deleteButtons).toHaveLength(0);
  });

  // ── Add member ────────────────────────────────────────────────────────────

  it('does not show add member form when user lacks permission', async () => {
    const user = userEvent.setup();
    renderProjectDetail();

    await waitFor(() => expect(screen.getByText('Test Project')).toBeInTheDocument());
    await user.click(screen.getByRole('button', { name: 'اعضا' }));

    expect(screen.queryByText('افزودن عضو')).not.toBeInTheDocument();
  });

  it('shows add member form when user is owner', async () => {
    sharedData.project = makeProject({ owner: { id: 1, username: 'testuser', email: 'test@example.com', full_name: 'User', role: 'DEV' } });
    const user = userEvent.setup();
    renderProjectDetail();

    await waitFor(() => expect(screen.getByText('Test Project')).toBeInTheDocument());
    await user.click(screen.getByRole('button', { name: 'اعضا' }));

    expect(screen.getByText('افزودن عضو')).toBeInTheDocument();
    expect(screen.getByText('انتخاب کاربر')).toBeInTheDocument();
  });

  it('adds new member successfully', async () => {
    sharedData.project = makeProject({ owner: { id: 1, username: 'testuser', email: 'test@example.com', full_name: 'User', role: 'DEV' } });
    const user = userEvent.setup();
    renderProjectDetail();

    await waitFor(() => expect(screen.getByText('Test Project')).toBeInTheDocument());
    await user.click(screen.getByRole('button', { name: 'اعضا' }));

    const form = screen.getByText('انتخاب کاربر').closest('form') as HTMLElement;
    const selects = within(form).getAllByRole('combobox');
    await user.selectOptions(selects[0], '6');

    await act(async () => {
      await user.click(screen.getByRole('button', { name: 'افزودن کاربر' }));
    });

    await waitFor(() => {
      expect(screen.getByText('Ali')).toBeInTheDocument();
    });
  });

  it('shows success message after adding member', async () => {
    sharedData.project = makeProject({ owner: { id: 1, username: 'testuser', email: 'test@example.com', full_name: 'User', role: 'DEV' } });
    const user = userEvent.setup();
    renderProjectDetail();

    await waitFor(() => expect(screen.getByText('Test Project')).toBeInTheDocument());
    await user.click(screen.getByRole('button', { name: 'اعضا' }));

    const form = screen.getByText('انتخاب کاربر').closest('form') as HTMLElement;
    const selects = within(form).getAllByRole('combobox');
    await user.selectOptions(selects[0], '6');

    await act(async () => {
      await user.click(screen.getByRole('button', { name: 'افزودن کاربر' }));
    });

    await waitFor(() => {
      expect(screen.getByText(/به پروژه اضافه شد/)).toBeInTheDocument();
    });
  });

  // ── Remove member ─────────────────────────────────────────────────────────

  it('shows remove button for non-owner members when user is owner', async () => {
    sharedData.project = makeProject({ owner: { id: 1, username: 'testuser', email: 'test@example.com', full_name: 'User', role: 'DEV' } });
    const user = userEvent.setup();
    renderProjectDetail();

    await waitFor(() => expect(screen.getByText('Test Project')).toBeInTheDocument());
    await user.click(screen.getByRole('button', { name: 'اعضا' }));

    const devItem = screen.getByText('Dev User').closest('.member-item') as HTMLElement;
    expect(within(devItem).getByRole('button', { name: 'حذف' })).toBeInTheDocument();
  });

  it('removes member successfully', async () => {
    sharedData.project = makeProject({ owner: { id: 1, username: 'testuser', email: 'test@example.com', full_name: 'User', role: 'DEV' } });
    const user = userEvent.setup();
    renderProjectDetail();

    await waitFor(() => expect(screen.getByText('Test Project')).toBeInTheDocument());
    await user.click(screen.getByRole('button', { name: 'اعضا' }));

    expect(screen.getByText('Dev User')).toBeInTheDocument();

    const devItem = screen.getByText('Dev User').closest('.member-item') as HTMLElement;
    await user.click(within(devItem).getByRole('button', { name: 'حذف' }));

    await waitFor(() => {
      expect(screen.queryByText('Dev User')).not.toBeInTheDocument();
    });
  });

  it('shows success message after removing member', async () => {
    sharedData.project = makeProject({ owner: { id: 1, username: 'testuser', email: 'test@example.com', full_name: 'User', role: 'DEV' } });
    const user = userEvent.setup();
    renderProjectDetail();

    await waitFor(() => expect(screen.getByText('Test Project')).toBeInTheDocument());
    await user.click(screen.getByRole('button', { name: 'اعضا' }));

    const devItem = screen.getByText('Dev User').closest('.member-item') as HTMLElement;
    await user.click(within(devItem).getByRole('button', { name: 'حذف' }));

    await waitFor(() => {
      expect(screen.getByText(/عضو از پروژه حذف شد/)).toBeInTheDocument();
    });
  });

  // ── Permission-based UI ──────────────────────────────────────────────────

  it('hides edit and settings buttons when user lacks permission', async () => {
    renderProjectDetail();

    await waitFor(() => expect(screen.getByText('Test Project')).toBeInTheDocument());

    expect(screen.queryByRole('button', { name: 'ویرایش' })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'تنظیمات' })).not.toBeInTheDocument();
  });

  it('shows edit and settings buttons when user is project owner', async () => {
    sharedData.project = makeProject({ owner: { id: 1, username: 'testuser', email: 'test@example.com', full_name: 'User', role: 'DEV' } });
    renderProjectDetail();

    await waitFor(() => expect(screen.getByText('Test Project')).toBeInTheDocument());

    expect(screen.getByRole('button', { name: 'ویرایش' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'تنظیمات' })).toBeInTheDocument();
  });

  // ── Edge cases ───────────────────────────────────────────────────────────

  it('handles project with no manager', async () => {
    sharedData.project = makeProject({ manager: null });
    renderProjectDetail();

    await waitFor(() => {
      expect(screen.getByText('Test Project')).toBeInTheDocument();
    });
  });

  it('handles null due date', async () => {
    sharedData.project = makeProject({ due_date: null });
    renderProjectDetail();

    await waitFor(() => {
      expect(screen.getByText(/تعیین نشده/)).toBeInTheDocument();
    });
  });

  it('displays member email addresses', async () => {
    const user = userEvent.setup();
    renderProjectDetail();

    await waitFor(() => expect(screen.getByText('Test Project')).toBeInTheDocument());
    await user.click(screen.getByRole('button', { name: 'اعضا' }));

    // Members are: Owner User (owner@test.com), Manager User (manager@test.com), Dev User (dev@test.com)
    expect(screen.getByText('owner@test.com')).toBeInTheDocument();
    expect(screen.getByText('manager@test.com')).toBeInTheDocument();
    expect(screen.getByText('dev@test.com')).toBeInTheDocument();
  });
});
