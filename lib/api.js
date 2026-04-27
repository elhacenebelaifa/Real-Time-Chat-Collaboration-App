const API_BASE = '/api';

function unwrap(body) {
  if (body && typeof body === 'object' && Object.prototype.hasOwnProperty.call(body, 'success') && Object.prototype.hasOwnProperty.call(body, 'data')) {
    return body.data;
  }
  return body;
}

function toError(body, fallback) {
  const message = (body && body.message) || (body && body.error && body.error.message) || fallback;
  const error = new Error(message);
  if (body && body.statusCode) error.status = body.statusCode;
  if (body && body.code) error.code = body.code;
  if (body && body.details) error.details = body.details;
  return error;
}

async function request(path, options = {}) {
  const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;

  const headers = {
    'Content-Type': 'application/json',
    ...(token && { Authorization: `Bearer ${token}` }),
    ...options.headers,
  };

  const res = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers,
  });

  const body = res.status === 204 ? null : await res.json();

  if (!res.ok) {
    const error = toError(body, 'Request failed');
    if (!error.status) error.status = res.status;
    throw error;
  }

  return unwrap(body);
}

export const api = {
  get: (path) => request(path),
  post: (path, body) => request(path, { method: 'POST', body: JSON.stringify(body) }),
  put: (path, body) => request(path, { method: 'PUT', body: JSON.stringify(body) }),
  delete: (path) => request(path, { method: 'DELETE' }),

  // File upload (no JSON content-type)
  upload: async (path, formData) => {
    const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
    const res = await fetch(`${API_BASE}${path}`, {
      method: 'POST',
      headers: token ? { Authorization: `Bearer ${token}` } : {},
      body: formData,
    });
    const body = await res.json();
    if (!res.ok) {
      const error = toError(body, 'Upload failed');
      if (!error.status) error.status = res.status;
      throw error;
    }
    return unwrap(body);
  },
};
