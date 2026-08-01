/**
 * CEE-AI Security Utilities
 * =========================
 * Centralized security helpers for authentication, authorization,
 * rate limiting, and safe error handling across all API routes.
 *
 * Follows: OWASP ASVS, OWASP API Security Top 10, CWE Best Practices
 */

import { NextRequest, NextResponse } from "next/server";
import { createHmac, randomBytes } from "crypto";

// ---------------------------------------------------------------------------
// 1. Rate Limiter — Sliding Window Counter (in-memory, no external deps)
// ---------------------------------------------------------------------------

interface RateLimitEntry {
  count: number;
  resetAt: number;
}

const rateLimitStore = new Map<string, RateLimitEntry>();

// Periodic cleanup to prevent memory leaks (every 5 minutes)
const CLEANUP_INTERVAL_MS = 5 * 60 * 1000;
let lastCleanup = Date.now();

function cleanupExpiredEntries() {
  const now = Date.now();
  if (now - lastCleanup < CLEANUP_INTERVAL_MS) return;
  lastCleanup = now;
  for (const [key, entry] of rateLimitStore.entries()) {
    if (now > entry.resetAt) {
      rateLimitStore.delete(key);
    }
  }
}

/**
 * Check if a request exceeds the rate limit.
 * Returns null if allowed, or a NextResponse 429 if blocked.
 */
export function checkRateLimit(
  request: NextRequest,
  options: {
    /** Unique identifier prefix for this limiter (e.g., "login", "api") */
    key: string;
    /** Maximum requests allowed within the window */
    maxRequests: number;
    /** Window duration in seconds */
    windowSeconds: number;
  },
): NextResponse | null {
  cleanupExpiredEntries();

  const ip =
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    request.headers.get("x-real-ip") ||
    "unknown";
  const limiterKey = `${options.key}:${ip}`;
  const now = Date.now();

  const entry = rateLimitStore.get(limiterKey);

  if (!entry || now > entry.resetAt) {
    rateLimitStore.set(limiterKey, {
      count: 1,
      resetAt: now + options.windowSeconds * 1000,
    });
    return null;
  }

  entry.count++;

  if (entry.count > options.maxRequests) {
    const retryAfter = Math.ceil((entry.resetAt - now) / 1000);
    return NextResponse.json(
      {
        status: "error",
        error: {
          code: "RATE_LIMIT_EXCEEDED",
          message: "Too many requests. Please try again later.",
        },
      },
      {
        status: 429,
        headers: {
          "Retry-After": String(retryAfter),
          "X-RateLimit-Limit": String(options.maxRequests),
          "X-RateLimit-Remaining": "0",
          "X-RateLimit-Reset": String(Math.ceil(entry.resetAt / 1000)),
        },
      },
    );
  }

  return null;
}

// ---------------------------------------------------------------------------
// 2. Authentication Helpers
// ---------------------------------------------------------------------------

/** Supported user roles, ordered by privilege level */
export type UserRole =
  | "RESIDENT"
  | "RWA_ADMIN"
  | "COMMUNITY_MANAGER"
  | "PLATFORM_ADMIN";

export interface AuthenticatedUser {
  email: string;
  name: string;
  role: UserRole;
  persona: string;
}

/**
 * Extracts authenticated user context from a request.
 * Checks the `cee_demo_session` cookie (set during login) and
 * the `Authorization: Bearer <token>` header for hardware JWTs.
 *
 * Returns the user object if authenticated, or null otherwise.
 */
