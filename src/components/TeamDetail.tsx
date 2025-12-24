import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { teamService, type Team, type TeamMembership } from '../services/teamService';

const TeamDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [team, setTeam] = useState<Team | null>(null);
  const [members, setMembers] = useState<TeamMembership[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'members' | 'projects' | 'invitations'>('members');

  useEffect(() => {
    if (id) {
      loadTeam(parseInt(id));
    }
  }, [id]);

  const loadTeam = async (teamId: number) => {
    try {
      setLoading(true);
      const teamData = await teamService.getTeam(teamId);
      const membersData = await teamService.getTeamMembers(teamId);
      setTeam(teamData);
      setMembers(membersData);
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to load team');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="page-loading">Loading team...</div>;
  }

  if (error || !team) {
    return <div className="error-message">{error || 'Team not found'}</div>;
  }

  return (
    <div className="team-detail">
      <div className="team-detail-header">
        <div className="team-detail-title">
          <div>
            <Link to="/teams" className="back-link">← Back to Teams</Link>
            <h1>{team.name}</h1>
          </div>
          <div className="team-actions">
            <button className="action-btn">Edit</button>
            <button className="action-btn secondary">Invite Member</button>
          </div>
        </div>
        <p className="team-description">{team.description || 'No description'}</p>
      </div>

      <div className="tabs">
        <button
          className={`tab ${activeTab === 'members' ? 'active' : ''}`}
          onClick={() => setActiveTab('members')}
        >
          Members ({members.length})
        </button>
        <button
          className={`tab ${activeTab === 'projects' ? 'active' : ''}`}
          onClick={() => setActiveTab('projects')}
        >
          Projects
        </button>
        <button
          className={`tab ${activeTab === 'invitations' ? 'active' : ''}`}
          onClick={() => setActiveTab('invitations')}
        >
          Invitations
        </button>
      </div>

      <div className="tab-content">
        {activeTab === 'members' && (
          <div>
            <h3>Team Members</h3>
            {members.length === 0 ? (
              <div className="empty-state">
                <p>No members yet. Invite someone to join!</p>
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
                      <span className="member-role">{member.role}</span>
                    </div>
                    <div className="member-stats">
                      <div className="stat">
                        <span className="stat-value">{member.tasks_completed}</span>
                        <span className="stat-label">Tasks Done</span>
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
            <h3>Team Projects</h3>
            <p>Projects assigned to this team will appear here.</p>
          </div>
        )}
        {activeTab === 'invitations' && (
          <div>
            <h3>Pending Invitations</h3>
            <p>Team invitations will appear here.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default TeamDetail;
