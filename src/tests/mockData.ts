// src/tests/mockData.ts
// Mock data for testing

export const mockUser = {
  id: 1,
  username: 'testuser',
  email: 'test@example.com',
  first_name: 'Test',
  last_name: 'User',
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
  password2: 'NewPass123!',
  first_name: 'New',
  last_name: 'User',
  role: 'DEV',
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