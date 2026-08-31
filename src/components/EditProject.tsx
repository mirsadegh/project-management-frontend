import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { projectService } from '../services/projectService';
import { useAuth } from '../services/contexts/AuthContext';
import type { ApiError } from '../services/types';
const EditProject: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    priority: 'MEDIUM' as 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL',
    start_date: '',
    due_date: '',
    budget: '',
    is_public: false,
    status: 'PLANNING' as 'PLANNING' | 'IN_PROGRESS' | 'ON_HOLD' | 'COMPLETED' | 'CANCELLED',
  });

  const canEdit = user && (
    user.role === 'ADMIN' ||
    user.role === 'PM' ||
    user.role === 'TL'
  );

  useEffect(() => {
    if (id) {
      loadProject(id);
    }
  }, [id]);

  const loadProject = async (projectSlug: string) => {
    try {
      setLoading(true);
      const data = await projectService.getProject(projectSlug);
      setFormData({
        name: data.name,
        description: data.description || '',
        priority: data.priority,
        start_date: data.start_date || '',
        due_date: data.due_date || '',
        budget: data.budget ? String(data.budget) : '',
        is_public: data.is_public,
        status: data.status,
      });
    } catch (err) {
      const apiErr = err as ApiError;
      setError(apiErr.response?.data?.detail || 'بارگذاری پروژه ناموفق بود');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    const checked = (e.target as HTMLInputElement).checked;

    setFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!id) return;

    setSaving(true);
    setError(null);
    setSuccess(null);

    try {
      const projectData = {
        ...formData,
        budget: formData.budget ? parseFloat(formData.budget) : undefined,
        start_date: formData.start_date || undefined,
        due_date: formData.due_date || undefined,
      };

      await projectService.updateProject(id, projectData);
      setSuccess('پروژه با موفقیت به‌روزرسانی شد');
      setTimeout(() => {
        navigate(`/projects/${id}`);
      }, 800);
    } catch (err) {
      const apiErr = err as ApiError;
      setError(apiErr.response?.data?.detail || 'به‌روزرسانی پروژه ناموفق بود');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div className="page-loading">در حال بارگذاری پروژه...</div>;
  }

  if (!canEdit) {
    return (
      <div className="error-message">
        شما دسترسی لازم برای ویرایش این پروژه را ندارید.
      </div>
    );
  }

  return (
    <div className="edit-project-page">
      <div className="page-header">
        <div className="header-left">
          <Link to={`/projects/${id}`} className="back-btn">
            → بازگشت به پروژه
          </Link>
          <h1>ویرایش پروژه</h1>
          <p className="page-subtitle">به‌روزرسانی جزئیات و تنظیمات پروژه</p>
        </div>
      </div>

      <div className="edit-project-form-container">
        {error && <div className="error-message">{error}</div>}
        {success && <div className="success-message">{success}</div>}

        <form onSubmit={handleSubmit} className="create-project-form">
          <div className="form-section">
            <h3>اطلاعات پایه</h3>

            <div className="form-group">
              <label htmlFor="name">نام پروژه *</label>
              <input
                type="text"
                id="name"
                name="name"
                value={formData.name}
                onChange={handleChange}
                placeholder="نام پروژه را وارد کنید"
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="description">توضیحات</label>
              <textarea
                id="description"
                name="description"
                value={formData.description}
                onChange={handleChange}
                placeholder="پروژه خود را توصیف کنید..."
                rows={4}
              />
            </div>

            <div className="form-row">
              <div className="form-group">
                <label htmlFor="priority">اولویت</label>
                <select
                  id="priority"
                  name="priority"
                  value={formData.priority}
                  onChange={handleChange}
                >
                  <option value="LOW">کم</option>
                  <option value="MEDIUM">متوسط</option>
                  <option value="HIGH">بالا</option>
                  <option value="CRITICAL">بحرانی</option>
                </select>
              </div>

              <div className="form-group">
                <label htmlFor="status">وضعیت</label>
                <select
                  id="status"
                  name="status"
                  value={formData.status}
                  onChange={handleChange}
                >
                  <option value="PLANNING">برنامه‌ریزی</option>
                  <option value="IN_PROGRESS">در حال انجام</option>
                  <option value="ON_HOLD">متوقف</option>
                  <option value="COMPLETED">تکمیل‌شده</option>
                  <option value="CANCELLED">لغوشده</option>
                </select>
              </div>

              <div className="form-group">
                <label htmlFor="budget">بودجه (اختیاری)</label>
                <input
                  type="number"
                  id="budget"
                  name="budget"
                  value={formData.budget}
                  onChange={handleChange}
                  placeholder="0.00"
                  step="0.01"
                  min="0"
                />
              </div>
            </div>

            <div className="form-group">
              <label className="checkbox-label">
                <input
                  type="checkbox"
                  name="is_public"
                  checked={formData.is_public}
                  onChange={handleChange}
                />
                این پروژه عمومی باشد
              </label>
              <small className="form-help">پروژه‌های عمومی برای همه کاربران قابل مشاهده است</small>
            </div>
          </div>

          <div className="form-section">
            <h3>زمان‌بندی</h3>

            <div className="form-row">
              <div className="form-group">
                <label htmlFor="start_date">تاریخ شروع</label>
                <input
                  type="date"
                  id="start_date"
                  name="start_date"
                  value={formData.start_date}
                  onChange={handleChange}
                />
              </div>

              <div className="form-group">
                <label htmlFor="due_date">مهلت</label>
                <input
                  type="date"
                  id="due_date"
                  name="due_date"
                  value={formData.due_date}
                  onChange={handleChange}
                />
              </div>
            </div>
          </div>

          <div className="form-actions">
            <button
              type="button"
              className="btn-secondary"
              onClick={() => navigate(`/projects/${id}`)}
            >
              انصراف
            </button>
            <button
              type="submit"
              className="btn-primary"
              disabled={saving}
            >
              {saving ? 'در حال ذخیره...' : 'ذخیره تغییرات'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EditProject;
