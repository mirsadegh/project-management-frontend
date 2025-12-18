// src/components/teams/TeamList.tsx

import React, { useState, useEffect, ChangeEvent } from 'react';
import { Users, Plus, Search, TrendingUp } from 'lucide-react';
// 1. سرویس api خود را وارد کنید
import api from '../../services/api'; // مسیر را بر اساس ساختار پروژه خود تنظیم کنید
import { useNavigate } from 'react-router-dom';
// 2. تعریف تایپ‌ها برای داده‌ها
interface TeamLead {
  first_name: string;
  last_name: string;
}

interface Team {
  id: number;
  name: string;
  team_type: string;
  description: string | null;
  slug: string;
  lead?: TeamLead; // اختیاری، چون ممکن است تیم لید نداشته باشد
  member_count: number;
  total_projects: number;
  completion_rate: number;
  is_full: boolean;
  allow_self_join: boolean;
  is_active: boolean;
}

// 3. تعریف تایپ برای props کامپوننت (در این حالت خالی است)
interface TeamListProps {}

const TeamList: React.FC<TeamListProps> = () => {
  const navigate = useNavigate();
  // 4. تایپ کردن state ها
  const [teams, setTeams] = useState<Team[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [filterType, setFilterType] = useState<string>('all');

  useEffect(() => {
    fetchTeams();
  }, [filterType]);

  const fetchTeams = async (): Promise<void> => {
    try {
      // 5. استفاده از سرویس api و حذف URL و توکن سخت‌کد شده
      const response = await api.get<{ results: Team[] } | Team[]>('/teams/teams/', {
        params: { team_type: filterType !== 'all' ? filterType : undefined }
      });
      setTeams(Array.isArray(response.data) ? response.data : response.data.results || []);
    } catch (error) {
      console.error('Error fetching teams:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredTeams = teams.filter(team =>
    team.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getTeamTypeColor = (type: string): string => {
    const colors: { [key: string]: string } = {
      'DEV': 'bg-blue-100 text-blue-800',
      'DESIGN': 'bg-purple-100 text-purple-800',
      'MARKETING': 'bg-pink-100 text-pink-800',
      'SALES': 'bg-green-100 text-green-800',
      'SUPPORT': 'bg-yellow-100 text-yellow-800',
      'MGMT': 'bg-red-100 text-red-800',
      'CROSS': 'bg-gray-100 text-gray-800'
    };
    return colors[type] || 'bg-gray-100 text-gray-800';
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto p-6">
      {/* 🎨 Header */}
      <div className="mb-8">
        <div className="flex justify-between items-center mb-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">👥 Teams</h1>
            <p className="text-gray-600 mt-1">Manage and collaborate with your teams</p>
          </div>
          <button
            onClick={() => navigate('/teams/create')}
            className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition"
          >
            <Plus size={20} />
            Create Team
          </button>
        </div>

        {/* 🔍 Search and Filters */}
        <div className="flex gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-3 text-gray-400" size={20} />
            <input
              type="text"
              placeholder="Search teams..."
              value={searchTerm}
              onChange={(e: ChangeEvent<HTMLInputElement>) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            />
          </div>
          
          <select
            value={filterType}
            onChange={(e: ChangeEvent<HTMLSelectElement>) => setFilterType(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">🌐 All Types</option>
            <option value="DEV">💻 Development</option>
            <option value="DESIGN">🎨 Design</option>
            <option value="MARKETING">📢 Marketing</option>
            <option value="SALES">💰 Sales</option>
            <option value="SUPPORT">🆘 Support</option>
            <option value="MGMT">📊 Management</option>
          </select>
        </div>
      </div>

      {/* 📊 Teams Grid */}
      {filteredTeams.length === 0 ? (
        <div className="text-center py-12 bg-gray-50 rounded-lg">
          <Users size={48} className="mx-auto text-gray-400 mb-4" />
          <p className="text-gray-600">No teams found</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredTeams.map((team) => (
            <div
              key={team.id}
              className="bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow cursor-pointer"
              onClick={() => window.location.href = `/teams/${team.slug}`}
            >
              {/* Card Header */}
              <div className="p-6 border-b border-gray-200">
                <div className="flex justify-between items-start mb-3">
                  <h3 className="text-xl font-bold text-gray-900">{team.name}</h3>
                  <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getTeamTypeColor(team.team_type)}`}>
                    {team.team_type}
                  </span>
                </div>
                
                <p className="text-gray-600 text-sm line-clamp-2">
                  {team.description || 'No description provided'}
                </p>
              </div>

              {/* Card Body */}
              <div className="p-6">
                {/* Team Lead */}
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center text-white font-semibold">
                    {team.lead?.first_name?.charAt(0) || '?'}
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Team Lead</p>
                    <p className="font-semibold text-gray-900">
                      {team.lead?.first_name} {team.lead?.last_name}
                    </p>
                  </div>
                </div>

                {/* Stats */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-500">👥 Members</p>
                    <p className="text-2xl font-bold text-gray-900">{team.member_count}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">📊 Projects</p>
                    <p className="text-2xl font-bold text-gray-900">{team.total_projects}</p>
                  </div>
                </div>

                {/* Completion Rate */}
                {team.total_projects > 0 && (
                  <div className="mt-4">
                    <div className="flex justify-between text-sm mb-1">
                      <span className="text-gray-600">Completion Rate</span>
                      <span className="font-semibold text-green-600">{team.completion_rate}%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-green-500 h-2 rounded-full transition-all"
                        style={{ width: `${team.completion_rate}%` }}
                      ></div>
                    </div>
                  </div>
                )}

                {/* Status Badge */}
                <div className="mt-4 flex items-center justify-between">
                  {team.is_full ? (
                    <span className="px-3 py-1 bg-red-100 text-red-800 rounded-full text-xs font-semibold">
                      🔒 Full
                    </span>
                  ) : team.allow_self_join ? (
                    <span className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-xs font-semibold">
                      ✅ Open to Join
                    </span>
                  ) : (
                    <span className="px-3 py-1 bg-yellow-100 text-yellow-800 rounded-full text-xs font-semibold">
                      📨 Invite Only
                    </span>
                  )}

                  {team.is_active ? (
                    <span className="text-green-600 text-sm font-semibold">● Active</span>
                  ) : (
                    <span className="text-gray-400 text-sm font-semibold">● Inactive</span>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default TeamList;