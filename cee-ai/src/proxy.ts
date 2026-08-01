/**
 * Next.js Middleware — Auth Proxy (Next.js 16 "proxy file" convention)
 * src/proxy.ts is recognized by Next.js 16 as the middleware/proxy entry point.
 *
 * Responsibilities:
 * - Refreshes Supabase session cookies on every request (SSR auth).
 * - Redirects unauthenticated users from /dashboard/* to /login.
 * - Redirects authenticated users away from /login to /dashboard.
 */
import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { verifySessionToken } from "./lib/security";

export async function proxy(request: NextRequest) {
  // Generate a unique Request ID for distributed tracing (CWE-117/OWASP A09)
  const requestId = "req-" + crypto.randomUUID().split("-")[0];

  let supabaseResponse = NextResponse.next({
    request: {
      headers: new Headers(request.headers),
    },
  });

  // Inject Request ID into request & response headers
  supabaseResponse.headers.set("X-Request-Id", requestId);
  request.headers.set("X-Request-Id", requestId);

  const hasEnv =
    process.env.NEXT_PUBLIC_SUPABASE_URL &&
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY &&
    !process.env.NEXT_PUBLIC_SUPABASE_URL.includes("your-proj");

  let user = null;

  if (hasEnv) {
    try {
      const supabase = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
          cookies: {
            getAll() {
              return request.cookies.getAll();
            },
            setAll(cookiesToSet) {
              cookiesToSet.forEach(({ name, value, options: _options }) =>
                request.cookies.set(name, value),
              );
              supabaseResponse = NextResponse.next({
                request: {
                  headers: new Headers(request.headers),
                },
              });
              cookiesToSet.forEach(({ name, value, options }) =>
                supabaseResponse.cookies.set(name, value, options),
              );
            },
          },
        },
      );

      // Refresh session if expired
      const {
        data: { user: supabaseUser },
      } = await supabase.auth.getUser();
      user = supabaseUser;
    } catch {
      // Supabase loading bypassed gracefully
    }
  }

  // Check for quick demo session cookie & cryptographically verify it
  const demoSession = request.cookies.get("cee_demo_session")?.value;
  let hasDemoSession = false;

  if (demoSession) {
    const verified = verifySessionToken(demoSession);
    if (verified) {
      hasDemoSession = true;
    } else if (process.env.NODE_ENV !== "production") {
      // In development, allow raw persona strings for easy manual testing
      const legacyRoles = ["provider", "consumer", "admin", "manager", "platform_admin"];
      if (legacyRoles.includes(demoSession)) {
        hasDemoSession = true;
      }
    }
  }

  const hasSession = !!user || hasDemoSession;

  // Route protection rules:
  // If user is not logged in and is trying to access dashboard, redirect to login
  const isDashboardRoute = request.nextUrl.pathname.startsWith("/dashboard");

  if (!hasSession && isDashboardRoute) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    return NextResponse.redirect(url);
  }

  // If user is logged in and trying to access login page, redirect to dashboard
  const isLoginRoute = request.nextUrl.pathname === "/login";
  if (hasSession && isLoginRoute) {
    const url = request.nextUrl.clone();
    url.pathname = "/dashboard";
    return NextResponse.redirect(url);
  }

  return supabaseResponse;
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * Feel free to modify this pattern to include more paths.
     */
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
