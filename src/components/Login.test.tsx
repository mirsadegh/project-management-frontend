// src/components/Login.test.tsx
import React from 'react';
import { render, screen, fireEvent, waitFor } from '../tests/test-utils';
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
    // Clear all mocks before each test
    vi.clearAllMocks();
    
    // Mock the useAuth hook to return a login function
    (useAuth as jest.Mock).mockReturnValue({
      login: vi.fn(),
      user: null,
      logout: vi.fn(),
      register: vi.fn(),
      loading: false,
    });
  });

  it('renders login form correctly', () => {
    render(<Login />);
    
    // Check if all form elements are rendered
    expect(screen.getByRole('heading', { name: 'Login' })).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Email')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Password')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Login' })).toBeInTheDocument();
  });

  it('shows error message when login fails', async () => {
    // Mock login to throw an error
    const mockLogin = vi.fn().mockRejectedValue(new Error('Login failed'));
    (useAuth as jest.Mock).mockReturnValue({
      login: mockLogin,
      user: null,
      logout: vi.fn(),
      register: vi.fn(),
      loading: false,
    });
    
    render(<Login />);
    
    // Fill in the form
    fireEvent.change(screen.getByPlaceholderText('Email'), {
      target: { value: mockLoginCredentials.email },
    });
    fireEvent.change(screen.getByPlaceholderText('Password'), {
      target: { value: mockLoginCredentials.password },
    });
    
    // Submit the form
    fireEvent.click(screen.getByRole('button', { name: 'Login' }));
    
    // Wait for the error to appear
    await waitFor(() => {
      expect(screen.getByText('Invalid email or password')).toBeInTheDocument();
    });
    
    // Ensure login was called with correct credentials
    expect(mockLogin).toHaveBeenCalledWith(
      mockLoginCredentials.email,
      mockLoginCredentials.password
    );
  });

  it('navigates to dashboard on successful login', async () => {
    const mockLogin = vi.fn().mockResolvedValue(undefined);
    (useAuth as jest.Mock).mockReturnValue({
      login: mockLogin,
      user: null,
      logout: vi.fn(),
      register: vi.fn(),
      loading: false,
    });
    
    render(<Login />);
    
    // Fill in the form
    fireEvent.change(screen.getByPlaceholderText('Email'), {
      target: { value: mockLoginCredentials.email },
    });
    fireEvent.change(screen.getByPlaceholderText('Password'), {
      target: { value: mockLoginCredentials.password },
    });
    
    // Submit the form
    fireEvent.click(screen.getByRole('button', { name: 'Login' }));
    
    // Wait for navigation
    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith('/dashboard');
    });
    
    // Ensure login was called with correct credentials
    expect(mockLogin).toHaveBeenCalledWith(
      mockLoginCredentials.email,
      mockLoginCredentials.password
    );
  });

  it('validates email and password fields', async () => {
    render(<Login />);
    
    // Try to submit without filling the form
    fireEvent.click(screen.getByRole('button', { name: 'Login' }));
    
    // Check that required validation works
    expect(screen.getByPlaceholderText('Email')).toBeInvalid();
    expect(screen.getByPlaceholderText('Password')).toBeInvalid();
  });
});