'use strict';

const express = require('express');
const validate = require('../../middleware/validate');
const { authLimiter } = require('../../middleware/rateLimit');
const { verifyJWT } = require('../../middleware/auth');
const ctrl = require('./auth.controller');
const schemas = require('./auth.schemas');

const router = express.Router();

router.post('/register',     authLimiter, validate({ body: schemas.registerSchema }),    ctrl.register);
router.post('/verify-email', authLimiter, validate({ body: schemas.verifyEmailSchema }), ctrl.verifyEmail);
router.post('/login',        authLimiter, validate({ body: schemas.loginSchema }),       ctrl.login);
router.post('/refresh',      authLimiter, validate({ body: schemas.refreshSchema }),     ctrl.refresh);
router.post('/logout',       ctrl.logout);
router.get('/me',            verifyJWT, ctrl.me);

module.exports = router;
