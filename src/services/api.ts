// src/services/api.ts

import axios from 'axios';
import type { AxiosInstance, AxiosError, InternalAxiosRequestConfig } from 'axios';

// خواندن آدرس پایه API از متغیرهای محیطی Vite
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

// PR-6: withCredentials=true so the browser includes the auth cookies
// (`ws_access`, `ws_refresh`) on every request. The cookies are set by
// the backend's login/register endpoints and are HttpOnly, so JavaScript
// cannot read them — they are only sent automatically by the browser
// on same-origin (or Vite-proxied) requests. The Vite dev proxy in
// `vite.config.ts` makes `/api` and `/ws` same-origin during development.
//
// Security fix (C-2): the previous `Authorization: Bearer <token>` header
// injection from localStorage has been removed. The cookie is the source
// of truth; the header was redundant and re-introduced XSS-based token
// theft. There is no client-side token to read anymore.
const api: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Security fix (C-3): CSRF token injection for state-changing requests.
// Django's CsrfViewMiddleware (settings.py:105) rejects unsafe HTTP
// methods when the X-CSRFToken header does not match the `csrftoken`
// cookie. With `withCredentials: true` the browser sends the cookie, but
// JavaScript must echo it as a header.
//
// CSRF_COOKIE_HTTPONLY must be False in the backend (it is, by default
// in Django) so document.cookie can read it. If the backend ever changes
// that, switch to fetching the token from a dedicated endpoint.
function getCookie(name: string): string | null {
  const value = `; ${document.cookie}`;
  const parts = value.split(`; ${name}=`);
  if (parts.length === 2) {
    return parts.pop()?.split(';').shift() || null;
  }
  return null;
}

// Security fix (C-3): attach X-CSRFToken on non-GET requests so Django
// accepts the cookie-authenticated mutation. Reads are safe to skip.
api.interceptors.request.use(
  (config: InternalAxiosRequestConfig): InternalAxiosRequestConfig => {
    const method = (config.method || 'get').toLowerCase();
    if (['post', 'put', 'patch', 'delete'].includes(method)) {
      const csrfToken = getCookie('csrftoken');
      if (csrfToken && config.headers) {
        config.headers['X-CSRFToken'] = csrfToken;
      }
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// --- اینترفالر پاسخ (Response Interceptor) ---

let refreshPromise: Promise<string> | null = null;

async function refreshAccessToken(): Promise<string> {
  if (!refreshPromise) {
    refreshPromise = (async () => {
      try {
        // Security fix (C-4): no localStorage read. The cookie is sent
        // automatically by the browser; the backend's CookieTokenRefreshView
        // (PR-6) reads `ws_refresh` from the cookie. The response sets a
        // new `Set-Cookie: ws_access=...` (and rotated ws_refresh when
        // SimpleJWT ROTATE_REFRESH_TOKENS kicks in).
        const { data } = await axios.post<{ access: string; refresh?: string }>(
          `${API_BASE_URL}/accounts/auth/refresh/`,
          {},
          { withCredentials: true }
        );
        return data.access;
      } catch (error) {
        // Refresh failed — let AuthContext detect the next 401 and force
        // logout. We no longer have local state to clear here.
        throw error;
      } finally {
        refreshPromise = null;
      }
    })();
  }
  return refreshPromise;
}

// این تابع پس از دریافت هر پاسخ اجرا می‌شود
api.interceptors.response.use(
  // اگر پاسخ موفقیت‌آمیز بود، همان را برگردان
  (response) => response,

  // اگر پاسخ با خطا مواجه شد
  async (error: AxiosError) => {
    // نوع‌داده‌ی originalRequest را گسترش می‌دهیم تا پراپرتی _retry را بتوان به آن اضافه کرد
    const originalRequest = error.config as InternalAxiosRequestConfig & { _retry?: boolean };

    // اگر خطا 401 (Unauthorized) بود و این درخواست برای اولین بار بود که تلاش می‌کند
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true; // جلوگیری از یک حلقه بی‌نهایت از تلاش‌ها

      try {
        await refreshAccessToken();
        // The new access token is now in the cookie (Set-Cookie on refresh
        // response). We don't need to attach a header — just retry the
        // request and the browser will send the updated cookie.
        return api(originalRequest);
      } catch (refreshError) {
        // اگر رفرش توکن هم ناموفق بود، خطای رفرش را به کامپوننت فراخواننده برگردان
        // AuthContext یا ProtectedRoute هدایت به صفحه ورود را انجام می‌دهند
        return Promise.reject(refreshError);
      }
    }

    // اگر خطا غیر از 401 بود، همان خطا را برگردان
    return Promise.reject(error);
  }
);

export default api;
