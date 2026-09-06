// src/components/TeamDetail.test.tsx
import React from 'react';
import { render, screen, waitFor } from '../tests/test-utils';
import userEvent from '@testing-library/user-event';
import { vi } from 'vitest';
import TeamDetail from './TeamDetail';
import { teamService } from '../services/teamService';

// ─── Mock teamService ──────────────────────────────────────────────────────────

vi.mock('../services/teamService', () => ({
  teamService: {
    getTeam: vi.fn(),
    getTeamMembers: vi.fn(),
    getTeams: vi.fn(),
    createTeam: vi.fn(),
    updateTeam: vi.fn(),
    deleteTeam: vi.fn(),
    getMyInvitations: vi.fn(),
    inviteToTeam: vi.fn(),
    acceptInvitation: vi.fn(),
    declineInvitation: vi.fn(),
    getMyTeams: vi.fn(),
    addMember: vi.fn(),
    removeMember: vi.fn(),
    joinTeam: vi.fn(),
    getTeamProjects: vi.fn(),
    assignProject: vi.fn(),
    getTeamMeetings: vi.fn(),
    scheduleMeeting: vi.fn(),
    getTeamGoals: vi.fn(),
    createGoal: vi.fn(),
    getTeamPerformance: vi.fn(),
  },
}));

const mockGetTeam = teamService.getTeam as ReturnType<typeof vi.fn>;
const mockGetTeamMembers = teamService.getTeamMembers as ReturnType<typeof vi.fn>;

// ─── Mock data ────────────────────────────────────────────────────────────────

const mockTeam = {
  id: 1,
  name: 'تیم فنی',
  description: 'تیم توسعه نرم‌افزار',
  slug: 'team-fani',
  created_at: '2024-01-15T10:00:00Z',
  updated_at: '2024-06-01T08:30:00Z',
  member_count: 2,
};

const mockMembers = [
  {
    id: 1,
    user: {
      id: 1,
      username: 'alifront',
      email: 'ali@example.com',
      full_name: 'علی محمدی',
      role: 'DEV',
    },
    team: 1,
    role: 'LEAD' as const,
    joined_at: '2024-01-15T10:00:00Z',
    is_active: true,
    performance_rating: 4.5,
    tasks_completed: 25,
  },
  {
    id: 2,
    user: {
      id: 2,
      username: 'saraDev',
      email: 'sara@example.com',
      full_name: 'سارا احمدی',
      role: 'DEV',
    },
    team: 1,
    role: 'MEMBER' as const,
    joined_at: '2024-02-01T10:00:00Z',
    is_active: true,
    performance_rating: 4.0,
    tasks_completed: 18,
  },
];

// ─── Tests ────────────────────────────────────────────────────────────────────

