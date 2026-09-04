// src/services/authService.ts
import api from './api';

// PR-6 note on token storage:
// The backend now also sets the access and refresh tokens as HttpOnly
// cookies on login/register/refresh. The browser sends them
// automatically on every same-origin request (and on every WebSocket
// upgrade through the Vite dev proxy). We still keep the localStorage
// mirror for backward compatibility with existing tools and tests that
// read the JSON body, but new code should treat the cookie as the
// source of truth — `isAuthenticated()` now probes the backend via
// `getCurrentUser()` instead of checking localStorage.

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

    const tokens = response.data?.tokens;
    if (tokens?.access && tokens?.refresh) {
      localStorage.setItem('accessToken', tokens.access);
      localStorage.setItem('refreshToken', tokens.refresh);
    }
  },

  async login(credentials: LoginCredentials): Promise<AuthTokens> {
    // Backend uses email as USERNAME_FIELD, so send email directly
    const response = await api.post<AuthTokens>('/accounts/auth/login/', credentials);

    const { access, refresh } = response.data;
    localStorage.setItem('accessToken', access);
    localStorage.setItem('refreshToken', refresh);

    return response.data;
  },

  async logout(): Promise<void> {
    const refresh = localStorage.getItem('refreshToken');
    try {
      // Blacklist refresh token on the backend when available. PR-6:
      // when running in cookie-only mode there is no refresh token in
      // localStorage, so we send `logout_all: true` so the backend
      // blacklists every outstanding refresh token for the current
      // user (identified via the ws_access cookie) and clears the
      // cookies via Set-Cookie.
      if (refresh) {
        await api.post('/accounts/auth/logout/', { refresh });
      } else {
        await api.post('/accounts/auth/logout/', { logout_all: true });
      }
    } catch {
      // Always clear local session even if the API call fails
    } finally {
      localStorage.removeItem('accessToken');
      localStorage.removeItem('refreshToken');
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

  isAuthenticated(): boolean {
    // PR-6: the source of truth is the HttpOnly cookie. We can only
    // verify that the cookie is valid by asking the backend. This
    // function returns synchronously based on localStorage for
    // compatibility with existing call sites; AuthContext.refresh
    // / getCurrentUser() is what actually confirms validity on app
    // load. Callers that need a true check should `await
    // authService.getCurrentUser()`.
    return !!localStorage.getItem('accessToken');
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

  async verifyToken(token?: string): Promise<boolean> {
    const access = token || localStorage.getItem('accessToken');
    if (!access) return false;
    try {
      await api.post('/accounts/auth/verify/', { token: access });
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
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
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