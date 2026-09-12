'use strict';

const path = require('path');
const { spawnSync } = require('child_process');

const setup = path.join(__dirname, 'setup.js');
const seed = path.join(__dirname, 'seed.sql');

const result = spawnSync(process.execPath, [setup, seed], { stdio: 'inherit' });
process.exit(result.status || 0);
