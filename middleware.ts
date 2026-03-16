import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"

export function middleware(req: NextRequest) {
  // Auth.js v5 uses different cookie names than NextAuth v4
  const sessionToken =
    req.cookies.get("__Secure-authjs.session-token") ??
    req.cookies.get("authjs.session-token")

  const isLoggedIn = !!sessionToken
  const { pathname } = req.nextUrl

  if (pathname.startsWith("/dashboard") && !isLoggedIn) {
    return NextResponse.redirect(new URL("/login", req.url))
  }

  if (pathname === "/login" && isLoggedIn) {
    return NextResponse.redirect(new URL("/dashboard", req.url))
  }
}

export const config = {
  runtime: "nodejs",
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
}
