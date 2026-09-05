// src/App.tsx
//
// Route-level code splitting: every page component is loaded via
// `React.lazy`, and the entire <Routes> is wrapped in a single
// <Suspense> boundary that shows a `PageSkeleton` while the chunk
// is being fetched. This keeps the initial JS bundle small
// (the route components are the heaviest pieces after the framework
// and the QueryClient).
//
// ErrorBoundary stays OUTSIDE Suspense so a chunk-load failure (or any
// render error inside a lazy component) is caught by the class
// boundary and presented to the user, rather than crashing the app
// silently.
import { useState, lazy, Suspense } from 'react';
import type { ReactNode } from 'react';
import { BrowserRouter, Routes, Route, Navigate, Link, useNavigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider, useAuth } from './services/contexts/AuthContext';
import ErrorBoundary from './components/ErrorBoundary';
import PageSkeleton from './components/common/PageSkeleton';
import './App.css';

// Lazy-loaded route components. All export `default` so the simple
// `lazy(() => import(...))` form is correct; if a future component
// switches to a named export, use the `.then(m => ({ default: m.X }))`
// form instead.
const Login = lazy(() => import('./components/Login'));
const Register = lazy(() => import('./components/Register'));
const Dashboard = lazy(() => import('./components/Dashboard'));
const Profile = lazy(() => import('./components/Profile'));
const ProjectsList = lazy(() => import('./components/ProjectsList'));
const ProjectDetail = lazy(() => import('./components/ProjectDetail'));
const TaskBoard = lazy(() => import('./components/TaskBoard'));
const EditProject = lazy(() => import('./components/EditProject'));
const ProjectSettings = lazy(() => import('./components/ProjectSettings'));
const TeamsList = lazy(() => import('./components/TeamsList'));
const TeamDetail = lazy(() => import('./components/TeamDetail'));
const NotificationsList = lazy(() => import('./components/NotificationsList'));
const NotFound = lazy(() => import('./components/NotFound'));

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

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 2,
      gcTime: 1000 * 60 * 10,
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

function App() {
  return (
    <BrowserRouter>
      <ErrorBoundary>
        <QueryClientProvider client={queryClient}>
          <AuthProvider>
            <Suspense fallback={<PageSkeleton />}>
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
          <Route path="*" element={<NotFound />} />
              </Routes>
            </Suspense>
          </AuthProvider>
        </QueryClientProvider>
      </ErrorBoundary>
    </BrowserRouter>
  );
}

export default App;
