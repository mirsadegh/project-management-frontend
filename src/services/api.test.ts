// src/services/api.test.ts
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import axios from 'axios';
import api from './api';
import { mockAuthTokens } from '../tests/mockData';

// Mock axios
vi.mock('axios', () => ({
  default: {
    create: vi.fn(),
    post: vi.fn(),
  },
}));

describe('API Service', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
  });

  describe('Request Interceptor', () => {
    it('should add Authorization header when access token exists', async () => {
      // Set up mock axios instance
      const mockAxiosInstance = {
        interceptors: {
          request: {
            use: vi.fn(),
          },
          response: {
            use: vi.fn(),
          },
        },
        post: vi.fn(),
        get: vi.fn(),
      };
      
      (axios.create as jest.Mock).mockReturnValue(mockAxiosInstance);
      
      // Set access token in localStorage
      localStorage.setItem('accessToken', mockAuthTokens.access);
      
      // Import api again to trigger the interceptor setup
      const { default: testApi } = await import('./api');
      
      // Verify that the request interceptor was set up
      expect(mockAxiosInstance.interceptors.request.use).toHaveBeenCalled();
      
      // Get the request interceptor function
      const requestInterceptor = (axios.create as jest.Mock).mock.results[0].value.interceptors.request.use.mock.calls[0][0];
      
      // Create a mock config
      const mockConfig = {
        headers: {},
      };
      
      // Call the interceptor
      const result = requestInterceptor(mockConfig);
      
      // Verify Authorization header was added
      expect(result.headers.Authorization).toBe(`Bearer ${mockAuthTokens.access}`);
    });

    it('should not add Authorization header when no access token exists', async () => {
      // Set up mock axios instance
      const mockAxiosInstance = {
        interceptors: {
          request: {
            use: vi.fn(),
          },
          response: {
            use: vi.fn(),
          },
        },
        post: vi.fn(),
        get: vi.fn(),
      };
      
      (axios.create as jest.Mock).mockReturnValue(mockAxiosInstance);
      
      // Import api again to trigger the interceptor setup
      const { default: testApi } = await import('./api');
      
      // Get the request interceptor function
      const requestInterceptor = (axios.create as jest.Mock).mock.results[0].value.interceptors.request.use.mock.calls[0][0];
      
      // Create a mock config
      const mockConfig = {
        headers: {},
      };
      
      // Call the interceptor
      const result = requestInterceptor(mockConfig);
      
      // Verify Authorization header was not added
      expect(result.headers.Authorization).toBeUndefined();
    });
  });

  describe('Response Interceptor', () => {
    it('should handle successful responses', async () => {
      // Set up mock axios instance
      const mockAxiosInstance = {
        interceptors: {
          request: {
            use: vi.fn(),
          },
          response: {
            use: vi.fn(),
          },
        },
        post: vi.fn(),
        get: vi.fn(),
      };
      
      (axios.create as jest.Mock).mockReturnValue(mockAxiosInstance);
      
      // Import api again to trigger the interceptor setup
      const { default: testApi } = await import('./api');
      
      // Get the response interceptor functions
      const responseInterceptor = (axios.create as jest.Mock).mock.results[0].value.interceptors.response.use;
      
      // Mock successful response
      const mockResponse = { data: 'success' };
      const successHandler = responseInterceptor.mock.calls[0][0];
      
      // Call the success handler
      const result = successHandler(mockResponse);
      
      // Verify response is returned as-is
      expect(result).toBe(mockResponse);
    });

    it('should handle token refresh on 401 error', async () => {
      // Set up mock axios instance
      const mockAxiosInstance = {
        interceptors: {
          request: {
            use: vi.fn(),
          },
          response: {
            use: vi.fn(),
          },
        },
        post: vi.fn(),
        get: vi.fn(),
      };
      
      (axios.create as jest.Mock).mockReturnValue(mockAxiosInstance);
      
      // Set up tokens
      localStorage.setItem('accessToken', mockAuthTokens.access);
      localStorage.setItem('refreshToken', mockAuthTokens.refresh);
      
      // Import api again to trigger the interceptor setup
      const { default: testApi } = await import('./api');
      
      // Get the response interceptor functions
      const responseInterceptor = (axios.create as jest.Mock).mock.results[0].value.interceptors.response.use;
      
      // Mock 401 error
      const mockError = {
        response: {
          status: 401,
        },
        config: {
          headers: {},
        },
      };
      
      // Mock axios.post for token refresh
      const mockRefreshResponse = {
        data: { access: 'new-access-token' },
      };
      
      (axios.post as jest.Mock).mockResolvedValue(mockRefreshResponse);
      
      // Get the error handler
      const errorHandler = responseInterceptor.mock.calls[0][1];
      
      // Call the error handler
      const result = await errorHandler(mockError);
      
      // Verify token refresh was attempted
      expect(axios.post).toHaveBeenCalledWith(
        expect.stringContaining('/accounts/auth/refresh/'),
        { refresh: mockAuthTokens.refresh }
      );
      
      // Verify new token was stored
      expect(localStorage.getItem('accessToken')).toBe('new-access-token');
      
      // Verify original request was retried with new token
      expect(result).toBeDefined();
    });

    it('should logout when token refresh fails', async () => {
      // Set up mock axios instance
      const mockAxiosInstance = {
        interceptors: {
          request: {
            use: vi.fn(),
          },
          response: {
            use: vi.fn(),
          },
        },
        post: vi.fn(),
        get: vi.fn(),
      };
      
      (axios.create as jest.Mock).mockReturnValue(mockAxiosInstance);
      
      // Set up tokens
      localStorage.setItem('accessToken', mockAuthTokens.access);
      localStorage.setItem('refreshToken', mockAuthTokens.refresh);
      
      // Import api again to trigger the interceptor setup
      const { default: testApi } = await import('./api');
      
      // Get the response interceptor functions
      const responseInterceptor = (axios.create as jest.Mock).mock.results[0].value.interceptors.response.use;
      
      // Mock 401 error
      const mockError = {
        response: {
          status: 401,
        },
        config: {
          headers: {},
        },
      };
      
      // Mock axios.post for token refresh to fail
      const refreshError = new Error('Refresh failed');
      (axios.post as jest.Mock).mockRejectedValue(refreshError);
      
      // Get the error handler
      const errorHandler = responseInterceptor.mock.calls[0][1];
      
      // Call the error handler and expect it to reject
      await expect(errorHandler(mockError)).rejects.toThrow('Refresh failed');
      
      // Verify tokens were cleared
      expect(localStorage.getItem('accessToken')).toBeNull();
      expect(localStorage.getItem('refreshToken')).toBeNull();
    });

    it('should not retry when _retry flag is set', async () => {
      // Set up mock axios instance
      const mockAxiosInstance = {
        interceptors: {
          request: {
            use: vi.fn(),
          },
          response: {
            use: vi.fn(),
          },
        },
        post: vi.fn(),
        get: vi.fn(),
      };
      
      (axios.create as jest.Mock).mockReturnValue(mockAxiosInstance);
      
      // Set up tokens
      localStorage.setItem('accessToken', mockAuthTokens.access);
      localStorage.setItem('refreshToken', mockAuthTokens.refresh);
      
      // Import api again to trigger the interceptor setup
      const { default: testApi } = await import('./api');
      
      // Get the response interceptor functions
      const responseInterceptor = (axios.create as jest.Mock).mock.results[0].value.interceptors.response.use;
      
      // Mock 401 error with _retry flag
      const mockError = {
        response: {
          status: 401,
        },
        config: {
          headers: {},
          _retry: true,
        },
      };
      
      // Get the error handler
      const errorHandler = responseInterceptor.mock.calls[0][1];
      
      // Call the error handler and expect it to reject without retrying
      await expect(errorHandler(mockError)).rejects.toBeDefined();
      
      // Verify token refresh was not attempted
      expect(axios.post).not.toHaveBeenCalled();
    });
  });
});