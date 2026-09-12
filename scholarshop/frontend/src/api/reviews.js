import { api } from './client';

export const reviewsApi = {
  create: (body) => api.post('/reviews', body).then((r) => r.data),
  forUser: (userId) => api.get(`/reviews/user/${userId}`).then((r) => r.data),
  forProduct: (productId) => api.get(`/reviews/product/${productId}`).then((r) => r.data),
};
