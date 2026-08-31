// src/components/NotFound.tsx
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../services/contexts/AuthContext';

const NotFound = () => {
  const navigate = useNavigate();
  const { user, loading } = useAuth();

  const handleGoHome = () => {
    if (loading) return;
    if (user) {
      navigate('/dashboard', { replace: true });
    } else {
      navigate('/login', { replace: true });
    }
  };

  return (
    <div className="notfound-container">
      <div className="notfound-card">
        <h1 className="notfound-code">۴۰۴</h1>
        <h2 className="notfound-title">صفحه مورد نظر یافت نشد</h2>
        <p className="notfound-subtitle">
          آدرس وارد شده وجود ندارد یا منتقل شده است.
        </p>
        <button
          type="button"
          className="btn-primary"
          onClick={handleGoHome}
          disabled={loading}
        >
          {loading ? 'در حال بارگذاری...' : 'بازگشت به داشبورد'}
        </button>
      </div>
    </div>
  );
};

export default NotFound;