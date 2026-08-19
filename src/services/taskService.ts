import api from './api';
import { unwrapList } from './pagination';

export interface Task {
  id: number;
  title: string;
  description: string;
  project: number;
  task_list: number | null;
  parent_task: number | null;
  assignee: UserSummary | null;
  assignee_id?: number | null;
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

export interface PaginatedTaskListResponse {
  count: number;
  next: string | null;
  previous: string | null;
  total_pages: number;
  current_page: number;
  results: TaskList[];
}

export interface PaginatedTaskResponse {
  count: number;
  next: string | null;
  previous: string | null;
  total_pages: number;
  current_page: number;
  results: Task[];
  tasks?: Task[];
}

export interface PaginatedTaskLabelResponse {
  count: number;
  next: string | null;
  previous: string | null;
  total_pages: number;
  current_page: number;
  results: TaskLabel[];
}

export interface TaskOrder {
  id: number;
  order: number;
}

export interface TaskListUpdateData {
  name?: string;
  description?: string;
  position?: number;
}

export const taskService = {
  async getTaskLists(projectId: number): Promise<TaskList[]> {
    const response = await api.get<PaginatedTaskListResponse>(`/tasks/task-lists/?project=${projectId}`);
    return response.data.results;
  },

  async getTasks(projectId: number, filters?: TaskFilters): Promise<Task[]> {
    const params = new URLSearchParams();
    if (filters?.status) params.append('status', filters.status);
    if (filters?.priority) params.append('priority', filters.priority);
    if (filters?.assignee) params.append('assignee', filters.assignee.toString());

    const response = await api.get<PaginatedTaskResponse>(`/tasks/tasks/?project=${projectId}&${params.toString()}`);
    return response.data.tasks ?? response.data.results;
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
    const response = await api.get<PaginatedTaskLabelResponse>(`/tasks/labels/?project=${projectId}`);
    return response.data.results;
  },

  async getMyTasks(filters?: TaskFilters): Promise<Task[]> {
    const params = new URLSearchParams();
    if (filters?.status) params.append('status', filters.status);
    if (filters?.priority) params.append('priority', filters.priority);

    const query = params.toString();
    const response = await api.get<PaginatedTaskResponse>(
      `/tasks/tasks/my_tasks/${query ? `?${query}` : ''}`
    );
    return response.data.tasks ?? response.data.results;
  },

  async getAllTasks(limit = 20, offset = 0): Promise<Task[]> {
    const response = await api.get<{ results: Task[] }>(
      `/tasks/tasks/all_tasks/?limit=${limit}&offset=${offset}`
    );
    return unwrapList(response.data);
  },

  async assignTask(taskId: number, userId: number): Promise<Task> {
    const response = await api.post<Task>(`/tasks/tasks/${taskId}/assign/`, {
      user_id: userId,
    });
    return response.data;
  },

  async changeTaskStatus(taskId: number, status: Task['status']): Promise<Task> {
    const response = await api.post<Task>(`/tasks/tasks/${taskId}/change_status/`, { status });
    return response.data;
  },

  async markTaskComplete(
    taskId: number,
    actualHours?: number
  ): Promise<{ message: string; task: Task }> {
    const response = await api.post<{ message: string; task: Task }>(
      `/tasks/tasks/${taskId}/mark_complete/`,
      actualHours !== undefined ? { actual_hours: actualHours } : {}
    );
    return response.data;
  },

  async logTaskTime(
    taskId: number,
    hours: number
  ): Promise<{ message: string; total_hours: number }> {
    const response = await api.post<{ message: string; total_hours: number }>(
      `/tasks/tasks/${taskId}/log_time/`,
      { hours }
    );
    return response.data;
  },

  async bulkAssignTasks(
    taskIds: number[],
    assigneeId: number
  ): Promise<{ message: string; updated_tasks: number }> {
    const response = await api.post<{ message: string; updated_tasks: number }>(
      '/tasks/tasks/bulk_assign/',
      { task_ids: taskIds, assignee_id: assigneeId }
    );
    return response.data;
  },

  async reorderTasks(taskListId: number, taskOrders: TaskOrder[]): Promise<{ message: string }> {
    const response = await api.post<{ message: string }>(`/tasks/tasks/${taskListId}/reorder/`, {
      task_orders: taskOrders,
    });
    return response.data;
  },

  async updateTaskList(taskListId: number, data: TaskListUpdateData): Promise<TaskList> {
    const response = await api.patch<TaskList>(`/tasks/task-lists/${taskListId}/`, data);
    return response.data;
  },

  async deleteTaskList(taskListId: number): Promise<void> {
    await api.delete(`/tasks/task-lists/${taskListId}/`);
  },

  async createLabel(projectId: number, name: string, color: string): Promise<TaskLabel> {
    const response = await api.post<TaskLabel>('/tasks/labels/', {
      project: projectId,
      name,
      color,
    });
    return response.data;
  },

  async updateLabel(labelId: number, data: Partial<TaskLabel>): Promise<TaskLabel> {
    const response = await api.patch<TaskLabel>(`/tasks/labels/${labelId}/`, data);
    return response.data;
  },

  async deleteLabel(labelId: number): Promise<void> {
    await api.delete(`/tasks/labels/${labelId}/`);
  },
};
