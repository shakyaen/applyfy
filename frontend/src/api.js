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
  // ─────────────────────────────────────────
  // USER APIs
  // ─────────────────────────────────────────
  
  upsertUser: (userData) =>
    request('/api/users', { 
      method: 'POST', 
      body: JSON.stringify({
        email: userData.email,
        password: userData.password,
        first_name: userData.first_name,
        middle_name: userData.middle_name,
        last_name: userData.last_name,
        phone: userData.phone,
        university: userData.university,
        year: userData.year,
        study_area: userData.study_area,
        job_type: userData.job_type,
        reminder_pref: userData.reminder_pref,
      }) 
    }),

  getUser: (email) =>
    request(`/api/users/${encodeURIComponent(email)}`),

  // ─────────────────────────────────────────
  // APPLICATIONS APIs
  // ─────────────────────────────────────────
  
  getApplications: (userEmail) =>
    request(`/api/applications/${encodeURIComponent(userEmail)}`),

  addApplication: (data) =>
    request('/api/applications', { 
      method: 'POST', 
      body: JSON.stringify({
        user_email: data.user_email,
        company: data.company,
        role: data.role,
        type: data.type,
        deadline: data.deadline,
        source: data.source,
        link: data.link,
        status: data.status,
        reminder: data.reminder,
      }) 
    }),

  updateStatus: (id, status) =>
    request(`/api/applications/${id}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status }),
    }),

  deleteApplication: (id) =>
    request(`/api/applications/${id}`, { method: 'DELETE' }),
};
