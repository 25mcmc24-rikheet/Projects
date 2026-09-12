import { api } from './client';

export const chatApi = {
  listConversations: () => api.get('/conversations').then((r) => r.data),
  open: (productId) => api.post('/conversations', { productId }).then((r) => r.data),
  get: (id) => api.get(`/conversations/${id}`).then((r) => r.data),
  messages: (id, params) => api.get(`/conversations/${id}/messages`, { params }).then((r) => r.data),
  markRead: (id) => api.post(`/conversations/${id}/read`).then((r) => r.data),
};
