// Lightweight API client for the frontend
// - Reads base URL from env with fallback to http://localhost:5000
// - Stores JWT in localStorage under 'agent_token'
// - Attaches Authorization header automatically when auth: true

const BASE_URL = (
  (typeof process !== 'undefined' && process.env && (process.env.REACT_APP_API_URL || process.env.NEXT_PUBLIC_API_URL)))
  || 'https://gestion-agent-arjxkqthw-habibeees-projects.vercel.app/';

const TOKEN_KEY = 'agent_token';

export function getToken() {
  try {
    return localStorage.getItem(TOKEN_KEY);
  } catch (_) {
    return null;
  }
}

export function setToken(token) {
  try {
    if (token) localStorage.setItem(TOKEN_KEY, token);
    else localStorage.removeItem(TOKEN_KEY);
  } catch (_) {
    // ignore storage errors
  }
}

export async function apiFetch(path, { method = 'GET', body, auth = false, headers: extraHeaders } = {}) {
  const headers = { 'Content-Type': 'application/json', ...(extraHeaders || {}) };

  if (auth) {
    const token = getToken();
    if (token) headers.Authorization = `Bearer ${token}`;
  }

  const res = await fetch(`${BASE_URL}${path}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });

  // Try to parse JSON even on errors to surface backend message
  let data = null;
  try { data = await res.json(); } catch (_) { /* no body */ }

  if (!res.ok) {
    const msg = (data && (data.error || data.message)) || `HTTP ${res.status}`;
    throw new Error(msg);
  }

  return data;
}
