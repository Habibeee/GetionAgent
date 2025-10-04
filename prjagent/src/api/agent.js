import { apiFetch } from './client';

// Example of protected call using the stored token automatically
export async function getAgentById(id) {
  const data = await apiFetch(`/agent/${id}`, { auth: true });
  return data?.data; // agent object
}

// Optionally you could also centralize login here if you wish elsewhere in the app
export async function loginAgent({ email, password }) {
  const data = await apiFetch('/agent/login', {
    method: 'POST',
    body: { email, password },
  });
  return data; // { message, token, agent }
}
