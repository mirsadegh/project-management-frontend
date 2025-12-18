// src/components/teams/TeamDetail.tsx

import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import {
  Users, Calendar, Target, TrendingUp,
  UserPlus, Mail, Settings, Award
} from 'lucide-react';
 
import api from '../../services/api'; // مسیر را بر اساس ساختار پروژه خود تنظیم کنید

// 2. تعریف تایپ‌ها برای داده‌ها
interface User {
  id: number;
  username: string;
  first_name: string;
  last_name: string;
}

interface PerformanceStats {
  active_projects: number;
  active_tasks: number;
  avg_member_rating?: number; // اختیاری
}

interface Membership {
  id: number;
  role: string;
  performance_rating?: number; // اختیاری
  days_in_team: number;
  user: User;
}

interface Team {
  id: number;
  name: string;
  slug: string;
  description: string | null;
  lead?: User; // اختیاری
  member_count: number;
  completion_rate: number;
  total_projects: number;
  completed_projects: number;
  performance_stats?: PerformanceStats; // اختیاری
  team_type: string;
  is_active: boolean;
  max_members: number | null;
  created_at: string;
  email?: string; // اختیاری
  slack_channel?: string; // اختیاری
  location?: string; // اختیاری
  memberships?: Membership[]; // اختیاری
}

// 3. تعریف تایپ برای props کامپوننت (در این حالت خالی است)
interface TeamDetailProps {}

