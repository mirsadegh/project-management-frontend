// src/services/api.test.ts
//
// Security-fix C-2 / C-3 / C-4: the previous tests asserted on the
// `Authorization: Bearer <token>` request interceptor and on
// localStorage state for refresh. Those behaviors are gone — the
// cookie is the source of truth (PR-6), no Authorization header is
// injected (C-2), X-CSRFToken is added to non-GET requests (C-3),
// and the refresh interceptor uses a cookie-based POST with an empty
// body (C-4). These tests cover the new contract.
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import axios from 'axios';
import api from './api';

const requestInterceptor = (api.interceptors.request as unknown as { handlers: Array<{ fulfilled: any }> }).handlers[0].fulfilled;
const responseErrorHandler = (api.interceptors.response as unknown as { handlers: Array<{ rejected: any }> }).handlers[0].rejected;

// Helper to clear cookies between tests.
function clearCookies() {
  document.cookie.split(';').forEach((c) => {
    const eqPos = c.indexOf('=');
    const name = eqPos > -1 ? c.substr(0, eqPos).trim() : c.trim();
    document.cookie = `${name}=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/`;
  });
}

describe('API Service', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    localStorage.clear();
    clearCookies();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('Request Interceptor (C-2 + C-3)', () => {
    it('should NOT add Authorization header (C-2 — cookie is source of truth)', () => {
      localStorage.setItem('accessToken', 'should-be-ignored');

      const result = requestInterceptor({ headers: {}, method: 'get' });

      expect(result.headers.Authorization).toBeUndefined();
    });

    it('should add X-CSRFToken on POST when csrftoken cookie is present (C-3)', () => {
      document.cookie = 'csrftoken=test-csrf-token';

      const result = requestInterceptor({ headers: {}, method: 'post' });

      expect(result.headers['X-CSRFToken']).toBe('test-csrf-token');
    });

    it('should add X-CSRFToken on PUT/PATCH/DELETE (C-3)', () => {
      document.cookie = 'csrftoken=csrf-xyz';

      const putResult = requestInterceptor({ headers: {}, method: 'put' });
      const patchResult = requestInterceptor({ headers: {}, method: 'patch' });
      const delResult = requestInterceptor({ headers: {}, method: 'delete' });

      expect(putResult.headers['X-CSRFToken']).toBe('csrf-xyz');
      expect(patchResult.headers['X-CSRFToken']).toBe('csrf-xyz');
      expect(delResult.headers['X-CSRFToken']).toBe('csrf-xyz');
    });

    it('should NOT add X-CSRFToken on GET (C-3 — safe methods skip CSRF)', () => {
      document.cookie = 'csrftoken=csrf-xyz';

      const result = requestInterceptor({ headers: {}, method: 'get' });

      expect(result.headers['X-CSRFToken']).toBeUndefined();
    });

    it('should not set X-CSRFToken when no csrftoken cookie exists', () => {
      const result = requestInterceptor({ headers: {}, method: 'post' });

      expect(result.headers['X-CSRFToken']).toBeUndefined();
    });
  });

  describe('Response Interceptor (C-4 — cookie-based refresh)', () => {
    it('should refresh via cookie (empty body) and retry the original request on 401', async () => {
      // The refresh interceptor uses bare `axios.post` (not the
      // configured `api` instance) so it can carry `withCredentials`
      // on a fresh request.
      const refreshSpy = vi.spyOn(axios, 'post').mockResolvedValue({ data: { access: 'new-access' } });
      // Intercept the retried request so it doesn't hit the network.
      api.defaults.adapter = (vi.fn(() => Promise.resolve({ data: 'retried' })) as unknown) as never;

      const mockError = {
        response: { status: 401 },
        config: { headers: {} },
      };

      const result = await responseErrorHandler(mockError);

      // Cookie-based refresh: no refresh token in the body.
      expect(refreshSpy).toHaveBeenCalledWith(
        expect.stringContaining('/accounts/auth/refresh/'),
        {},
        expect.objectContaining({ withCredentials: true })
      );
      // C-4: no localStorage write.
      expect(localStorage.getItem('accessToken')).toBeNull();
      expect(result).toBeDefined();
    });

    it('should reject when refresh fails', async () => {
      vi.spyOn(axios, 'post').mockRejectedValue(new Error('Refresh failed'));

      const mockError = {
        response: { status: 401 },
        config: { headers: {} },
      };

      await expect(responseErrorHandler(mockError)).rejects.toThrow('Refresh failed');
    });

    it('should not retry when _retry flag is set', async () => {
      const refreshSpy = vi.spyOn(axios, 'post');

      const mockError = {
        response: { status: 401 },
        config: { headers: {}, _retry: true },
      };

      await expect(responseErrorHandler(mockError)).rejects.toBeDefined();
      expect(refreshSpy).not.toHaveBeenCalled();
    });

    it('should not refresh on non-401 errors', async () => {
      const refreshSpy = vi.spyOn(axios, 'post');

      const mockError = {
        response: { status: 500 },
        config: { headers: {} },
      };

      await expect(responseErrorHandler(mockError)).rejects.toBeDefined();
      expect(refreshSpy).not.toHaveBeenCalled();
    });
  });
});
