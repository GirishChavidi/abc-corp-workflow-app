import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { projectsAPI } from '../api';
import useStore from '../store';

export default function Dashboard() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const user = useStore((s) => s.user);

  useEffect(() => {
    projectsAPI.dashboard()
      .then(setStats)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  const statCards = [
    { label: 'Total Projects', value: stats?.totalProjects || 0, icon: '📁', color: 'bg-blue-50 text-blue-700 border-blue-200' },
    { label: 'Active Projects', value: stats?.activeProjects || 0, icon: '🚀', color: 'bg-green-50 text-green-700 border-green-200' },
    { label: 'Clients', value: stats?.totalClients || 0, icon: '🏢', color: 'bg-purple-50 text-purple-700 border-purple-200' },
    { label: 'Trainees', value: stats?.totalTrainees || 0, icon: '👥', color: 'bg-orange-50 text-orange-700 border-orange-200' },
    { label: 'Vendors', value: stats?.totalVendors || 0, icon: '🔧', color: 'bg-teal-50 text-teal-700 border-teal-200' },
  ];

  const statusColor = {
    draft: 'badge-draft',
    active: 'badge-active',
    training: 'badge-training',
    interviewing: 'badge-interviewing',
    completed: 'badge-completed',
    cancelled: 'badge-cancelled',
  };

  return (
    <div>
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">
          Welcome back, {user?.name} 👋
        </h1>
        <p className="text-gray-500 mt-1">
          {user?.role === 'account_manager'
            ? 'Here\'s your project management overview'
            : 'Here\'s your project status overview'}
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4 mb-8">
        {statCards.map((card) => (
          <div key={card.label} className={`${card.color} border rounded-xl p-5`}>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium opacity-75">{card.label}</p>
                <p className="text-2xl font-bold mt-1">{card.value}</p>
              </div>
              <span className="text-2xl">{card.icon}</span>
            </div>
          </div>
        ))}
      </div>

      {/* Recent Projects */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200">
        <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
          <h2 className="font-bold text-gray-800">Recent Projects</h2>
          <Link
            to="/projects"
            className="text-sm text-blue-600 hover:text-blue-800 font-medium"
          >
            View All →
          </Link>
        </div>
        <div className="divide-y divide-gray-100">
          {(stats?.recentProjects || []).length === 0 ? (
            <div className="px-6 py-12 text-center text-gray-400">
              No projects yet.{' '}
              {user?.role === 'account_manager' && (
                <Link to="/projects" className="text-blue-600 hover:text-blue-800">Create one now</Link>
              )}
            </div>
          ) : (
            (stats?.recentProjects || []).map((project) => (
              <Link
                key={project.id}
                to={`/projects/${project.id}`}
                className="flex items-center justify-between px-6 py-4 hover:bg-gray-50 transition-colors"
              >
                <div className="flex items-center gap-4">
                  <div className={`w-10 h-10 rounded-lg flex items-center justify-center text-sm font-bold ${
                    project.type === 'on-site' ? 'bg-blue-100 text-blue-700' : 'bg-green-100 text-green-700'
                  }`}>
                    {project.type === 'on-site' ? '🏢' : '🌐'}
                  </div>
                  <div>
                    <p className="font-medium text-gray-800">{project.name}</p>
                    <p className="text-sm text-gray-500">{project.client_name} · {project.type}</p>
                  </div>
                </div>
                <span className={`badge ${statusColor[project.status] || 'badge-draft'}`}>
                  {project.status}
                </span>
              </Link>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
