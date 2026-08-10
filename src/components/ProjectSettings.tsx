import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { projectService, type Project } from '../services/projectService';
import { useAuth } from '../services/contexts/AuthContext';

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
      const error = err as { response?: { data?: { detail?: string } } };
      setError(error.response?.data?.detail || 'Failed to load project');
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
      setSuccess(`Project is now ${!project.is_public ? 'public' : 'private'}`);
    } catch (err) {
      const error = err as { response?: { data?: { detail?: string } } };
      setError(error.response?.data?.detail || 'Failed to update visibility');
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
      const error = err as { response?: { data?: { detail?: string } } };
      setError(error.response?.data?.detail || 'Failed to delete project');
      setDeleting(false);
      setShowDeleteConfirm(false);
    }
  };

  if (loading) {
    return <div className="page-loading">Loading settings...</div>;
  }

  if (!project) {
    return <div className="error-message">{error || 'Project not found'}</div>;
  }

  if (!canManage) {
    return (
      <div className="error-message">
        You do not have permission to manage project settings.
      </div>
    );
  }

  return (
    <div className="project-settings-page">
      <div className="page-header">
        <div className="header-left">
          <Link to={`/projects/${id}`} className="back-btn">
            ← Back to Project
          </Link>
          <h1>Project Settings</h1>
          <p className="page-subtitle">Manage project visibility and data</p>
        </div>
      </div>

      <div className="settings-container">
        {error && <div className="error-message">{error}</div>}
        {success && <div className="success-message">{success}</div>}

        <div className="settings-section">
          <h3>Visibility</h3>
          <div className="setting-item">
            <div>
              <strong>
                Public Project{' '}
                <span className={`visibility-badge ${project.is_public ? 'public' : 'private'}`}>
                  {project.is_public ? 'Public' : 'Private'}
                </span>
              </strong>
              <p>
                {project.is_public
                  ? 'This project is visible to all users.'
                  : 'This project is only visible to project members.'}
              </p>
            </div>
            <button
              type="button"
              className={`btn-toggle ${project.is_public ? 'active' : ''}`}
              onClick={handleTogglePublic}
              disabled={saving}
              aria-pressed={project.is_public}
            >
              {saving ? 'Saving...' : project.is_public ? 'Make Private' : 'Make Public'}
            </button>
          </div>
        </div>

        <div className="settings-section">
          <h3>Project Information</h3>
          <div className="info-grid">
            <div className="info-item">
              <span className="info-label">Owner</span>
              <span className="info-value">{project.owner.full_name || project.owner.username}</span>
            </div>
            <div className="info-item">
              <span className="info-label">Manager</span>
              <span className="info-value">
                {project.manager ? (project.manager.full_name || project.manager.username) : 'Not assigned'}
              </span>
            </div>
            <div className="info-item">
              <span className="info-label">Created</span>
              <span className="info-value">
                {new Date(project.created_at).toLocaleDateString()}
              </span>
            </div>
            <div className="info-item">
              <span className="info-label">Last Updated</span>
              <span className="info-value">
                {new Date(project.updated_at).toLocaleDateString()}
              </span>
            </div>
            <div className="info-item">
              <span className="info-label">Total Tasks</span>
              <span className="info-value">{project.total_tasks}</span>
            </div>
            <div className="info-item">
              <span className="info-label">Members</span>
              <span className="info-value">{project.comment_count}</span>
            </div>
          </div>
        </div>

        <div className="settings-section danger-zone">
          <h3>Danger Zone</h3>
          {!showDeleteConfirm ? (
            <div className="setting-item">
              <div>
                <strong>Delete this project</strong>
                <p>Once deleted, there is no going back. Please be certain.</p>
              </div>
              <button
                className="btn-danger"
                onClick={() => setShowDeleteConfirm(true)}
              >
                Delete Project
              </button>
            </div>
          ) : (
            <div className="delete-confirm">
              <p>Are you sure you want to delete <strong>{project.name}</strong>? This action cannot be undone.</p>
              <div className="delete-actions">
                <button
                  className="btn-secondary"
                  onClick={() => setShowDeleteConfirm(false)}
                  disabled={deleting}
                >
                  Cancel
                </button>
                <button
                  className="btn-danger"
                  onClick={handleDelete}
                  disabled={deleting}
                >
                  {deleting ? 'Deleting...' : 'Yes, Delete Project'}
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
