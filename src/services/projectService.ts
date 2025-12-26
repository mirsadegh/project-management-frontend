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

export interface PaginatedProjectsResponse {
  pagination: {
    count: number;
    total_pages: number;
    current_page: number;
    page_size: number;
    next: string | null;
    previous: string | null;
  };
  projects: Project[];
}

export const projectService = {
  async getProjects(filters?: ProjectFilters): Promise<Project[]> {
    const params = new URLSearchParams();
    if (filters?.status) params.append('status', filters.status);
    if (filters?.priority) params.append('priority', filters.priority);
    if (filters?.search) params.append('search', filters.search);

    const response = await api.get<PaginatedProjectsResponse>(`/projects/projects/?${params.toString()}`);
    return response.data.projects;
  },

  async getProject(slug: string): Promise<Project> {
    const response = await api.get<Project>(`/projects/projects/${slug}/`);
    return response.data;
  },

  async createProject(data: Partial<Project>): Promise<Project> {
    const response = await api.post<Project>('/projects/projects/', data);
    return response.data;
  },

  async updateProject(slug: string, data: Partial<Project>): Promise<Project> {
    const response = await api.patch<Project>(`/projects/projects/${slug}/`, data);
    return response.data;
  },

  async deleteProject(slug: string): Promise<void> {
    await api.delete(`/projects/projects/${slug}/`);
  },

  async getProjectMembers(slug: string): Promise<ProjectMember[]> {
    const response = await api.get<any>(`/projects/projects/${slug}/`);
    return response.data.members || [];
  },
};