describe('TeamDetail', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Loading state', () => {
    it('shows loading indicator while fetching team data', () => {
      mockGetTeam.mockReturnValue(new Promise(() => {}));
      mockGetTeamMembers.mockReturnValue(new Promise(() => {}));

      render(<TeamDetail />, { route: '/teams/team-fani' });

      expect(screen.getByText('در حال بارگذاری تیم...')).toBeInTheDocument();
    });
  });

  describe('Error state', () => {
    it('shows error message when team fetch fails', async () => {
      mockGetTeam.mockRejectedValue({
        response: { data: { detail: 'بارگذاری تیم ناموفق بود' } },
      });
      mockGetTeamMembers.mockResolvedValue([]);

      render(<TeamDetail />, { route: '/teams/team-fani' });

      await waitFor(() => {
        expect(screen.getByText('بارگذاری تیم ناموفق بود')).toBeInTheDocument();
      });
    });

    it('shows team not found message when team does not exist', async () => {
      mockGetTeam.mockResolvedValue(null as any);
      mockGetTeamMembers.mockResolvedValue([]);

      render(<TeamDetail />, { route: '/teams/team-fani' });

      await waitFor(() => {
        expect(screen.getByText('تیم یافت نشد')).toBeInTheDocument();
      });
    });
  });

  describe('Team header', () => {
    it('displays team name', async () => {
      mockGetTeam.mockResolvedValue(mockTeam);
      mockGetTeamMembers.mockResolvedValue([]);

      render(<TeamDetail />, { route: '/teams/team-fani' });

      await waitFor(() => {
        expect(screen.getByRole('heading', { name: 'تیم فنی' })).toBeInTheDocument();
      });
    });

    it('displays team description', async () => {
      mockGetTeam.mockResolvedValue(mockTeam);
      mockGetTeamMembers.mockResolvedValue([]);

      render(<TeamDetail />, { route: '/teams/team-fani' });

      await waitFor(() => {
        expect(screen.getByText('تیم توسعه نرم‌افزار')).toBeInTheDocument();
      });
    });

    it('displays back link to teams', async () => {
      mockGetTeam.mockResolvedValue(mockTeam);
      mockGetTeamMembers.mockResolvedValue([]);

      render(<TeamDetail />, { route: '/teams/team-fani' });

      await waitFor(() => {
        expect(screen.getByText('→ بازگشت به تیم‌ها')).toBeInTheDocument();
      });
    });

    it('displays edit and invite buttons', async () => {
      mockGetTeam.mockResolvedValue(mockTeam);
      mockGetTeamMembers.mockResolvedValue([]);

      render(<TeamDetail />, { route: '/teams/team-fani' });

      await waitFor(() => {
        expect(screen.getByRole('button', { name: 'ویرایش' })).toBeInTheDocument();
        expect(screen.getByRole('button', { name: 'دعوت عضو' })).toBeInTheDocument();
      });
    });
  });

  describe('Tabs navigation', () => {
    it('displays members, projects, and invitations tabs', async () => {
      mockGetTeam.mockResolvedValue(mockTeam);
      mockGetTeamMembers.mockResolvedValue([]);

      render(<TeamDetail />, { route: '/teams/team-fani' });

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /اعضا/ })).toBeInTheDocument();
        expect(screen.getByRole('button', { name: 'پروژه‌ها' })).toBeInTheDocument();
        expect(screen.getByRole('button', { name: 'دعوت‌نامه‌ها' })).toBeInTheDocument();
      });
    });

    it('shows members tab as active by default', async () => {
      mockGetTeam.mockResolvedValue(mockTeam);
      mockGetTeamMembers.mockResolvedValue([]);

      render(<TeamDetail />, { route: '/teams/team-fani' });

      await waitFor(() => {
        const membersTab = screen.getByRole('button', { name: /اعضا/ });
        expect(membersTab).toHaveClass('active');
      });
    });

    it('switches to projects tab when clicked', async () => {
      mockGetTeam.mockResolvedValue(mockTeam);
      mockGetTeamMembers.mockResolvedValue([]);

      render(<TeamDetail />, { route: '/teams/team-fani' });

      await waitFor(() => {
        expect(screen.getByRole('heading', { name: 'تیم فنی' })).toBeInTheDocument();
      });

      const user = userEvent.setup();
      await user.click(screen.getByRole('button', { name: 'پروژه‌ها' }));

      await waitFor(() => {
        expect(screen.getByText('پروژه‌های اختصاص‌یافته به این تیم اینجا نمایش داده می‌شوند.')).toBeInTheDocument();
      });
    });

    it('switches to invitations tab when clicked', async () => {
      mockGetTeam.mockResolvedValue(mockTeam);
      mockGetTeamMembers.mockResolvedValue([]);

      render(<TeamDetail />, { route: '/teams/team-fani' });

      await waitFor(() => {
        expect(screen.getByRole('heading', { name: 'تیم فنی' })).toBeInTheDocument();
      });

      const user = userEvent.setup();
      await user.click(screen.getByRole('button', { name: 'دعوت‌نامه‌ها' }));

      await waitFor(() => {
        expect(screen.getByText('دعوت‌نامه‌های تیم اینجا نمایش داده می‌شوند.')).toBeInTheDocument();
      });
    });
  });

  describe('Members tab', () => {
    it('displays member count in tab', async () => {
      mockGetTeam.mockResolvedValue(mockTeam);
      mockGetTeamMembers.mockResolvedValue(mockMembers);

      render(<TeamDetail />, { route: '/teams/team-fani' });

      await waitFor(() => {
        expect(screen.getByText('اعضا (2)')).toBeInTheDocument();
      });
    });

    it('displays member cards with name, email and role', async () => {
      mockGetTeam.mockResolvedValue(mockTeam);
      mockGetTeamMembers.mockResolvedValue(mockMembers);

      render(<TeamDetail />, { route: '/teams/team-fani' });

      await waitFor(() => {
        expect(screen.getByText('علی محمدی')).toBeInTheDocument();
        expect(screen.getByText('سارا احمدی')).toBeInTheDocument();
      });

      // Emails
      expect(screen.getByText('ali@example.com')).toBeInTheDocument();
      expect(screen.getByText('sara@example.com')).toBeInTheDocument();

      // Roles (using getAllByText since they appear multiple places)
      // LEAD is not in ROLE_LABELS so it shows as-is; MEMBER maps to 'عضو'
      expect(screen.getAllByText('LEAD').length).toBeGreaterThanOrEqual(1);
      expect(screen.getAllByText('عضو').length).toBeGreaterThanOrEqual(1);
    });

    it('displays member avatar initials', async () => {
      mockGetTeam.mockResolvedValue(mockTeam);
      mockGetTeamMembers.mockResolvedValue([mockMembers[0]]);

      render(<TeamDetail />, { route: '/teams/team-fani' });

      await waitFor(() => {
        expect(screen.getByText('علی محمدی')).toBeInTheDocument();
      });

      // Avatar shows first character of name
      expect(screen.getByText('ع')).toBeInTheDocument();
    });

    it('displays tasks completed stat', async () => {
      mockGetTeam.mockResolvedValue(mockTeam);
      mockGetTeamMembers.mockResolvedValue([mockMembers[0]]);

      render(<TeamDetail />, { route: '/teams/team-fani' });

      await waitFor(() => {
        expect(screen.getByText('25')).toBeInTheDocument();
        expect(screen.getByText('وظایف انجام‌شده')).toBeInTheDocument();
      });
    });

    it('shows empty state when no members', async () => {
      mockGetTeam.mockResolvedValue(mockTeam);
      mockGetTeamMembers.mockResolvedValue([]);

      render(<TeamDetail />, { route: '/teams/team-fani' });

      await waitFor(() => {
        expect(screen.getByText('هنوز عضوی وجود ندارد. کسی را دعوت کنید!')).toBeInTheDocument();
      });
    });
  });
});
