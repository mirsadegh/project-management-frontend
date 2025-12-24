import api from './api';

export interface Task {
  id: number;
  title: string;
  description: string;
  project: number;
  task_list: number | null;
  parent_task: number | null;
  assignee: UserSummary | null;
  created_by: UserSummary;
  status: 'TODO' | 'IN_PROGRESS' | 'IN_REVIEW' | 'COMPLETED' | 'BLOCKED';
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
  start_date: string | null;
  due_date: string | null;
  completed_at: string | null;
  estimated_hours: number | null;
  actual_hours: number | null;
  position: number;
  is_overdue: boolean;
  comment_count: number;
  attachment_count: number;
  created_at: string;
  updated_at: string;
}

export interface UserSummary {
  id: number;
  username: string;
  email: string;
  full_name: string;
  role: string;
}

export interface TaskList {
  id: number;
  project: number;
  name: string;
  description: string;
  position: number;
  tasks: Task[];
}

export interface TaskLabel {
  id: number;
  project: number;
  name: string;
  color: string;
}

export interface TaskFilters {
  status?: string;
  priority?: string;
  assignee?: number;
}

export const taskService = {
  async getTaskLists(projectId: number): Promise<TaskList[]> {
    const response = await api.get<TaskList[]>(`/tasks/task-lists/?project=${projectId}`);
    return response.data;
  },

  async getTasks(projectId: number, filters?: TaskFilters): Promise<Task[]> {
    const params = new URLSearchParams();
    if (filters?.status) params.append('status', filters.status);
    if (filters?.priority) params.append('priority', filters.priority);
    if (filters?.assignee) params.append('assignee', filters.assignee.toString());
    
    const response = await api.get<Task[]>(`/tasks/tasks/?project=${projectId}&${params.toString()}`);
    return response.data;
  },

  async getTask(taskId: number): Promise<Task> {
    const response = await api.get<Task>(`/tasks/tasks/${taskId}/`);
    return response.data;
  },

  async createTask(data: Partial<Task>): Promise<Task> {
    const response = await api.post<Task>('/tasks/tasks/', data);
    return response.data;
  },

  async updateTask(taskId: number, data: Partial<Task>): Promise<Task> {
    const response = await api.patch<Task>(`/tasks/tasks/${taskId}/`, data);
    return response.data;
  },

  async deleteTask(taskId: number): Promise<void> {
    await api.delete(`/tasks/tasks/${taskId}/`);
  },

  async createTaskList(projectId: number, name: string): Promise<TaskList> {
    const response = await api.post<TaskList>('/tasks/task-lists/', {
      project: projectId,
      name,
    });
    return response.data;
  },

  async getLabels(projectId: number): Promise<TaskLabel[]> {
    const response = await api.get<TaskLabel[]>(`/tasks/labels/?project=${projectId}`);
    return response.data;
  },
};
