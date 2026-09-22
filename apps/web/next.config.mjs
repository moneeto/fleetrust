import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Fija la raíz de esta app explícitamente: el filesystem tiene otros
  // lockfiles ajenos a Fleetrust y Next.js no tiene por qué adivinar.
  outputFileTracingRoot: __dirname,
};

export default nextConfig;
