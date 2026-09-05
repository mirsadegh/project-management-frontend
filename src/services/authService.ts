// src/services/authService.ts
import api from './api';

// PR-6 note on token storage (security-fix C-4):
// The backend sets the access and refresh tokens as HttpOnly cookies on
// login/register/refresh. The browser sends them automatically on every
// same-origin request and on every WebSocket upgrade through the Vite dev
// proxy. JavaScript cannot read HttpOnly cookies, and we no longer keep a
// localStorage mirror — that mirror was XSS-vulnerable and contradicted
// the cookie-as-source-of-truth design. The previous `verifyToken` and
// `isAuthenticated` helpers, which read the token from localStorage, are
// rewritten below to use the cookie-authenticated backend endpoints.

// Type definitions for input and output data
export interface LoginCredentials {
  email: string;  // Backend uses email as USERNAME_FIELD
  password: string;
}

export interface AuthTokens {
  access: string;
  refresh: string;
}

export interface UserProfile {
  id: number;
  username: string;
  email: string;
  first_name: string;
  last_name: string;
  full_name: string;
  role: string;
  department: string;
  is_available: boolean;
  job_title: string;
  phone_number: string | null;
  bio: string;
  profile_picture: string | null;
  date_joined: string;
  last_login: string | null;
}

export interface RegisterData {
  username: string;
  password: string;
  password_confirm: string;
  email: string;
  first_name?: string;
  last_name?: string;
}

export const authService = {
  async register(userData: RegisterData): Promise<void> {
    // Backend requires password_confirm and returns JWT tokens for auto-login
    const response = await api.post<{
      message: string;
      tokens: AuthTokens;
    }>('/accounts/auth/register/', userData);

    // Security fix (C-4): tokens are set as HttpOnly cookies by the
    // backend (PR-6). We do not (and cannot) read them from the cookie
    // store, and we no longer mirror them in localStorage. The
    // `tokens` body is kept for backward compatibility with existing
    // tools; the frontend treats it as opaque.
    void response.data.tokens;
  },

  async login(credentials: LoginCredentials): Promise<AuthTokens> {
    // Backend uses email as USERNAME_FIELD, so send email directly
    const response = await api.post<AuthTokens>('/accounts/auth/login/', credentials);

    // Security fix (C-4): the backend sets HttpOnly cookies on the
    // response. No localStorage write. The body is still returned for
    // backward compatibility with non-browser clients.
    return response.data;
  },

  async logout(): Promise<void> {
    // Security fix (C-4): there is no refresh token in localStorage to
    // read, and we never need one. We send `logout_all: true` so the
    // backend blacklists every outstanding refresh token for the
    // current user (identified via the ws_access cookie) and clears
    // the cookies via Set-Cookie. On the client side there is no
    // state to clear — the cookie store is the browser's job.
    try {
      await api.post('/accounts/auth/logout/', { logout_all: true });
    } catch {
      // Always succeed locally; the cookie will expire on its own and
      // the next /me/ call will fail, prompting re-login.
    }
  },

  async getCurrentUser(): Promise<UserProfile> {
    const response = await api.get<UserProfile>('/accounts/users/me/');
    return response.data;
  },

  async updateProfile(userData: Partial<UserProfile>): Promise<UserProfile> {
    const response = await api.patch<UserProfile>('/accounts/users/me/', userData);
    return response.data;
  },

  // Security fix (C-4): `isAuthenticated` can no longer be a sync
  // localStorage check. The source of truth is the HttpOnly cookie, so
  // the only reliable answer comes from asking the backend. This
  // function probes /accounts/users/me/ — any 2xx means the cookie is
  // valid, any 401 means it isn't. We do NOT cache the result; the
  // call sites that need a true check (AuthContext, ProtectedRoute)
  // should call this once and update their state accordingly.
  async isAuthenticated(): Promise<boolean> {
    try {
      await api.get('/accounts/users/me/');
      return true;
    } catch {
      return false;
    }
  },

  async getUsers(): Promise<Array<{ id: number; username: string; full_name: string; email: string }>> {
    const response = await api.get<{
      results: Array<{ id: number; username: string; full_name: string; email: string }>;
    }>('/accounts/users/');
    return response.data.results || [];
  },

  async getUser(userId: number): Promise<UserProfile> {
    const response = await api.get<UserProfile>(`/accounts/users/${userId}/`);
    return response.data;
  },

  // Security fix (C-5): explicit cookie-based refresh used by the
  // WebSocket reconnect path. The backend's CookieTokenRefreshView
  // (PR-6) reads `ws_refresh` from the cookie, rotates the access
  // token, and sets a fresh `ws_access` cookie. We use a dedicated
  // helper (rather than calling /me/ in a loop) because the WS path
  // has tighter latency and reconnection budgets than the regular
  // 401 interceptor in `api.ts`.
  async refresh(): Promise<void> {
    await api.post('/accounts/auth/refresh/', {});
  },

  // Security fix (C-4): the old `verifyToken(token?)` posted the access
  // token in the request body. With HttpOnly cookies we cannot read
  // the access token from JavaScript, so that signature no longer makes
  // sense. We replace it with `verifySession()`, which asks the backend
  // to validate the cookie-attached token. The backend's
  // /accounts/auth/verify/ endpoint reads the Authorization header or
  // the cookie and returns 200/401 accordingly.
  async verifySession(): Promise<boolean> {
    try {
      await api.post('/accounts/auth/verify/', {});
      return true;
    } catch {
      return false;
    }
  },

  async changePassword(oldPassword: string, newPassword: string, newPasswordConfirm: string): Promise<void> {
    await api.post('/accounts/users/change_password/', {
      old_password: oldPassword,
      new_password: newPassword,
      new_password_confirm: newPasswordConfirm,
    });
  },

  async deactivateAccount(password: string): Promise<void> {
    await api.post('/accounts/users/deactivate_account/', { password });
    // No localStorage to clear (C-4). The backend's account
    // deactivation blacklists all refresh tokens; the next API call
    // will return 401 and the AuthContext will log the user out.
  },

  async requestPasswordReset(email: string): Promise<void> {
    await api.post('/accounts/auth/password-reset/', { email });
  },

  async confirmPasswordReset(
    uid: string,
    token: string,
    newPassword: string,
    newPasswordConfirm: string
  ): Promise<void> {
    await api.post('/accounts/auth/password-reset/confirm/', {
      uid,
      token,
      new_password: newPassword,
      new_password_confirm: newPasswordConfirm,
    });
  },
};
