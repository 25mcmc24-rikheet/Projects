'use strict';

const express = require('express');
const validate = require('../../middleware/validate');
const { verifyJWT, requireVerified } = require('../../middleware/auth');
const upload = require('../../middleware/upload');
const ctrl = require('./product.controller');
const schemas = require('./product.schemas');

const router = express.Router();

router.use(verifyJWT, requireVerified);

router.get('/', validate({ query: schemas.listQuery }), ctrl.list);
router.get('/:id', ctrl.getOne);

router.post(
  '/',
  upload.array('images', 5),
  validate({ body: schemas.createSchema }),
  ctrl.create
);

router.patch('/:id', validate({ body: schemas.patchSchema }), ctrl.update);
router.delete('/:id', ctrl.remove);

router.post('/:id/report', validate({ body: schemas.reportSchema }), ctrl.report);

module.exports = router;
