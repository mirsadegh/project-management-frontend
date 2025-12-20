// src/services/contexts/AuthContext.test.tsx
import React from 'react';
import { render, screen, waitFor, act } from '../../tests/test-utils';
import { AuthProvider, useAuth } from './AuthContext';
import { authService } from '../../services/authService';
import { mockUser, mockAuthTokens } from '../../tests/mockData';

// Mock the authService
vi.mock('../../services/authService', () => ({
  authService: {
    login: vi.fn(),
    logout: vi.fn(),
    register: vi.fn(),
    getCurrentUser: vi.fn(),
    isAuthenticated: vi.fn(),
  },
}));

describe('AuthContext', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
  });

  describe('AuthProvider', () => {
    it('should initialize with null user and loading true', () => {
      (authService.isAuthenticated as jest.Mock).mockReturnValue(false);
      
      const TestComponent = () => {
        const { user, loading } = useAuth();
        return (
          <div>
            <span data-testid="user">{user ? 'has-user' : 'no-user'}</span>
            <span data-testid="loading">{loading ? 'loading' : 'not-loading'}</span>
          </div>
        );
      };
      
      render(
        <AuthProvider>
          <TestComponent />
        </AuthProvider>
      );
      
      expect(screen.getByTestId('user')).toHaveTextContent('no-user');
      expect(screen.getByTestId('loading')).toHaveTextContent('loading');
    });

    it('should set user when authenticated and getCurrentUser succeeds', async () => {
      (authService.isAuthenticated as jest.Mock).mockReturnValue(true);
      (authService.getCurrentUser as jest.Mock).mockResolvedValue(mockUser);
      
      const TestComponent = () => {
        const { user, loading } = useAuth();
        return (
          <div>
            <span data-testid="user">{user?.username || 'no-user'}</span>
            <span data-testid="loading">{loading ? 'loading' : 'not-loading'}</span>
          </div>
        );
      };
      
      render(
        <AuthProvider>
          <TestComponent />
        </AuthProvider>
      );
      
      // Wait for the async initialization to complete
      await waitFor(() => {
        expect(screen.getByTestId('loading')).toHaveTextContent('not-loading');
      });
      
      expect(screen.getByTestId('user')).toHaveTextContent(mockUser.username);
    });

    it('should logout when getCurrentUser fails', async () => {
      (authService.isAuthenticated as jest.Mock).mockReturnValue(true);
      (authService.getCurrentUser as jest.Mock).mockRejectedValue(new Error('Invalid token'));
      
      const TestComponent = () => {
        const { user, loading } = useAuth();
        return (
          <div>
            <span data-testid="user">{user ? 'has-user' : 'no-user'}</span>
            <span data-testid="loading">{loading ? 'loading' : 'not-loading'}</span>
          </div>
        );
      };
      
      render(
        <AuthProvider>
          <TestComponent />
        </AuthProvider>
      );
      
      // Wait for the async initialization to complete
      await waitFor(() => {
        expect(screen.getByTestId('loading')).toHaveTextContent('not-loading');
      });
      
      expect(screen.getByTestId('user')).toHaveTextContent('no-user');
      expect(authService.logout).toHaveBeenCalled();
    });
  });

  describe('useAuth hook', () => {
    it('should throw error when used outside AuthProvider', () => {
      const TestComponent = () => {
        try {
          useAuth();
          return <div>Should not render</div>;
        } catch (error) {
          return <div data-testid="error">{(error as Error).message}</div>;
        }
      };
      
      render(<TestComponent />);
      
      expect(screen.getByTestId('error')).toHaveTextContent('useAuth must be used within an AuthProvider');
    });

    it('should provide login function', async () => {
      (authService.isAuthenticated as jest.Mock).mockReturnValue(false);
      (authService.login as jest.Mock).mockResolvedValue(mockAuthTokens);
      (authService.getCurrentUser as jest.Mock).mockResolvedValue(mockUser);
      
      const TestComponent = () => {
        const { login, user } = useAuth();
        return (
          <div>
            <button onClick={() => login('test@example.com', 'password')}>Login</button>
            <span data-testid="user">{user?.username || 'no-user'}</span>
          </div>
        );
      };
      
      render(
        <AuthProvider>
          <TestComponent />
        </AuthProvider>
      );
      
      // Click login button
      fireEvent.click(screen.getByText('Login'));
      
      // Wait for login to complete
      await waitFor(() => {
        expect(authService.login).toHaveBeenCalledWith('test@example.com', 'password');
        expect(authService.getCurrentUser).toHaveBeenCalled();
        expect(screen.getByTestId('user')).toHaveTextContent(mockUser.username);
      });
    });

    it('should provide logout function', async () => {
      (authService.isAuthenticated as jest.Mock).mockReturnValue(true);
      (authService.getCurrentUser as jest.Mock).mockResolvedValue(mockUser);
      
      const TestComponent = () => {
        const { logout, user } = useAuth();
        return (
          <div>
            <button onClick={logout}>Logout</button>
            <span data-testid="user">{user ? 'has-user' : 'no-user'}</span>
          </div>
        );
      };
      
      render(
        <AuthProvider>
          <TestComponent />
        </AuthProvider>
      );
      
      // Wait for initialization
      await waitFor(() => {
        expect(screen.getByTestId('user')).toHaveTextContent('has-user');
      });
      
      // Click logout button
      fireEvent.click(screen.getByText('Logout'));
      
      // Check that user is set to null
      await waitFor(() => {
        expect(screen.getByTestId('user')).toHaveTextContent('no-user');
        expect(authService.logout).toHaveBeenCalled();
      });
    });

    it('should provide register function', async () => {
      (authService.isAuthenticated as jest.Mock).mockReturnValue(false);
      (authService.register as jest.Mock).mockResolvedValue(undefined);
      
      const TestComponent = () => {
        const { register } = useAuth();
        return (
          <div>
            <button onClick={() => register({
              username: 'newuser',
              email: 'new@example.com',
              password: 'password',
            })}>
              Register
            </button>
          </div>
        );
      };
      
      render(
        <AuthProvider>
          <TestComponent />
        </AuthProvider>
      );
      
      // Click register button
      fireEvent.click(screen.getByText('Register'));
      
      // Wait for register to complete
      await waitFor(() => {
        expect(authService.register).toHaveBeenCalledWith({
          username: 'newuser',
          email: 'new@example.com',
          password: 'password',
        });
      });
    });
  });
});