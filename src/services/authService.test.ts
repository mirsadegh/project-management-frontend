// src/services/authService.test.ts
//
// Security-fix C-4: the previous tests asserted on localStorage
// writes/reads for `accessToken` and `refreshToken`. Those mirrors are
// gone — the backend sets HttpOnly cookies (PR-6) and the frontend no
// longer touches localStorage for tokens. These tests now assert on
// the API surface only and verify that no localStorage state is left
// behind.
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { authService } from './authService';
import api from './api';
import { mockUser, mockAuthTokens, mockLoginCredentials, mockRegisterData } from '../tests/mockData';

// Mock the api module
vi.mock('./api', () => ({
  default: {
    post: vi.fn(),
    get: vi.fn(),
    patch: vi.fn(),
  },
}));

describe('authService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Clear localStorage before each test — security fix C-4 ensures
    // nothing is written here, but we still start clean.
    localStorage.clear();
  });

  describe('login', () => {
    it('should call API with correct credentials and NOT write tokens to localStorage', async () => {
      // Mock the API response (body still includes tokens for backward
      // compatibility; the FE must not write them to localStorage).
      (api.post as jest.Mock).mockResolvedValue({ data: mockAuthTokens });

      const result = await authService.login(mockLoginCredentials);

      // Verify API was called with correct endpoint and data
      expect(api.post).toHaveBeenCalledWith('/accounts/auth/login/', mockLoginCredentials);

      // Security fix (C-4): tokens must NOT be in localStorage.
      expect(localStorage.getItem('accessToken')).toBeNull();
      expect(localStorage.getItem('refreshToken')).toBeNull();

      // The tokens are still returned for callers that need them.
      expect(result).toEqual(mockAuthTokens);
    });

    it('should throw error when login fails', async () => {
      const error = new Error('Login failed');
      (api.post as jest.Mock).mockRejectedValue(error);

      await expect(authService.login(mockLoginCredentials)).rejects.toThrow('Login failed');

      // No tokens should have been written.
      expect(localStorage.getItem('accessToken')).toBeNull();
      expect(localStorage.getItem('refreshToken')).toBeNull();
    });
  });

  describe('register', () => {
    it('should call API with correct user data and NOT write tokens to localStorage', async () => {
      (api.post as jest.Mock).mockResolvedValue({
        data: {
          message: 'Registration successful',
          tokens: mockAuthTokens,
        },
      });

      await authService.register(mockRegisterData);

      expect(api.post).toHaveBeenCalledWith('/accounts/auth/register/', mockRegisterData);
      // Security fix (C-4): no localStorage state.
      expect(localStorage.getItem('accessToken')).toBeNull();
      expect(localStorage.getItem('refreshToken')).toBeNull();
    });

    it('should throw error when registration fails', async () => {
      const error = new Error('Registration failed');
      (api.post as jest.Mock).mockRejectedValue(error);

      await expect(authService.register(mockRegisterData)).rejects.toThrow('Registration failed');
    });
  });

  describe('logout', () => {
    it('should call backend logout with logout_all: true (C-4) and leave localStorage clean', async () => {
      (api.post as jest.Mock).mockResolvedValue({ data: { message: 'Successfully logged out' } });

      await authService.logout();

      // Security fix (C-4): always logout_all since there is no
      // refresh token in localStorage to forward.
      expect(api.post).toHaveBeenCalledWith('/accounts/auth/logout/', { logout_all: true });
      expect(localStorage.getItem('accessToken')).toBeNull();
      expect(localStorage.getItem('refreshToken')).toBeNull();
    });

    it('should swallow backend errors and still complete locally', async () => {
      (api.post as jest.Mock).mockRejectedValue(new Error('Network error'));

      // The promise should not reject — the cookie will expire on its
      // own and the next /me/ call will surface the 401.
      await expect(authService.logout()).resolves.toBeUndefined();
    });
  });

  describe('getCurrentUser', () => {
    it('should return user data when authenticated', async () => {
      (api.get as jest.Mock).mockResolvedValue({ data: mockUser });

      const result = await authService.getCurrentUser();

      expect(api.get).toHaveBeenCalledWith('/accounts/users/me/');
      expect(result).toEqual(mockUser);
    });

    it('should throw error when getting user fails', async () => {
      const error = new Error('Failed to get user');
      (api.get as jest.Mock).mockRejectedValue(error);

      await expect(authService.getCurrentUser()).rejects.toThrow('Failed to get user');
    });
  });

  describe('updateProfile', () => {
    it('should update user profile and return updated data', async () => {
      const updatedUser = { ...mockUser, username: 'updateduser' };
      (api.patch as jest.Mock).mockResolvedValue({ data: updatedUser });

      const result = await authService.updateProfile({ username: 'updateduser' });

      expect(api.patch).toHaveBeenCalledWith('/accounts/users/me/', { username: 'updateduser' });
      expect(result).toEqual(updatedUser);
    });
  });

  describe('isAuthenticated (async, cookie-based)', () => {
    it('should return true when /users/me/ succeeds', async () => {
      (api.get as jest.Mock).mockResolvedValue({ data: mockUser });

      const result = await authService.isAuthenticated();

      expect(result).toBe(true);
      expect(api.get).toHaveBeenCalledWith('/accounts/users/me/');
    });

    it('should return false when /users/me/ fails', async () => {
      (api.get as jest.Mock).mockRejectedValue(new Error('401 Unauthorized'));

      const result = await authService.isAuthenticated();

      expect(result).toBe(false);
    });
  });

  describe('refresh (C-5)', () => {
    it('should POST to /accounts/auth/refresh/ with an empty body (cookie carries the refresh token)', async () => {
      (api.post as jest.Mock).mockResolvedValue({ data: { access: 'new-access' } });

      await authService.refresh();

      expect(api.post).toHaveBeenCalledWith('/accounts/auth/refresh/', {});
    });
  });

  describe('verifySession (replaces verifyToken, C-4)', () => {
    it('should return true when /auth/verify/ succeeds', async () => {
      (api.post as jest.Mock).mockResolvedValue({ data: {} });

      const result = await authService.verifySession();

      expect(result).toBe(true);
    });

    it('should return false when /auth/verify/ fails', async () => {
      (api.post as jest.Mock).mockRejectedValue(new Error('401'));

      const result = await authService.verifySession();

      expect(result).toBe(false);
    });
  });
});
