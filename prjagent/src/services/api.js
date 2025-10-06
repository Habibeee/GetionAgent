const BASE_URL = process.env.REACT_APP_API_BASE || 'https://gestion-agent-arjxkqthw-habibeees-projects.vercel.app/';

const jsonHeaders = () => ({ 'Content-Type': 'application/json' });

export const withAuth = (token) => ({
  Authorization: `Bearer ${token}`,
});

export async function apiPost(path, body, options = {}) {
  const res = await fetch(`${BASE_URL}${path}`, {
    method: 'POST',
    headers: { ...jsonHeaders(), ...(options.headers || {}) },
    body: JSON.stringify(body ?? {}),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(data?.error || 'Erreur API');
  }
  return data;
}

export async function apiGet(path, options = {}) {
  const res = await fetch(`${BASE_URL}${path}`, {
    method: 'GET',
    headers: { ...(options.headers || {}) },
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(data?.error || 'Erreur API');
  }
  return data;
}
