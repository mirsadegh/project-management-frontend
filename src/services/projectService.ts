import api from './api';

export interface Project {
  id: number;
  name: string;
  slug: string;
  description: string;
  owner: UserSummary;
  manager: UserSummary | null;
  status: 'PLANNING' | 'IN_PROGRESS' | 'ON_HOLD' | 'COMPLETED' | 'CANCELLED';
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  progress: number;
  start_date: string | null;
  due_date: string | null;
  completed_date: string | null;
  budget: number | null;
  is_active: boolean;
  is_public: boolean;
  is_overdue: boolean;
  total_tasks: number;
  completed_tasks: number;
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

export interface ProjectMember {
  id: number;
  user: UserSummary;
  role: 'OWNER' | 'MANAGER' | 'MEMBER' | 'VIEWER';
  joined_at: string;
}

export interface ProjectFilters {
  status?: string;
  priority?: string;
  search?: string;
}

export const projectService = {
  async getProjects(filters?: ProjectFilters): Promise<Project[]> {
    const params = new URLSearchParams();
    if (filters?.status) params.append('status', filters.status);
    if (filters?.priority) params.append('priority', filters.priority);
    if (filters?.search) params.append('search', filters.search);
    
    const response = await api.get<Project[]>(`/projects/projects/?${params.toString()}`);
    return response.data;
  },

  async getProject(id: number): Promise<Project> {
    const response = await api.get<Project>(`/projects/projects/${id}/`);
    return response.data;
  },

  async createProject(data: Partial<Project>): Promise<Project> {
    const response = await api.post<Project>('/projects/projects/', data);
    return response.data;
  },

  async updateProject(id: number, data: Partial<Project>): Promise<Project> {
    const response = await api.patch<Project>(`/projects/projects/${id}/`, data);
    return response.data;
  },

  async deleteProject(id: number): Promise<void> {
    await api.delete(`/projects/projects/${id}/`);
  },

  async getProjectMembers(projectId: number): Promise<ProjectMember[]> {
    const response = await api.get<any>(`/projects/projects/${projectId}/`);
    return response.data.members || [];
  },
};
