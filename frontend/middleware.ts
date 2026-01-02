import { NextRequest, NextResponse } from "next/server";

export function middleware(request: NextRequest) {
  const token = request.cookies.get("token")?.value;
  const pathname = request.nextUrl.pathname;

  // Rutas públicas
  const publicRoutes = ["/login"];

  // Si no está logueado y no es pública → login
  if (!token && !publicRoutes.includes(pathname)) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  // Si está logueado y va a login → dashboard
  if (token && pathname === "/login") {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    // 👇 ESTO ES LO IMPORTANTE
    "/((?!_next/static|_next/image|favicon.ico|api).*)",
  ],
};
