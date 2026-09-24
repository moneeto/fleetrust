import { createApp } from './app.js';
import { config } from './config.js';
import { pool } from './db.js';
import { ensureF2Schema } from './db/ensure-f2.js';
import { ensureF3Catalog } from './db/ensure-f3.js';
import { createSmtpMailer } from './mail/mailer.js';

const mailer = createSmtpMailer();
const app = createApp(pool, mailer);

ensureF2Schema(pool)
  .then(() => ensureF3Catalog(pool))
  .then(() => {
    app.listen(config.port, () => {
      console.log(`[fleetrust-backoffice/api] escuchando en http://localhost:${config.port}`);
    });
  })
  .catch((err) => {
    console.error('[fleetrust-backoffice/api] no se pudo preparar la base', err);
    process.exit(1);
  });
