/**
 * ResolveX API Client
 * Clean REST client communicating with the Fastify + Prisma backend.
 */

const API_BASE_URL = import.meta.env.VITE_API_URL || '/api';

/**
 * Helper to retrieve stored auth token
 */
function getAuthToken() {
  try {
    return localStorage.getItem('cms_auth_token') || null;
  } catch {
    return null;
  }
}

/**
 * Common request wrapper with JSON headers and Bearer auth injection
 */
async function request(endpoint, options = {}) {
  const token = getAuthToken();
  const headers = {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...(options.headers || {}),
  };

  const config = {
    ...options,
    headers,
  };

  try {
    const res = await fetch(`${API_BASE_URL}${endpoint}`, config);
    const data = await res.json().catch(() => ({}));

    if (!res.ok) {
      const error = new Error(data.message || `Request failed with status ${res.status}`);
      error.status = res.status;
      error.details = data;
      throw error;
    }

    return data;
  } catch (err) {
    // Re-throw formatted error
    throw err;
  }
}

// 1. Auth API
export const authApi = {
  login: async (email, password) => {
    const res = await request('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
    if (res.token) {
      localStorage.setItem('cms_auth_token', res.token);
    }
    return res;
  },

  register: async (userData) => {
    const res = await request('/auth/register', {
      method: 'POST',
      body: JSON.stringify(userData),
    });
    if (res.token) {
      localStorage.setItem('cms_auth_token', res.token);
    }
    return res;
  },

  getMe: async () => {
    return request('/auth/me');
  },

  logout: () => {
    localStorage.removeItem('cms_auth_token');
  },
};

// 2. Ticket API
export const ticketApi = {
  list: async (filters = {}) => {
    const params = new URLSearchParams();
    Object.entries(filters).forEach(([k, v]) => {
      if (v !== undefined && v !== null && v !== '') {
        params.append(k, v);
      }
    });
    const qs = params.toString() ? `?${params.toString()}` : '';
    return request(`/tickets${qs}`);
  },

  getStats: async (orgKey) => {
    const qs = orgKey ? `?orgKey=${encodeURIComponent(orgKey)}` : '';
    return request(`/tickets/stats${qs}`);
  },

  getById: async (id) => {
    return request(`/tickets/${id}`);
  },

  create: async (ticketData) => {
    return request('/tickets', {
      method: 'POST',
      body: JSON.stringify(ticketData),
    });
  },

  updateStatus: async (id, status, note) => {
    return request(`/tickets/${id}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status, note }),
    });
  },

  addComment: async (id, text, isInternal = false) => {
    return request(`/tickets/${id}/comments`, {
      method: 'POST',
      body: JSON.stringify({ text, isInternal }),
    });
  },

  reassign: async (id, assignedToId, departmentId, reason) => {
    return request(`/tickets/${id}/reassign`, {
      method: 'POST',
      body: JSON.stringify({ assignedToId, departmentId, reason }),
    });
  },

  proposeResolution: async (id, notes) => {
    return request(`/tickets/${id}/propose-resolution`, {
      method: 'POST',
      body: JSON.stringify({ notes }),
    });
  },

  confirmResolution: async (id, feedbackNote) => {
    return request(`/tickets/${id}/confirm-resolution`, {
      method: 'POST',
      body: JSON.stringify({ feedbackNote }),
    });
  },

  rejectResolution: async (id, rejectionReason) => {
    return request(`/tickets/${id}/reject-resolution`, {
      method: 'POST',
      body: JSON.stringify({ rejectionReason }),
    });
  },
};

// 3. Department API
export const departmentApi = {
  list: async (orgKey) => {
    const qs = orgKey ? `?orgKey=${encodeURIComponent(orgKey)}` : '';
    return request(`/departments${qs}`);
  },

  listStaff: async () => {
    return request('/departments/staff');
  },
};
