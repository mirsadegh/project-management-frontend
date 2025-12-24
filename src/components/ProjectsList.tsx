import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { projectService, type Project } from '../services/projectService';

const ProjectsList: React.FC = () => {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);

  useEffect(() => {
    loadProjects();
  }, []);

  const loadProjects = async () => {
    try {
      setLoading(true);
      const data = await projectService.getProjects();
      setProjects(data);
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to load projects');
    } finally {
      setLoading(false);
    }
  };

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

  if (loading) {
    return <div className="page-loading">Loading projects...</div>;
  }

  return (
    <div className="projects-page">
      <div className="page-header">
        <div className="header-left">
          <h1>Projects</h1>
          <p className="page-subtitle">Manage and track all your projects</p>
        </div>
        <div className="header-actions">
          <input
            type="text"
            placeholder="Search projects..."
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className="search-input"
          />
          <button className="btn-primary" onClick={() => setShowCreateModal(true)}>
            + New Project
          </button>
        </div>
      </div>

      {error && <div className="error-message">{error}</div>}

      {filteredProjects.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon">📋</div>
          <h3>No projects yet</h3>
          <p>Create your first project to get started</p>
          <button className="btn-primary" onClick={() => setShowCreateModal(true)}>
            Create Project
          </button>
        </div>
      ) : (
        <div className="projects-grid">
          {filteredProjects.map((project) => (
            <Link to={`/projects/${project.id}`} key={project.id} className="project-card">
              <div className="project-card-header">
                <h3 className="project-name">{project.name}</h3>
                <div className="project-badges">
                  <span 
                    className="status-badge"
                    style={{ backgroundColor: getStatusColor(project.status) }}
                  >
                    {project.status.replace('_', ' ')}
                  </span>
                  <span 
                    className="priority-badge"
                    style={{ backgroundColor: getPriorityColor(project.priority) }}
                  >
                    {project.priority}
                  </span>
                </div>
              </div>
              
              <p className="project-description">
                {project.description || 'No description provided'}
              </p>
              
              <div className="project-progress">
                <div className="progress-header">
                  <span>Progress</span>
                  <span>{project.progress}%</span>
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
                  <span className="stat-label">Tasks</span>
                </div>
                <div className="stat">
                  <span className="stat-value">{project.completed_tasks}</span>
                  <span className="stat-label">Completed</span>
                </div>
                <div className="stat">
                  <span className="stat-value">{project.total_tasks - project.completed_tasks}</span>
                  <span className="stat-label">Remaining</span>
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
                    <span className="no-manager">No manager assigned</span>
                  )}
                </div>
                {project.due_date && (
                  <span className={`due-date ${project.is_overdue ? 'overdue' : ''}`}>
                    Due: {new Date(project.due_date).toLocaleDateString()}
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
          onCreated={loadProjects}
        />
      )}
    </div>
  );
};

interface CreateProjectModalProps {
  onClose: () => void;
  onCreated: () => void;
}

const CreateProjectModal: React.FC<CreateProjectModalProps> = ({ onClose, onCreated }) => {
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      await projectService.createProject(formData);
      onCreated();
      onClose();
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to create project');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>Create New Project</h2>
          <button className="close-btn" onClick={onClose}>×</button>
        </div>
        
        <form onSubmit={handleSubmit}>
          {error && <div className="error-message">{error}</div>}
          
          <div className="form-group">
            <label>Project Name *</label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="Enter project name"
              required
            />
          </div>
          
          <div className="form-group">
            <label>Description</label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Enter project description"
              rows={3}
            />
          </div>
          
          <div className="form-row">
            <div className="form-group">
              <label>Priority</label>
              <select
                value={formData.priority}
                onChange={(e) => setFormData({ ...formData, priority: e.target.value })}
              >
                <option value="LOW">Low</option>
                <option value="MEDIUM">Medium</option>
                <option value="HIGH">High</option>
                <option value="CRITICAL">Critical</option>
              </select>
            </div>
          </div>
          
          <div className="form-row">
            <div className="form-group">
              <label>Start Date</label>
              <input
                type="date"
                value={formData.start_date}
                onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
              />
            </div>
            <div className="form-group">
              <label>Due Date</label>
              <input
                type="date"
                value={formData.due_date}
                onChange={(e) => setFormData({ ...formData, due_date: e.target.value })}
              />
            </div>
          </div>
          
          <div className="modal-actions">
            <button type="button" className="btn-secondary" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="btn-primary" disabled={loading}>
              {loading ? 'Creating...' : 'Create Project'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ProjectsList;
