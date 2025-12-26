import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { projectService, type Project } from '../services/projectService';

const ProjectDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [project, setProject] = useState<Project | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'overview' | 'tasks' | 'files' | 'members'>('overview');

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
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to load project');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="page-loading">Loading project...</div>;
  }

  if (error || !project) {
    return <div className="error-message">{error || 'Project not found'}</div>;
  }

  return (
    <div className="project-detail">
      <div className="project-detail-header">
        <div className="project-detail-title">
          <div>
            <Link to="/projects" className="back-link">← Back to Projects</Link>
            <h1>{project.name}</h1>
          </div>
          <div className="project-actions">
            <button className="action-btn">Edit</button>
            <button className="action-btn secondary">Settings</button>
          </div>
        </div>
        
        <p className="project-description">{project.description || 'No description'}</p>

        <div className="project-meta">
          <div className="meta-item">
            <span className="meta-label">Status</span>
            <span className="meta-value">{project.status.replace('_', ' ')}</span>
          </div>
          <div className="meta-item">
            <span className="meta-label">Priority</span>
            <span className="meta-value">{project.priority}</span>
          </div>
          <div className="meta-item">
            <span className="meta-label">Progress</span>
            <span className="meta-value">{project.progress}%</span>
          </div>
          <div className="meta-item">
            <span className="meta-label">Tasks</span>
            <span className="meta-value">{project.completed_tasks}/{project.total_tasks}</span>
          </div>
          <div className="meta-item">
            <span className="meta-label">Due Date</span>
            <span className="meta-value">
              {project.due_date ? new Date(project.due_date).toLocaleDateString() : 'Not set'}
            </span>
          </div>
        </div>
      </div>

      <div className="tabs">
        <button
          className={`tab ${activeTab === 'overview' ? 'active' : ''}`}
          onClick={() => setActiveTab('overview')}
        >
          Overview
        </button>
        <button
          className={`tab ${activeTab === 'tasks' ? 'active' : ''}`}
          onClick={() => setActiveTab('tasks')}
        >
          Tasks
        </button>
        <button
          className={`tab ${activeTab === 'files' ? 'active' : ''}`}
          onClick={() => setActiveTab('files')}
        >
          Files
        </button>
        <button
          className={`tab ${activeTab === 'members' ? 'active' : ''}`}
          onClick={() => setActiveTab('members')}
        >
          Members
        </button>
      </div>

      <div className="tab-content">
        {activeTab === 'overview' && (
          <div>
            <h3>Project Overview</h3>
            <p>Project detail content will go here.</p>
            <Link to={`/projects/${project.slug}/tasks`} className="action-btn">
              Open Task Board
            </Link>
          </div>
        )}
        {activeTab === 'tasks' && (
          <div>
            <h3>Tasks</h3>
            <p>Tasks management will go here.</p>
            <Link to={`/projects/${project.slug}/tasks`} className="action-btn">
              View Task Board
            </Link>
          </div>
        )}
        {activeTab === 'files' && (
          <div>
            <h3>Files</h3>
            <p>File management will go here.</p>
          </div>
        )}
        {activeTab === 'members' && (
          <div>
            <h3>Team Members</h3>
            <p>Member list will go here.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default ProjectDetail;
