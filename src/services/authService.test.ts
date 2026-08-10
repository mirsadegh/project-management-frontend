// src/services/authService.test.ts
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
    // Clear localStorage before each test
    localStorage.clear();
  });

  describe('login', () => {
    it('should call API with correct credentials and store tokens', async () => {
      // Mock the API response
      (api.post as jest.Mock).mockResolvedValue({ data: mockAuthTokens });
      
      const result = await authService.login(mockLoginCredentials);
      
      // Verify API was called with correct endpoint and data
      expect(api.post).toHaveBeenCalledWith('/accounts/auth/login/', mockLoginCredentials);
      
      // Verify tokens are stored in localStorage
      expect(localStorage.getItem('accessToken')).toBe(mockAuthTokens.access);
      expect(localStorage.getItem('refreshToken')).toBe(mockAuthTokens.refresh);
      
      // Verify tokens are returned
      expect(result).toEqual(mockAuthTokens);
    });

    it('should throw error when login fails', async () => {
      const error = new Error('Login failed');
      (api.post as jest.Mock).mockRejectedValue(error);
      
      await expect(authService.login(mockLoginCredentials)).rejects.toThrow('Login failed');
      
      // Verify no tokens are stored
      expect(localStorage.getItem('accessToken')).toBeNull();
      expect(localStorage.getItem('refreshToken')).toBeNull();
    });
  });

  describe('register', () => {
    it('should call API with correct user data and store tokens', async () => {
      (api.post as jest.Mock).mockResolvedValue({
        data: {
          message: 'Registration successful',
          tokens: mockAuthTokens,
        },
      });
      
      await authService.register(mockRegisterData);
      
      // Verify API was called with correct endpoint and data
      expect(api.post).toHaveBeenCalledWith('/accounts/auth/register/', mockRegisterData);
      expect(localStorage.getItem('accessToken')).toBe(mockAuthTokens.access);
      expect(localStorage.getItem('refreshToken')).toBe(mockAuthTokens.refresh);
    });

    it('should throw error when registration fails', async () => {
      const error = new Error('Registration failed');
      (api.post as jest.Mock).mockRejectedValue(error);
      
      await expect(authService.register(mockRegisterData)).rejects.toThrow('Registration failed');
    });
  });

  describe('logout', () => {
    it('should call backend logout and remove tokens from localStorage', async () => {
      localStorage.setItem('accessToken', mockAuthTokens.access);
      localStorage.setItem('refreshToken', mockAuthTokens.refresh);
      (api.post as jest.Mock).mockResolvedValue({ data: { message: 'Successfully logged out' } });
      
      await authService.logout();
      
      expect(api.post).toHaveBeenCalledWith('/accounts/auth/logout/', {
        refresh: mockAuthTokens.refresh,
      });
      expect(localStorage.getItem('accessToken')).toBeNull();
      expect(localStorage.getItem('refreshToken')).toBeNull();
    });

    it('should still clear tokens if backend logout fails', async () => {
      localStorage.setItem('accessToken', mockAuthTokens.access);
      localStorage.setItem('refreshToken', mockAuthTokens.refresh);
      (api.post as jest.Mock).mockRejectedValue(new Error('Network error'));
      
      await authService.logout();
      
      expect(localStorage.getItem('accessToken')).toBeNull();
      expect(localStorage.getItem('refreshToken')).toBeNull();
    });
  });

  describe('getCurrentUser', () => {
    it('should return user data when authenticated', async () => {
      (api.get as jest.Mock).mockResolvedValue({ data: mockUser });
      
      const result = await authService.getCurrentUser();
      
      // Verify API was called with correct endpoint
      expect(api.get).toHaveBeenCalledWith('/accounts/profile/');
      
      // Verify user data is returned
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
      
      // Verify API was called with correct endpoint and data
      expect(api.patch).toHaveBeenCalledWith('/accounts/profile/', { username: 'updateduser' });
      
      // Verify updated user data is returned
      expect(result).toEqual(updatedUser);
    });
  });

  describe('isAuthenticated', () => {
    it('should return true when access token exists', () => {
      localStorage.setItem('accessToken', mockAuthTokens.access);
      
      const result = authService.isAuthenticated();
      
      expect(result).toBe(true);
    });

    it('should return false when access token does not exist', () => {
      const result = authService.isAuthenticated();
      
      expect(result).toBe(false);
    });
  });
});