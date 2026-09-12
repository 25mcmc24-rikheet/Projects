import { api } from './client';

export const ordersApi = {
  create: (body) => api.post('/orders', body).then((r) => r.data),
  listMine: (role = 'buyer') => api.get('/orders/me', { params: { role } }).then((r) => r.data),
  setStatus: (id, status) => api.patch(`/orders/${id}/status`, { status }).then((r) => r.data),
};
