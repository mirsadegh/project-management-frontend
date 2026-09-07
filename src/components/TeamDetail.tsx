import React, { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'react-toastify';
import { teamService, type Team, type TeamMembership } from '../services/teamService';
import { getRoleLabel } from '../utils/labels';
import type { ApiError } from '../services/types';

const TeamDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const queryClient = useQueryClient();
  const [team, setTeam] = useState<Team | null>(null);
  const [members, setMembers] = useState<TeamMembership[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'members' | 'projects' | 'invitations'>('members');

  // Edit modal state
  const [showEditModal, setShowEditModal] = useState(false);
  const [editFormData, setEditFormData] = useState({ name: '', description: '' });

  // Invite modal state
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [inviteFormData, setInviteFormData] = useState({ username_or_email: '', role: 'MEMBER' });

  // Load team on mount
  React.useEffect(() => {
    if (id) {
      loadTeam(id);
    }
  }, [id]);

  const loadTeam = async (teamSlug: string) => {
    try {
      setLoading(true);
      const teamData = await teamService.getTeam(teamSlug);
      const membersData = await teamService.getTeamMembers(teamSlug);
      setTeam(teamData);
      setMembers(membersData);
    } catch (err) {
      const apiErr = err as ApiError;
      setError(apiErr.response?.data?.detail || 'بارگذاری تیم ناموفق بود');
    } finally {
      setLoading(false);
    }
  };

  // Update team mutation
  const updateTeamMutation = useMutation({
    mutationFn: (data: { name: string; description: string }) =>
      teamService.updateTeam(id!, data),
    onSuccess: (updatedTeam) => {
      setTeam(updatedTeam);
      setShowEditModal(false);
      queryClient.invalidateQueries({ queryKey: ['teams'] });
      toast.success('تیم با موفقیت به‌روزرسانی شد');
    },
    onError: (err: ApiError) => {
      toast.error(err.response?.data?.detail || 'به‌روزرسانی تیم ناموفق بود');
    },
  });

  // Invite member mutation
  const inviteMemberMutation = useMutation({
    mutationFn: (data: { username_or_email: string; role: string }) =>
      teamService.inviteMember(Number(id), data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['teams'] });
      setShowInviteModal(false);
      setInviteFormData({ username_or_email: '', role: 'MEMBER' });
      toast.success('عضو با موفقیت اضافه شد');
    },
    onError: (err: ApiError) => {
      toast.error(err.response?.data?.detail || 'افزودن عضو ناموفق بود');
    },
  });

  if (loading) {
    return <div className="page-loading">در حال بارگذاری تیم...</div>;
  }

  if (error || !team) {
    return <div className="error-message">{error || 'تیم یافت نشد'}</div>;
  }

  return (
    <div className="team-detail">
      <div className="team-detail-header">
        <div className="team-detail-title">
          <div>
            <Link to="/teams" className="back-link">→ بازگشت به تیم‌ها</Link>
            <h1>{team.name}</h1>
          </div>
          <div className="team-actions">
            <button
              className="action-btn"
              onClick={() => {
                setEditFormData({ name: team.name, description: team.description || '' });
                setShowEditModal(true);
              }}
            >
              ویرایش
            </button>
            <button
              className="action-btn secondary"
              onClick={() => setShowInviteModal(true)}
            >
              دعوت عضو
            </button>
          </div>
        </div>
        <p className="team-description">{team.description || 'بدون توضیحات'}</p>
      </div>

      <div className="tabs">
        <button
          className={`tab ${activeTab === 'members' ? 'active' : ''}`}
          onClick={() => setActiveTab('members')}
        >
          اعضا ({members.length})
        </button>
        <button
          className={`tab ${activeTab === 'projects' ? 'active' : ''}`}
          onClick={() => setActiveTab('projects')}
        >
          پروژه‌ها
        </button>
        <button
          className={`tab ${activeTab === 'invitations' ? 'active' : ''}`}
          onClick={() => setActiveTab('invitations')}
        >
          دعوت‌نامه‌ها
        </button>
      </div>

      <div className="tab-content">
        {activeTab === 'members' && (
          <div>
            <h3>اعضای تیم</h3>
            {members.length === 0 ? (
              <div className="empty-state">
                <p>هنوز عضوی وجود ندارد. کسی را دعوت کنید!</p>
              </div>
            ) : (
              <div className="members-list">
                {members.map((member) => (
                  <div key={member.id} className="member-card">
                    <div className="member-avatar-large">
                      {member.user.full_name?.charAt(0) || member.user.username.charAt(0)}
                    </div>
                    <div className="member-info">
                      <h4>{member.user.full_name || member.user.username}</h4>
                      <p>{member.user.email}</p>
                      <span className="member-role">{getRoleLabel(member.role)}</span>
                    </div>
                    <div className="member-stats">
                      <div className="stat">
                        <span className="stat-value">{member.tasks_completed}</span>
                        <span className="stat-label">وظایف انجام‌شده</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
        {activeTab === 'projects' && (
          <div>
            <h3>پروژه‌های تیم</h3>
            <p>پروژه‌های اختصاص‌یافته به این تیم اینجا نمایش داده می‌شوند.</p>
          </div>
        )}
        {activeTab === 'invitations' && (
          <div>
            <h3>دعوت‌نامه‌های در انتظار</h3>
            <p>دعوت‌نامه‌های تیم اینجا نمایش داده می‌شوند.</p>
          </div>
        )}
      </div>

      {/* Edit Team Modal */}
      {showEditModal && (
        <div className="modal-overlay" onClick={() => setShowEditModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>ویرایش تیم</h2>
              <button className="close-btn" onClick={() => setShowEditModal(false)}>×</button>
            </div>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                updateTeamMutation.mutate(editFormData);
              }}
            >
              <div className="form-group">
                <label>نام تیم</label>
                <input
                  type="text"
                  value={editFormData.name}
                  onChange={(e) => setEditFormData({ ...editFormData, name: e.target.value })}
                  required
                />
              </div>
              <div className="form-group">
                <label>توضیحات</label>
                <textarea
                  value={editFormData.description}
                  onChange={(e) => setEditFormData({ ...editFormData, description: e.target.value })}
                  rows={4}
                />
              </div>
              <div className="modal-actions">
                <button type="button" className="btn-secondary" onClick={() => setShowEditModal(false)}>
                  انصراف
                </button>
                <button type="submit" className="btn-primary" disabled={updateTeamMutation.isPending}>
                  {updateTeamMutation.isPending ? 'در حال ذخیره...' : 'ذخیره'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Invite Member Modal */}
      {showInviteModal && (
        <div className="modal-overlay" onClick={() => setShowInviteModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>افزودن عضو جدید</h2>
              <button className="close-btn" onClick={() => setShowInviteModal(false)}>×</button>
            </div>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                inviteMemberMutation.mutate(inviteFormData);
              }}
            >
              <div className="form-group">
                <label>ایمیل یا نام کاربری</label>
                <input
                  type="text"
                  value={inviteFormData.username_or_email}
                  onChange={(e) => setInviteFormData({ ...inviteFormData, username_or_email: e.target.value })}
                  placeholder="username یا email@example.com"
                  required
                />
              </div>
              <div className="form-group">
                <label>نقش</label>
                <select
                  value={inviteFormData.role}
                  onChange={(e) => setInviteFormData({ ...inviteFormData, role: e.target.value })}
                >
                  <option value="MEMBER">عضو</option>
                  <option value="CO_LEAD">هم‌سرپرست</option>
                  <option value="LEAD">سرپرست</option>
                </select>
              </div>
              <div className="modal-actions">
                <button type="button" className="btn-secondary" onClick={() => setShowInviteModal(false)}>
                  انصراف
                </button>
                <button type="submit" className="btn-primary" disabled={inviteMemberMutation.isPending}>
                  {inviteMemberMutation.isPending ? 'در حال افزودن...' : 'افزودن عضو'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default TeamDetail;
