import React, { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { projectService, type Project } from '../services/projectService';
import { useProjects } from '../services/queryHooks';
import { getStatusLabel, getPriorityLabel, formatDate } from '../utils/labels';
import type { ApiError } from '../services/types';
import type { UseMutationResult } from '@tanstack/react-query';

const ProjectsList: React.FC = () => {
  const queryClient = useQueryClient();
  const [filter, setFilter] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);

  const { data: projects = [], isLoading, error } = useProjects();

  const createMutation = useMutation({
    mutationFn: (data: Partial<Project>) => projectService.createProject(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['projects'] });
    },
    onError: (err: ApiError) => {
      console.error(err.response?.data?.detail || 'ایجاد پروژه ناموفق بود');
    },
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'PLANNING': return '#6b7280';
      case 'IN_PROGRESS': return '#3b82f6';
      case 'ON_HOLD': return '#f59e0b';
      case 'COMPLETED': return '#10b981';
      case 'CANCELLED': return '#ef4444';
      default: return '#6b7280';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'LOW': return '#10b981';
      case 'MEDIUM': return '#f59e0b';
      case 'HIGH': return '#f97316';
      case 'CRITICAL': return '#ef4444';
      default: return '#6b7280';
    }
  };

  const filteredProjects = projects.filter((project) =>
    project.name.toLowerCase().includes(filter.toLowerCase()) ||
    project.description.toLowerCase().includes(filter.toLowerCase())
  );

  if (isLoading) {
    return <div className="page-loading">در حال بارگذاری پروژه‌ها...</div>;
  }

  return (
    <div className="projects-page">
      <div className="page-header">
        <div className="header-left">
          <h1>پروژه‌ها</h1>
          <p className="page-subtitle">مدیریت و پیگیری تمام پروژه‌های شما</p>
        </div>
        <div className="header-actions">
          <input
            type="text"
            placeholder="جستجوی پروژه‌ها..."
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className="search-input"
          />
          <button className="btn-primary" onClick={() => setShowCreateModal(true)}>
            + پروژه جدید
          </button>
        </div>
      </div>

      {error && <div className="error-message">{(error as ApiError).response?.data?.detail || 'بارگذاری پروژه‌ها ناموفق بود'}</div>}

      {filteredProjects.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon">📋</div>
          <h3>هنوز پروژه‌ای وجود ندارد</h3>
          <p>اولین پروژه خود را بسازید تا شروع کنید</p>
          <button className="btn-primary" onClick={() => setShowCreateModal(true)}>
            ایجاد پروژه
          </button>
        </div>
      ) : (
        <div className="projects-grid">
          {filteredProjects.map((project) => (
            <Link to={`/projects/${project.slug}`} key={project.id} className="project-card">
              <div className="project-card-header">
                <h3 className="project-name">{project.name}</h3>
                <div className="project-badges">
                  <span 
                    className="status-badge"
                    style={{ backgroundColor: getStatusColor(project.status) }}
                  >
                    {getStatusLabel(project.status)}
                  </span>
                  <span 
                    className="priority-badge"
                    style={{ backgroundColor: getPriorityColor(project.priority) }}
                  >
                    {getPriorityLabel(project.priority)}
                  </span>
                </div>
              </div>
              
              <p className="project-description">
                {project.description || 'توضیحی ثبت نشده است'}
              </p>
              
              <div className="project-progress">
                <div className="progress-header">
                  <span>پیشرفت</span>
                  <span>{project.progress}٪</span>
                </div>
                <div className="progress-bar">
                  <div 
                    className="progress-fill" 
                    style={{ width: `${project.progress}%` }}
                  />
                </div>
              </div>
              
              <div className="project-stats">
                <div className="stat">
                  <span className="stat-value">{project.total_tasks}</span>
                  <span className="stat-label">وظایف</span>
                </div>
                <div className="stat">
                  <span className="stat-value">{project.completed_tasks}</span>
                  <span className="stat-label">تکمیل‌شده</span>
                </div>
                <div className="stat">
                  <span className="stat-value">{project.total_tasks - project.completed_tasks}</span>
                  <span className="stat-label">باقی‌مانده</span>
                </div>
              </div>
              
              <div className="project-footer">
                <div className="project-manager">
                  {project.manager ? (
                    <>
                      <div className="manager-avatar">
                        {project.manager.full_name?.charAt(0) || project.manager.username.charAt(0)}
                      </div>
                      <span>{project.manager.full_name || project.manager.username}</span>
                    </>
                  ) : (
                    <span className="no-manager">مدیری تعیین نشده</span>
                  )}
                </div>
                {project.due_date && (
                  <span className={`due-date ${project.is_overdue ? 'overdue' : ''}`}>
                    مهلت: {formatDate(project.due_date)}
                  </span>
                )}
              </div>
            </Link>
          ))}
        </div>
      )}

      {showCreateModal && (
        <CreateProjectModal
          onClose={() => setShowCreateModal(false)}
          createMutation={createMutation}
        />
      )}
    </div>
  );
};

interface CreateProjectModalProps {
  onClose: () => void;
  createMutation: UseMutationResult<Project, ApiError, Partial<Project>, unknown>;
}

const CreateProjectModal: React.FC<CreateProjectModalProps> = ({ onClose, createMutation }) => {
  const [formData, setFormData] = useState<{
    name: string;
    description: string;
    priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
    start_date: string;
    due_date: string;
  }>({
    name: '',
    description: '',
    priority: 'MEDIUM',
    start_date: '',
    due_date: '',
  });
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    try {
      await createMutation.mutateAsync(formData);
      onClose();
    } catch (err) {
      const apiErr = err as ApiError;
      setError(apiErr.response?.data?.detail || 'ایجاد پروژه ناموفق بود');
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>ایجاد پروژه جدید</h2>
          <button className="close-btn" onClick={onClose}>×</button>
        </div>
        
        <form onSubmit={handleSubmit}>
          {error && <div className="error-message">{(error as ApiError).response?.data?.detail || 'بارگذاری پروژه‌ها ناموفق بود'}</div>}
          
          <div className="form-group">
            <label>نام پروژه *</label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="نام پروژه را وارد کنید"
              required
            />
          </div>
          
          <div className="form-group">
            <label>توضیحات</label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="توضیحات پروژه را وارد کنید"
              rows={3}
            />
          </div>
          
          <div className="form-row">
            <div className="form-group">
              <label>اولویت</label>
              <select
                value={formData.priority}
                onChange={(e) => setFormData({ ...formData, priority: e.target.value as 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL' })}
              >
                <option value="LOW">کم</option>
                <option value="MEDIUM">متوسط</option>
                <option value="HIGH">بالا</option>
                <option value="CRITICAL">بحرانی</option>
              </select>
            </div>
          </div>
          
          <div className="form-row">
            <div className="form-group">
              <label>تاریخ شروع</label>
              <input
                type="date"
                value={formData.start_date}
                onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
              />
            </div>
            <div className="form-group">
              <label>مهلت</label>
              <input
                type="date"
                value={formData.due_date}
                onChange={(e) => setFormData({ ...formData, due_date: e.target.value })}
              />
            </div>
          </div>
          
          <div className="modal-actions">
            <button type="button" className="btn-secondary" onClick={onClose}>
              انصراف
            </button>
            <button type="submit" className="btn-primary" disabled={createMutation.isPending}>
              {createMutation.isPending ? 'در حال ایجاد...' : 'ایجاد پروژه'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ProjectsList;
