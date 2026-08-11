// src/App.tsx
import React, { useState } from 'react';
import type { ReactNode } from 'react';
import { BrowserRouter, Routes, Route, Navigate, Link, useNavigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './services/contexts/AuthContext';
import Login from './components/Login';
import Register from './components/Register';
import Dashboard from './components/Dashboard';
import Profile from './components/Profile';
import ProjectsList from './components/ProjectsList';
import ProjectDetail from './components/ProjectDetail';
import TaskBoard from './components/TaskBoard';
import TeamsList from './components/TeamsList';
import TeamDetail from './components/TeamDetail';
import NotificationsList from './components/NotificationsList';
import EditProject from './components/EditProject';
import ProjectSettings from './components/ProjectSettings';
import './App.css';

// Type for ProtectedRoute props
interface ProtectedRouteProps {
  children: ReactNode;
}

// ProtectedRoute - redirects to login if not authenticated
const ProtectedRoute = ({ children }: ProtectedRouteProps) => {
  const { user, loading, logout } = useAuth();
  const navigate = useNavigate();
  const [loggingOut, setLoggingOut] = useState(false);

  const handleLogout = async () => {
    if (loggingOut) return;
    setLoggingOut(true);
    try {
      await logout();
      navigate('/login', { replace: true });
    } finally {
      setLoggingOut(false);
    }
  };

  if (loading) {
    return <div className="page-loading">در حال بارگذاری...</div>;
  }
  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return (
    <div className="protected-layout">
      <nav className="protected-nav">
        <div className="nav-brand">مدیریت پروژه</div>
        <div className="nav-links">
          <Link to="/dashboard" className="nav-link">داشبورد</Link>
          <Link to="/projects" className="nav-link">پروژه‌ها</Link>
          <Link to="/teams" className="nav-link">تیم‌ها</Link>
          <Link to="/notifications" className="nav-link">اعلان‌ها</Link>
        </div>
        <div className="nav-user">
          <Link to="/profile" className="user-link">
            {user.full_name || user.username}
          </Link>
          <button
            type="button"
            className="logout-button"
            onClick={handleLogout}
            disabled={loggingOut}
          >
            {loggingOut ? 'در حال خروج...' : 'خروج'}
          </button>
        </div>
      </nav>
      <main className="protected-content">{children}</main>
    </div>
  );
};

// GuestRoute - redirects to dashboard if already authenticated
const GuestRoute = ({ children }: ProtectedRouteProps) => {
  const { user, loading } = useAuth();

  if (loading) {
    return <div className="page-loading">در حال بارگذاری...</div>;
  }
  if (user) {
    return <Navigate to="/dashboard" replace />;
  }

  return <>{children}</>;
};

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route
            path="/login"
            element={
              <GuestRoute>
                <Login />
              </GuestRoute>
            }
          />
          <Route
            path="/register"
            element={
              <GuestRoute>
                <Register />
              </GuestRoute>
            }
          />
          
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <Dashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/profile"
            element={
              <ProtectedRoute>
                <Profile />
              </ProtectedRoute>
            }
          />
          <Route
            path="/projects"
            element={
              <ProtectedRoute>
                <ProjectsList />
              </ProtectedRoute>
            }
          />
          <Route
            path="/projects/:id"
            element={
              <ProtectedRoute>
                <ProjectDetail />
              </ProtectedRoute>
            }
          />
          <Route
            path="/projects/:projectId/tasks"
            element={
              <ProtectedRoute>
                <TaskBoard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/projects/:id/edit"
            element={
              <ProtectedRoute>
                <EditProject />
              </ProtectedRoute>
            }
          />
          <Route
            path="/projects/:id/settings"
            element={
              <ProtectedRoute>
                <ProjectSettings />
              </ProtectedRoute>
            }
          />
          <Route
            path="/teams"
            element={
              <ProtectedRoute>
                <TeamsList />
              </ProtectedRoute>
            }
          />
          <Route
            path="/teams/:id"
            element={
              <ProtectedRoute>
                <TeamDetail />
              </ProtectedRoute>
            }
          />
          <Route
            path="/notifications"
            element={
              <ProtectedRoute>
                <NotificationsList />
              </ProtectedRoute>
            }
          />
          
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
