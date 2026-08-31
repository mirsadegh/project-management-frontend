// src/services/api.ts

import axios from 'axios';
import type { AxiosInstance, AxiosError, InternalAxiosRequestConfig } from 'axios';

// خواندن آدرس پایه API از متغیرهای محیطی Vite
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

// ایجاد یک نمونه از axios با تنظیمات پیش‌فرض
const api: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// --- اینترفالر درخواست (Request Interceptor) ---
// این تابع قبل از ارسال هر درخواست اجرا می‌شود
api.interceptors.request.use(
  (config: InternalAxiosRequestConfig): InternalAxiosRequestConfig => {
    const token = localStorage.getItem('accessToken');
    // اگر توکن وجود داشت، آن را به هدر درخواست اضافه کن
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    // اگر در تنظیم درخواست مشکلی پیش آمد، خطا را برگردان
    return Promise.reject(error);
  }
);

// --- اینترفالر پاسخ (Response Interceptor) ---

let refreshPromise: Promise<string> | null = null;

async function refreshAccessToken(): Promise<string> {
  if (!refreshPromise) {
    refreshPromise = (async () => {
      try {
        const refreshToken = localStorage.getItem('refreshToken');
        if (!refreshToken) throw new Error('No refresh token');

        const { data } = await axios.post<{ access: string; refresh?: string }>(
          `${API_BASE_URL}/accounts/auth/refresh/`,
          { refresh: refreshToken }
        );

        localStorage.setItem('accessToken', data.access);

        // CRITICAL: store rotated refresh token (one-time-use).
        // The backend's SimpleJWT with ROTATE_REFRESH_TOKENS invalidates
        // the old refresh token on every successful rotation; ignoring the
        // new one would force a re-login on the next refresh.
        if (data.refresh) {
          localStorage.setItem('refreshToken', data.refresh);
        }

        return data.access;
      } catch (error) {
        // Refresh failed — clear tokens so AuthContext can detect and force logout.
        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');
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
        const newAccessToken = await refreshAccessToken();
        if (originalRequest.headers) {
          originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
        }
        // ارسال مجدد درخواست اصلی با توکن جدید
        return api(originalRequest);
      } catch (refreshError) {
        // اگر رفرش توکن هم ناموفق بود، خطای رفرش را به کامپوننت فراخوانی برگردان
        // AuthContext یا ProtectedRoute هدایت به صفحه ورود را انجام می‌دهند
        return Promise.reject(refreshError);
      }
    }

    // اگر خطا غیر از 401 بود، همان خطا را برگردان
    return Promise.reject(error);
  }
);

export default api;