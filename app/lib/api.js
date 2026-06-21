/**
 * VAANI API Client — Handles all backend communication
 */

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5001/api';

let accessToken = null;

// Initialize from localStorage (client-side only)
export function initAuth() {
  if (typeof window !== 'undefined') {
    accessToken = localStorage.getItem('vaani_token');
  }
}

export function setToken(token) {
  accessToken = token;
  if (typeof window !== 'undefined') {
    localStorage.setItem('vaani_token', token);
  }
}

export function clearToken() {
  accessToken = null;
  if (typeof window !== 'undefined') {
    localStorage.removeItem('vaani_token');
    localStorage.removeItem('vaani_refresh');
    localStorage.removeItem('vaani_user');
  }
}

export function getStoredUser() {
  if (typeof window !== 'undefined') {
    const data = localStorage.getItem('vaani_user');
    return data ? JSON.parse(data) : null;
  }
  return null;
}

export function setStoredUser(user) {
  if (typeof window !== 'undefined') {
    localStorage.setItem('vaani_user', JSON.stringify(user));
  }
}

async function request(path, options = {}) {
  if (!accessToken && typeof window !== 'undefined') {
    accessToken = localStorage.getItem('vaani_token');
  }
  const url = `${API_URL}${path}`;
  const headers = {
    'Content-Type': 'application/json',
    ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
    ...options.headers,
  };

  try {
    const res = await fetch(url, { ...options, headers });

    // Handle token refresh
    if (res.status === 401) {
      const data = await res.json();
      if (data.code === 'TOKEN_EXPIRED') {
        const refreshed = await refreshAccessToken();
        if (refreshed) {
          headers.Authorization = `Bearer ${accessToken}`;
          return fetch(url, { ...options, headers }).then(r => r.json());
        }
      }
      clearToken();
      if (typeof window !== 'undefined') window.location.href = '/';
      return data;
    }

    return res.json();
  } catch (err) {
    console.error('API request failed:', err);
    return { error: 'Network error — please check your connection' };
  }
}

async function refreshAccessToken() {
  try {
    const refreshToken = typeof window !== 'undefined' ? localStorage.getItem('vaani_refresh') : null;
    if (!refreshToken) return false;

    const res = await fetch(`${API_URL}/auth/refresh`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refreshToken }),
    });

    if (res.ok) {
      const data = await res.json();
      setToken(data.accessToken);
      if (typeof window !== 'undefined') {
        localStorage.setItem('vaani_refresh', data.refreshToken);
      }
      return true;
    }
    return false;
  } catch {
    return false;
  }
}

// === AUTH ===
export const auth = {
  sendOtp: (mobile) => request('/auth/send-otp', { method: 'POST', body: JSON.stringify({ mobile }) }),
  verifyOtp: (mobile, otp) => request('/auth/verify-otp', { method: 'POST', body: JSON.stringify({ mobile, otp }) }),
  logout: () => request('/auth/logout', { method: 'POST' }),
  me: () => request('/auth/me'),
};

// === COMPLAINTS ===
export const complaints = {
  file: (data) => request('/complaints', { method: 'POST', body: JSON.stringify(data) }),
  list: (params = {}) => {
    const qs = new URLSearchParams(params).toString();
    return request(`/complaints?${qs}`);
  },
  get: (id) => request(`/complaints/${id}`),
  updateStatus: (id, status, note) => request(`/complaints/${id}/status`, { method: 'PATCH', body: JSON.stringify({ status, note }) }),
  addTimeline: (id, data) => request(`/complaints/${id}/timeline`, { method: 'POST', body: JSON.stringify(data) }),
  resolve: (id, data) => request(`/complaints/${id}/resolve`, { method: 'POST', body: JSON.stringify(data) }),
  citizenVerify: (id, response) => request(`/complaints/${id}/citizen-verify`, { method: 'POST', body: JSON.stringify({ response }) }),
  deptVerify: (id, note) => request(`/complaints/${id}/dept-verify`, { method: 'POST', body: JSON.stringify({ note }) }),
  dmVerify: (id, note) => request(`/complaints/${id}/dm-verify`, { method: 'POST', body: JSON.stringify({ note }) }),
  citizenRate: (id, rating, feedback) => request(`/complaints/${id}/citizen-rate`, { method: 'POST', body: JSON.stringify({ rating, feedback }) }),
  escalate: (id, reason) => request(`/complaints/${id}/escalate`, { method: 'POST', body: JSON.stringify({ reason }) }),
  cmFlag: (id) => request(`/complaints/${id}/cm-flag`, { method: 'POST' }),
  cmDirective: (id, directive) => request(`/complaints/${id}/cm-directive`, { method: 'POST', body: JSON.stringify({ directive }) }),
  extendSla: (id, hours, reason) => request(`/complaints/${id}/extend-sla`, { method: 'POST', body: JSON.stringify({ hours, reason }) }),
  assign: (id, officerId) => request(`/complaints/${id}/assign`, { method: 'POST', body: JSON.stringify({ officerId }) }),
  myComplaints: () => request('/complaints/my'),
  officerQueue: () => request('/complaints/officer/queue'),
  duplicateCheck: (lat, lng, category) => request(`/complaints/duplicate-check?lat=${lat}&lng=${lng}&category=${category}`),
};

// === ANALYTICS ===
export const analytics = {
  dashboard: () => request('/dashboard'),
  detailed: () => request('/analytics/detailed'),
  heatmap: () => request('/heatmap'),
  leaderboard: () => request('/leaderboard/districts'),
  officerLeaderboard: () => request('/leaderboard/officers'),
  defcon: () => request('/defcon'),
  trends: (days = 7) => request(`/trends?days=${days}`),
};

// === RESOURCES ===
export const resources = {
  officers: (params = {}) => {
    const qs = new URLSearchParams(params).toString();
    return request(`/officers?${qs}`);
  },
  createOfficer: (data) => request('/officers', { method: 'POST', body: JSON.stringify(data) }),
  officerScorecard: (id) => request(`/officers/${id}/scorecard`),
  departments: () => request('/departments'),
  department: (id) => request(`/departments/${id}`),
  districts: () => request('/districts'),
  notifications: () => request('/notifications'),
  readNotification: (id) => request(`/notifications/${id}/read`, { method: 'PATCH' }),
  readAllNotifications: () => request('/notifications/read-all', { method: 'POST' }),
  visits: () => request('/visits'),
  createVisit: (data) => request('/visits', { method: 'POST', body: JSON.stringify(data) }),
  syncStatus: () => request('/external/sync-status'),
};
