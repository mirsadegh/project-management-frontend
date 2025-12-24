import React, { useState, useEffect } from 'react';
import { useAuth } from '../services/contexts/AuthContext';
import { authService, type UserProfile } from '../services/authService';

const Profile: React.FC = () => {
  const { user } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState<Partial<UserProfile>>({});
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    if (user) {
      setFormData({
        first_name: user.first_name,
        last_name: user.last_name,
        phone_number: user.phone_number,
        bio: user.bio,
        job_title: user.job_title,
        department: user.department,
      });
    }
  }, [user]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage(null);
    try {
      await authService.updateProfile(formData);
      setMessage({ type: 'success', text: 'Profile updated successfully!' });
      setIsEditing(false);
    } catch (error) {
      setMessage({ type: 'error', text: 'Failed to update profile. Please try again.' });
    } finally {
      setLoading(false);
    }
  };

  if (!user) {
    return <div className="profile-container">Loading...</div>;
  }

  return (
    <div className="profile-container">
      <div className="profile-header">
        <div className="profile-avatar">
          {user.profile_picture ? (
            <img src={user.profile_picture} alt={user.full_name} className="avatar-image" />
          ) : (
            <div className="avatar-placeholder">
              {user.full_name?.charAt(0).toUpperCase() || user.username.charAt(0).toUpperCase()}
            </div>
          )}
        </div>
        <div className="profile-title">
          <h1>{user.full_name || user.username}</h1>
          <p className="profile-role">{user.role === 'ADMIN' ? 'Admin' : user.role}</p>
          <p className="profile-email">{user.email}</p>
        </div>
        <button className="edit-button" onClick={() => setIsEditing(!isEditing)}>
          {isEditing ? 'Cancel' : 'Edit Profile'}
        </button>
      </div>

      {message && (
        <div className={`message ${message.type}`}>
          {message.text}
        </div>
      )}

      {isEditing ? (
        <form onSubmit={handleSubmit} className="profile-form">
          <div className="form-row">
            <div className="form-group">
              <label htmlFor="first_name">First Name</label>
              <input
                type="text"
                id="first_name"
                name="first_name"
                value={formData.first_name || ''}
                onChange={handleChange}
              />
            </div>
            <div className="form-group">
              <label htmlFor="last_name">Last Name</label>
              <input
                type="text"
                id="last_name"
                name="last_name"
                value={formData.last_name || ''}
                onChange={handleChange}
              />
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="job_title">Job Title</label>
            <input
              type="text"
              id="job_title"
              name="job_title"
              value={formData.job_title || ''}
              onChange={handleChange}
            />
          </div>

          <div className="form-group">
            <label htmlFor="department">Department</label>
            <input
              type="text"
              id="department"
              name="department"
              value={formData.department || ''}
              onChange={handleChange}
            />
          </div>

          <div className="form-group">
            <label htmlFor="phone_number">Phone Number</label>
            <input
              type="tel"
              id="phone_number"
              name="phone_number"
              value={formData.phone_number || ''}
              onChange={handleChange}
              placeholder="09123456789"
            />
          </div>

          <div className="form-group">
            <label htmlFor="bio">Bio</label>
            <textarea
              id="bio"
              name="bio"
              value={formData.bio || ''}
              onChange={handleChange}
              rows={4}
              placeholder="Tell us about yourself..."
            />
          </div>

          <button type="submit" className="save-button" disabled={loading}>
            {loading ? 'Saving...' : 'Save Changes'}
          </button>
        </form>
      ) : (
        <div className="profile-details">
          <div className="detail-section">
            <h3>Personal Information</h3>
            <div className="detail-grid">
              <div className="detail-item">
                <span className="detail-label">Username</span>
                <span className="detail-value">{user.username}</span>
              </div>
              <div className="detail-item">
                <span className="detail-label">Email</span>
                <span className="detail-value">{user.email}</span>
              </div>
              <div className="detail-item">
                <span className="detail-label">Phone</span>
                <span className="detail-value">{user.phone_number || 'Not provided'}</span>
              </div>
              <div className="detail-item">
                <span className="detail-label">Bio</span>
                <span className="detail-value">{user.bio || 'Not provided'}</span>
              </div>
            </div>
          </div>

          <div className="detail-section">
            <h3>Work Information</h3>
            <div className="detail-grid">
              <div className="detail-item">
                <span className="detail-label">Job Title</span>
                <span className="detail-value">{user.job_title || 'Not set'}</span>
              </div>
              <div className="detail-item">
                <span className="detail-label">Department</span>
                <span className="detail-value">{user.department || 'Not set'}</span>
              </div>
              <div className="detail-item">
                <span className="detail-label">Role</span>
                <span className="detail-value">
                  {user.role === 'ADMIN' ? 'Admin' : 
                   user.role === 'PM' ? 'Project Manager' : 
                   user.role === 'TL' ? 'Team Lead' : 
                   user.role === 'DEV' ? 'Developer' : 
                   user.role === 'DES' ? 'Designer' : 
                   user.role === 'CLIENT' ? 'Client' : user.role}
                </span>
              </div>
              <div className="detail-item">
                <span className="detail-label">Availability</span>
                <span className={`detail-value ${user.is_available ? 'available' : 'unavailable'}`}>
                  {user.is_available ? 'Available' : 'Not Available'}
                </span>
              </div>
            </div>
          </div>

          <div className="detail-section">
            <h3>Account Information</h3>
            <div className="detail-grid">
              <div className="detail-item">
                <span className="detail-label">Member Since</span>
                <span className="detail-value">
                  {user.date_joined ? new Date(user.date_joined).toLocaleDateString() : 'Unknown'}
                </span>
              </div>
              <div className="detail-item">
                <span className="detail-label">Last Login</span>
                <span className="detail-value">
                  {user.last_login ? new Date(user.last_login).toLocaleString() : 'Never'}
                </span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Profile;
