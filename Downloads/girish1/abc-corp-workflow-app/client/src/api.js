const API_BASE = '/api';

async function request(endpoint, options = {}) {
  const token = localStorage.getItem('abc_token');
  const headers = {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...options.headers,
  };

  const res = await fetch(`${API_BASE}${endpoint}`, { ...options, headers });

  if (res.status === 401 || res.status === 403) {
    // If unauthorized, clear token and redirect
    if (res.status === 401) {
      localStorage.removeItem('abc_token');
      localStorage.removeItem('abc_user');
      window.location.href = '/login';
    }
  }

  const data = await res.json();

  if (!res.ok) {
    throw new Error(data.error || 'Request failed');
  }

  return data;
}

// ─── Auth ───────────────────────────────────────────────────────────────────
export const authAPI = {
  login: (email, password) => request('/auth/login', { method: 'POST', body: JSON.stringify({ email, password }) }),
  register: (data) => request('/auth/register', { method: 'POST', body: JSON.stringify(data) }),
  me: () => request('/auth/me'),
};

// ─── Clients ────────────────────────────────────────────────────────────────
export const clientsAPI = {
  list: () => request('/clients'),
  get: (id) => request(`/clients/${id}`),
  create: (data) => request('/clients', { method: 'POST', body: JSON.stringify(data) }),
  update: (id, data) => request(`/clients/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
};

// ─── Vendors ────────────────────────────────────────────────────────────────
export const vendorsAPI = {
  list: () => request('/vendors'),
  get: (id) => request(`/vendors/${id}`),
  create: (data) => request('/vendors', { method: 'POST', body: JSON.stringify(data) }),
  update: (id, data) => request(`/vendors/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
};

// ─── Projects ───────────────────────────────────────────────────────────────
export const projectsAPI = {
  list: () => request('/projects'),
  get: (id) => request(`/projects/${id}`),
  create: (data) => request('/projects', { method: 'POST', body: JSON.stringify(data) }),
  update: (id, data) => request(`/projects/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  saveWorkflow: (id, workflow_data) => request(`/projects/${id}/workflow`, { method: 'PUT', body: JSON.stringify({ workflow_data }) }),
  // Trainings
  addTraining: (projectId, data) => request(`/projects/${projectId}/trainings`, { method: 'POST', body: JSON.stringify(data) }),
  updateTraining: (projectId, trainingId, data) => request(`/projects/${projectId}/trainings/${trainingId}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteTraining: (projectId, trainingId) => request(`/projects/${projectId}/trainings/${trainingId}`, { method: 'DELETE' }),
  // Trainees
  addTrainee: (projectId, data) => request(`/projects/${projectId}/trainees`, { method: 'POST', body: JSON.stringify(data) }),
  updateTrainee: (projectId, ptId, data) => request(`/projects/${projectId}/trainees/${ptId}`, { method: 'PUT', body: JSON.stringify(data) }),
  // Dashboard
  dashboard: () => request('/projects/stats/dashboard'),
};

// ─── Trainees ───────────────────────────────────────────────────────────────
export const traineesAPI = {
  list: () => request('/trainees'),
  get: (id) => request(`/trainees/${id}`),
  create: (data) => request('/trainees', { method: 'POST', body: JSON.stringify(data) }),
  update: (id, data) => request(`/trainees/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
};

// ─── Workflow Templates ─────────────────────────────────────────────────────
export const workflowsAPI = {
  list: () => request('/workflows'),
  get: (id) => request(`/workflows/${id}`),
  create: (data) => request('/workflows', { method: 'POST', body: JSON.stringify(data) }),
  delete: (id) => request(`/workflows/${id}`, { method: 'DELETE' }),
};
