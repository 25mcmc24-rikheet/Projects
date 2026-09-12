import { api } from './client';

export const notificationsApi = {
  list: (params) => api.get('/notifications', { params }).then((r) => r.data),
  markRead: (id) => api.patch(`/notifications/${id}/read`).then((r) => r.data),
  markAllRead: () => api.patch('/notifications/read-all').then((r) => r.data),
};
