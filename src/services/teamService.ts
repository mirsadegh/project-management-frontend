import api from './api';

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
    const response = await api.get<any>(`/teams/teams/${slug}/`);
    return response.data.members || [];
  },

  async getTeamInvitations(teamId: number): Promise<TeamInvitation[]> {
    const response = await api.get<TeamInvitation[]>(`/teams/team-invitations/?team=${teamId}`);
    return response.data;
  },

  async inviteToTeam(teamId: number, email: string, role: string): Promise<TeamInvitation> {
    const response = await api.post<TeamInvitation>('/teams/team-invitations/', {
      team: teamId,
      invited_user_email: email,
      role,
    });
    return response.data;
  },

  async acceptInvitation(invitationId: number): Promise<void> {
    await api.post(`/teams/team-invitations/${invitationId}/accept/`);
  },

  async declineInvitation(invitationId: number): Promise<void> {
    await api.post(`/teams/team-invitations/${invitationId}/decline/`);
  },
};
