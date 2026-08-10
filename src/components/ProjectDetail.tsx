import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { projectService, type Project, type ProjectMember } from '../services/projectService';
import { authService } from '../services/authService';
import { useAuth } from '../services/contexts/AuthContext';

type MemberRole = ProjectMember['role'];

const ROLE_LABELS: Record<MemberRole, string> = {
  OWNER: 'Owner',
  MANAGER: 'Manager',
  MEMBER: 'Member',
  VIEWER: 'Viewer',
};

const ProjectDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [project, setProject] = useState<Project | null>(null);
  const [members, setMembers] = useState<ProjectMember[]>([]);
  const [users, setUsers] = useState<Array<{ id: number; username: string; full_name: string; email: string }>>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'overview' | 'tasks' | 'files' | 'members'>('overview');
  const [selectedUserId, setSelectedUserId] = useState<number | ''>('');
  const [selectedRole, setSelectedRole] = useState<MemberRole>('MEMBER');
  const [actionLoading, setActionLoading] = useState(false);
  const [memberError, setMemberError] = useState<string | null>(null);
  const [memberSuccess, setMemberSuccess] = useState<string | null>(null);

  const canManage = user && (
    user.role === 'ADMIN' ||
    user.role === 'PM' ||
    user.role === 'TL' ||
    (project && (project.owner.id === user.id || (project.manager && project.manager.id === user.id)))
  );

  const canManageMembers = user && (
    user.role === 'ADMIN' ||
    user.role === 'PM' ||
    user.role === 'TL' ||
    (project && (project.owner.id === user.id || (project.manager && project.manager.id === user.id)))
  );

  useEffect(() => {
    if (id) {
      loadProject(id);
    }
  }, [id]);

  useEffect(() => {
    if (activeTab === 'members' && canManageMembers) {
      loadUsers();
    }
  }, [activeTab, canManageMembers]);

  const loadUsers = async () => {
    try {
      const data = await authService.getUsers();
      setUsers(data);
    } catch {
      // Non-critical: the add form simply won't be populated.
    }
  };

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
      setMembers(data.members || []);
    } catch (err) {
      const error = err as { response?: { data?: { detail?: string } } };
      setError(error.response?.data?.detail || 'Failed to load project');
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

  const memberUserIds = members.map((m) => m.user.id);
  const availableUsers = users.filter((u) => !memberUserIds.includes(u.id));

  const handleAddMember = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!id || selectedUserId === '') return;

    setActionLoading(true);
    setMemberError(null);
    setMemberSuccess(null);
    try {
      const newMember = await projectService.addMember(id, Number(selectedUserId), selectedRole);
      setMembers((prev) => [...prev, newMember]);
      setSelectedUserId('');
      setSelectedRole('MEMBER');
      setMemberSuccess(`${newMember.user.full_name || newMember.user.username} added to the project.`);
    } catch (err) {
      const error = err as { response?: { data?: { detail?: string; user_id?: string[]; role?: string[] } } };
      setMemberError(
        error.response?.data?.detail ||
        error.response?.data?.user_id?.[0] ||
        error.response?.data?.role?.[0] ||
        'Failed to add member'
      );
    } finally {
      setActionLoading(false);
    }
  };

  const handleRemoveMember = async (memberId: number) => {
    if (!id) return;

    setActionLoading(true);
    setMemberError(null);
    setMemberSuccess(null);
    try {
      await projectService.removeMember(id, memberId);
      setMembers((prev) => prev.filter((m) => m.id !== memberId));
      setMemberSuccess('Member removed from the project.');
    } catch (err) {
      const error = err as { response?: { data?: { detail?: string } } };
      setMemberError(error.response?.data?.detail || 'Failed to remove member');
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <div className="project-detail">
      <div className="project-detail-header">
        <div className="project-detail-title">
          <div>
            <Link to="/projects" className="back-link">← Back to Projects</Link>
            <h1>{project.name}</h1>
          </div>
          <div className="project-actions">
            {canManage && (
              <>
                <button
                  className="action-btn"
                  onClick={() => navigate(`/projects/${project?.slug}/edit`)}
                >
                  Edit
                </button>
                <button
                  className="action-btn secondary"
                  onClick={() => navigate(`/projects/${project?.slug}/settings`)}
                >
                  Settings
                </button>
              </>
            )}
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
          <div className="members-section">
            <h3>Team Members</h3>

            {memberError && <div className="error-message">{memberError}</div>}
            {memberSuccess && <div className="success-message">{memberSuccess}</div>}

            <ul className="members-list">
              {members.map((member) => (
                <li key={member.id} className="member-item">
                  <div className="member-info">
                    <span className="member-name">
                      {member.user.full_name || member.user.username}
                    </span>
                    <span className="member-email">{member.user.email}</span>
                  </div>
                  <div className="member-meta">
                    <span className={`member-role role-${member.role.toLowerCase()}`}>
                      {ROLE_LABELS[member.role] || member.role}
                    </span>
                    {canManageMembers && member.role !== 'OWNER' && (
                      <button
                        type="button"
                        className="btn-danger small"
                        onClick={() => handleRemoveMember(member.id)}
                        disabled={actionLoading}
                      >
                        Remove
                      </button>
                    )}
                  </div>
                </li>
              ))}
              {members.length === 0 && <li className="member-empty">No members yet.</li>}
            </ul>

            {canManageMembers && (
              <form className="add-member-form" onSubmit={handleAddMember}>
                <h4>Add Member</h4>
                <div className="add-member-fields">
                  <select
                    value={selectedUserId}
                    onChange={(e) => setSelectedUserId(e.target.value === '' ? '' : Number(e.target.value))}
                    required
                    disabled={actionLoading || availableUsers.length === 0}
                  >
                    <option value="">
                      {availableUsers.length === 0 ? 'No users available' : 'Select a user'}
                    </option>
                    {availableUsers.map((u) => (
                      <option key={u.id} value={u.id}>
                        {u.full_name || u.username} ({u.email})
                      </option>
                    ))}
                  </select>
                  <select
                    value={selectedRole}
                    onChange={(e) => setSelectedRole(e.target.value as MemberRole)}
                    disabled={actionLoading}
                  >
                    <option value="MEMBER">Member</option>
                    <option value="MANAGER">Manager</option>
                    <option value="VIEWER">Viewer</option>
                  </select>
                  <button
                    type="submit"
                    className="action-btn"
                    disabled={actionLoading || selectedUserId === ''}
                  >
                    {actionLoading ? 'Adding...' : 'Add User'}
                  </button>
                </div>
              </form>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default ProjectDetail;
