// Thin fetch wrapper for the real server/ backend (identity, discovery,
// booking — the modules built so far, see CLAUDE.md §9). Every call resolves
// to { ok:true, data } or { ok:false, error:{ code, message } } — the exact
// envelope server/src/utils/respond.js and middleware/errorHandler.js use, so
// callers never need to distinguish "network failure" from "server said no."

const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5050/api';
const TOKEN_KEY = 's360-access-token';

export function getAccessToken() {
  try {
    return localStorage.getItem(TOKEN_KEY);
  } catch {
    return null;
  }
}

export function setAccessToken(token) {
  try {
    if (token) localStorage.setItem(TOKEN_KEY, token);
    else localStorage.removeItem(TOKEN_KEY);
  } catch {
    /* storage unavailable */
  }
}

// Refresh calls share one in-flight promise so a burst of parallel 401s
// (several components fetching at once) triggers exactly one refresh, not one
// per caller.
let refreshPromise = null;

async function refreshAccessToken() {
  if (!refreshPromise) {
    refreshPromise = rawRequest('/identity/auth/refresh', { method: 'POST', auth: false, retry: false })
      .then((res) => {
        const token = res.ok ? res.data?.accessToken : null;
        setAccessToken(token || null);
        return Boolean(token);
      })
      .finally(() => {
        refreshPromise = null;
      });
  }
  return refreshPromise;
}

async function rawRequest(path, { method = 'GET', body, auth = true, retry = true } = {}) {
  const headers = { 'Content-Type': 'application/json' };
  if (auth) {
    const token = getAccessToken();
    if (token) headers.Authorization = `Bearer ${token}`;
  }

  let res;
  try {
    res = await fetch(`${BASE_URL}${path}`, {
      method,
      headers,
      credentials: 'include', // carries the httpOnly s360_rt refresh cookie
      body: body !== undefined ? JSON.stringify(body) : undefined,
    });
  } catch {
    return { ok: false, error: { code: 'NETWORK_ERROR', message: 'Could not reach the server. Check your connection.' } };
  }

  let json = null;
  try {
    json = await res.json();
  } catch {
    /* empty/non-JSON body */
  }

  if (res.status === 401 && retry && auth) {
    const refreshed = await refreshAccessToken();
    if (refreshed) return rawRequest(path, { method, body, auth, retry: false });
  }

  if (!json || json.ok === false) {
    return { ok: false, error: (json && json.error) || { code: 'UNKNOWN', message: 'Something went wrong.' } };
  }
  return { ok: true, data: json.data };
}

export const api = {
  get: (path, opts) => rawRequest(path, { method: 'GET', ...opts }),
  post: (path, body, opts) => rawRequest(path, { method: 'POST', body, ...opts }),
  patch: (path, body, opts) => rawRequest(path, { method: 'PATCH', body, ...opts }),
  del: (path, opts) => rawRequest(path, { method: 'DELETE', ...opts }),
};
