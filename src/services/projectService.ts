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
  members?: ProjectMember[];
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

export interface ProjectStatistics {
  total_tasks: number;
  completed_tasks: number;
  in_progress_tasks: number;
  todo_tasks: number;
  blocked_tasks: number;
  in_review_tasks: number;
  overdue_tasks: number;
  total_members: number;
}

export interface ProjectReport {
  project_name: string;
  total_tasks: number;
  completed: number;
  in_progress: number;
  members: number;
}

export interface ProjectTeamInfo {
  your_role: string;
  total_members: number;
  members: ProjectMember[];
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
    const response = await api.get<ProjectMember[]>(`/projects/projects/${slug}/members/`);
    return response.data;
  },

  async addMember(
    slug: string,
    user_id: number,
    role: ProjectMember['role'] = 'MEMBER'
  ): Promise<ProjectMember> {
    const response = await api.post<ProjectMember>(
      `/projects/projects/${slug}/add_member/`,
      { user_id, role }
    );
    return response.data;
  },

  async removeMember(slug: string, memberId: number): Promise<void> {
    await api.delete(`/projects/projects/${slug}/remove_member/${memberId}/`);
  },

  async getStatistics(slug: string): Promise<ProjectStatistics> {
    const response = await api.get<ProjectStatistics>(`/projects/projects/${slug}/statistics/`);
    return response.data;
  },

  async getReports(slug: string): Promise<ProjectReport> {
    const response = await api.get<ProjectReport>(`/projects/projects/${slug}/reports/`);
    return response.data;
  },

  async getTeamInfo(slug: string): Promise<ProjectTeamInfo> {
    const response = await api.get<ProjectTeamInfo>(`/projects/projects/${slug}/team_info/`);
    return response.data;
  },

  async archive(slug: string): Promise<{ message: string }> {
    const response = await api.post<{ message: string }>(`/projects/projects/${slug}/archive/`);
    return response.data;
  },

  async closeProject(slug: string): Promise<{ message: string; completed_date: string }> {
    const response = await api.post<{ message: string; completed_date: string }>(
      `/projects/projects/${slug}/close_project/`
    );
    return response.data;
  },

  async forceDelete(slug: string): Promise<{ message: string }> {
    const response = await api.delete<{ message: string }>(`/projects/projects/${slug}/force_delete/`);
    return response.data;
  },

  async getComments(slug: string) {
    const response = await api.get(`/projects/projects/${slug}/comments/`);
    return response.data;
  },

  async addComment(slug: string, text: string, parent?: number) {
    const response = await api.post(`/projects/projects/${slug}/add_comment/`, {
      text,
      parent: parent ?? null,
    });
    return response.data;
  },

  async getAttachments(slug: string) {
    const response = await api.get(`/projects/projects/${slug}/attachments/`);
    return response.data;
  },

  async uploadFile(slug: string, file: File, description = '') {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('description', description);
    const response = await api.post(`/projects/projects/${slug}/upload_file/`, formData);
    return response.data;
  },
};
