import { cookies } from 'next/headers';

/**
 * Fetch para usar desde Server Components (por ejemplo, el guard del
 * layout autenticado). A diferencia del fetch del navegador, uno del lado
 * del servidor no adjunta cookies solo — hay que reenviarlas a mano.
 * `API_ORIGIN` es server-only (no `NEXT_PUBLIC_*`): el navegador nunca lo
 * necesita, siempre habla con su propio origen (ver `lib/api-client.ts`).
 */
const API_ORIGIN = process.env.API_ORIGIN ?? 'http://localhost:5001';

export async function fetchFromApiServer(path: string, init?: RequestInit): Promise<Response> {
  const cookieHeader = (await cookies()).toString();
  return fetch(`${API_ORIGIN}${path}`, {
    ...init,
    cache: 'no-store',
    headers: {
      ...init?.headers,
      cookie: cookieHeader,
    },
  });
}
