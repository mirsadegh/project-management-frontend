// src/components/Dashboard.tsx
import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../services/contexts/AuthContext';
import { getRoleLabel } from '../utils/labels';
import { useProjects, useMyTasks, useTeams, useUnreadCount } from '../services/queryHooks';
import ActivityFeed from './ActivityFeed';

const Dashboard: React.FC = () => {
  const { user } = useAuth();
  const { data: projects, isLoading: loadingProjects } = useProjects();
  const { data: myTasks, isLoading: loadingTasks } = useMyTasks();
  const { data: teams, isLoading: loadingTeams } = useTeams();
  const { data: unreadCount } = useUnreadCount();

  const completedTasks = React.useMemo(
    () => (myTasks ?? []).filter((t) => t.status === 'COMPLETED').length,
    [myTasks]
  );

  const renderValue = (loading: boolean, value: number): React.ReactNode => {
    if (loading) return <span className="stat-skeleton">...</span>;
    return value.toLocaleString('fa-IR');
  };

  const projectsEmpty = !loadingProjects && (projects?.length ?? 0) === 0;
  const tasksEmpty = !loadingTasks && (myTasks?.length ?? 0) === 0;
  const teamsEmpty = !loadingTeams && (teams?.length ?? 0) === 0;

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
            <Link to="/projects" className="stat-item stat-item-link">
              <span className="stat-value">
                {renderValue(loadingProjects, projects?.length ?? 0)}
              </span>
              <span className="stat-label">پروژه‌ها</span>
            </Link>
            <Link to="/projects" className="stat-item stat-item-link">
              <span className="stat-value">
                {renderValue(loadingTasks, myTasks?.length ?? 0)}
              </span>
              <span className="stat-label">وظایف من</span>
            </Link>
            <Link to="/teams" className="stat-item stat-item-link">
              <span className="stat-value">
                {renderValue(loadingTasks, completedTasks)}
              </span>
              <span className="stat-label">تکمیل‌شده</span>
            </Link>
            <Link to="/teams" className="stat-item stat-item-link">
              <span className="stat-value">
                {renderValue(loadingTeams, teams?.length ?? 0)}
              </span>
              <span className="stat-label">تیم‌ها</span>
            </Link>
          </div>
        </div>

        <div className="dashboard-card">
          <h3>اعلان‌های خوانده‌نشده</h3>
          <Link to="/notifications" className="dashboard-unread-link">
            <p className="dashboard-unread-count">
              {unreadCount === undefined
                ? 'در حال بارگذاری...'
                : unreadCount > 0
                ? `${unreadCount.toLocaleString('fa-IR')} اعلان جدید`
                : 'اعلان جدیدی ندارید'}
            </p>
          </Link>
        </div>

        {(projectsEmpty || tasksEmpty || teamsEmpty) && (
          <div className="dashboard-card dashboard-empty-card">
            <h3>شروع کنید</h3>
            {projectsEmpty && (
              <div className="dashboard-empty-row">
                <p>هنوز پروژه‌ای ندارید.</p>
                <Link to="/projects" className="btn-primary">
                  ایجاد اولین پروژه
                </Link>
              </div>
            )}
            {tasksEmpty && (
              <div className="dashboard-empty-row">
                <p>هنوز وظیفه‌ای برای شما ثبت نشده است.</p>
                <Link to="/projects" className="btn-secondary">
                  مشاهده پروژه‌ها
                </Link>
              </div>
            )}
            {teamsEmpty && (
              <div className="dashboard-empty-row">
                <p>عضو هیچ تیمی نیستید.</p>
                <Link to="/teams" className="btn-secondary">
                  مشاهده تیم‌ها
                </Link>
              </div>
            )}
          </div>
        )}

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

      <ActivityFeed />
    </div>
  );
};

export default Dashboard;