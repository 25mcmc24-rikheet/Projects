import { api } from './client';

export const wishlistApi = {
  list: () => api.get('/wishlist').then((r) => r.data),
  add: (productId) => api.post(`/wishlist/${productId}`).then((r) => r.data),
  remove: (productId) => api.delete(`/wishlist/${productId}`).then((r) => r.data),
};
