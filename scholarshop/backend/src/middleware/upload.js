'use strict';

const path = require('path');
const crypto = require('crypto');
const multer = require('multer');
const { uploadDir } = require('../config/storage');
const AppError = require('../utils/AppError');

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadDir),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase().replace(/[^.a-z0-9]/g, '') || '.jpg';
    const id = crypto.randomBytes(12).toString('hex');
    cb(null, `${Date.now()}-${id}${ext}`);
  },
});

function fileFilter(req, file, cb) {
  if (!/^image\/(jpe?g|png|webp|gif)$/i.test(file.mimetype)) {
    return cb(new AppError(400, 'INVALID_FILE_TYPE', 'Only JPEG, PNG, WEBP or GIF allowed.'));
  }
  cb(null, true);
}

const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 5 * 1024 * 1024, files: 5 },
});

module.exports = upload;
