import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { projectService, type Project, type ProjectMember } from '../services/projectService';
import { authService } from '../services/authService';
import { useAuth } from '../services/contexts/AuthContext';
import { getRoleLabel, getStatusLabel, getPriorityLabel, formatDate } from '../utils/labels';

type MemberRole = ProjectMember['role'];

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

  const loadProject = async (projectSlug: string) => {
    try {
      setLoading(true);
      const data = await projectService.getProject(projectSlug);
      setProject(data);
      setMembers(data.members || []);
    } catch (err) {
      const error = err as { response?: { data?: { detail?: string } } };
      setError(error.response?.data?.detail || 'بارگذاری پروژه ناموفق بود');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="page-loading">در حال بارگذاری پروژه...</div>;
  }

  if (error || !project) {
    return <div className="error-message">{error || 'پروژه یافت نشد'}</div>;
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
      setMemberSuccess(`${newMember.user.full_name || newMember.user.username} به پروژه اضافه شد.`);
    } catch (err) {
      const error = err as { response?: { data?: { detail?: string; user_id?: string[]; role?: string[] } } };
      setMemberError(
        error.response?.data?.detail ||
        error.response?.data?.user_id?.[0] ||
        error.response?.data?.role?.[0] ||
        'افزودن عضو ناموفق بود'
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
      setMemberSuccess('عضو از پروژه حذف شد.');
    } catch (err) {
      const error = err as { response?: { data?: { detail?: string } } };
      setMemberError(error.response?.data?.detail || 'حذف عضو ناموفق بود');
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <div className="project-detail">
      <div className="project-detail-header">
        <div className="project-detail-title">
          <div>
            <Link to="/projects" className="back-link">→ بازگشت به پروژه‌ها</Link>
            <h1>{project.name}</h1>
          </div>
          <div className="project-actions">
            {canManage && (
              <>
                <button
                  className="action-btn"
                  onClick={() => navigate(`/projects/${project?.slug}/edit`)}
                >
                  ویرایش
                </button>
                <button
                  className="action-btn secondary"
                  onClick={() => navigate(`/projects/${project?.slug}/settings`)}
                >
                  تنظیمات
                </button>
              </>
            )}
          </div>
        </div>
        
        <p className="project-description">{project.description || 'بدون توضیحات'}</p>

        <div className="project-meta">
          <div className="meta-item">
            <span className="meta-label">وضعیت</span>
            <span className="meta-value">{getStatusLabel(project.status)}</span>
          </div>
          <div className="meta-item">
            <span className="meta-label">اولویت</span>
            <span className="meta-value">{getPriorityLabel(project.priority)}</span>
          </div>
          <div className="meta-item">
            <span className="meta-label">پیشرفت</span>
            <span className="meta-value">{project.progress}٪</span>
          </div>
          <div className="meta-item">
            <span className="meta-label">وظایف</span>
            <span className="meta-value">{project.completed_tasks}/{project.total_tasks}</span>
          </div>
          <div className="meta-item">
            <span className="meta-label">مهلت</span>
            <span className="meta-value">
              {project.due_date ? formatDate(project.due_date) : 'تعیین نشده'}
            </span>
          </div>
        </div>
      </div>

      <div className="tabs">
        <button
          className={`tab ${activeTab === 'overview' ? 'active' : ''}`}
          onClick={() => setActiveTab('overview')}
        >
          نمای کلی
        </button>
        <button
          className={`tab ${activeTab === 'tasks' ? 'active' : ''}`}
          onClick={() => setActiveTab('tasks')}
        >
          وظایف
        </button>
        <button
          className={`tab ${activeTab === 'files' ? 'active' : ''}`}
          onClick={() => setActiveTab('files')}
        >
          فایل‌ها
        </button>
        <button
          className={`tab ${activeTab === 'members' ? 'active' : ''}`}
          onClick={() => setActiveTab('members')}
        >
          اعضا
        </button>
      </div>

      <div className="tab-content">
        {activeTab === 'overview' && (
          <div>
            <h3>نمای کلی پروژه</h3>
            <p>جزئیات و خلاصه پروژه در اینجا نمایش داده می‌شود.</p>
            <Link to={`/projects/${project.slug}/tasks`} className="action-btn">
              باز کردن بورد وظایف
            </Link>
          </div>
        )}
        {activeTab === 'tasks' && (
          <div>
            <h3>وظایف</h3>
            <p>مدیریت وظایف پروژه</p>
            <Link to={`/projects/${project.slug}/tasks`} className="action-btn">
              مشاهده بورد وظایف
            </Link>
          </div>
        )}
        {activeTab === 'files' && (
          <div>
            <h3>فایل‌ها</h3>
            <p>مدیریت فایل‌های پروژه</p>
          </div>
        )}
        {activeTab === 'members' && (
          <div className="members-section">
            <h3>اعضای تیم</h3>

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
                      {getRoleLabel(member.role)}
                    </span>
                    {canManageMembers && member.role !== 'OWNER' && (
                      <button
                        type="button"
                        className="btn-danger small"
                        onClick={() => handleRemoveMember(member.id)}
                        disabled={actionLoading}
                      >
                        حذف
                      </button>
                    )}
                  </div>
                </li>
              ))}
              {members.length === 0 && <li className="member-empty">هنوز عضوی وجود ندارد.</li>}
            </ul>

            {canManageMembers && (
              <form className="add-member-form" onSubmit={handleAddMember}>
                <h4>افزودن عضو</h4>
                <div className="add-member-fields">
                  <select
                    value={selectedUserId}
                    onChange={(e) => setSelectedUserId(e.target.value === '' ? '' : Number(e.target.value))}
                    required
                    disabled={actionLoading || availableUsers.length === 0}
                  >
                    <option value="">
                      {availableUsers.length === 0 ? 'کاربری موجود نیست' : 'انتخاب کاربر'}
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
                    <option value="MEMBER">عضو</option>
                    <option value="MANAGER">مدیر</option>
                    <option value="VIEWER">بازدیدکننده</option>
                  </select>
                  <button
                    type="submit"
                    className="action-btn"
                    disabled={actionLoading || selectedUserId === ''}
                  >
                    {actionLoading ? 'در حال افزودن...' : 'افزودن کاربر'}
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
