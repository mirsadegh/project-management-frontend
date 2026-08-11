import React, { useState, useEffect } from 'react';
import { useAuth } from '../services/contexts/AuthContext';
import { authService, type UserProfile } from '../services/authService';
import { getRoleLabel, formatDate, formatDateTime } from '../utils/labels';

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
      setMessage({ type: 'success', text: 'پروفایل با موفقیت به‌روزرسانی شد!' });
      setIsEditing(false);
    } catch {
      setMessage({ type: 'error', text: 'به‌روزرسانی پروفایل ناموفق بود. لطفاً دوباره تلاش کنید.' });
    } finally {
      setLoading(false);
    }
  };

  if (!user) {
    return <div className="profile-container">در حال بارگذاری...</div>;
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
          <p className="profile-role">{getRoleLabel(user.role)}</p>
          <p className="profile-email">{user.email}</p>
        </div>
        <button className="edit-button" onClick={() => setIsEditing(!isEditing)}>
          {isEditing ? 'انصراف' : 'ویرایش پروفایل'}
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
              <label htmlFor="first_name">نام</label>
              <input
                type="text"
                id="first_name"
                name="first_name"
                value={formData.first_name || ''}
                onChange={handleChange}
              />
            </div>
            <div className="form-group">
              <label htmlFor="last_name">نام خانوادگی</label>
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
            <label htmlFor="job_title">عنوان شغلی</label>
            <input
              type="text"
              id="job_title"
              name="job_title"
              value={formData.job_title || ''}
              onChange={handleChange}
            />
          </div>

          <div className="form-group">
            <label htmlFor="department">دپارتمان</label>
            <input
              type="text"
              id="department"
              name="department"
              value={formData.department || ''}
              onChange={handleChange}
            />
          </div>

          <div className="form-group">
            <label htmlFor="phone_number">شماره تلفن</label>
            <input
              type="tel"
              id="phone_number"
              name="phone_number"
              value={formData.phone_number || ''}
              onChange={handleChange}
              placeholder="۰۹۱۲۳۴۵۶۷۸۹"
            />
          </div>

          <div className="form-group">
            <label htmlFor="bio">بیوگرافی</label>
            <textarea
              id="bio"
              name="bio"
              value={formData.bio || ''}
              onChange={handleChange}
              rows={4}
              placeholder="درباره خودتان بنویسید..."
            />
          </div>

          <button type="submit" className="save-button" disabled={loading}>
            {loading ? 'در حال ذخیره...' : 'ذخیره تغییرات'}
          </button>
        </form>
      ) : (
        <div className="profile-details">
          <div className="detail-section">
            <h3>اطلاعات شخصی</h3>
            <div className="detail-grid">
              <div className="detail-item">
                <span className="detail-label">نام کاربری</span>
                <span className="detail-value">{user.username}</span>
              </div>
              <div className="detail-item">
                <span className="detail-label">ایمیل</span>
                <span className="detail-value">{user.email}</span>
              </div>
              <div className="detail-item">
                <span className="detail-label">تلفن</span>
                <span className="detail-value">{user.phone_number || 'ثبت نشده'}</span>
              </div>
              <div className="detail-item">
                <span className="detail-label">بیوگرافی</span>
                <span className="detail-value">{user.bio || 'ثبت نشده'}</span>
              </div>
            </div>
          </div>

          <div className="detail-section">
            <h3>اطلاعات شغلی</h3>
            <div className="detail-grid">
              <div className="detail-item">
                <span className="detail-label">عنوان شغلی</span>
                <span className="detail-value">{user.job_title || 'تعیین نشده'}</span>
              </div>
              <div className="detail-item">
                <span className="detail-label">دپارتمان</span>
                <span className="detail-value">{user.department || 'تعیین نشده'}</span>
              </div>
              <div className="detail-item">
                <span className="detail-label">نقش</span>
                <span className="detail-value">{getRoleLabel(user.role)}</span>
              </div>
              <div className="detail-item">
                <span className="detail-label">وضعیت</span>
                <span className={`detail-value ${user.is_available ? 'available' : 'unavailable'}`}>
                  {user.is_available ? 'در دسترس' : 'غیرقابل دسترس'}
                </span>
              </div>
            </div>
          </div>

          <div className="detail-section">
            <h3>اطلاعات حساب</h3>
            <div className="detail-grid">
              <div className="detail-item">
                <span className="detail-label">عضویت از</span>
                <span className="detail-value">
                  {user.date_joined ? formatDate(user.date_joined) : 'نامشخص'}
                </span>
              </div>
              <div className="detail-item">
                <span className="detail-label">آخرین ورود</span>
                <span className="detail-value">
                  {user.last_login ? formatDateTime(user.last_login) : 'هرگز'}
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
