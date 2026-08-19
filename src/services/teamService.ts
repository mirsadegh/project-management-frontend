import api from './api';
import { unwrapList } from './pagination';

export interface Team {
  id: number;
  name: string;
  description: string;
  slug: string;
  created_at: string;
  updated_at: string;
  member_count?: number;
}

export interface PaginatedTeamsResponse {
  count: number;
  next: string | null;
  previous: string | null;
  total_pages: number;
  current_page: number;
  results: Team[];
}

export interface TeamMembership {
  id: number;
  user: UserSummary;
  team: number;
  role: 'MEMBER' | 'CO_LEAD' | 'LEAD';
  joined_at: string;
  is_active: boolean;
  performance_rating: number | null;
  tasks_completed: number;
}

export interface TeamInvitation {
  id: number;
  team: TeamSummary;
  invited_user: UserSummary;
  invited_by: UserSummary;
  role: 'MEMBER' | 'CO_LEAD' | 'LEAD';
  status: 'PENDING' | 'ACCEPTED' | 'DECLINED' | 'CANCELLED' | 'EXPIRED';
  message: string;
  expires_at: string;
  created_at: string;
}

export interface TeamSummary {
  id: number;
  name: string;
}

export interface UserSummary {
  id: number;
  username: string;
  email: string;
  full_name: string;
  role: string;
}

export interface TeamProject {
  id: number;
  team: TeamSummary;
  project: {
    id: number;
    name: string;
    slug: string;
    status?: string;
  };
  assigned_by: UserSummary | null;
  assigned_by_name: string | null;
  assigned_at: string;
  is_primary: boolean;
}

export interface TeamMeeting {
  id: number;
  team: TeamSummary;
  title: string;
  meeting_type: string;
  description: string;
  scheduled_at: string;
  duration_minutes: number | null;
  location: string | null;
  attendees: UserSummary[];
  organizer: UserSummary;
  agenda: string;
  notes: string;
  action_items: string;
  is_completed: boolean;
  completed_at: string | null;
  is_upcoming: boolean;
  is_past: boolean;
  created_at: string;
  updated_at: string;
}

export interface TeamMeetingCreateData {
  title: string;
  meeting_type?: string;
  description?: string;
  scheduled_at: string;
  duration_minutes?: number | null;
  location?: string | null;
  attendee_ids?: number[];
  agenda?: string;
  notes?: string;
}

export interface TeamGoal {
  id: number;
  team: TeamSummary;
  title: string;
  description: string;
  status: string;
  progress: number;
  start_date: string | null;
  target_date: string | null;
  completed_date: string | null;
  owner: UserSummary;
  target_value: number | null;
  current_value: number | null;
  is_overdue: boolean;
  created_at: string;
  updated_at: string;
}

export interface TeamGoalCreateData {
  title: string;
  description?: string;
  status?: string;
  progress?: number;
  start_date?: string | null;
  target_date?: string | null;
  owner_id?: number;
  target_value?: number | null;
  current_value?: number | null;
}

export interface TeamPerformanceReport {
  team_stats: Record<string, unknown>;
  top_performers: TeamMembership[];
  recent_activities: Array<{
    user: string;
    action: string;
    description: string;
    created_at: string;
  }>;
}

export const teamService = {
  async getTeams(): Promise<Team[]> {
    const response = await api.get<PaginatedTeamsResponse>('/teams/teams/');
    return response.data.results;
  },

  async getTeam(slug: string): Promise<Team> {
    const response = await api.get<Team>(`/teams/teams/${slug}/`);
    return response.data;
  },

  async createTeam(data: Partial<Team>): Promise<Team> {
    const response = await api.post<Team>('/teams/teams/', data);
    return response.data;
  },

  async updateTeam(slug: string, data: Partial<Team>): Promise<Team> {
    const response = await api.patch<Team>(`/teams/teams/${slug}/`, data);
    return response.data;
  },

  async deleteTeam(slug: string): Promise<void> {
    await api.delete(`/teams/teams/${slug}/`);
  },

  async getTeamMembers(slug: string): Promise<TeamMembership[]> {
    const response = await api.get<Team & { members?: TeamMembership[] }>(`/teams/teams/${slug}/`);
    return response.data.members || [];
  },

  async getMyInvitations(): Promise<TeamInvitation[]> {
    const response = await api.get<TeamInvitation[] | { results: TeamInvitation[] }>(
      '/teams/team-invitations/'
    );
    return unwrapList(response.data);
  },

  async inviteToTeam(teamId: number, userId: number, role: string, message = ''): Promise<TeamInvitation> {
    const response = await api.post<TeamInvitation>(`/teams/teams/${teamId}/invite/`, {
      invited_user_id: userId,
      role,
      message,
    });
    return response.data;
  },

  async acceptInvitation(invitationId: number): Promise<void> {
    await api.post(`/teams/team-invitations/${invitationId}/accept/`);
  },

  async declineInvitation(invitationId: number): Promise<void> {
    await api.post(`/teams/team-invitations/${invitationId}/decline/`);
  },

  async getMyTeams(): Promise<Team[]> {
    const response = await api.get<Team[] | { results: Team[] }>('/teams/teams/my_teams/');
    return unwrapList(response.data);
  },

  async addMember(teamId: number, userId: number, role: string): Promise<TeamMembership> {
    const response = await api.post<TeamMembership>(`/teams/teams/${teamId}/add_member/`, {
      user_id: userId,
      role,
    });
    return response.data;
  },

  async removeMember(teamId: number, membershipId: number): Promise<void> {
    await api.delete(`/teams/teams/${teamId}/remove_member/${membershipId}/`);
  },

  async joinTeam(teamId: number): Promise<{ message: string; membership: TeamMembership }> {
    const response = await api.post<{ message: string; membership: TeamMembership }>(
      `/teams/teams/${teamId}/join/`
    );
    return response.data;
  },

  async getTeamProjects(teamId: number): Promise<TeamProject[]> {
    const response = await api.get<TeamProject[]>(`/teams/teams/${teamId}/projects/`);
    return response.data;
  },

  async assignProject(teamId: number, projectId: number, isPrimary = false): Promise<TeamProject> {
    const response = await api.post<TeamProject>(`/teams/teams/${teamId}/assign_project/`, {
      project_id: projectId,
      is_primary: isPrimary,
    });
    return response.data;
  },

  async getTeamMeetings(teamId: number, status?: 'upcoming' | 'past'): Promise<TeamMeeting[]> {
    const query = status ? `?status=${status}` : '';
    const response = await api.get<TeamMeeting[]>(`/teams/teams/${teamId}/meetings/${query}`);
    return response.data;
  },

  async scheduleMeeting(teamId: number, data: TeamMeetingCreateData): Promise<TeamMeeting> {
    const response = await api.post<TeamMeeting>(`/teams/teams/${teamId}/schedule_meeting/`, data);
    return response.data;
  },

  async getTeamGoals(teamId: number, status?: string): Promise<TeamGoal[]> {
    const query = status ? `?status=${status}` : '';
    const response = await api.get<TeamGoal[]>(`/teams/teams/${teamId}/goals/${query}`);
    return response.data;
  },

  async createGoal(teamId: number, data: TeamGoalCreateData): Promise<TeamGoal> {
    const response = await api.post<TeamGoal>(`/teams/teams/${teamId}/create_goal/`, data);
    return response.data;
  },

  async getTeamPerformance(teamId: number): Promise<TeamPerformanceReport> {
    const response = await api.get<TeamPerformanceReport>(`/teams/teams/${teamId}/performance/`);
    return response.data;
  },
};
