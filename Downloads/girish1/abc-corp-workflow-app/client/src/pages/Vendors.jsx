import React, { useState, useEffect } from 'react';
import { vendorsAPI } from '../api';
import useStore from '../store';

const trainingTypeLabels = {
  computer_skills: 'Computer Skills',
  business_skills: 'Business Skills',
  logic_skills: 'Logic Skills',
};

export default function Vendors() {
  const [vendors, setVendors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState({ name: '', specializations: [], contact_email: '', contact_phone: '' });
  const showNotification = useStore((s) => s.showNotification);

  useEffect(() => {
    vendorsAPI.list()
      .then(setVendors)
      .catch(() => showNotification('Failed to load vendors', 'error'))
      .finally(() => setLoading(false));
  }, []);

  const handleSpecToggle = (spec) => {
    setForm((f) => ({
      ...f,
      specializations: f.specializations.includes(spec)
        ? f.specializations.filter((s) => s !== spec)
        : [...f.specializations, spec],
    }));
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    try {
      const vendor = await vendorsAPI.create(form);
      setVendors([...vendors, vendor]);
      setShowCreate(false);
      setForm({ name: '', specializations: [], contact_email: '', contact_phone: '' });
      showNotification('Vendor created');
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
          <h1 className="text-2xl font-bold text-gray-900">Vendors</h1>
          <p className="text-gray-500 text-sm mt-1">{vendors.length} training vendors</p>
        </div>
        <button onClick={() => setShowCreate(true)} className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700">
          + New Vendor
        </button>
      </div>

      {showCreate && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-6">
            <h2 className="text-lg font-bold mb-4">Add Training Vendor</h2>
            <form onSubmit={handleCreate} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Vendor Name</label>
                <input type="text" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="w-full border rounded-lg px-3 py-2 text-sm" required />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Specializations</label>
                {Object.entries(trainingTypeLabels).map(([value, label]) => (
                  <label key={value} className="flex items-center gap-2 mb-1.5 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={form.specializations.includes(value)}
                      onChange={() => handleSpecToggle(value)}
                      className="rounded text-blue-600"
                    />
                    <span className="text-sm">{label}</span>
                  </label>
                ))}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Contact Email</label>
                <input type="email" value={form.contact_email} onChange={(e) => setForm({ ...form, contact_email: e.target.value })} className="w-full border rounded-lg px-3 py-2 text-sm" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Contact Phone</label>
                <input type="tel" value={form.contact_phone} onChange={(e) => setForm({ ...form, contact_phone: e.target.value })} className="w-full border rounded-lg px-3 py-2 text-sm" />
              </div>
              <div className="flex gap-3 justify-end">
                <button type="button" onClick={() => setShowCreate(false)} className="px-4 py-2 text-sm text-gray-600">Cancel</button>
                <button type="submit" className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700">Create Vendor</button>
              </div>
            </form>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {vendors.map((vendor) => (
          <div key={vendor.id} className="bg-white rounded-xl shadow-sm border border-gray-200 p-5 hover:shadow-md transition-shadow">
            <div className="flex items-start justify-between mb-3">
              <div className="w-12 h-12 bg-teal-100 rounded-xl flex items-center justify-center text-xl">🔧</div>
              <span className={`badge ${vendor.status === 'active' ? 'badge-active' : 'badge-cancelled'}`}>
                {vendor.status}
              </span>
            </div>
            <h3 className="font-bold text-gray-800">{vendor.name}</h3>
            <div className="mt-2 flex flex-wrap gap-1">
              {(vendor.specializations || []).map((spec) => (
                <span key={spec} className="text-xs bg-teal-50 text-teal-700 px-2 py-0.5 rounded-full capitalize">
                  {spec.replace('_', ' ')}
                </span>
              ))}
            </div>
            {vendor.contact_email && <p className="text-xs text-gray-400 mt-3">📧 {vendor.contact_email}</p>}
            {vendor.contact_phone && <p className="text-xs text-gray-400">📱 {vendor.contact_phone}</p>}
          </div>
        ))}
      </div>
    </div>
  );
}