export function getAuthenticatedUser(
  request: NextRequest,
): AuthenticatedUser | null {
  // Check for demo session cookie (set by the login page)
  const sessionCookie = request.cookies.get("cee_demo_session")?.value;
  if (!sessionCookie) return null;

  // Try to verify as signed JWT first
  const jwtPayload = verifySessionToken(sessionCookie);
  if (jwtPayload) {
    let persona = "provider";
    if (jwtPayload.role === "RWA_ADMIN") persona = "admin";
    else if (jwtPayload.role === "COMMUNITY_MANAGER") persona = "manager";
    else if (jwtPayload.role === "PLATFORM_ADMIN") persona = "platform_admin";
    else if (jwtPayload.email === "meenakshi.sundaram@palmmeadows.in") persona = "consumer";

    return {
      email: jwtPayload.email,
      name: jwtPayload.name,
      role: jwtPayload.role,
      persona,
    };
  }

  // Fallback for legacy local development mode (strictly disabled in production)
  if (process.env.NODE_ENV !== "production") {
    const roleMap: Record<string, AuthenticatedUser> = {
      provider: {
        email: "rajesh.sharma@palmmeadows.in",
        name: "Rajesh Sharma",
        role: "RESIDENT",
        persona: "provider",
      },
      consumer: {
        email: "meenakshi.sundaram@palmmeadows.in",
        name: "Dr. Meenakshi Sundaram",
        role: "RESIDENT",
        persona: "consumer",
      },
      admin: {
        email: "president.nair@palmmeadows.in",
        name: "Col. V. K. Nair",
        role: "RWA_ADMIN",
        persona: "admin",
      },
      manager: {
        email: "manager.patel@palmmeadows.in",
        name: "Amit Patel",
        role: "COMMUNITY_MANAGER",
        persona: "manager",
      },
      platform_admin: {
        email: "ops.admin@cee-ai.com",
        name: "Ops Admin",
        role: "PLATFORM_ADMIN",
        persona: "platform_admin",
      },
    };
    return roleMap[sessionCookie] || null;
  }

  return null;
}

/**
 * Check if a request has a valid hardware Bearer token.
 * In production, this would verify a signed JWT against HARDWARE_EDGE_JWT_SECRET.
 * Currently validates the token format as a stub.
 */
export function isHardwareAuthenticated(request: NextRequest): boolean {
  const authHeader = request.headers.get("Authorization");
  return !!authHeader?.startsWith("Bearer ");
}

/**
 * Require authentication — returns a 401 response if the user is not authenticated.
 * Returns null if the user IS authenticated (allows the request to proceed).
 */
export function requireAuth(
  request: NextRequest,
  meta: { timestamp: string; request_id: string },
): NextResponse | null {
  const user = getAuthenticatedUser(request);
  const isHardware = isHardwareAuthenticated(request);

  if (!user && !isHardware) {
    return NextResponse.json(
      {
        status: "error",
        error: {
          code: "AUTHENTICATION_REQUIRED",
          message: "Valid authentication credentials are required.",
        },
        meta,
      },
      { status: 401 },
    );
  }

  return null;
}

// ---------------------------------------------------------------------------
// 3. Authorization / RBAC
// ---------------------------------------------------------------------------

/**
 * Require specific roles — returns a 403 response if the user doesn't have
 * one of the required roles. Hardware tokens bypass RBAC checks.
 */
export function requireRole(
  request: NextRequest,
  allowedRoles: UserRole[],
  meta: { timestamp: string; request_id: string },
): NextResponse | null {
  // Hardware tokens bypass RBAC (they're pre-authorized devices)
  if (isHardwareAuthenticated(request)) {
    return null;
  }

  const user = getAuthenticatedUser(request);
  if (!user) {
    return NextResponse.json(
      {
        status: "error",
        error: {
          code: "AUTHENTICATION_REQUIRED",
          message: "Valid authentication credentials are required.",
        },
        meta,
      },
      { status: 401 },
    );
  }

  if (!allowedRoles.includes(user.role)) {
    return NextResponse.json(
      {
        status: "error",
        error: {
          code: "INSUFFICIENT_PERMISSIONS",
          message: "You do not have permission to perform this action.",
        },
        meta,
      },
      { status: 403 },
    );
  }

  return null;
}

// ---------------------------------------------------------------------------
// 4. JWT Token Signing (HMAC-SHA256)
// ---------------------------------------------------------------------------

/**
 * Create a signed session token using HMAC-SHA256.
 * This replaces the static dummy token from the login route.
 */
