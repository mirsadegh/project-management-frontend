import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { projectService, type Project } from '../services/projectService';
import { useAuth } from '../services/contexts/AuthContext';
import { formatDate } from '../utils/labels';
import type { ApiError } from '../services/types';
const ProjectSettings: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [project, setProject] = useState<Project | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const canManage = user && (
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
      setProject(data);
    } catch (err) {
      const apiErr = err as ApiError;
      setError(apiErr.response?.data?.detail || 'بارگذاری پروژه ناموفق بود');
    } finally {
      setLoading(false);
    }
  };

  const handleTogglePublic = async () => {
    if (!id || !project) return;

    setSaving(true);
    setError(null);
    try {
      await projectService.updateProject(id, { is_public: !project.is_public });
      setProject((prev) => prev ? { ...prev, is_public: !prev.is_public } : null);
      setSuccess(`پروژه اکنون ${!project.is_public ? 'عمومی' : 'خصوصی'} است`);
    } catch (err) {
      const apiErr = err as ApiError;
      setError(apiErr.response?.data?.detail || 'به‌روزرسانی دید ناموفق بود');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!id) return;

    setDeleting(true);
    setError(null);
    try {
      await projectService.deleteProject(id);
      navigate('/projects');
    } catch (err) {
      const apiErr = err as ApiError;
      setError(apiErr.response?.data?.detail || 'Failed to delete project');
      setDeleting(false);
      setShowDeleteConfirm(false);
    }
  };

  if (loading) {
    return <div className="page-loading">در حال بارگذاری تنظیمات...</div>;
  }

  if (!project) {
    return <div className="error-message">{error || 'پروژه یافت نشد'}</div>;
  }

  if (!canManage) {
    return (
      <div className="error-message">
        شما دسترسی لازم برای مدیریت تنظیمات پروژه را ندارید.
      </div>
    );
  }

  return (
    <div className="project-settings-page">
      <div className="page-header">
        <div className="header-left">
          <Link to={`/projects/${id}`} className="back-btn">
            → بازگشت به پروژه
          </Link>
          <h1>تنظیمات پروژه</h1>
          <p className="page-subtitle">مدیریت دید پروژه و داده‌ها</p>
        </div>
      </div>

      <div className="settings-container">
        {error && <div className="error-message">{error}</div>}
        {success && <div className="success-message">{success}</div>}

        <div className="settings-section">
          <h3>دید</h3>
          <div className="setting-item">
            <div>
              <strong>
                پروژه عمومی{' '}
                <span className={`visibility-badge ${project.is_public ? 'public' : 'private'}`}>
                  {project.is_public ? 'عمومی' : 'خصوصی'}
                </span>
              </strong>
              <p>
                {project.is_public
                  ? 'این پروژه برای همه کاربران قابل مشاهده است.'
                  : 'این پروژه فقط برای اعضای پروژه قابل مشاهده است.'}
              </p>
            </div>
            <button
              type="button"
              className={`btn-toggle ${project.is_public ? 'active' : ''}`}
              onClick={handleTogglePublic}
              disabled={saving}
              aria-pressed={project.is_public}
            >
              {saving ? 'در حال ذخیره...' : project.is_public ? 'خصوصی کردن' : 'عمومی کردن'}
            </button>
          </div>
        </div>

        <div className="settings-section">
          <h3>اطلاعات پروژه</h3>
          <div className="info-grid">
            <div className="info-item">
              <span className="info-label">مالک</span>
              <span className="info-value">{project.owner.full_name || project.owner.username}</span>
            </div>
            <div className="info-item">
              <span className="info-label">مدیر</span>
              <span className="info-value">
                {project.manager ? (project.manager.full_name || project.manager.username) : 'تعیین نشده'}
              </span>
            </div>
            <div className="info-item">
              <span className="info-label">ایجاد شده</span>
              <span className="info-value">
                {formatDate(project.created_at)}
              </span>
            </div>
            <div className="info-item">
              <span className="info-label">آخرین به‌روزرسانی</span>
              <span className="info-value">
                {formatDate(project.updated_at)}
              </span>
            </div>
            <div className="info-item">
              <span className="info-label">مجموع وظایف</span>
              <span className="info-value">{project.total_tasks}</span>
            </div>
            <div className="info-item">
              <span className="info-label">اعضا</span>
              <span className="info-value">{project.comment_count}</span>
            </div>
          </div>
        </div>

        <div className="settings-section danger-zone">
          <h3>منطقه خطر</h3>
          {!showDeleteConfirm ? (
            <div className="setting-item">
              <div>
                <strong>حذف این پروژه</strong>
                <p>پس از حذف، امکان بازگشت وجود ندارد. لطفاً مطمئن باشید.</p>
              </div>
              <button
                className="btn-danger"
                onClick={() => setShowDeleteConfirm(true)}
              >
                حذف پروژه
              </button>
            </div>
          ) : (
            <div className="delete-confirm">
              <p>آیا مطمئن هستید که می‌خواهید <strong>{project.name}</strong> را حذف کنید؟ این عمل غیرقابل بازگشت است.</p>
              <div className="delete-actions">
                <button
                  className="btn-secondary"
                  onClick={() => setShowDeleteConfirm(false)}
                  disabled={deleting}
                >
                  انصراف
                </button>
                <button
                  className="btn-danger"
                  onClick={handleDelete}
                  disabled={deleting}
                >
                  {deleting ? 'در حال حذف...' : 'بله، پروژه را حذف کن'}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ProjectSettings;
