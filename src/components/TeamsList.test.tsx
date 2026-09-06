// src/components/TeamsList.test.tsx
import React from 'react';
import { render, screen, waitFor } from '../tests/test-utils';
import userEvent from '@testing-library/user-event';
import { vi } from 'vitest';
import TeamsList from './TeamsList';
import { teamService } from '../services/teamService';

// ─── Mock teamService ──────────────────────────────────────────────────────────

vi.mock('../services/teamService', () => ({
  teamService: {
    getTeams: vi.fn(),
    createTeam: vi.fn(),
  },
}));

const mockGetTeams = teamService.getTeams as ReturnType<typeof vi.fn>;
const mockCreateTeam = teamService.createTeam as ReturnType<typeof vi.fn>;

// ─── Mock data ────────────────────────────────────────────────────────────────

const mockTeams = [
  {
    id: 1,
    name: 'تیم توسعه',
    description: 'تیم توسعه نرم‌افزار',
    slug: 'team-dev',
    member_count: 5,
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z',
  },
  {
    id: 2,
    name: 'تیم طراحی',
    description: 'تیم طراحی UI/UX',
    slug: 'team-design',
    member_count: 3,
    created_at: '2024-02-01T00:00:00Z',
    updated_at: '2024-02-01T00:00:00Z',
  },
];

// ─── Tests ─────────────────────────────────────────────────────────────────────

