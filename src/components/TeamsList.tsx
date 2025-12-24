import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { teamService, type Team } from '../services/teamService';

const TeamsList: React.FC = () => {
  const [teams, setTeams] = useState<Team[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState('');

  useEffect(() => {
    loadTeams();
  }, []);

  const loadTeams = async () => {
    try {
      setLoading(true);
      const data = await teamService.getTeams();
      setTeams(data);
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to load teams');
    } finally {
      setLoading(false);
    }
  };

  const filteredTeams = teams.filter((team) =>
    team.name.toLowerCase().includes(filter.toLowerCase()) ||
    team.description.toLowerCase().includes(filter.toLowerCase())
  );

  if (loading) {
    return <div className="page-loading">Loading teams...</div>;
  }

  return (
    <div className="teams-page">
      <div className="page-header">
        <div className="header-left">
          <h1>Teams</h1>
          <p className="page-subtitle">Collaborate with your team members</p>
        </div>
        <div className="header-actions">
          <input
            type="text"
            placeholder="Search teams..."
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className="search-input"
          />
          <button className="btn-primary">+ New Team</button>
        </div>
      </div>

      {error && <div className="error-message">{error}</div>}

      {filteredTeams.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon">👥</div>
          <h3>No teams yet</h3>
          <p>Create your first team to start collaborating</p>
          <button className="btn-primary">Create Team</button>
        </div>
      ) : (
        <div className="teams-grid">
          {filteredTeams.map((team) => (
            <Link to={`/teams/${team.id}`} key={team.id} className="team-card">
              <h3>{team.name}</h3>
              <p>{team.description || 'No description provided'}</p>
              <div className="team-members-preview">
                <div className="member-avatar">T</div>
                <span className="member-count">
                  {team.member_count !== undefined ? `${team.member_count} members` : 'View team'}
                </span>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
};

export default TeamsList;
