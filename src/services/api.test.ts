// src/services/api.test.ts
import { describe, it, expect, vi, beforeEach } from 'vitest';
import axios from 'axios';
import api from './api';
import { mockAuthTokens } from '../tests/mockData';

// api.ts registers its interceptors on the real axios instance it exports.
// We read those already-registered handlers directly (axios stores them in
// `interceptors.<type>.handlers`) instead of mocking axios, which avoids the
// framework quirk where vi.mock('axios') is not applied to nested imports.
const requestInterceptor = (api.interceptors.request as unknown as { handlers: Array<{ fulfilled: any }> }).handlers[0].fulfilled;
const successHandler = (api.interceptors.response as unknown as { handlers: Array<{ fulfilled: any }> }).handlers[0].fulfilled;
const errorHandler = (api.interceptors.response as unknown as { handlers: Array<{ rejected: any }> }).handlers[0].rejected;

describe('API Service', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    localStorage.clear();
  });

  describe('Request Interceptor', () => {
    it('should add Authorization header when access token exists', () => {
      localStorage.setItem('accessToken', mockAuthTokens.access);

      const result = requestInterceptor({ headers: {} });

      expect(result.headers.Authorization).toBe(`Bearer ${mockAuthTokens.access}`);
    });

    it('should not add Authorization header when no access token exists', () => {
      const result = requestInterceptor({ headers: {} });

      expect(result.headers.Authorization).toBeUndefined();
    });
  });

  describe('Response Interceptor', () => {
    it('should handle successful responses', () => {
      const mockResponse = { data: 'success' };
      const result = successHandler(mockResponse);

      expect(result).toBe(mockResponse);
    });

    it('should handle token refresh on 401 error', async () => {
      localStorage.setItem('accessToken', mockAuthTokens.access);
      localStorage.setItem('refreshToken', mockAuthTokens.refresh);

      const mockError = {
        response: { status: 401 },
        config: { headers: {} },
      };

      vi.spyOn(axios, 'post').mockResolvedValue({ data: { access: 'new-access-token' } });
      // Intercept the retried request so it doesn't hit the network.
      api.defaults.adapter = (vi.fn(() => Promise.resolve({ data: 'retried' })) as unknown) as never;

      const result = await errorHandler(mockError);

      expect(axios.post).toHaveBeenCalledWith(
        expect.stringContaining('/accounts/auth/refresh/'),
        { refresh: mockAuthTokens.refresh }
      );
      expect(localStorage.getItem('accessToken')).toBe('new-access-token');
      expect(result).toBeDefined();
    });

    it('should logout when token refresh fails', async () => {
      localStorage.setItem('accessToken', mockAuthTokens.access);
      localStorage.setItem('refreshToken', mockAuthTokens.refresh);

      const mockError = {
        response: { status: 401 },
        config: { headers: {} },
      };

      vi.spyOn(axios, 'post').mockRejectedValue(new Error('Refresh failed'));

      await expect(errorHandler(mockError)).rejects.toThrow('Refresh failed');
      expect(localStorage.getItem('accessToken')).toBeNull();
      expect(localStorage.getItem('refreshToken')).toBeNull();
    });

    it('should not retry when _retry flag is set', async () => {
      localStorage.setItem('accessToken', mockAuthTokens.access);
      localStorage.setItem('refreshToken', mockAuthTokens.refresh);

      const mockError = {
        response: { status: 401 },
        config: { headers: {}, _retry: true },
      };

      vi.spyOn(axios, 'post');
      await expect(errorHandler(mockError)).rejects.toBeDefined();
      expect(axios.post).not.toHaveBeenCalled();
    });
  });
});
