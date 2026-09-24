import 'dotenv/config';

export const config = {
  nodeEnv: process.env.NODE_ENV ?? 'development',
  port: Number(process.env.PORT ?? 5001),
  auth: {
    // RF-206. En dev cae a un valor fijo para no bloquear el arranque; en
    // cualquier entorno real JWT_SECRET es obligatorio (ver .env.example).
    jwtSecret: process.env.JWT_SECRET ?? 'dev-insecure-secret-change-me',
    accessTokenTtlSeconds: 15 * 60,
    refreshTokenTtlDays: 30,
    // RF-201: bloqueo tras 5 intentos fallidos consecutivos, 15 minutos.
    maxFailedLoginAttempts: 5,
    lockoutMinutes: 15,
  },
  smtp: {
    host: process.env.SMTP_HOST ?? '',
    port: Number(process.env.SMTP_PORT ?? 465),
    secure: (process.env.SMTP_SECURE ?? 'true') !== 'false',
    user: process.env.SMTP_USER ?? '',
    password: process.env.SMTP_PASSWORD ?? '',
    from: process.env.SMTP_FROM ?? process.env.SMTP_USER ?? '',
  },
  publicUrl: process.env.BACKOFFICE_PUBLIC_URL ?? 'http://localhost:5000',
  db: {
    host: process.env.DB_HOST ?? 'localhost',
    port: Number(process.env.DB_PORT ?? 3306),
    user: process.env.DB_USER ?? 'root',
    password: process.env.DB_PASSWORD ?? '',
    database: process.env.DB_NAME ?? 'fleetrust',
  },
};
