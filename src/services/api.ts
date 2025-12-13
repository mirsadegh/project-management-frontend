// src/services/api.ts

import axios, { AxiosInstance, AxiosError, AxiosRequestConfig } from 'axios';

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
  (config: AxiosRequestConfig): AxiosRequestConfig => {
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
// این تابع پس از دریافت هر پاسخ اجرا می‌شود
api.interceptors.response.use(
  // اگر پاسخ موفقیت‌آمیز بود، همان را برگردان
  (response) => response,

  // اگر پاسخ با خطا مواجه شد
  async (error: AxiosError) => {
    // نوع‌داده‌ی originalRequest را گسترش می‌دهیم تا پراپرتی _retry را بتوان به آن اضافه کرد
    const originalRequest = error.config as AxiosRequestConfig & { _retry?: boolean };

    // اگر خطا 401 (Unauthorized) بود و این درخواست برای اولین بار بود که تلاش می‌کند
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true; // جلوگیری از یک حلقه بی‌نهایت از تلاش‌ها

      try {
        // تلاش برای رفرش کردن توکن با استفاده از refresh token
        const refreshToken = localStorage.getItem('refreshToken');
        const response = await axios.post<{ access: string }>(`${API_BASE_URL}/accounts/auth/refresh/`, {
          refresh: refreshToken,
        });

        const { access } = response.data;
        // ذخیره توکن جدید
        localStorage.setItem('accessToken', access);

        // تنظیم توکن جدید روی هدر درخواست اصلی
        if (originalRequest.headers) {
          originalRequest.headers.Authorization = `Bearer ${access}`;
        }

        // ارسال مجدد درخواست اصلی با توکن جدید
        return api(originalRequest);

      } catch (refreshError) {
        // اگر رفرش توکن هم ناموفق بود، توکن‌ها را از حافظه پاک کن
        console.error("Refresh token failed. Logging out.");
        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');

        // خطای رفرش را به کامپوننت فراخوانی برگردان
        // کامپوننت می‌تواند با استفاده از AuthContext، کاربر را خارج کرده و به صفحه لاگین ببرد
        return Promise.reject(refreshError);
      }
    }

    // اگر خطا غیر از 401 بود، همان خطا را برگردان
    return Promise.reject(error);
  }
);

export default api;