import express, { type Express } from 'express';
import cookieParser from 'cookie-parser';
import cors from 'cors';
import type { Pool } from 'mysql2/promise';
import { checkDbConnection } from './db.js';
import { createRequireSession } from './auth/session.middleware.js';
import { createAuthRoutes } from './routes/auth.routes.js';
import { createMeRoutes } from './routes/me.routes.js';
import { createOperationsRoutes } from './routes/operations.routes.js';
import type { Mailer } from './mail/mailer.js';

const pkg = { name: '@fleetrust-backoffice/api', version: '0.1.0' };

export function createApp(pool: Pool, mailer: Mailer): Express {
  const app = express();
  app.use(
    cors({
      origin: process.env.WEB_ORIGIN ?? 'http://localhost:5000',
      credentials: true,
    }),
  );
  app.use(express.json());
  app.use(cookieParser());

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

  // Rutas públicas: login/logout/refresh, no requieren sesión previa.
  app.use(createAuthRoutes(pool, mailer));

  const requireSession = createRequireSession(pool);
  app.use((req, res, next) => {
    if (!req.path.startsWith('/api/') || req.path.startsWith('/api/auth/')) return next();
    return requireSession(req, res, next);
  });
  app.use(createMeRoutes(pool));
  app.use(createOperationsRoutes(pool, mailer));

  return app;
}
