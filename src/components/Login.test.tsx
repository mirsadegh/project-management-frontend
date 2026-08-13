// src/components/Login.test.tsx
import React from 'react';
import { render, screen, fireEvent, waitFor } from '../tests/test-utils';
import { AxiosError } from 'axios';
import Login from './Login';
import { useAuth } from '../services/contexts/AuthContext';
import { mockLoginCredentials } from '../tests/mockData';

// Mock the AuthContext module
vi.mock('../services/contexts/AuthContext', async (importOriginal) => {
  const actual = await importOriginal();
  return {
    ...actual,
    useAuth: vi.fn(),
  };
});

// Mock react-router-dom's useNavigate
const mockNavigate = vi.fn();
vi.mock('react-router-dom', async (importOriginal) => {
  const actual = await importOriginal();
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

describe('Login Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();

    (useAuth as unknown as ReturnType<typeof vi.fn>).mockReturnValue({
      login: vi.fn(),
      user: null,
      logout: vi.fn(),
      register: vi.fn(),
      loading: false,
    });
  });

  it('renders login form correctly', () => {
    render(<Login />);

    expect(screen.getByRole('heading', { name: 'خوش آمدید' })).toBeInTheDocument();
    expect(screen.getByPlaceholderText('ایمیل')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('رمز عبور')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'ورود' })).toBeInTheDocument();
  });

  it('shows error message when login fails', async () => {
    const mockLogin = vi.fn().mockRejectedValue(new Error('Login failed'));
    (useAuth as unknown as ReturnType<typeof vi.fn>).mockReturnValue({
      login: mockLogin,
      user: null,
      logout: vi.fn(),
      register: vi.fn(),
      loading: false,
    });

    render(<Login />);

    fireEvent.change(screen.getByPlaceholderText('ایمیل'), {
      target: { value: mockLoginCredentials.email },
    });
    fireEvent.change(screen.getByPlaceholderText('رمز عبور'), {
      target: { value: mockLoginCredentials.password },
    });

    fireEvent.click(screen.getByRole('button', { name: 'ورود' }));

    await waitFor(() => {
      expect(screen.getByText('Login failed')).toBeInTheDocument();
    });

    expect(mockLogin).toHaveBeenCalledWith(
      mockLoginCredentials.email,
      mockLoginCredentials.password
    );
  });

  it('shows throttle message on 429 responses', async () => {
    const axiosError = new AxiosError('Too many requests');
    axiosError.response = {
      status: 429,
      data: { detail: 'Request was throttled. Expected available in 60 seconds.' },
      statusText: 'Too Many Requests',
      headers: {},
      config: {} as never,
    };

    const mockLogin = vi.fn().mockRejectedValue(axiosError);
    (useAuth as unknown as ReturnType<typeof vi.fn>).mockReturnValue({
      login: mockLogin,
      user: null,
      logout: vi.fn(),
      register: vi.fn(),
      loading: false,
    });

    render(<Login />);

    fireEvent.change(screen.getByPlaceholderText('ایمیل'), {
      target: { value: mockLoginCredentials.email },
    });
    fireEvent.change(screen.getByPlaceholderText('رمز عبور'), {
      target: { value: mockLoginCredentials.password },
    });
    fireEvent.click(screen.getByRole('button', { name: 'ورود' }));

    await waitFor(() => {
      expect(
        screen.getByText('Request was throttled. Expected available in 60 seconds.')
      ).toBeInTheDocument();
    });
  });

  it('navigates to dashboard on successful login', async () => {
    const mockLogin = vi.fn().mockResolvedValue(undefined);
    (useAuth as unknown as ReturnType<typeof vi.fn>).mockReturnValue({
      login: mockLogin,
      user: null,
      logout: vi.fn(),
      register: vi.fn(),
      loading: false,
    });

    render(<Login />);

    fireEvent.change(screen.getByPlaceholderText('ایمیل'), {
      target: { value: mockLoginCredentials.email },
    });
    fireEvent.change(screen.getByPlaceholderText('رمز عبور'), {
      target: { value: mockLoginCredentials.password },
    });

    fireEvent.click(screen.getByRole('button', { name: 'ورود' }));

    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith('/dashboard');
    });

    expect(mockLogin).toHaveBeenCalledWith(
      mockLoginCredentials.email,
      mockLoginCredentials.password
    );
  });

  it('validates email and password fields', async () => {
    render(<Login />);

    fireEvent.click(screen.getByRole('button', { name: 'ورود' }));

    expect(screen.getByPlaceholderText('ایمیل')).toBeInvalid();
    expect(screen.getByPlaceholderText('رمز عبور')).toBeInvalid();
  });
});
