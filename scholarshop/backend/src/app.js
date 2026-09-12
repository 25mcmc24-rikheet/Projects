'use strict';

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const path = require('path');

const env = require('./config/env');
const { uploadDir } = require('./config/storage');
const { globalLimiter } = require('./middleware/rateLimit');
const errorHandler = require('./middleware/error');
const AppError = require('./utils/AppError');

const authRoutes = require('./modules/auth/auth.routes');
const productRoutes = require('./modules/products/product.routes');
const wishlistRoutes = require('./modules/wishlist/wishlist.routes');
const orderRoutes = require('./modules/orders/order.routes');
const reviewRoutes = require('./modules/reviews/review.routes');
const userRoutes = require('./modules/users/user.routes');
const chatRoutes = require('./modules/chat/chat.routes');
const notificationRoutes = require('./modules/notifications/notification.routes');

const app = express();

app.use(helmet({ crossOriginResourcePolicy: { policy: 'cross-origin' } }));
app.use(cors({ origin: env.FRONTEND_URL, credentials: true }));
app.use(express.json({ limit: '1mb' }));
app.use(morgan(env.NODE_ENV === 'production' ? 'combined' : 'dev'));
app.use(globalLimiter);

app.use('/uploads', express.static(uploadDir, { maxAge: '7d' }));

app.get('/health', (req, res) => res.json({ ok: true, ts: Date.now() }));

const api = express.Router();
api.use('/auth', authRoutes);
api.use('/products', productRoutes);
api.use('/wishlist', wishlistRoutes);
api.use('/orders', orderRoutes);
api.use('/reviews', reviewRoutes);
api.use('/users', userRoutes);
api.use('/conversations', chatRoutes);
api.use('/notifications', notificationRoutes);

app.use('/api/v1', api);

app.use((req, res, next) => {
  next(new AppError(404, 'NOT_FOUND', `Route not found: ${req.method} ${req.path}`));
});

app.use(errorHandler);

module.exports = app;
