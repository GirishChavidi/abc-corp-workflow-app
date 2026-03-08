import React, { useState, useEffect } from 'react';
import { clientsAPI } from '../api';
import useStore from '../store';

export default function Clients() {
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState({ name: '', industry: '' });
  const isManager = useStore((s) => s.user?.role === 'account_manager');
  const showNotification = useStore((s) => s.showNotification);

  useEffect(() => {
    clientsAPI.list()
      .then(setClients)
      .catch(() => showNotification('Failed to load clients', 'error'))
      .finally(() => setLoading(false));
  }, []);

  const handleCreate = async (e) => {
    e.preventDefault();
    try {
      const client = await clientsAPI.create(form);
      setClients([...clients, client]);
      setShowCreate(false);
      setForm({ name: '', industry: '' });
      showNotification('Client created');
    } catch (err) {
      showNotification(err.message, 'error');
    }
  };

  if (loading) {
    return <div className="flex items-center justify-center h-64"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div></div>;
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Clients</h1>
          <p className="text-gray-500 text-sm mt-1">{clients.length} onboarded clients</p>
        </div>
        {isManager && (
          <button onClick={() => setShowCreate(true)} className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700">
            + New Client
          </button>
        )}
      </div>

      {showCreate && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-6">
            <h2 className="text-lg font-bold mb-4">Onboard New Client</h2>
            <form onSubmit={handleCreate} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Company Name</label>
                <input type="text" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="w-full border rounded-lg px-3 py-2 text-sm" required />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Industry</label>
                <input type="text" value={form.industry} onChange={(e) => setForm({ ...form, industry: e.target.value })} className="w-full border rounded-lg px-3 py-2 text-sm" />
              </div>
              <div className="flex gap-3 justify-end">
                <button type="button" onClick={() => setShowCreate(false)} className="px-4 py-2 text-sm text-gray-600">Cancel</button>
                <button type="submit" className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700">Create Client</button>
              </div>
            </form>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {clients.map((client) => (
          <div key={client.id} className="bg-white rounded-xl shadow-sm border border-gray-200 p-5 hover:shadow-md transition-shadow">
            <div className="flex items-start justify-between mb-3">
              <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center text-lg font-bold text-purple-700">
                {client.name.charAt(0)}
              </div>
              <span className={`badge ${client.status === 'active' ? 'badge-active' : 'badge-cancelled'}`}>
                {client.status}
              </span>
            </div>
            <h3 className="font-bold text-gray-800">{client.name}</h3>
            {client.industry && <p className="text-sm text-gray-500 mt-1">{client.industry}</p>}
            <p className="text-xs text-gray-400 mt-3">
              Onboarded: {new Date(client.onboarded_at || client.created_at).toLocaleDateString()}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}
