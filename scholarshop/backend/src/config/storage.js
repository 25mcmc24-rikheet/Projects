'use strict';

const path = require('path');
const fs = require('fs');
const env = require('./env');

const uploadDir = path.resolve(process.cwd(), env.UPLOAD_DIR);
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

function publicUrlFor(filename) {
  return `/uploads/${filename}`;
}

module.exports = { uploadDir, publicUrlFor };
