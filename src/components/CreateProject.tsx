import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { projectService } from '../services/projectService';

const CreateProject: React.FC = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    priority: 'MEDIUM' as 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL',
    start_date: '',
    due_date: '',
    budget: '',
    is_public: false,
  });

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
    setLoading(true);
    setError(null);

    try {
      const projectData = {
        ...formData,
        budget: formData.budget ? parseFloat(formData.budget) : undefined,
        start_date: formData.start_date || undefined,
        due_date: formData.due_date || undefined,
      };

      await projectService.createProject(projectData);
      navigate('/projects');
    } catch (err: any) {
      setError(err.response?.data?.detail || 'ایجاد پروژه ناموفق بود');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="create-project-page">
      <div className="page-header">
        <div className="header-left">
          <button className="back-btn" onClick={() => navigate('/projects')}>
            → بازگشت به پروژه‌ها
          </button>
          <h1>ایجاد پروژه جدید</h1>
          <p className="page-subtitle">پروژه جدیدی راه‌اندازی کنید تا کارهایتان را سازمان‌دهی کنید</p>
        </div>
      </div>

      <div className="create-project-form-container">
        {error && <div className="error-message">{error}</div>}

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
              onClick={() => navigate('/projects')}
            >
              انصراف
            </button>
            <button
              type="submit"
              className="btn-primary"
              disabled={loading}
            >
              {loading ? 'در حال ایجاد...' : 'ایجاد پروژه'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateProject;
