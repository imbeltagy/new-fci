import { type NextRequest, NextResponse } from "next/server";

const PUBLIC_AUTH_PATHS = ["/auth/login", "/auth/forgot-password", "/auth/confirm-reset"];
const RESET_PASSWORD_PATH = "/auth/reset-password";

function isPublicAuthPath(pathname: string) {
  return PUBLIC_AUTH_PATHS.some((p) => pathname.startsWith(p));
}

function hasRefreshToken(req: NextRequest): boolean {
  return !!req.cookies.get("refresh_token")?.value;
}

function mustChangePassword(req: NextRequest): boolean {
  return req.cookies.get("should_change_password")?.value === "true";
}

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const authenticated = hasRefreshToken(req);

  // Unauthenticated: only public auth paths are allowed
  if (!authenticated && !isPublicAuthPath(pathname)) {
    const url = req.nextUrl.clone();
    url.pathname = "/auth/login";
    return NextResponse.redirect(url);
  }

  // Authenticated on a public auth page: go home (or reset-password if forced)
  if (authenticated && isPublicAuthPath(pathname)) {
    const url = req.nextUrl.clone();
    url.pathname = mustChangePassword(req) ? RESET_PASSWORD_PATH : "/";
    return NextResponse.redirect(url);
  }

  // Authenticated and must change password: only reset-password page is allowed
  if (authenticated && mustChangePassword(req) && pathname !== RESET_PASSWORD_PATH) {
    const url = req.nextUrl.clone();
    url.pathname = RESET_PASSWORD_PATH;
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
