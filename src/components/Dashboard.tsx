import React from 'react';
import { useAuth } from '../services/contexts/AuthContext';

const Dashboard: React.FC = () => {
  const { user } = useAuth();

  return (
    <div className="dashboard">
      <div className="dashboard-header">
        <h1>Dashboard</h1>
        <p className="welcome-message">
          Welcome back, {user?.full_name || user?.username}!
        </p>
      </div>

      <div className="dashboard-cards">
        <div className="dashboard-card">
          <h3>Your Profile</h3>
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
              <p className="user-role-small">
                {user?.role === 'ADMIN' ? 'Admin' : 
                 user?.role === 'PM' ? 'Project Manager' : 
                 user?.role === 'TL' ? 'Team Lead' : 
                 user?.role === 'DEV' ? 'Developer' : 
                 user?.role === 'DES' ? 'Designer' : 
                 user?.role === 'CLIENT' ? 'Client' : user?.role}
              </p>
            </div>
          </div>
        </div>

        <div className="dashboard-card">
          <h3>Quick Stats</h3>
          <div className="stats-grid">
            <div className="stat-item">
              <span className="stat-value">0</span>
              <span className="stat-label">Projects</span>
            </div>
            <div className="stat-item">
              <span className="stat-value">0</span>
              <span className="stat-label">Tasks</span>
            </div>
            <div className="stat-item">
              <span className="stat-value">0</span>
              <span className="stat-label">Completed</span>
            </div>
          </div>
        </div>

        <div className="dashboard-card">
          <h3>Account Status</h3>
          <div className="account-status">
            <div className="status-item">
              <span className="status-label">Email</span>
              <span className={`status-badge ${user?.email ? 'verified' : 'unverified'}`}>
                {user?.email ? 'Verified' : 'Unverified'}
              </span>
            </div>
            <div className="status-item">
              <span className="status-label">Availability</span>
              <span className={`status-badge ${user?.is_available ? 'available' : 'unavailable'}`}>
                {user?.is_available ? 'Available' : 'Busy'}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