describe('TeamsList', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Loading state', () => {
    it('shows loading indicator while fetching teams', () => {
      // Never resolve — loading stays true
      mockGetTeams.mockReturnValue(new Promise(() => {}));

      render(<TeamsList />, { route: '/teams' });

      expect(screen.getByText('در حال بارگذاری تیم‌ها...')).toBeInTheDocument();
    });
  });

  describe('Error state', () => {
    it('shows error message when fetch fails', async () => {
      mockGetTeams.mockRejectedValue({
        response: { data: { detail: 'خطای سرور' } },
      });

      render(<TeamsList />, { route: '/teams' });

      await waitFor(() => {
        expect(screen.getByText('خطای سرور')).toBeInTheDocument();
      });
    });
  });

  describe('Empty state', () => {
    it('shows empty state when no teams exist', async () => {
      mockGetTeams.mockResolvedValue([]);

      render(<TeamsList />, { route: '/teams' });

      await waitFor(() => {
        expect(screen.getByText('هنوز تیمی وجود ندارد')).toBeInTheDocument();
      });
      expect(screen.getByRole('button', { name: 'ایجاد تیم' })).toBeInTheDocument();
    });
  });

  describe('Team list rendering', () => {
    it('displays list of teams with correct names', async () => {
      mockGetTeams.mockResolvedValue(mockTeams);

      render(<TeamsList />, { route: '/teams' });

      await waitFor(() => {
        expect(screen.getByText('تیم توسعه')).toBeInTheDocument();
        expect(screen.getByText('تیم طراحی')).toBeInTheDocument();
      });
    });

    it('renders team cards as links to team detail pages', async () => {
      mockGetTeams.mockResolvedValue(mockTeams);

      render(<TeamsList />, { route: '/teams' });

      await waitFor(() => {
        const firstLink = screen.getByRole('link', { name: /تیم توسعه/i });
        expect(firstLink).toHaveAttribute('href', '/teams/1');
      });
    });

    it('shows team descriptions', async () => {
      mockGetTeams.mockResolvedValue(mockTeams);

      render(<TeamsList />, { route: '/teams' });

      await waitFor(() => {
        expect(screen.getByText('تیم توسعه نرم‌افزار')).toBeInTheDocument();
      });
    });

    it('shows member count for each team', async () => {
      mockGetTeams.mockResolvedValue(mockTeams);

      render(<TeamsList />, { route: '/teams' });

      await waitFor(() => {
        expect(screen.getByText('5 عضو')).toBeInTheDocument();
        expect(screen.getByText('3 عضو')).toBeInTheDocument();
      });
    });

    it('shows page heading and subtitle', async () => {
      mockGetTeams.mockResolvedValue(mockTeams);

      render(<TeamsList />, { route: '/teams' });

      await waitFor(() => {
        expect(screen.getByRole('heading', { name: 'تیم‌ها' })).toBeInTheDocument();
        expect(screen.getByText('با اعضای تیم خود همکاری کنید')).toBeInTheDocument();
      });
    });

    it('shows search input in header', async () => {
      mockGetTeams.mockResolvedValue(mockTeams);

      render(<TeamsList />, { route: '/teams' });

      await waitFor(() => {
        expect(screen.getByPlaceholderText('جستجوی تیم‌ها...')).toBeInTheDocument();
      });
    });
  });

  describe('Filter/search functionality', () => {
    it('filters teams by name when user types in search input', async () => {
      const user = userEvent.setup();
      mockGetTeams.mockResolvedValue(mockTeams);

      render(<TeamsList />, { route: '/teams' });

      await waitFor(() => {
        expect(screen.getByText('تیم توسعه')).toBeInTheDocument();
        expect(screen.getByText('تیم طراحی')).toBeInTheDocument();
      });

      const searchInput = screen.getByPlaceholderText('جستجوی تیم‌ها...');
      await user.type(searchInput, 'توسعه');

      await waitFor(() => {
        expect(screen.getByText('تیم توسعه')).toBeInTheDocument();
        expect(screen.queryByText('تیم طراحی')).not.toBeInTheDocument();
      });
    });

    it('shows all teams when search input is cleared', async () => {
      const user = userEvent.setup();
      mockGetTeams.mockResolvedValue(mockTeams);

      render(<TeamsList />, { route: '/teams' });

      await waitFor(() => screen.getByText('تیم توسعه'));

      const searchInput = screen.getByPlaceholderText('جستجوی تیم‌ها...');
      await user.type(searchInput, 'توسعه');
      await waitFor(() => {
        expect(screen.queryByText('تیم طراحی')).not.toBeInTheDocument();
      });

      await user.clear(searchInput);
      expect(screen.getByText('تیم طراحی')).toBeInTheDocument();
    });

    it('shows empty filter state when filter matches nothing', async () => {
      const user = userEvent.setup();
      mockGetTeams.mockResolvedValue(mockTeams);

      render(<TeamsList />, { route: '/teams' });

      await waitFor(() => screen.getByText('تیم توسعه'));

      const searchInput = screen.getByPlaceholderText('جستجوی تیم‌ها...');
      await user.type(searchInput, 'xyz-not-a-team');

      await waitFor(() => {
        expect(screen.getByText('هنوز تیمی وجود ندارد')).toBeInTheDocument();
      });
    });
  });

  describe('Create team modal', () => {
    it('opens the create team form when "+ تیم جدید" button is clicked', async () => {
      const user = userEvent.setup();
      mockGetTeams.mockResolvedValue(mockTeams);

      render(<TeamsList />, { route: '/teams' });

      await waitFor(() => screen.getByText('تیم توسعه'));

      const createButton = screen.getByRole('button', { name: '+ تیم جدید' });
      await user.click(createButton);

      await waitFor(() => {
        expect(screen.getByText('ایجاد تیم جدید')).toBeInTheDocument();
      });
    });

    it('closes the form when cancel button is clicked', async () => {
      const user = userEvent.setup();
      mockGetTeams.mockResolvedValue(mockTeams);

      render(<TeamsList />, { route: '/teams' });

      await waitFor(() => screen.getByText('تیم توسعه'));

      await user.click(screen.getByRole('button', { name: '+ تیم جدید' }));
      await waitFor(() => {
        expect(screen.getByText('ایجاد تیم جدید')).toBeInTheDocument();
      });

      await user.click(screen.getByRole('button', { name: 'انصراف' }));

      await waitFor(() => {
        expect(screen.queryByText('ایجاد تیم جدید')).not.toBeInTheDocument();
      });
    });

    it('creates new team successfully', async () => {
      mockGetTeams
        .mockResolvedValueOnce(mockTeams)
        .mockResolvedValueOnce([...mockTeams, { id: 3, name: 'تیم جدید', description: '', slug: 'new', member_count: 1, created_at: '', updated_at: '' }]);
      mockCreateTeam.mockResolvedValue({ id: 3, name: 'تیم جدید', description: '', slug: 'new', member_count: 1, created_at: '', updated_at: '' });

      const user = userEvent.setup();
      render(<TeamsList />, { route: '/teams' });

      await waitFor(() => screen.getByText('تیم توسعه'));

      await user.click(screen.getByRole('button', { name: '+ تیم جدید' }));
      await waitFor(() => {
        expect(screen.getByText('ایجاد تیم جدید')).toBeInTheDocument();
      });

      await user.type(screen.getByPlaceholderText('مثلاً: تیم فرانت‌اند'), 'تیم جدید');
      await user.click(screen.getByRole('button', { name: 'ایجاد تیم' }));

      await waitFor(() => {
        expect(screen.getByText('تیم جدید')).toBeInTheDocument();
      });
      // Modal should be closed after success
      expect(screen.queryByText('ایجاد تیم جدید')).not.toBeInTheDocument();
    });

    it('shows validation error when team name is empty', async () => {
      mockGetTeams.mockResolvedValue(mockTeams);

      const user = userEvent.setup();
      render(<TeamsList />, { route: '/teams' });

      await waitFor(() => screen.getByText('تیم توسعه'));

      await user.click(screen.getByRole('button', { name: '+ تیم جدید' }));
      await waitFor(() => {
        expect(screen.getByText('ایجاد تیم جدید')).toBeInTheDocument();
      });

      // Submit without filling name
      await user.click(screen.getByRole('button', { name: 'ایجاد تیم' }));

      await waitFor(() => {
        expect(screen.getByText('نام تیم الزامی است')).toBeInTheDocument();
      });
      // Form should still be open
      expect(screen.getByText('ایجاد تیم جدید')).toBeInTheDocument();
    });

    it('shows error message when team creation fails', async () => {
      mockGetTeams.mockResolvedValue(mockTeams);
      mockCreateTeam.mockRejectedValue(new Error('ایجاد تیم ناموفق بود'));

      const user = userEvent.setup();
      render(<TeamsList />, { route: '/teams' });

      await waitFor(() => screen.getByText('تیم توسعه'));

      await user.click(screen.getByRole('button', { name: '+ تیم جدید' }));
      await waitFor(() => {
        expect(screen.getByText('ایجاد تیم جدید')).toBeInTheDocument();
      });

      await user.type(screen.getByPlaceholderText('مثلاً: تیم فرانت‌اند'), 'تیم جدید');
      await user.click(screen.getByRole('button', { name: 'ایجاد تیم' }));

      await waitFor(() => {
        expect(screen.getByText('ایجاد تیم ناموفق بود')).toBeInTheDocument();
      });
    });
  });

  describe('Navigation', () => {
    it('team cards are links to team detail pages', async () => {
      mockGetTeams.mockResolvedValue(mockTeams);

      render(<TeamsList />, { route: '/teams' });

      await waitFor(() => {
        const firstLink = screen.getByRole('link', { name: /تیم توسعه/i });
        expect(firstLink).toHaveAttribute('href', '/teams/1');
        const secondLink = screen.getByRole('link', { name: /تیم طراحی/i });
        expect(secondLink).toHaveAttribute('href', '/teams/2');
      });
    });
  });
});