export function createSessionToken(payload: {
  email: string;
  name: string;
  role: string;
  home_id: string | null;
}): string {
  const secret =
    process.env.JWT_SECRET_KEY || "fallback_dev_secret_not_for_production";
  const header = Buffer.from(
    JSON.stringify({ alg: "HS256", typ: "JWT" }),
  ).toString("base64url");
  const body = Buffer.from(
    JSON.stringify({
      ...payload,
      iat: Math.floor(Date.now() / 1000),
      exp: Math.floor(Date.now() / 1000) + 86400, // 24-hour expiry
      jti: randomBytes(16).toString("hex"),
    }),
  ).toString("base64url");
  const signature = createHmac("sha256", secret)
    .update(`${header}.${body}`)
    .digest("base64url");

  return `${header}.${body}.${signature}`;
}

/**
 * Verify a signed session token.
 * Returns the payload if valid, or null if invalid/expired.
 */
export function verifySessionToken(token: string): {
  email: string;
  name: string;
  role: UserRole;
  home_id: string | null;
  exp?: number;
} | null {
  try {
    const parts = token.split(".");
    if (parts.length !== 3) return null;
    const [header, body, signature] = parts;
    const secret =
      process.env.JWT_SECRET_KEY || "fallback_dev_secret_not_for_production";
    
    // Verify signature
    const expectedSignature = createHmac("sha256", secret)
      .update(`${header}.${body}`)
      .digest("base64url");

    if (signature !== expectedSignature) {
      return null;
    }

    const payload = JSON.parse(
      Buffer.from(body, "base64url").toString("utf8"),
    );

    // Verify expiration
    if (payload.exp && Date.now() / 1000 > payload.exp) {
      return null;
    }

    return payload;
  } catch {
    return null;
  }
}

// ---------------------------------------------------------------------------
// 5. Request Metadata Helpers
// ---------------------------------------------------------------------------

/**
 * Generate a unique request ID for tracing and audit logging.
 * Uses crypto.randomBytes for better entropy than Math.random().
 */
export function generateRequestId(): string {
  return `req-${randomBytes(6).toString("hex")}`;
}

/**
 * Build standard API response metadata.
 */
export function buildMeta() {
  const timestamp = new Date().toISOString();
  const request_id = generateRequestId();
  return { timestamp, request_id };
}

// ---------------------------------------------------------------------------
// 6. Request Body Size Validation
// ---------------------------------------------------------------------------

/**
 * Validates that the request body does not exceed the maximum allowed size.
 * Returns a 413 response if the body is too large, or null if acceptable.
 */
export async function validateBodySize(
  request: NextRequest,
  maxBytes: number,
  meta: { timestamp: string; request_id: string },
): Promise<NextResponse | null> {
  const contentLength = request.headers.get("content-length");
  if (contentLength && parseInt(contentLength, 10) > maxBytes) {
    return NextResponse.json(
      {
        status: "error",
        error: {
          code: "PAYLOAD_TOO_LARGE",
          message: `Request body exceeds maximum allowed size of ${Math.floor(maxBytes / 1024)}KB.`,
        },
        meta,
      },
      { status: 413 },
    );
  }
  return null;
}

// ---------------------------------------------------------------------------
// 7. Safe Error Response Factory
// ---------------------------------------------------------------------------

/**
 * Creates a standardized error response that never leaks internal details.
 * Zod validation errors are reduced to a safe summary.
 */
export function safeErrorResponse(
  code: string,
  message: string,
  meta: { timestamp: string; request_id: string },
  status: number = 500,
): NextResponse {
  return NextResponse.json(
    {
      status: "error",
      error: { code, message },
      meta,
    },
    { status },
  );
}

/**
 * Creates a safe validation error response from a Zod error.
 * Only exposes which fields failed — not the internal error structure.
 */
export function safeValidationError(
  zodError: { flatten: () => { fieldErrors: Record<string, string[]> } },
  meta: { timestamp: string; request_id: string },
): NextResponse {
  const fieldErrors = zodError.flatten().fieldErrors;
  const failedFields = Object.keys(fieldErrors);
  return NextResponse.json(
    {
      status: "error",
      error: {
        code: "VALIDATION_FAILED",
        message: "Request validation failed.",
        fields: failedFields,
      },
      meta,
    },
    { status: 400 },
  );
}
