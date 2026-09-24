import { NextResponse, type NextRequest } from 'next/server';

/**
 * Guardia rápida por presencia de cookie (no valida el token: eso lo hace
 * la API en cada request, ver `session.middleware.ts`). Evita el parpadeo
 * de mandar a alguien sin cookie a una pantalla protegida antes de que el
 * layout autenticado llegue a comprobarlo. `/login` es la única ruta
 * pública; todo lo demás requiere, al menos, tener la cookie.
 */
const ACCESS_COOKIE = 'fleetrust_access';
const LOGIN_PATH = '/login';
const LANDING_PATH = '/profile';
const PUBLIC_PATHS = ['/login', '/invitacion', '/restablecer', '/verificar', '/suplantacion'];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  if (pathname.startsWith('/api/')) return NextResponse.next();

  const requestHeaders = new Headers(request.headers);
  requestHeaders.set('x-pathname', pathname);
  const next = () => NextResponse.next({ request: { headers: requestHeaders } });

  const hasSessionCookie = request.cookies.has(ACCESS_COOKIE);
  if (PUBLIC_PATHS.some((path) => pathname === path || pathname.startsWith(`${path}/`))) {
    if (pathname === LOGIN_PATH && hasSessionCookie) {
      return NextResponse.redirect(new URL(LANDING_PATH, request.url));
    }
    return next();
  }

  if (!hasSessionCookie) {
    return NextResponse.redirect(new URL(LOGIN_PATH, request.url));
  }
  if (pathname === '/') {
    return NextResponse.redirect(new URL(LANDING_PATH, request.url));
  }
  return next();
}

export const config = {
  matcher: ['/((?!_next|favicon.ico).*)'],
};
