// src/middleware.ts
import { NextRequest, NextResponse } from "next/server";

export function middleware(request: NextRequest) {
  const token = request.cookies.get("token")?.value;
  const { pathname } = request.nextUrl;

  // 1. Si NO hay token y no estás en login -> Al Login
  if (!token && pathname !== "/login") {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  // 2. Si HAY token y estás en la raíz o en login -> A Tours
  if (token && (pathname === "/" || pathname === "/login")) {
    return NextResponse.redirect(new URL("/tours/bookings", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match todas las rutas excepto las estáticas y API
     */
    "/((?!api|_next/static|_next/image|favicon.ico|images).*)",
  ],
};