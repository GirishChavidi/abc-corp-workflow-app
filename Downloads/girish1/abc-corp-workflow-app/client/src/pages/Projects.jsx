import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { projectsAPI, clientsAPI } from '../api';
import useStore from '../store';

export default function Projects() {
  const [projects, setProjects] = useState([]);
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState({ client_id: '', name: '', description: '', type: 'on-site' });
  const user = useStore((s) => s.user);
  const showNotification = useStore((s) => s.showNotification);

  useEffect(() => {
    Promise.all([projectsAPI.list(), clientsAPI.list()])
      .then(([p, c]) => { setProjects(p); setClients(c); })
      .catch(() => showNotification('Failed to load data', 'error'))
      .finally(() => setLoading(false));
  }, []);

  const handleCreate = async (e) => {
    e.preventDefault();
    try {
      const project = await projectsAPI.create({ ...form, client_id: Number(form.client_id) });
      setProjects([project, ...projects]);
      setShowCreate(false);
      setForm({ client_id: '', name: '', description: '', type: 'on-site' });
      showNotification('Project created successfully');
    } catch (err) {
      showNotification(err.message, 'error');
    }
  };

  const statusColor = {
    draft: 'badge-draft', active: 'badge-active', training: 'badge-training',
    interviewing: 'badge-interviewing', completed: 'badge-completed', cancelled: 'badge-cancelled',
  };

  if (loading) {
    return <div className="flex items-center justify-center h-64"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div></div>;
  }

  return (
    <div>
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Projects</h1>
          <p className="text-gray-500 text-sm mt-1">{projects.length} total projects</p>
        </div>
        {user?.role === 'account_manager' && (
          <button
            onClick={() => setShowCreate(true)}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors"
          >
            + New Project
          </button>
        )}
      </div>

      {/* Create Modal */}
      {showCreate && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-lg w-full p-6">
            <h2 className="text-lg font-bold text-gray-800 mb-4">Create New Project</h2>
            <form onSubmit={handleCreate} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Client</label>
                <select
                  value={form.client_id}
                  onChange={(e) => setForm({ ...form, client_id: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
                  required
                >
                  <option value="">Select client...</option>
                  {clients.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Project Name</label>
                <input
                  type="text"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
                  placeholder="Project name"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                <textarea
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  rows={3}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
                  placeholder="Project description..."
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Project Type</label>
                <div className="flex gap-4">
                  {['on-site', 'off-site'].map((t) => (
                    <label key={t} className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="radio"
                        name="type"
                        value={t}
                        checked={form.type === t}
                        onChange={() => setForm({ ...form, type: t })}
                        className="text-blue-600"
                      />
                      <span className="text-sm capitalize">{t}</span>
                      {t === 'on-site' && <span className="text-xs text-gray-400">(min 2 trainings)</span>}
                    </label>
                  ))}
                </div>
              </div>
              <div className="flex gap-3 justify-end pt-2">
                <button type="button" onClick={() => setShowCreate(false)} className="px-4 py-2 text-sm text-gray-600 hover:text-gray-800">Cancel</button>
                <button type="submit" className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700">Create Project</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Project Grid */}
      {projects.length === 0 ? (
        <div className="bg-white rounded-xl shadow-sm border p-12 text-center text-gray-400">
          No projects found. Create your first project to get started.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {projects.map((project) => (
            <Link
              key={project.id}
              to={`/projects/${project.id}`}
              className="bg-white rounded-xl shadow-sm border border-gray-200 p-5 hover:shadow-md hover:border-blue-200 transition-all"
            >
              <div className="flex items-start justify-between mb-3">
                <div className={`w-10 h-10 rounded-lg flex items-center justify-center text-lg ${
                  project.type === 'on-site' ? 'bg-blue-100' : 'bg-green-100'
                }`}>
                  {project.type === 'on-site' ? '🏢' : '🌐'}
                </div>
                <span className={`badge ${statusColor[project.status] || 'badge-draft'}`}>
                  {project.status}
                </span>
              </div>
              <h3 className="font-bold text-gray-800 mb-1">{project.name}</h3>
              <p className="text-sm text-gray-500 mb-3">{project.client_name}</p>
              {project.description && (
                <p className="text-xs text-gray-400 line-clamp-2">{project.description}</p>
              )}
              <div className="flex items-center justify-between mt-4 pt-3 border-t border-gray-100">
                <span className="text-xs text-gray-400 capitalize">{project.type}</span>
                {project.manager_name && (
                  <span className="text-xs text-gray-400">👤 {project.manager_name}</span>
                )}
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
