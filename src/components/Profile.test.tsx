// src/components/Profile.test.tsx
import React from 'react';
import { render, screen, waitFor, fireEvent } from '../tests/test-utils';
import userEvent from '@testing-library/user-event';
import { vi } from 'vitest';
import Profile from './Profile';
import { useAuth } from '../services/contexts/AuthContext';
import { authService } from '../services/authService';
import { mockUser } from '../tests/mockData';

// ─── Mock AuthContext ──────────────────────────────────────────────────────────

vi.mock('../services/contexts/AuthContext', async (importOriginal) => {
  const actual = await importOriginal();
  return {
    ...actual,
    useAuth: vi.fn(),
  };
});

// ─── Mock authService ────────────────────────────────────────────────────────

vi.mock('../services/authService', () => ({
  authService: {
    updateProfile: vi.fn(),
  },
}));

const mockUseAuth = useAuth as ReturnType<typeof vi.fn>;
const mockUpdateProfile = authService.updateProfile as ReturnType<typeof vi.fn>;

// ─── Tests ───────────────────────────────────────────────────────────────────

describe('Profile', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUseAuth.mockReturnValue({
      user: mockUser,
      loading: false,
      login: vi.fn(),
      logout: vi.fn(),
      register: vi.fn(),
    });
  });

  describe('Loading state', () => {
    it('shows loading when user is not yet available', () => {
      mockUseAuth.mockReturnValue({
        user: null,
        loading: true,
        login: vi.fn(),
        logout: vi.fn(),
        register: vi.fn(),
      });

      render(<Profile />, { route: '/profile' });

      expect(screen.getByText('در حال بارگذاری...')).toBeInTheDocument();
    });
  });

  describe('Profile display', () => {
    it('displays user full name', async () => {
      render(<Profile />, { route: '/profile' });

      await waitFor(() => {
        expect(screen.getByText('علی احمدی')).toBeInTheDocument();
      });
    });

    it('displays user email', async () => {
      render(<Profile />, { route: '/profile' });

      await waitFor(() => {
        // email appears twice: in header and in detail grid
        expect(screen.getAllByText('test@example.com').length).toBeGreaterThanOrEqual(1);
      });
    });

    it('displays user role label', async () => {
      render(<Profile />, { route: '/profile' });

      await waitFor(() => {
        // role appears in both header and detail section
        expect(screen.getAllByText('توسعه‌دهنده').length).toBeGreaterThanOrEqual(1);
      });
    });

    it('displays phone number when available', async () => {
      render(<Profile />, { route: '/profile' });

      await waitFor(() => {
        expect(screen.getByText('۰۹۱۲۳۴۵۶۷۸۹')).toBeInTheDocument();
      });
    });

    it('displays username', async () => {
      render(<Profile />, { route: '/profile' });

      await waitFor(() => {
        expect(screen.getByText('testuser')).toBeInTheDocument();
      });
    });

    it('displays job title and department', async () => {
      render(<Profile />, { route: '/profile' });

      await waitFor(() => {
        // job_title and department appear in the job info detail section
        expect(screen.getAllByText('فنی').length).toBeGreaterThanOrEqual(1);
      });
    });

    it('displays availability status', async () => {
      render(<Profile />, { route: '/profile' });

      await waitFor(() => {
        expect(screen.getByText('در دسترس')).toBeInTheDocument();
      });
    });

    it('shows edit button', async () => {
      render(<Profile />, { route: '/profile' });

      await waitFor(() => {
        expect(screen.getByRole('button', { name: 'ویرایش پروفایل' })).toBeInTheDocument();
      });
    });
  });

  describe('Edit mode', () => {
    it('opens edit form when edit button is clicked', async () => {
      const user = userEvent.setup();
      render(<Profile />, { route: '/profile' });

      await waitFor(() => {
        expect(screen.getByText('علی احمدی')).toBeInTheDocument();
      });

      await user.click(screen.getByRole('button', { name: 'ویرایش پروفایل' }));

      await waitFor(() => {
        expect(screen.getByLabelText('نام')).toBeInTheDocument();
        expect(screen.getByLabelText('نام خانوادگی')).toBeInTheDocument();
      });
    });

    it('shows cancel button in edit mode', async () => {
      const user = userEvent.setup();
      render(<Profile />, { route: '/profile' });

      await waitFor(() => {
        expect(screen.getByText('علی احمدی')).toBeInTheDocument();
      });

      await user.click(screen.getByRole('button', { name: 'ویرایش پروفایل' }));

      await waitFor(() => {
        expect(screen.getByRole('button', { name: 'انصراف' })).toBeInTheDocument();
      });
    });

    it('pre-fills form with current user data', async () => {
      const user = userEvent.setup();
      render(<Profile />, { route: '/profile' });

      await waitFor(() => {
        expect(screen.getByText('علی احمدی')).toBeInTheDocument();
      });

      await user.click(screen.getByRole('button', { name: 'ویرایش پروفایل' }));

      await waitFor(() => {
        expect(screen.getByDisplayValue('علی')).toBeInTheDocument();
        expect(screen.getByDisplayValue('احمدی')).toBeInTheDocument();
      });
    });

    it('closes edit form when cancel is clicked', async () => {
      const user = userEvent.setup();
      render(<Profile />, { route: '/profile' });

      await waitFor(() => {
        expect(screen.getByText('علی احمدی')).toBeInTheDocument();
      });

      await user.click(screen.getByRole('button', { name: 'ویرایش پروفایل' }));

      await waitFor(() => {
        expect(screen.getByLabelText('نام')).toBeInTheDocument();
      });

      await user.click(screen.getByRole('button', { name: 'انصراف' }));

      await waitFor(() => {
        expect(screen.queryByLabelText('نام')).not.toBeInTheDocument();
        expect(screen.getByText('علی احمدی')).toBeInTheDocument();
      });
    });
  });

  describe('Profile update', () => {
    it('updates profile successfully', async () => {
      mockUpdateProfile.mockResolvedValue(undefined);

      const user = userEvent.setup();
      render(<Profile />, { route: '/profile' });

      await waitFor(() => {
        expect(screen.getByText('علی احمدی')).toBeInTheDocument();
      });

      await user.click(screen.getByRole('button', { name: 'ویرایش پروفایل' }));

      await waitFor(() => {
        expect(screen.getByLabelText('نام')).toBeInTheDocument();
      });

      const firstNameInput = screen.getByLabelText('نام');
      await user.clear(firstNameInput);
      await user.type(firstNameInput, 'محمد');

      const submitButton = screen.getByRole('button', { name: 'ذخیره تغییرات' });
      await user.click(submitButton);

      await waitFor(() => {
        expect(mockUpdateProfile).toHaveBeenCalledWith(
          expect.objectContaining({ first_name: 'محمد' })
        );
      });

      await waitFor(() => {
        expect(screen.getByText('پروفایل با موفقیت به‌روزرسانی شد!')).toBeInTheDocument();
      });

      // Form should close after success
      await waitFor(() => {
        expect(screen.queryByLabelText('نام')).not.toBeInTheDocument();
      });
    });

    it('shows error message when update fails', async () => {
      mockUpdateProfile.mockRejectedValue(new Error('Update failed'));

      const user = userEvent.setup();
      render(<Profile />, { route: '/profile' });

      await waitFor(() => {
        expect(screen.getByText('علی احمدی')).toBeInTheDocument();
      });

      await user.click(screen.getByRole('button', { name: 'ویرایش پروفایل' }));

      await waitFor(() => {
        expect(screen.getByLabelText('نام')).toBeInTheDocument();
      });

      await user.click(screen.getByRole('button', { name: 'ذخیره تغییرات' }));

      await waitFor(() => {
        expect(screen.getByText('به‌روزرسانی پروفایل ناموفق بود. لطفاً دوباره تلاش کنید.')).toBeInTheDocument();
      });

      // Form should stay open after error
      expect(screen.getByLabelText('نام')).toBeInTheDocument();
    });

    it('shows loading state while saving', async () => {
      mockUpdateProfile.mockReturnValue(new Promise(() => {}));

      const user = userEvent.setup();
      render(<Profile />, { route: '/profile' });

      await waitFor(() => {
        expect(screen.getByText('علی احمدی')).toBeInTheDocument();
      });

      await user.click(screen.getByRole('button', { name: 'ویرایش پروفایل' }));

      await waitFor(() => {
        expect(screen.getByLabelText('نام')).toBeInTheDocument();
      });

      const submitButton = screen.getByRole('button', { name: 'ذخیره تغییرات' });
      await user.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText('در حال ذخیره...')).toBeInTheDocument();
      });

      expect(submitButton).toBeDisabled();
    });
  });

});
