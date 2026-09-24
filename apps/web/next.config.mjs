import path from 'node:path';
import { fileURLToPath } from 'node:url';
import createNextIntlPlugin from 'next-intl/plugin';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const API_ORIGIN = process.env.API_ORIGIN ?? 'http://localhost:5001';

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Fija la raíz de esta app explícitamente: el filesystem tiene otros
  // lockfiles ajenos a Fleetrust y Next.js no tiene por qué adivinar.
  outputFileTracingRoot: __dirname,
  // El navegador solo conoce el origen de ESTE front. `/api/*` se sirve
  // desde el mismo host y puerto, y Next.js lo reenvía server-side a la
  // API real. Así la cookie httpOnly que pone la API queda en el mismo
  // origen que ve el navegador, sin depender de compartir dominio/puerto
  // entre front y API — el mismo mecanismo que usaría un reverse proxy
  // en producción si front y API terminan bajo el mismo hostname público.
  async rewrites() {
    return [{ source: '/api/:path*', destination: `${API_ORIGIN}/api/:path*` }];
  },
};

const withNextIntl = createNextIntlPlugin('./i18n/request.ts');

export default withNextIntl(nextConfig);
