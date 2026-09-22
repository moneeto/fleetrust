import express, { type Express } from 'express';
import { checkDbConnection } from './db.js';

const pkg = { name: '@fleetrust-backoffice/api', version: '0.1.0' };

export function createApp(): Express {
  const app = express();
  app.use(express.json());

  app.get('/health', async (_req, res) => {
    const db = await checkDbConnection();
    res.status(db.ok ? 200 : 503).json({
      service: pkg.name,
      version: pkg.version,
      surface: 'BACKOFFICE',
      db: db.ok ? 'ok' : 'error',
      dbError: db.ok ? undefined : db.error,
    });
  });

  return app;
}
