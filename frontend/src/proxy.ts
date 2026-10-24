// src/middleware.ts
import { NextRequest, NextResponse } from "next/server";

export function proxy(request: NextRequest) {
  const token = request.cookies.get("token")?.value;
  const { pathname } = request.nextUrl;

  const publicPaths = ["/login", "/register", "/verify-email", "/forgot-password", "/reset-password"];

  // 1. Si NO hay token y no estás en una ruta pública -> Al Login
  if (!token && !publicPaths.includes(pathname)) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  // 2. Si HAY token y estás en la raíz o en una ruta pública -> A Tours
  if (token && (pathname === "/" || publicPaths.includes(pathname))) {
    return NextResponse.redirect(new URL("/tours/calendar", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match todas las rutas excepto las estáticas y API
     */
    "/((?!api|_next/static|_next/image|favicon.ico|icon.svg|images).*)",
  ],
};