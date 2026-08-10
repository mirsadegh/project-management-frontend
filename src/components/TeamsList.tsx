import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { teamService, type Team } from '../services/teamService';

type ApiError = {
  response?: { data?: { detail?: string; name?: string[] } };
};

const getErrorMessage = (err: unknown, fallback: string): string => {
  const data = (err as ApiError).response?.data;
  return data?.name?.[0] || data?.detail || fallback;
};

const TeamsList: React.FC = () => {
  const [teams, setTeams] = useState<Team[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState('');

  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState({ name: '', description: '' });
  const [creating, setCreating] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  useEffect(() => {
    loadTeams();
  }, []);

  const loadTeams = async () => {
    try {
      setLoading(true);
      const data = await teamService.getTeams();
      setTeams(data);
    } catch (err) {
      setError(getErrorMessage(err, 'Failed to load teams'));
    } finally {
      setLoading(false);
    }
  };

  const openCreate = () => {
    setForm({ name: '', description: '' });
    setFormError(null);
    setShowCreate(true);
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim()) {
      setFormError('Team name is required');
      return;
    }

    setCreating(true);
    setFormError(null);
    try {
      await teamService.createTeam({ name: form.name.trim(), description: form.description.trim() });
      setShowCreate(false);
      await loadTeams();
    } catch (err) {
      setFormError(getErrorMessage(err, 'Failed to create team'));
    } finally {
      setCreating(false);
    }
  };

  const filteredTeams = teams.filter((team) =>
    team.name.toLowerCase().includes(filter.toLowerCase()) ||
    (team.description || '').toLowerCase().includes(filter.toLowerCase())
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
          <button className="btn-primary" onClick={openCreate}>+ New Team</button>
        </div>
      </div>

      {error && <div className="error-message">{error}</div>}

      {showCreate && (
        <form className="create-team-form" onSubmit={handleCreate}>
          <h3>Create New Team</h3>
          {formError && <div className="error-message">{formError}</div>}
          <div className="form-group">
            <label>Team Name</label>
            <input
              type="text"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              placeholder="e.g. Frontend Squad"
              disabled={creating}
            />
          </div>
          <div className="form-group">
            <label>Description</label>
            <textarea
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              placeholder="What is this team about?"
              disabled={creating}
            />
          </div>
          <div className="form-actions">
            <button type="button" className="btn-secondary" onClick={() => setShowCreate(false)} disabled={creating}>
              Cancel
            </button>
            <button type="submit" className="btn-primary" disabled={creating}>
              {creating ? 'Creating...' : 'Create Team'}
            </button>
          </div>
        </form>
      )}

      {!showCreate && filteredTeams.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon">👥</div>
          <h3>No teams yet</h3>
          <p>Create your first team to start collaborating</p>
          <button className="btn-primary" onClick={openCreate}>Create Team</button>
        </div>
      ) : (
        <div className="teams-grid">
          {filteredTeams.map((team) => (
            <Link to={`/teams/${team.slug}`} key={team.id} className="team-card">
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
