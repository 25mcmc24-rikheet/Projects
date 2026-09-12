import { api } from './client';

export const productsApi = {
  list: (params) => api.get('/products', { params }).then((r) => r.data),
  get:  (id) => api.get(`/products/${id}`).then((r) => r.data),
  create: (formData) =>
    api.post('/products', formData, { headers: { 'Content-Type': 'multipart/form-data' } }).then((r) => r.data),
  patch: (id, body) => api.patch(`/products/${id}`, body).then((r) => r.data),
  remove: (id) => api.delete(`/products/${id}`).then((r) => r.data),
  report: (id, reason) => api.post(`/products/${id}/report`, { reason }).then((r) => r.data),
};
