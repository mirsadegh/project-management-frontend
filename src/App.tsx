// src/App.tsx
import React from 'react';
import type { ReactNode } from 'react';
import { BrowserRouter, Routes, Route, Navigate, Link } from 'react-router-dom';
import { AuthProvider, useAuth } from './services/contexts/AuthContext';
import Login from './components/Login';
import Dashboard from './components/Dashboard';
import Profile from './components/Profile';
import './App.css';

// تایپ کردن props برای ProtectedRoute
interface ProtectedRouteProps {
  children: ReactNode;
}

const ProtectedRoute = ({ children }: ProtectedRouteProps) => {
  const { user, loading, logout } = useAuth();

  if (loading) {
    return <div>Loading...</div>;
  }
  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return (
    <div className="protected-layout">
      <nav className="protected-nav">
        <div className="nav-brand">Project Management</div>
        <div className="nav-links">
          <Link to="/dashboard" className="nav-link">Dashboard</Link>
          <Link to="/profile" className="nav-link">Profile</Link>
        </div>
        <div className="nav-user">
          <span className="user-name">{user.full_name || user.username}</span>
          <button onClick={logout} className="logout-button">Logout</button>
        </div>
      </nav>
      <main className="protected-content">{children}</main>
    </div>
  );
};

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route path="/login" element={<Login />} />
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
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;