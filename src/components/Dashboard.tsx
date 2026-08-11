import React from 'react';
import { useAuth } from '../services/contexts/AuthContext';
import { getRoleLabel } from '../utils/labels';

const Dashboard: React.FC = () => {
  const { user } = useAuth();

  return (
    <div className="dashboard">
      <div className="dashboard-header">
        <h1>داشبورد</h1>
        <p className="welcome-message">
          خوش آمدید، {user?.full_name || user?.username}!
        </p>
      </div>

      <div className="dashboard-cards">
        <div className="dashboard-card">
          <h3>پروفایل شما</h3>
          <div className="user-mini-info">
            <div className="user-avatar-small">
              {user?.profile_picture ? (
                <img src={user.profile_picture} alt={user.full_name} />
              ) : (
                <span>{user?.full_name?.charAt(0) || user?.username?.charAt(0)}</span>
              )}
            </div>
            <div className="user-details-small">
              <p className="user-name-small">{user?.full_name || user?.username}</p>
              <p className="user-role-small">{getRoleLabel(user?.role)}</p>
            </div>
          </div>
        </div>

        <div className="dashboard-card">
          <h3>آمار سریع</h3>
          <div className="stats-grid">
            <div className="stat-item">
              <span className="stat-value">۰</span>
              <span className="stat-label">پروژه‌ها</span>
            </div>
            <div className="stat-item">
              <span className="stat-value">۰</span>
              <span className="stat-label">وظایف</span>
            </div>
            <div className="stat-item">
              <span className="stat-value">۰</span>
              <span className="stat-label">تکمیل‌شده</span>
            </div>
          </div>
        </div>

        <div className="dashboard-card">
          <h3>وضعیت حساب</h3>
          <div className="account-status">
            <div className="status-item">
              <span className="status-label">ایمیل</span>
              <span className={`status-badge ${user?.email ? 'verified' : 'unverified'}`}>
                {user?.email ? 'تأییدشده' : 'تأییدنشده'}
              </span>
            </div>
            <div className="status-item">
              <span className="status-label">دسترسی</span>
              <span className={`status-badge ${user?.is_available ? 'available' : 'unavailable'}`}>
                {user?.is_available ? 'در دسترس' : 'مشغول'}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
