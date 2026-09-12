import axios from 'axios';

const baseURL = import.meta.env.VITE_API_URL || 'http://localhost:4000/api/v1';

export const api = axios.create({ baseURL });

let onUnauthorized = null;
export function setUnauthorizedHandler(fn) { onUnauthorized = fn; }

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('access_token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err?.response?.status === 401 && onUnauthorized) onUnauthorized();
    return Promise.reject(err);
  }
);

export function apiError(err) {
  return err?.response?.data?.error?.message || err?.message || 'Something went wrong.';
}
