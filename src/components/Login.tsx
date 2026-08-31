// src/components/Login.tsx
import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { isAxiosError } from 'axios';
import { useAuth } from '../services/contexts/AuthContext';
import { getErrorMessage } from '../services/types';
import type { ApiError } from '../services/types';

function getLoginErrorMessage(err: unknown): string {
  if (isAxiosError(err)) {
    const status = err.response?.status;
    const data = err.response?.data as
      | { detail?: string; non_field_errors?: string[] }
      | string
      | undefined;

    if (status === 429) {
      const detail =
        typeof data === 'object' && data && 'detail' in data ? data.detail : undefined;
      return (
        detail ||
        'تعداد تلاش‌های ورود بیش از حد مجاز است. لطفاً چند دقیقه صبر کنید و دوباره تلاش کنید.'
      );
    }

    if (!err.response) {
      return 'ارتباط با سرور برقرار نشد. مطمئن شوید بک‌اند روی پورت ۸۰۰۰ در حال اجراست.';
    }

    if (status === 401 || status === 400) {
      if (typeof data === 'object' && data) {
        if (typeof data.detail === 'string') return data.detail;
        if (Array.isArray(data.non_field_errors) && data.non_field_errors[0]) {
          return data.non_field_errors[0];
        }
      }
      return 'ایمیل یا رمز عبور نادرست است';
    }

    if (status !== undefined) {
      return `ورود ناموفق بود (خطای ${status}). لطفاً دوباره تلاش کنید.`;
    }
  }

  return getErrorMessage(err as ApiError) || 'ورود ناموفق بود. لطفاً دوباره تلاش کنید.';
}

const Login = () => {
  const [email, setEmail] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [error, setError] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await login(email.trim(), password);
      navigate('/dashboard');
    } catch (err) {
      setError(getLoginErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-container">
      <h2>خوش آمدید</h2>
      <p className="login-subtitle">وارد حساب کاربری خود شوید</p>
      {error && <div className="error">{error}</div>}
      <form onSubmit={handleSubmit}>
        <input
          type="email"
          placeholder="ایمیل"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
        <input
          type="password"
          placeholder="رمز عبور"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />
        <button type="submit" disabled={loading}>
          {loading ? 'در حال ورود...' : 'ورود'}
        </button>
      </form>
      <p className="login-footer">
        حساب کاربری ندارید؟ <Link to="/register">ثبت‌نام کنید</Link>
      </p>
    </div>
  );
};

export default Login;
