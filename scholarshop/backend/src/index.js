'use strict';

const http = require('http');
const env = require('./config/env');
const app = require('./app');
const { initSocket } = require('./sockets');
const logger = require('./utils/logger');

const server = http.createServer(app);
const io = initSocket(server);
app.set('io', io);

server.listen(env.PORT, () => {
  logger.info(`ScholarShop API listening on http://localhost:${env.PORT}`);
  logger.info(`Allowed CORS origin: ${env.FRONTEND_URL}`);
});

function shutdown(signal) {
  logger.info(`Received ${signal}, shutting down...`);
  server.close(() => process.exit(0));
  setTimeout(() => process.exit(1), 10_000).unref();
}

process.on('SIGINT', () => shutdown('SIGINT'));
process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('unhandledRejection', (err) => logger.error('unhandledRejection', err));
process.on('uncaughtException', (err) => logger.error('uncaughtException', err));
