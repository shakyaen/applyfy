const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

async function request(path, options = {}) {
  const res = await fetch(`${API_URL}${path}`, {
    headers: { 'Content-Type': 'application/json' },
    ...options,
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: 'Unknown error' }));
    throw new Error(err.detail || 'Request failed');
  }
  return res.json();
}

export const api = {
  upsertUser: (profile) =>
    request('/api/users', { method: 'POST', body: JSON.stringify(profile) }),

  getUser: (email) =>
    request(`/api/users/${encodeURIComponent(email)}`),

  getApplications: (userEmail) =>
    request(`/api/applications/${encodeURIComponent(userEmail)}`),

  addApplication: (data) =>
    request('/api/applications', { method: 'POST', body: JSON.stringify(data) }),

  updateStatus: (id, status) =>
    request(`/api/applications/${id}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status }),
    }),

  deleteApplication: (id) =>
    request(`/api/applications/${id}`, { method: 'DELETE' }),
};
