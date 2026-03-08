import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { projectsAPI, vendorsAPI, traineesAPI } from '../api';
import useStore from '../store';

const statusFlow = ['sourced', 'training', 'certified', 'interview_scheduled', 'interviewed', 'shortlisted', 'offer_given', 'hired'];
const trainingLabels = { computer_skills: 'Computer Skills', business_skills: 'Business Skills', logic_skills: 'Logic Skills' };
const payerLabels = { abc_corp: 'ABC Corp', client: 'Client', trainee: 'Trainee' };

export default function ProjectDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [project, setProject] = useState(null);
  const [vendors, setVendors] = useState([]);
  const [allTrainees, setAllTrainees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState('overview');
  const [showAddTraining, setShowAddTraining] = useState(false);
  const [showAddTrainee, setShowAddTrainee] = useState(false);
  const [trainingForm, setTrainingForm] = useState({ type: 'computer_skills', vendor_id: '', paid_by: 'abc_corp', certification_required: false });
  const [traineeForm, setTraineeForm] = useState({ trainee_id: '', name: '', email: '', phone: '' });

  const user = useStore((s) => s.user);
  const showNotification = useStore((s) => s.showNotification);
  const isManager = user?.role === 'account_manager';

  const loadProject = () => projectsAPI.get(id).then(setProject);

  useEffect(() => {
    Promise.all([projectsAPI.get(id), vendorsAPI.list(), traineesAPI.list()])
      .then(([p, v, t]) => { setProject(p); setVendors(v); setAllTrainees(t); })
      .catch(() => showNotification('Failed to load project', 'error'))
      .finally(() => setLoading(false));
  }, [id]);

  const handleAddTraining = async (e) => {
    e.preventDefault();
    try {
      await projectsAPI.addTraining(id, { ...trainingForm, vendor_id: trainingForm.vendor_id ? Number(trainingForm.vendor_id) : null });
      await loadProject();
      setShowAddTraining(false);
      setTrainingForm({ type: 'computer_skills', vendor_id: '', paid_by: 'abc_corp', certification_required: false });
      showNotification('Training added');
    } catch (err) { showNotification(err.message, 'error'); }
  };

  const handleDeleteTraining = async (trainingId) => {
    try {
      await projectsAPI.deleteTraining(id, trainingId);
      await loadProject();
      showNotification('Training removed');
    } catch (err) { showNotification(err.message, 'error'); }
  };

  const handleAddTrainee = async (e) => {
    e.preventDefault();
    try {
      const data = traineeForm.trainee_id ? { trainee_id: Number(traineeForm.trainee_id) } : { name: traineeForm.name, email: traineeForm.email, phone: traineeForm.phone };
      await projectsAPI.addTrainee(id, data);
      await loadProject();
      setShowAddTrainee(false);
      setTraineeForm({ trainee_id: '', name: '', email: '', phone: '' });
      showNotification('Trainee added');
    } catch (err) { showNotification(err.message, 'error'); }
  };

  const handleTraineeStatus = async (ptId, newStatus) => {
    try {
      const updates = { status: newStatus };
      if (newStatus === 'offer_given') updates.offer_date = new Date().toISOString();
      if (newStatus === 'hired') updates.hire_date = new Date().toISOString();
      await projectsAPI.updateTrainee(id, ptId, updates);
      await loadProject();
      showNotification(`Trainee moved to: ${newStatus.replace('_', ' ')}`);
    } catch (err) { showNotification(err.message, 'error'); }
  };

  const handleStatusChange = async (newStatus) => {
    try {
      await projectsAPI.update(id, { status: newStatus });
      await loadProject();
      showNotification(`Project status: ${newStatus}`);
    } catch (err) { showNotification(err.message, 'error'); }
  };

  if (loading) return <div className="flex items-center justify-center h-64"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div></div>;
  if (!project) return <div className="text-center py-12 text-gray-400">Project not found</div>;

  const statusColor = { draft: 'badge-draft', active: 'badge-active', training: 'badge-training', interviewing: 'badge-interviewing', completed: 'badge-completed', cancelled: 'badge-cancelled' };

  const traineeStatusColor = {
    sourced: 'bg-gray-100 text-gray-700', training: 'bg-blue-100 text-blue-700', certified: 'bg-indigo-100 text-indigo-700',
    interview_scheduled: 'bg-yellow-100 text-yellow-700', interviewed: 'bg-orange-100 text-orange-700',
    shortlisted: 'bg-purple-100 text-purple-700', offer_given: 'bg-teal-100 text-teal-700', hired: 'bg-green-100 text-green-700', rejected: 'bg-red-100 text-red-700'
  };

  return (
    <div>
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm text-gray-500 mb-4">
        <Link to="/projects" className="hover:text-blue-600">Projects</Link>
        <span>/</span>
        <span className="text-gray-800 font-medium">{project.name}</span>
      </div>

      {/* Header */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="flex items-start gap-4">
            <div className={`w-14 h-14 rounded-xl flex items-center justify-center text-2xl ${project.type === 'on-site' ? 'bg-blue-100' : 'bg-green-100'}`}>
              {project.type === 'on-site' ? '🏢' : '🌐'}
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">{project.name}</h1>
              <p className="text-gray-500 mt-1">{project.client_name} · {project.type} · Managed by {project.manager_name || 'Unassigned'}</p>
              {project.description && <p className="text-sm text-gray-400 mt-2">{project.description}</p>}
            </div>
          </div>
          <div className="flex items-center gap-3">
            <span className={`badge ${statusColor[project.status]}`}>{project.status}</span>
            <Link to={`/projects/${id}/workflow`} className="bg-indigo-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-indigo-700 transition-colors">
              🔧 Workflow Builder
            </Link>
            {isManager && (
              <select
                value={project.status}
                onChange={(e) => handleStatusChange(e.target.value)}
                className="border border-gray-300 rounded-lg px-3 py-2 text-sm"
              >
                {['draft', 'active', 'training', 'interviewing', 'completed', 'cancelled'].map((s) => (
                  <option key={s} value={s} className="capitalize">{s}</option>
                ))}
              </select>
            )}
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 mb-6 bg-gray-100 p-1 rounded-lg w-fit">
        {['overview', 'trainings', 'trainees'].map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors capitalize ${tab === t ? 'bg-white shadow text-gray-800' : 'text-gray-500 hover:text-gray-700'}`}
          >
            {t}
          </button>
        ))}
      </div>

      {/* ── Overview Tab ─────────────────────────────────────────────────── */}
      {tab === 'overview' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="bg-white rounded-xl shadow-sm border p-5">
            <h3 className="font-bold text-gray-700 mb-3">Project Info</h3>
            <dl className="space-y-3 text-sm">
              <div><dt className="text-gray-400">Type</dt><dd className="font-medium capitalize">{project.type}</dd></div>
              <div><dt className="text-gray-400">Status</dt><dd className="font-medium capitalize">{project.status}</dd></div>
              <div><dt className="text-gray-400">Client</dt><dd className="font-medium">{project.client_name}</dd></div>
              <div><dt className="text-gray-400">Manager</dt><dd className="font-medium">{project.manager_name || 'Unassigned'}</dd></div>
              <div><dt className="text-gray-400">Created</dt><dd className="font-medium">{new Date(project.created_at).toLocaleDateString()}</dd></div>
            </dl>
          </div>
          <div className="bg-white rounded-xl shadow-sm border p-5">
            <h3 className="font-bold text-gray-700 mb-3">Training Summary</h3>
            <p className="text-2xl font-bold text-indigo-600">{project.trainings?.length || 0}</p>
            <p className="text-sm text-gray-400">configured trainings</p>
            {project.type === 'on-site' && project.trainings?.length < 2 && (
              <div className="mt-3 bg-yellow-50 border border-yellow-200 text-yellow-700 text-xs p-2 rounded">
                ⚠️ On-site projects require at least 2 trainings
              </div>
            )}
            <div className="mt-3 space-y-2">
              {(project.trainings || []).map((t) => (
                <div key={t.id} className="flex justify-between text-sm">
                  <span className="capitalize">{t.type?.replace('_', ' ')}</span>
                  <span className={`badge badge-${t.status === 'completed' ? 'completed' : t.status === 'in_progress' ? 'active' : 'draft'}`}>{t.status}</span>
                </div>
              ))}
            </div>
          </div>
          <div className="bg-white rounded-xl shadow-sm border p-5">
            <h3 className="font-bold text-gray-700 mb-3">Trainee Pipeline</h3>
            <p className="text-2xl font-bold text-blue-600">{project.trainees?.length || 0}</p>
            <p className="text-sm text-gray-400">candidates in pipeline</p>
            <div className="mt-3 space-y-1">
              {Object.entries(
                (project.trainees || []).reduce((acc, t) => { acc[t.status] = (acc[t.status] || 0) + 1; return acc; }, {})
              ).map(([status, count]) => (
                <div key={status} className="flex justify-between text-sm">
                  <span className="capitalize">{status.replace('_', ' ')}</span>
                  <span className="font-medium">{count}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ── Trainings Tab ────────────────────────────────────────────────── */}
      {tab === 'trainings' && (
        <div>
          {isManager && (
            <div className="mb-4">
              <button onClick={() => setShowAddTraining(true)} className="bg-indigo-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-indigo-700">
                + Add Training
              </button>
            </div>
          )}

          {showAddTraining && (
            <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
              <div className="bg-white rounded-2xl shadow-xl max-w-lg w-full p-6">
                <h2 className="text-lg font-bold mb-4">Add Training</h2>
                <form onSubmit={handleAddTraining} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Training Type</label>
                    <select value={trainingForm.type} onChange={(e) => setTrainingForm({ ...trainingForm, type: e.target.value })} className="w-full border rounded-lg px-3 py-2 text-sm">
                      {Object.entries(trainingLabels).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Vendor</label>
                    <select value={trainingForm.vendor_id} onChange={(e) => setTrainingForm({ ...trainingForm, vendor_id: e.target.value })} className="w-full border rounded-lg px-3 py-2 text-sm">
                      <option value="">Select vendor...</option>
                      {vendors.map((v) => <option key={v.id} value={v.id}>{v.name}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Paid By</label>
                    <select value={trainingForm.paid_by} onChange={(e) => setTrainingForm({ ...trainingForm, paid_by: e.target.value })} className="w-full border rounded-lg px-3 py-2 text-sm">
                      {Object.entries(payerLabels).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
                    </select>
                  </div>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input type="checkbox" checked={trainingForm.certification_required} onChange={(e) => setTrainingForm({ ...trainingForm, certification_required: e.target.checked })} />
                    <span className="text-sm">Certification Required</span>
                  </label>
                  <div className="flex gap-3 justify-end">
                    <button type="button" onClick={() => setShowAddTraining(false)} className="px-4 py-2 text-sm text-gray-600">Cancel</button>
                    <button type="submit" className="bg-indigo-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-indigo-700">Add Training</button>
                  </div>
                </form>
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {(project.trainings || []).map((t) => (
              <div key={t.id} className="bg-white rounded-xl shadow-sm border p-5">
                <div className="flex justify-between items-start mb-3">
                  <h3 className="font-bold text-gray-800 capitalize">{t.type?.replace('_', ' ')}</h3>
                  {isManager && (
                    <button onClick={() => handleDeleteTraining(t.id)} className="text-red-400 hover:text-red-600 text-sm">✕</button>
                  )}
                </div>
                <dl className="space-y-2 text-sm">
                  <div className="flex justify-between"><span className="text-gray-400">Vendor</span><span className="font-medium">{t.vendor_name || 'Unassigned'}</span></div>
                  <div className="flex justify-between"><span className="text-gray-400">Paid By</span><span className="font-medium capitalize">{t.paid_by?.replace('_', ' ')}</span></div>
                  <div className="flex justify-between"><span className="text-gray-400">Certification</span><span className="font-medium">{t.certification_required ? '✅ Yes' : '❌ No'}</span></div>
                  <div className="flex justify-between"><span className="text-gray-400">Status</span><span className={`badge badge-${t.status === 'completed' ? 'completed' : t.status === 'in_progress' ? 'active' : 'draft'}`}>{t.status}</span></div>
                </dl>
              </div>
            ))}
            {(project.trainings || []).length === 0 && (
              <div className="col-span-full bg-white rounded-xl shadow-sm border p-12 text-center text-gray-400">
                No trainings configured. Add trainings to define the project scope.
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── Trainees Tab ─────────────────────────────────────────────────── */}
      {tab === 'trainees' && (
        <div>
          {isManager && (
            <div className="mb-4">
              <button onClick={() => setShowAddTrainee(true)} className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700">
                + Add Trainee
              </button>
            </div>
          )}

          {showAddTrainee && (
            <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
              <div className="bg-white rounded-2xl shadow-xl max-w-lg w-full p-6">
                <h2 className="text-lg font-bold mb-4">Add Trainee to Project</h2>
                <form onSubmit={handleAddTrainee} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Select Existing Trainee</label>
                    <select value={traineeForm.trainee_id} onChange={(e) => setTraineeForm({ ...traineeForm, trainee_id: e.target.value })} className="w-full border rounded-lg px-3 py-2 text-sm">
                      <option value="">-- Or create new below --</option>
                      {allTrainees.map((t) => <option key={t.id} value={t.id}>{t.name} ({t.email})</option>)}
                    </select>
                  </div>
                  {!traineeForm.trainee_id && (
                    <>
                      <div className="border-t pt-3"><p className="text-xs text-gray-400 mb-2">Create New Trainee</p></div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
                        <input type="text" value={traineeForm.name} onChange={(e) => setTraineeForm({ ...traineeForm, name: e.target.value })} className="w-full border rounded-lg px-3 py-2 text-sm" required={!traineeForm.trainee_id} />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                        <input type="email" value={traineeForm.email} onChange={(e) => setTraineeForm({ ...traineeForm, email: e.target.value })} className="w-full border rounded-lg px-3 py-2 text-sm" />
                      </div>
                    </>
                  )}
                  <div className="flex gap-3 justify-end">
                    <button type="button" onClick={() => setShowAddTrainee(false)} className="px-4 py-2 text-sm text-gray-600">Cancel</button>
                    <button type="submit" className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700">Add Trainee</button>
                  </div>
                </form>
              </div>
            </div>
          )}

          {/* Trainee Pipeline */}
          <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">Trainee</th>
                  <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">Status</th>
                  <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">Dates</th>
                  {isManager && <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">Actions</th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {(project.trainees || []).map((pt) => {
                  const currentIdx = statusFlow.indexOf(pt.status);
                  const nextStatus = currentIdx < statusFlow.length - 1 ? statusFlow[currentIdx + 1] : null;
                  return (
                    <tr key={pt.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4">
                        <p className="font-medium text-gray-800">{pt.trainee_name}</p>
                        <p className="text-xs text-gray-400">{pt.trainee_email}</p>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`badge ${traineeStatusColor[pt.status] || 'bg-gray-100 text-gray-700'}`}>
                          {pt.status?.replace('_', ' ')}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-xs text-gray-400">
                        {pt.interview_date && <div>Interview: {new Date(pt.interview_date).toLocaleDateString()}</div>}
                        {pt.offer_date && <div>Offer: {new Date(pt.offer_date).toLocaleDateString()}</div>}
                        {pt.hire_date && <div>Hired: {new Date(pt.hire_date).toLocaleDateString()}</div>}
                      </td>
                      {isManager && (
                        <td className="px-6 py-4">
                          <div className="flex gap-2">
                            {nextStatus && (
                              <button
                                onClick={() => handleTraineeStatus(pt.id, nextStatus)}
                                className="text-xs bg-blue-50 text-blue-700 px-3 py-1 rounded-full hover:bg-blue-100"
                              >
                                → {nextStatus.replace('_', ' ')}
                              </button>
                            )}
                            {pt.status !== 'rejected' && pt.status !== 'hired' && (
                              <button
                                onClick={() => handleTraineeStatus(pt.id, 'rejected')}
                                className="text-xs bg-red-50 text-red-700 px-3 py-1 rounded-full hover:bg-red-100"
                              >
                                Reject
                              </button>
                            )}
                          </div>
                        </td>
                      )}
                    </tr>
                  );
                })}
                {(project.trainees || []).length === 0 && (
                  <tr>
                    <td colSpan={isManager ? 4 : 3} className="px-6 py-12 text-center text-gray-400">
                      No trainees assigned yet.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
