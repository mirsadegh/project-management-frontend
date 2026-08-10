// src/components/Login.tsx
import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { isAxiosError } from 'axios';
import { useAuth } from '../services/contexts/AuthContext';

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
        'Too many login attempts. Please wait a few minutes and try again.'
      );
    }

    if (!err.response) {
      return 'Cannot reach the server. Make sure the backend is running on port 8000.';
    }

    if (status === 401 || status === 400) {
      if (typeof data === 'object' && data) {
        if (typeof data.detail === 'string') return data.detail;
        if (Array.isArray(data.non_field_errors) && data.non_field_errors[0]) {
          return data.non_field_errors[0];
        }
      }
      return 'Invalid email or password';
    }

    if (typeof data === 'object' && data && typeof data.detail === 'string') {
      return data.detail;
    }

    return `Login failed (error ${status}). Please try again.`;
  }

  if (err instanceof Error && err.message) {
    return err.message;
  }

  return 'Login failed. Please try again.';
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
      <h2>Welcome Back</h2>
      <p className="login-subtitle">Sign in to your account</p>
      {error && <div className="error">{error}</div>}
      <form onSubmit={handleSubmit}>
        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />
        <button type="submit" disabled={loading}>
          {loading ? 'Signing in...' : 'Sign In'}
        </button>
      </form>
      <p className="login-footer">
        Don't have an account? <Link to="/register">Create one</Link>
      </p>
    </div>
  );
};

export default Login;