const TeamDetail: React.FC<TeamDetailProps> = () => {
  // 4. تایپ کردن useParams
  const { slug } = useParams<{ slug: string }>();

  // 5. تایپ کردن state ها
  const [team, setTeam] = useState<Team | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [activeTab, setActiveTab] = useState<string>('overview');

  useEffect(() => {
    if (slug) {
      fetchTeamDetails();
    }
  }, [slug]);

  const fetchTeamDetails = async (): Promise<void> => {
    if (!slug) return;
    
    try {
      // 6. استفاده از سرویس api و حذف URL و توکن سخت‌کد شده
      // استفاده از Generic <Team> برای تایپ کردن پاسخ
      const response = await api.get<Team>(`/teams/teams/${slug}/`);
      setTeam(response.data);
    } catch (error) {
      console.error('Error fetching team:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddMember = (): void => {
    // Open modal to add member
    console.log('Add member clicked');
  };

  const handleSendInvitation = (): void => {
    // Open modal to send invitation
    console.log('Send invitation clicked');
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (!team) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-600">❌ Team not found</p>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto p-6">
      {/* 🎨 Header Section */}
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg shadow-lg p-8 mb-6">
        <div className="flex justify-between items-start">
          <div className="text-white">
            <h1 className="text-4xl font-bold mb-2">{team.name}</h1>
            <p className="text-blue-100 text-lg mb-4">{team.description}</p>
            
            <div className="flex gap-4">
              <div className="bg-white bg-opacity-20 backdrop-blur-sm rounded-lg px-4 py-2">
                <p className="text-sm text-blue-100">Team Lead</p>
                <p className="font-semibold">
                  {team.lead?.first_name} {team.lead?.last_name}
                </p>
              </div>
              
              <div className="bg-white bg-opacity-20 backdrop-blur-sm rounded-lg px-4 py-2">
                <p className="text-sm text-blue-100">Members</p>
                <p className="font-semibold">{team.member_count}</p>
              </div>
              
              <div className="bg-white bg-opacity-20 backdrop-blur-sm rounded-lg px-4 py-2">
                <p className="text-sm text-blue-100">Completion Rate</p>
                <p className="font-semibold">{team.completion_rate}%</p>
              </div>
            </div>
          </div>

          <div className="flex gap-2">
            <button
              onClick={handleAddMember}
              className="bg-white text-blue-600 px-4 py-2 rounded-lg hover:bg-blue-50 transition flex items-center gap-2"
            >
              <UserPlus size={20} />
              Add Member
            </button>
            
            <button
              onClick={handleSendInvitation}
              className="bg-white bg-opacity-20 backdrop-blur-sm text-white px-4 py-2 rounded-lg hover:bg-opacity-30 transition flex items-center gap-2"
            >
              <Mail size={20} />
              Invite
            </button>
          </div>
        </div>
      </div>

      {/* 📊 Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-500 text-sm">👥 Team Members</p>
              <p className="text-3xl font-bold text-gray-900">{team.member_count}</p>
            </div>
            <Users size={40} className="text-blue-500" />
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-500 text-sm">📊 Total Projects</p>
              <p className="text-3xl font-bold text-gray-900">{team.total_projects}</p>
            </div>
            <Target size={40} className="text-purple-500" />
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-500 text-sm">✅ Completed</p>
              <p className="text-3xl font-bold text-gray-900">{team.completed_projects}</p>
            </div>
            <Award size={40} className="text-green-500" />
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-500 text-sm">📈 Success Rate</p>
              <p className="text-3xl font-bold text-gray-900">{team.completion_rate}%</p>
            </div>
            <TrendingUp size={40} className="text-orange-500" />
          </div>
        </div>
      </div>

      {/* 🎯 Tabs Navigation */}
      <div className="bg-white rounded-lg shadow mb-6">
        <div className="border-b border-gray-200">
          <nav className="flex gap-8 px-6">
            {['overview', 'members', 'projects', 'meetings', 'goals'].map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`py-4 px-2 border-b-2 font-medium text-sm transition ${
                  activeTab === tab
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                {tab.charAt(0).toUpperCase() + tab.slice(1)}
              </button>
            ))}
          </nav>
        </div>

        {/* Tab Content */}
        <div className="p-6">
          {activeTab === 'overview' && (
            <div>
              <h3 className="text-xl font-bold mb-4">📊 Team Overview</h3>
              
              {/* Performance Stats */}
              {team.performance_stats && (
                <div className="bg-gray-50 rounded-lg p-6 mb-6">
                  <h4 className="font-semibold text-gray-900 mb-4">Performance Metrics</h4>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div>
                      <p className="text-sm text-gray-600">Active Projects</p>
                      <p className="text-2xl font-bold text-blue-600">
                        {team.performance_stats.active_projects}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Active Tasks</p>
                      <p className="text-2xl font-bold text-purple-600">
                        {team.performance_stats.active_tasks}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Avg Rating</p>
                      <p className="text-2xl font-bold text-green-600">
                        {team.performance_stats.avg_member_rating?.toFixed(1) || 'N/A'}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Completion</p>
                      <p className="text-2xl font-bold text-orange-600">
                        {team.completion_rate}%
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Team Info */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h4 className="font-semibold text-gray-900 mb-3">📋 Team Information</h4>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Type:</span>
                      <span className="font-semibold">{team.team_type}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Status:</span>
                      <span className={`font-semibold ${team.is_active ? 'text-green-600' : 'text-gray-400'}`}>
                        {team.is_active ? '✅ Active' : '❌ Inactive'}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Max Members:</span>
                      <span className="font-semibold">{team.max_members || 'Unlimited'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Created:</span>
                      <span className="font-semibold">
                        {new Date(team.created_at).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                </div>

                <div>
                  <h4 className="font-semibold text-gray-900 mb-3">📧 Contact</h4>
                  <div className="space-y-2">
                    {team.email && (
                      <div className="flex justify-between">
                        <span className="text-gray-600">Email:</span>
                        <span className="font-semibold">{team.email}</span>
                      </div>
                    )}
                    {team.slack_channel && (
                      <div className="flex justify-between">
                        <span className="text-gray-600">Slack:</span>
                        <span className="font-semibold">#{team.slack_channel}</span>
                      </div>
                    )}
                    {team.location && (
                      <div className="flex justify-between">
                        <span className="text-gray-600">Location:</span>
                        <span className="font-semibold">{team.location}</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'members' && (
            <div>
              <h3 className="text-xl font-bold mb-4">👥 Team Members ({team.member_count})</h3>
              <div className="space-y-4">
                {team.memberships?.map((membership) => (
                  <div
                    key={membership.id}
                    className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition"
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-blue-500 rounded-full flex items-center justify-center text-white font-semibold text-lg">
                        {membership.user.first_name?.charAt(0)}
                      </div>
                      <div>
                        <p className="font-semibold text-gray-900">
                          {membership.user.first_name} {membership.user.last_name}
                        </p>
                        <p className="text-sm text-gray-600">@{membership.user.username}</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-4">
                      <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm font-semibold">
                        {membership.role}
                      </span>
                      {membership.performance_rating && (
                        <div className="flex items-center gap-1">
                          <span className="text-yellow-500">⭐</span>
                          <span className="font-semibold">{membership.performance_rating}</span>
                        </div>
                      )}
                      <span className="text-sm text-gray-500">
                        {membership.days_in_team} days
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'projects' && (
            <div>
              <h3 className="text-xl font-bold mb-4">📊 Team Projects</h3>
              <p className="text-gray-600">Project list will be displayed here...</p>
            </div>
          )}

          {activeTab === 'meetings' && (
            <div>
              <h3 className="text-xl font-bold mb-4">📅 Team Meetings</h3>
              <p className="text-gray-600">Meeting list will be displayed here...</p>
            </div>
          )}

          {activeTab === 'goals' && (
            <div>
              <h3 className="text-xl font-bold mb-4">🎯 Team Goals</h3>
              <p className="text-gray-600">Goal list will be displayed here...</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default TeamDetail;