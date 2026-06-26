/* =====================================================
   EDUQUEST — core/api.js
   Cliente HTTP para la API backend (JWT)
   ===================================================== */

const EQ_API = (() => {

  const baseUrl = () => EQ_CONFIG?.API_URL || 'http://localhost:3000';

  const request = async (path, options = {}) => {
    const headers = { 'Content-Type': 'application/json', ...options.headers };

    const token = EQ_Storage.getToken();
    if (token) headers.Authorization = `Bearer ${token}`;

    const res = await fetch(`${baseUrl()}${path}`, { ...options, headers });
    const data = await res.json().catch(() => ({}));

    if (!res.ok) {
      const err = new Error(data.error || `Error HTTP ${res.status}`);
      err.status = res.status;
      err.data = data;
      throw err;
    }
    return data;
  };

  const login = (email, matricula_code) =>
    request('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, matricula_code }),
    });

  const getMe = () => request('/api/auth/me');

  const health = () => request('/api/health');

  return { login, getMe, health, request };
})();

window.EQ_API = EQ_API;
