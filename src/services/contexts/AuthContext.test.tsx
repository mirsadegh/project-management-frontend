// src/services/contexts/AuthContext.test.tsx
//
// Security-fix C-4: the AuthProvider no longer consults
// `authService.isAuthenticated()` to seed initial state. It always
// calls `authService.getCurrentUser()` and treats 2xx as
// authenticated. The tests have been updated accordingly.
import React from 'react';
import { render, screen, waitFor, fireEvent } from '../../tests/test-utils';
import { render as rawRender } from '@testing-library/react';
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
  },
}));

describe('AuthContext', () => {
  beforeEach(() => {
    // mockReset clears the implementation too, so a `mockRejectedValue`
    // from a prior test doesn't leak into the next one (which was
    // causing an unhandled rejection + wrong call count).
    (authService.getCurrentUser as jest.Mock).mockReset();
    (authService.login as jest.Mock).mockReset();
    (authService.logout as jest.Mock).mockReset();
    (authService.register as jest.Mock).mockReset();
    localStorage.clear();
  });

  describe('AuthProvider', () => {
    it('should start with null user and loading true while probing /me/', () => {
      // Make the initial getCurrentUser call hang so we can assert
      // the "loading" state.
      (authService.getCurrentUser as jest.Mock).mockReturnValue(new Promise(() => {}));

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
        </AuthProvider>,
        { route: '/test' }
      );

      expect(screen.getByTestId('user')).toHaveTextContent('no-user');
      expect(screen.getByTestId('loading')).toHaveTextContent('loading');
    });

    it('should set user when getCurrentUser succeeds', async () => {
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
        </AuthProvider>,
        { route: '/test' }
      );

      await waitFor(() => {
        expect(screen.getByTestId('loading')).toHaveTextContent('not-loading');
      });

      expect(screen.getByTestId('user')).toHaveTextContent(mockUser.username);
    });

    it('should clear user and stay logged-out when getCurrentUser fails (C-4)', async () => {
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
        </AuthProvider>,
        { route: '/test' }
      );

      await waitFor(() => {
        expect(screen.getByTestId('loading')).toHaveTextContent('not-loading');
      });

      expect(screen.getByTestId('user')).toHaveTextContent('no-user');
      // C-4: no automatic logout() call — we just keep the user null.
      // The next 401 from any real call will trigger the refresh
      // interceptor, which on failure propagates the error.
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

      rawRender(<TestComponent />);

      expect(screen.getByTestId('error')).toHaveTextContent('useAuth must be used within an AuthProvider');
    });

    it('should provide login function', async () => {
      // Sequence: (1) initial probe fails -> user stays null.
      //          (2) login() is called -> calls getCurrentUser()
      //          (3) login() calls getCurrentUser() again to confirm identity.
      (authService.getCurrentUser as jest.Mock)
        .mockRejectedValueOnce(new Error('not authenticated'))
        .mockResolvedValueOnce(mockUser)
        .mockResolvedValueOnce(mockUser);
      (authService.login as jest.Mock).mockResolvedValue(mockAuthTokens);

      const TestComponent = () => {
        const { login, user } = useAuth();
        return (
          <div>
            <button onClick={() => login('test@example.com', 'password')}>Login</button>
            <span data-testid="user">{user?.username || 'no-user'}</span>
          </div>
        );
      };

      rawRender(
        <AuthProvider>
          <TestComponent />
        </AuthProvider>
      );

      // Wait for the initial probe to settle (and reject).
      await waitFor(() => {
        expect(authService.getCurrentUser).toHaveBeenCalledTimes(1);
      });

      // Click login button
      fireEvent.click(screen.getByText('Login'));

      // Wait for login to complete
      await waitFor(() => {
        expect(authService.login).toHaveBeenCalledWith({ email: 'test@example.com', password: 'password' });
        expect(authService.getCurrentUser).toHaveBeenCalledTimes(2);
        expect(screen.getByTestId('user')).toHaveTextContent(mockUser.username);
      });
    });

    it('should provide logout function', async () => {
      (authService.getCurrentUser as jest.Mock).mockResolvedValue(mockUser);
      (authService.logout as jest.Mock).mockResolvedValue(undefined);

      const TestComponent = () => {
        const { logout, user } = useAuth();
        return (
          <div>
            <button onClick={() => { void logout(); }}>Logout</button>
            <span data-testid="user">{user ? 'has-user' : 'no-user'}</span>
          </div>
        );
      };

      render(
        <AuthProvider>
          <TestComponent />
        </AuthProvider>,
        { route: '/test' }
      );

      // Wait for initialization
      await waitFor(() => {
        expect(screen.getByTestId('user')).toHaveTextContent('has-user');
      });

      // Click logout button
      fireEvent.click(screen.getByText('Logout'));

      // logout() is async; wait for setUser(null) to be called after authService.logout resolves
      await waitFor(() => {
        expect(screen.getByTestId('user')).toHaveTextContent('no-user');
        expect(authService.logout).toHaveBeenCalled();
      });
    });

    it('should provide register function', async () => {
      // Sequence: (1) initial probe returns user.
      //          (2) register() is called.
      //          (3) After successful register, implementation calls getCurrentUser() again.
      (authService.getCurrentUser as jest.Mock)
        .mockResolvedValueOnce(mockUser)
        .mockResolvedValueOnce(mockUser)
        .mockResolvedValueOnce(mockUser);
      (authService.register as jest.Mock).mockResolvedValue(undefined);

      const TestComponent = () => {
        const { register } = useAuth();
        return (
          <div>
            <button onClick={() => register({
              username: 'newuser',
              email: 'new@example.com',
              password: 'password',
              password_confirm: 'password',
            })}>
              Register
            </button>
          </div>
        );
      };

      render(
        <AuthProvider>
          <TestComponent />
        </AuthProvider>,
        { route: '/test' }
      );

      // Wait for initial probe to resolve
      await waitFor(() => {
        expect(authService.getCurrentUser).toHaveBeenCalled();
      });

      // Click register button
      fireEvent.click(screen.getByText('Register'));

      // Wait for register to complete
      await waitFor(() => {
        expect(authService.register).toHaveBeenCalledWith({
          username: 'newuser',
          email: 'new@example.com',
          password: 'password',
          password_confirm: 'password',
        });
      });
    });
  });
});
