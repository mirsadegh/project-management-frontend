// src/tests/mockData.ts
// Mock data for testing

export const mockUser = {
  id: 1,
  username: 'testuser',
  email: 'test@example.com',
  first_name: 'Test',
  last_name: 'User',
  full_name: 'Test User',
  role: 'DEV',
};

export const mockUserSummary = {
  id: 1,
  username: 'testuser',
  email: 'test@example.com',
  full_name: 'Test User',
  role: 'DEV',
};

export const mockAuthTokens = {
  access: 'mock-access-token',
  refresh: 'mock-refresh-token',
};

export const mockLoginCredentials = {
  email: 'test@example.com',
  password: 'TestPass123!',
};

export const mockRegisterData = {
  username: 'newuser',
  email: 'new@example.com',
  password: 'NewPass123!',
  password_confirm: 'NewPass123!',
  first_name: 'New',
  last_name: 'User',
};

export const mockProject = {
  id: 1,
  name: 'Test Project',
  description: 'A test project',
  start_date: '2023-01-01',
  due_date: '2023-12-31',
  status: 'ACTIVE',
  owner: mockUser,
};

export const mockProjects = [
  {
    id: 1,
    name: 'پروژه اول',
    slug: 'porojekt-avval',
    description: 'توضیحات پروژه اول',
    owner: mockUserSummary,
    manager: mockUserSummary,
    status: 'IN_PROGRESS' as const,
    priority: 'HIGH' as const,
    progress: 50,
    start_date: '2024-01-01',
    due_date: '2024-06-01',
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
  },
  {
    id: 2,
    name: 'پروژه دوم',
    slug: 'porojekt-dovvom',
    description: 'توضیحات پروژه دوم',
    owner: mockUserSummary,
    manager: null,
    status: 'COMPLETED' as const,
    priority: 'LOW' as const,
    progress: 100,
    start_date: '2024-02-01',
    due_date: '2024-07-01',
    completed_date: '2024-06-30',
    budget: null,
    is_active: false,
    is_public: false,
    is_overdue: false,
    total_tasks: 5,
    completed_tasks: 5,
    comment_count: 1,
    attachment_count: 0,
    created_at: '2024-02-01T00:00:00Z',
    updated_at: '2024-06-30T00:00:00Z',
  },
];

export const mockTask = {
  id: 1,
  title: 'Test Task',
  description: 'A test task',
  status: 'TODO',
  priority: 'MEDIUM',
  project: mockProject,
  assigned_to: mockUser,
  created_by: mockUser,
};

export const mockTeam = {
  id: 1,
  name: 'Test Team',
  description: 'A test team',
  created_by: mockUser,
  members: [mockUser],
};

export const mockComment = {
  id: 1,
  content: 'Test comment',
  created_by: mockUser,
  created_at: '2023-01-01T00:00:00Z',
  task: mockTask,
};

export const mockFile = {
  id: 1,
  name: 'test-file.txt',
  file: 'http://example.com/test-file.txt',
  file_type: 'TXT',
  file_size: 1024,
  uploaded_by: mockUser,
  uploaded_at: '2023-01-01T00:00:00Z',
  task: mockTask,
};