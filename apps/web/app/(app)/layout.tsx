import { headers } from 'next/headers';
import { redirect } from 'next/navigation';
import type { MeResponse, NavigationItem } from '../../lib/api-client';
import { fetchFromApiServer } from '../../lib/server-api';
import { AppShell } from './AppShell';

/**
 * Guardia real de sesión (la de `middleware.ts` solo mira si hay cookie).
 * Acá se le pregunta a la API — la única que sabe si el token sigue
 * siendo válido, si el usuario sigue activo y si la cuenta sigue
 * pudiendo operar (RF-107/RF-309: sin caché, la verdad es la de ahora).
 */
export default async function AuthenticatedLayout({ children }: { children: React.ReactNode }) {
  const [meRes, navRes] = await Promise.all([
    fetchFromApiServer('/api/me'),
    fetchFromApiServer('/api/me/navigation'),
  ]);

  if (!meRes.ok) {
    redirect('/login');
  }

  const user = (await meRes.json()) as MeResponse;
  const pathname = (await headers()).get('x-pathname') ?? '';
  if (user.mustChangePassword && !user.modoSuplantacion && pathname !== '/cambiar-contrasena') {
    redirect('/cambiar-contrasena');
  }
  const navItems: NavigationItem[] = navRes.ok ? ((await navRes.json()).items as NavigationItem[]) : [];

  return <AppShell user={user} navItems={navItems}>{children}</AppShell>;
}
