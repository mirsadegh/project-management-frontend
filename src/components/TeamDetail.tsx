import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { teamService, type Team, type TeamMembership } from '../services/teamService';
import { getRoleLabel } from '../utils/labels';

const TeamDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [team, setTeam] = useState<Team | null>(null);
  const [members, setMembers] = useState<TeamMembership[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'members' | 'projects' | 'invitations'>('members');

  useEffect(() => {
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
    } catch (err: any) {
      setError(err.response?.data?.detail || 'بارگذاری تیم ناموفق بود');
    } finally {
      setLoading(false);
    }
  };

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
            <button className="action-btn">ویرایش</button>
            <button className="action-btn secondary">دعوت عضو</button>
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
    </div>
  );
};

export default TeamDetail;
