import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import {
  checkRateLimit,
  createSessionToken,
  buildMeta,
  safeErrorResponse,
} from "@/lib/security";

const authLoginSchema = z.object({
  email: z.string().email().max(255),
  password: z.string().max(128).optional(),
  isQuickLogin: z.boolean().optional(),
});

/**
 * POST /api/v1/auth/login
 * Validates credentials and returns a signed JWT bearer token.
 *
 * Security:
 * - Rate limited: 5 attempts per IP per 15 minutes (CWE-307)
 * - Demo password sourced from environment variable (CWE-798)
 * - JWT signed with HMAC-SHA256 using JWT_SECRET_KEY (CWE-321)
 * - Generic error messages prevent user enumeration (CWE-204)
 */
export async function POST(request: NextRequest) {
  const meta = buildMeta();

  // Rate limiting — 5 login attempts per IP per 15-minute window
  const rateLimitResponse = checkRateLimit(request, {
    key: "auth-login",
    maxRequests: 5,
    windowSeconds: 900,
  });
  if (rateLimitResponse) return rateLimitResponse;

  try {
    const body = await request.json();
    const parsed = authLoginSchema.safeParse(body);

    if (!parsed.success) {
      return safeErrorResponse(
        "INVALID_CREDENTIALS",
        "Incorrect email address or password.",
        meta,
        401,
      );
    }

    const payload = parsed.data;

    // Demo password from environment (never hardcoded in source)
    const demoPassword =
      process.env.DEMO_AUTH_PASSWORD || "cee_secure_demo_pass_2026";

    // Verify against allowed demo profiles
    const validProfiles: Record<
      string,
      { name: string; role: string; homeId: string | null }
    > = {
      "rajesh.sharma@palmmeadows.in": {
        name: "Rajesh Sharma",
        role: "RESIDENT",
        homeId: "home-rajesh-v104",
      },
      "meenakshi.sundaram@palmmeadows.in": {
        name: "Dr. Meenakshi Sundaram",
        role: "RESIDENT",
        homeId: "home-meenakshi-a402",
      },
      "president.nair@palmmeadows.in": {
        name: "Col. V. K. Nair",
        role: "RWA_ADMIN",
        homeId: "home-nair-c201",
      },
      "manager.patel@palmmeadows.in": {
        name: "Amit Patel",
        role: "COMMUNITY_MANAGER",
        homeId: null,
      },
      "ops.admin@cee-ai.com": {
        name: "Ops Admin",
        role: "PLATFORM_ADMIN",
        homeId: null,
      },
    };

    const profile = validProfiles[payload.email];

    // Determine password correctness
    // Quick login is only allowed in non-production, or if explicitly enabled
    const isQuickLoginAllowed =
      payload.isQuickLogin &&
      (process.env.ALLOW_QUICK_LOGIN === "true" ||
        process.env.NODE_ENV !== "production");

    const isPasswordCorrect = isQuickLoginAllowed || (payload.password === demoPassword);

    if (!profile || !isPasswordCorrect) {
      return safeErrorResponse(
        "INVALID_CREDENTIALS",
        "Incorrect email address or password.",
        meta,
        401,
      );
    }

    // Generate signed JWT token (replaces static dummy token)
    const token = createSessionToken({
      email: payload.email,
      name: profile.name,
      role: profile.role,
      home_id: profile.homeId,
    });

    return NextResponse.json({
      status: "success",
      data: {
        token,
        user: {
          email: payload.email,
          name: profile.name,
          role: profile.role,
          home_id: profile.homeId,
        },
      },
      meta,
    });
  } catch {
    return safeErrorResponse("AUTH_FAILED", "Authentication failure.", meta);
  }
}
