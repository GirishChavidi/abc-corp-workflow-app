import React, { useState, useEffect } from 'react';

const trainingTypes = [
  { value: 'computer_skills', label: 'Computer Skills' },
  { value: 'business_skills', label: 'Business Skills' },
  { value: 'logic_skills', label: 'Logic Skills' },
];

const payerOptions = [
  { value: 'abc_corp', label: 'ABC Corp' },
  { value: 'client', label: 'Client' },
  { value: 'trainee', label: 'Trainee' },
];

export default function NodeEditor({ node, onUpdate, onClose, vendors = [] }) {
  const [data, setData] = useState({ ...node.data });

  useEffect(() => {
    setData({ ...node.data });
  }, [node.id]);

  const handleChange = (field, value) => {
    const newData = { ...data, [field]: value };
    setData(newData);
    onUpdate(node.id, newData);
  };

  const handleTrainingsChange = (type) => {
    const current = data.trainings || [];
    const updated = current.includes(type)
      ? current.filter((t) => t !== type)
      : [...current, type];
    handleChange('trainings', updated);
  };

  const handlePaymentChange = (training, payer) => {
    const payments = { ...(data.payments || {}) };
    payments[training] = payer;
    handleChange('payments', payments);
  };

  const handleVendorMapChange = (training, vendorName) => {
    const vendorsMap = { ...(data.vendors || {}) };
    vendorsMap[training] = vendorName;
    handleChange('vendors', vendorsMap);
  };

  const optionsChange = (idx, value) => {
    const opts = [...(data.options || [])];
    opts[idx] = value;
    handleChange('options', opts);
  };

  const addOption = () => {
    handleChange('options', [...(data.options || []), '']);
  };

  const removeOption = (idx) => {
    handleChange('options', (data.options || []).filter((_, i) => i !== idx));
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-4 w-72">
      <div className="flex justify-between items-center mb-4">
        <h3 className="font-bold text-sm text-gray-700">Edit Node</h3>
        <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-lg">×</button>
      </div>

      <div className="text-xs text-gray-400 mb-3 uppercase">
        Type: {node.type?.replace('Node', '')}
      </div>

      {/* Label (all nodes) */}
      <div className="mb-4">
        <label className="block text-xs font-medium text-gray-600 mb-1">Label</label>
        <input
          type="text"
          value={data.label || ''}
          onChange={(e) => handleChange('label', e.target.value)}
          className="w-full border border-gray-300 rounded px-2 py-1.5 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        />
      </div>

      {/* Decision node options */}
      {node.type === 'decisionNode' && (
        <>
          <div className="mb-3">
            <label className="block text-xs font-medium text-gray-600 mb-1">Decision Field</label>
            <select
              value={data.field || ''}
              onChange={(e) => handleChange('field', e.target.value)}
              className="w-full border border-gray-300 rounded px-2 py-1.5 text-sm"
            >
              <option value="">Select field...</option>
              <option value="project_type">Project Type (On/Off-site)</option>
              <option value="training_required">Training Required?</option>
              <option value="certification">Certification Required?</option>
              <option value="custom">Custom</option>
            </select>
          </div>
          <div className="mb-3">
            <label className="block text-xs font-medium text-gray-600 mb-1">Options</label>
            {(data.options || []).map((opt, idx) => (
              <div key={idx} className="flex gap-1 mb-1">
                <input
                  type="text"
                  value={opt}
                  onChange={(e) => optionsChange(idx, e.target.value)}
                  className="flex-1 border border-gray-300 rounded px-2 py-1 text-sm"
                  placeholder={`Option ${idx + 1}`}
                />
                <button onClick={() => removeOption(idx)} className="text-red-400 hover:text-red-600 text-sm px-1">×</button>
              </div>
            ))}
            <button onClick={addOption} className="text-xs text-blue-600 hover:text-blue-800 mt-1">+ Add Option</button>
          </div>
        </>
      )}

      {/* Training node */}
      {node.type === 'trainingNode' && (
        <div className="mb-3">
          <label className="block text-xs font-medium text-gray-600 mb-2">Training Types</label>
          {trainingTypes.map((t) => (
            <label key={t.value} className="flex items-center gap-2 mb-1.5 text-sm cursor-pointer">
              <input
                type="checkbox"
                checked={(data.trainings || []).includes(t.value)}
                onChange={() => handleTrainingsChange(t.value)}
                className="rounded text-indigo-600"
              />
              {t.label}
            </label>
          ))}
        </div>
      )}

      {/* Payment node */}
      {node.type === 'paymentNode' && (
        <div className="mb-3">
          <label className="block text-xs font-medium text-gray-600 mb-2">Payment Assignment</label>
          {trainingTypes.map((t) => (
            <div key={t.value} className="mb-2">
              <span className="text-xs text-gray-500 capitalize">{t.label}</span>
              <select
                value={(data.payments || {})[t.value] || ''}
                onChange={(e) => handlePaymentChange(t.value, e.target.value)}
                className="w-full border border-gray-300 rounded px-2 py-1 text-sm mt-0.5"
              >
                <option value="">Select payer...</option>
                {payerOptions.map((p) => (
                  <option key={p.value} value={p.value}>{p.label}</option>
                ))}
              </select>
            </div>
          ))}
        </div>
      )}

      {/* Vendor node */}
      {node.type === 'vendorNode' && (
        <div className="mb-3">
          <label className="block text-xs font-medium text-gray-600 mb-2">Vendor Assignment</label>
          {trainingTypes.map((t) => (
            <div key={t.value} className="mb-2">
              <span className="text-xs text-gray-500">{t.label}</span>
              <select
                value={(data.vendors || {})[t.value] || ''}
                onChange={(e) => handleVendorMapChange(t.value, e.target.value)}
                className="w-full border border-gray-300 rounded px-2 py-1 text-sm mt-0.5"
              >
                <option value="">Select vendor...</option>
                {vendors.map((v) => (
                  <option key={v.id} value={v.name}>{v.name}</option>
                ))}
              </select>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
