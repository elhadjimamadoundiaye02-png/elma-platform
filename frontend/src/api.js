import { API_URL } from './config';

// Le token d'accès est gardé en mémoire + persisté dans localStorage pour
// survivre à un rafraîchissement de page (ceci est le vrai site déployé,
// pas un artifact Claude — localStorage est donc disponible sans restriction).
let accessToken = localStorage.getItem('elma_access_token') || null;
let refreshToken = localStorage.getItem('elma_refresh_token') || null;

export function setTokens(tokens) {
  accessToken = tokens?.accessToken || null;
  refreshToken = tokens?.refreshToken || null;
  if (accessToken) localStorage.setItem('elma_access_token', accessToken);
  else localStorage.removeItem('elma_access_token');
  if (refreshToken) localStorage.setItem('elma_refresh_token', refreshToken);
  else localStorage.removeItem('elma_refresh_token');
}

export function getAccessToken() {
  return accessToken;
}

export function clearTokens() {
  setTokens(null);
}

// Décode le payload du JWT (sans vérifier la signature — c'est juste pour
// lire userId/role côté client, le backend revalide tout de toute façon).
export function decodeToken(token) {
  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    return payload;
  } catch {
    return null;
  }
}

async function request(path, options = {}, retry = true) {
  const headers = { 'Content-Type': 'application/json', ...(options.headers || {}) };
  if (accessToken) headers['Authorization'] = `Bearer ${accessToken}`;

  const res = await fetch(`${API_URL}${path}`, { ...options, headers });

  // Access token expiré : on tente une seule fois de le renouveler via le refresh token
  if (res.status === 401 && retry && refreshToken) {
    const refreshed = await tryRefresh();
    if (refreshed) return request(path, options, false);
  }

  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.message || `Erreur API (${res.status})`);
  }
  if (res.status === 204) return null;
  return res.json();
}

async function tryRefresh() {
  try {
    const res = await fetch(`${API_URL}/auth/refresh`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${accessToken}` },
      body: JSON.stringify({ refreshToken }),
    });
    if (!res.ok) throw new Error();
    const tokens = await res.json();
    setTokens(tokens);
    return true;
  } catch {
    clearTokens();
    return false;
  }
}

export const api = {
  // --- Auth ---
  register: (data) => request('/auth/register', { method: 'POST', body: JSON.stringify(data) }),
  login: (data) => request('/auth/login', { method: 'POST', body: JSON.stringify(data) }),
  logout: () => request('/auth/logout', { method: 'POST' }),

  // --- Catalogue ---
  getServices: () => request('/services'),
  estimate: (serviceId) => request('/services/estimation', { method: 'POST', body: JSON.stringify({ serviceId }) }),

  // --- Tickets ---
  createTicket: (data) => request('/tickets', { method: 'POST', body: JSON.stringify(data) }),
  getTickets: () => request('/tickets'),
  getTicket: (id) => request(`/tickets/${id}`),
  updateTicketStatus: (id, statut) => request(`/tickets/${id}/statut`, { method: 'PATCH', body: JSON.stringify({ statut }) }),
  assignTechnician: (id, technicienId) => request(`/tickets/${id}/assigner`, { method: 'PATCH', body: JSON.stringify({ technicienId }) }),

  // --- Messages ---
  getMessages: (ticketId) => request(`/tickets/${ticketId}/messages`),
  postMessage: (ticketId, contenu) => request(`/tickets/${ticketId}/messages`, { method: 'POST', body: JSON.stringify({ contenu }) }),

  // --- Admin ---
  getSessions: () => request('/admin/sessions'),
  invalidateSession: (socketId) => request(`/admin/sessions/${socketId}`, { method: 'DELETE' }),
  getStatsOverview: () => request('/admin/stats/overview'),
  getStatsRepartition: () => request('/admin/stats/repartition'),
  getUsers: () => request('/admin/users'),
  updateUserRole: (id, role) => request(`/admin/users/${id}/role`, { method: 'PATCH', body: JSON.stringify({ role }) }),
};
