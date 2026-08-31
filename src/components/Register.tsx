import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../services/contexts/AuthContext';
import { getErrorMessage } from '../services/types';
import type { ApiError } from '../services/types';

const Register: React.FC = () => {
  const navigate = useNavigate();
  const { register } = useAuth();
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    password_confirm: '',
    first_name: '',
    last_name: '',
  });
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    if (formData.password !== formData.password_confirm) {
      setError('رمزهای عبور یکسان نیستند');
      setLoading(false);
      return;
    }

    if (formData.password.length < 8) {
      setError('رمز عبور باید حداقل ۸ کاراکتر باشد');
      setLoading(false);
      return;
    }

    try {
      await register({
        username: formData.username,
        email: formData.email,
        password: formData.password,
        password_confirm: formData.password_confirm,
        first_name: formData.first_name,
        last_name: formData.last_name,
      });
    } catch (err: unknown) {
      const apiErr = err as ApiError;
      const data = apiErr.response?.data;
      if (typeof data === 'string') {
        setError(data);
      } else if (data?.detail) {
        setError(data.detail);
      } else if (data && typeof data === 'object') {
        const fieldNames: Record<string, string> = {
          username: 'نام کاربری',
          email: 'ایمیل',
          password: 'رمز عبور',
          password_confirm: 'تأیید رمز عبور',
          first_name: 'نام',
          last_name: 'نام خانوادگی',
        };
        const messages = Object.entries(data)
          .flatMap(([field, value]) => {
            const list = Array.isArray(value) ? value : [value];
            const label = fieldNames[field] || field;
            return list.map((msg) => `${label}: ${msg}`);
          });
        setError(messages.join(' ') || getErrorMessage(apiErr));
      } else {
        setError(getErrorMessage(apiErr));
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-container">
      <h2>ایجاد حساب کاربری</h2>
      <p className="login-subtitle">به پلتفرم مدیریت پروژه بپیوندید</p>
      
      {error && <div className="error">{error}</div>}
      
      <form onSubmit={handleSubmit}>
        <div className="form-row">
          <input
            type="text"
            name="first_name"
            placeholder="نام"
            value={formData.first_name}
            onChange={handleChange}
            required
          />
          <input
            type="text"
            name="last_name"
            placeholder="نام خانوادگی"
            value={formData.last_name}
            onChange={handleChange}
          />
        </div>
        
        <input
          type="text"
          name="username"
          placeholder="نام کاربری"
          value={formData.username}
          onChange={handleChange}
          required
        />
        
        <input
          type="email"
          name="email"
          placeholder="ایمیل"
          value={formData.email}
          onChange={handleChange}
          required
        />
        
        <input
          type="password"
          name="password"
          placeholder="رمز عبور (حداقل ۸ کاراکتر)"
          value={formData.password}
          onChange={handleChange}
          required
        />
        
        <input
          type="password"
          name="password_confirm"
          placeholder="تأیید رمز عبور"
          value={formData.password_confirm}
          onChange={handleChange}
          required
        />
        
        <button type="submit" disabled={loading}>
          {loading ? 'در حال ایجاد حساب...' : 'ثبت‌نام'}
        </button>
      </form>
      
      <p className="login-footer">
        قبلاً حساب دارید؟ <Link to="/login">وارد شوید</Link>
      </p>
    </div>
  );
};

export default Register;
