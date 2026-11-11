// API Client for LeadIQ
const API_BASE = '/api';

export async function request(endpoint, options = {}) {
  const url = `${API_BASE}${endpoint}`;
  const headers = options.headers || {};
  
  if (!(options.body instanceof FormData) && !headers['Content-Type']) {
    headers['Content-Type'] = 'application/json';
  }

  const response = await fetch(url, {
    ...options,
    headers,
  });

  if (response.status === 204) {
    return null;
  }

  const contentType = response.headers.get('content-type');
  if (contentType && contentType.includes('text/csv')) {
    return response.blob();
  }

  const data = await response.json().catch(() => null);

  if (!response.ok) {
    const errorMsg = data && (data.detail || data.message) ? (data.detail || data.message) : `HTTP error ${response.status}`;
    throw new Error(typeof errorMsg === 'string' ? errorMsg : JSON.stringify(errorMsg));
  }

  return data;
}

export const api = {
  // Dashboard
  getDashboardStats: () => request('/dashboard/stats'),

  // Leads
  getLeads: (params = {}) => {
    const searchParams = new URLSearchParams();
    Object.entries(params).forEach(([key, val]) => {
      if (val !== undefined && val !== null && val !== '') {
        searchParams.append(key, val);
      }
    });
    return request(`/leads?${searchParams.toString()}`);
  },

  getLead: (id) => request(`/leads/${id}`),

  createLead: (leadData, autoValidate = true, autoEnrich = false) =>
    request(`/leads?auto_validate=${autoValidate}&auto_enrich=${autoEnrich}`, {
      method: 'POST',
      body: JSON.stringify(leadData),
    }),

  updateLead: (id, data) =>
    request(`/leads/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),

  deleteLead: (id) =>
    request(`/leads/${id}`, {
      method: 'DELETE',
    }),

  batchDeleteLeads: (leadIds) =>
    request('/leads/batch-delete', {
      method: 'POST',
      body: JSON.stringify({ lead_ids: leadIds }),
    }),

  validateLead: (id) =>
    request(`/leads/${id}/validate`, {
      method: 'POST',
    }),

  enrichLead: (id) =>
    request(`/leads/${id}/enrich`, {
      method: 'POST',
    }),

  batchEnrichLeads: (leadIds) =>
    request('/leads/batch-enrich', {
      method: 'POST',
      body: JSON.stringify({ lead_ids: leadIds }),
    }),

  checkDuplicates: (leadData) =>
    request('/leads/check-duplicates', {
      method: 'POST',
      body: JSON.stringify(leadData),
    }),

  exportLeadsUrl: (params = {}) => {
    const searchParams = new URLSearchParams();
    Object.entries(params).forEach(([key, val]) => {
      if (val !== undefined && val !== null && val !== '') {
        searchParams.append(key, val);
      }
    });
    return `${API_BASE}/leads/export?${searchParams.toString()}`;
  },

  // CSV Imports
  previewCsv: (file) => {
    const formData = new FormData();
    formData.append('file', file);
    return request('/imports/preview', {
      method: 'POST',
      body: formData,
    });
  },

  processCsvImport: (payload) =>
    request('/imports/process', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),

  getImportHistory: () => request('/imports'),

  getRejectedExportUrl: (historyId) => `${API_BASE}/imports/${historyId}/rejected`,

  // Settings
  getSettings: () => request('/settings'),
  updateSettings: (data) =>
    request('/settings/update', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  testGroq: (data) =>
    request('/settings/test-groq', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
};
