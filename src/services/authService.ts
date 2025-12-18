// src/services/authService.ts
import api from './api';

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
  // ... هر فیلد دیگری که پروفایل کاربر شما دارد
}

export interface RegisterData {
  username: string;
  password: string;
  email: string;
  // ... فیلدهای دیگر برای ثبت‌نام
}

export const authService = {
  async register(userData: RegisterData): Promise<void> {
    // ما فقط یک پاسخ موفقیت‌آمیز را از سرور انتظار داریم، نیازی به بازگرداندن داده نیست
    await api.post('/accounts/auth/register/', userData);
  },

  async login(credentials: LoginCredentials): Promise<AuthTokens> {
    const response = await api.post<AuthTokens>('/accounts/auth/login/', credentials);
    
    const { access, refresh } = response.data;
    localStorage.setItem('accessToken', access);
    localStorage.setItem('refreshToken', refresh);
    
    return response.data;
  },

  logout(): void {
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
  },

  async getCurrentUser(): Promise<UserProfile> {
    const response = await api.get<UserProfile>('/accounts/profile/');
    return response.data;
  },

  async updateProfile(userData: Partial<UserProfile>): Promise<UserProfile> {
    const response = await api.patch<UserProfile>('/accounts/profile/', userData);
    return response.data;
  },

  isAuthenticated(): boolean {
    return !!localStorage.getItem('accessToken');
  },
};