import React, { useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { projectService, type ProjectMember } from '../services/projectService';
import { useAuth } from '../services/contexts/AuthContext';
import { useProject, useUsers } from '../services/queryHooks';
import { getRoleLabel, getStatusLabel, getPriorityLabel, formatDate } from '../utils/labels';
import type { ApiError } from '../services/types';
type MemberRole = ProjectMember['role'];

const ProjectDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const [activeTab, setActiveTab] = useState<'overview' | 'tasks' | 'files' | 'members'>('overview');
  const [selectedUserId, setSelectedUserId] = useState<number | ''>('');
  const [selectedRole, setSelectedRole] = useState<MemberRole>('MEMBER');
  const [memberError, setMemberError] = useState<string | null>(null);
  const [memberSuccess, setMemberSuccess] = useState<string | null>(null);

  const { data: project, isLoading, error } = useProject(id ?? '');

  const members = project?.members ?? [];

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

  // useUsers is called unconditionally; it is a cheap cached list
  const { data: users = [] } = useUsers();

  const addMemberMutation = useMutation({
    mutationFn: (data: { user_id: number; role: MemberRole }) =>
      projectService.addMember(id ?? '', data.user_id, data.role),
    onSuccess: (newMember) => {
      queryClient.invalidateQueries({ queryKey: ['project', id] });
      setSelectedUserId('');
      setSelectedRole('MEMBER');
      setMemberSuccess(`${newMember.user.full_name || newMember.user.username} به پروژه اضافه شد.`);
      setMemberError(null);
    },
    onError: (err: ApiError) => {
      const data = err.response?.data as
        | { detail?: string; user_id?: string[]; role?: string[] }
        | undefined;
      setMemberError(
        data?.detail ||
        data?.user_id?.[0] ||
        data?.role?.[0] ||
        'افزودن عضو ناموفق بود'
      );
      setMemberSuccess(null);
    },
  });

  const removeMemberMutation = useMutation({
    mutationFn: (memberId: number) => projectService.removeMember(id ?? '', memberId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['project', id] });
      setMemberSuccess('عضو از پروژه حذف شد.');
      setMemberError(null);
    },
    onError: (err: ApiError) => {
      setMemberError(err.response?.data?.detail || 'حذف عضو ناموفق بود');
      setMemberSuccess(null);
    },
  });

  if (isLoading) {
    return <div className="page-loading">در حال بارگذاری پروژه...</div>;
  }

  if (error || !project) {
    return (
      <div className="error-message">
        {(error as ApiError)?.response?.data?.detail || 'پروژه یافت نشد'}
      </div>
    );
  }

  const memberUserIds = members.map((m) => m.user.id);
  type AuthUser = { id: number; username: string; full_name: string; email: string };
  const availableUsers = users.filter((u: AuthUser) => !memberUserIds.includes(u.id));

  const handleAddMember = (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedUserId === '') return;
    addMemberMutation.mutate({ user_id: Number(selectedUserId), role: selectedRole });
  };

  const handleRemoveMember = (memberId: number) => {
    removeMemberMutation.mutate(memberId);
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
                        disabled={removeMemberMutation.isPending}
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
                    disabled={addMemberMutation.isPending || availableUsers.length === 0}
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
                    disabled={addMemberMutation.isPending}
                  >
                    <option value="MEMBER">عضو</option>
                    <option value="MANAGER">مدیر</option>
                    <option value="VIEWER">بازدیدکننده</option>
                  </select>
                  <button
                    type="submit"
                    className="action-btn"
                    disabled={addMemberMutation.isPending || selectedUserId === ''}
                  >
                    {addMemberMutation.isPending ? 'در حال افزودن...' : 'افزودن کاربر'}
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
