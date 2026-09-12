'use strict';

require('dotenv').config();
const fs = require('fs');
const path = require('path');
const mysql = require('mysql2/promise');

async function applyFile(connection, filePath) {
  let sql = fs.readFileSync(filePath, 'utf8');
  // Strip full-line `--` comments before splitting. Otherwise the first chunk can start with
  // `-- ...` and get dropped by `startsWith('--')`, skipping e.g. INSERT INTO users in seed.sql.
  sql = sql.replace(/^\s*--[^\r\n]*(\r?\n|$)/gm, '');
  const statements = sql
    .split(/;\s*\r?\n/)
    .map((s) => s.trim())
    .filter((s) => s.length > 0 && !s.startsWith('--'));

  for (const stmt of statements) {
    await connection.query(stmt);
  }
}

async function main() {
  const file = process.argv[2] || path.join(__dirname, 'schema.sql');
  const target = path.resolve(file);

  if (!fs.existsSync(target)) {
    console.error(`SQL file not found: ${target}`);
    process.exit(1);
  }

  const conn = await mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    port: Number(process.env.DB_PORT || 3306),
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'scholarshop',
    multipleStatements: false,
  });

  try {
    console.log(`Applying ${path.basename(target)} to ${process.env.DB_NAME}...`);
    await applyFile(conn, target);
    console.log('Done.');
  } finally {
    await conn.end();
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
