'use strict';

const bcrypt = require('bcrypt');

const COST = 12;

async function hashPassword(plain) {
  return bcrypt.hash(plain, COST);
}

async function comparePassword(plain, hash) {
  return bcrypt.compare(plain, hash);
}

function generateOtp(length = 6) {
  let s = '';
  for (let i = 0; i < length; i += 1) s += Math.floor(Math.random() * 10).toString();
  return s;
}

module.exports = { hashPassword, comparePassword, generateOtp };
