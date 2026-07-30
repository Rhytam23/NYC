import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

const authLoginSchema = z.object({
  email: z.string().email(),
  password: z.string(),
});

/**
 * POST /api/v1/auth/login
 * Validates credentials and returns JWT bearer token.
 */
export async function POST(request: NextRequest) {
  const reqId = `req-${Math.random().toString(36).substr(2, 9)}`;
  const timestamp = new Date().toISOString();

  try {
    const body = await request.json();
    const payload = authLoginSchema.parse(body);

    // Verify if it is one of our demo profiles
    const validEmails = [
      "rajesh.sharma@palmmeadows.in",
      "meenakshi.sundaram@palmmeadows.in",
      "president.nair@palmmeadows.in",
    ];

    if (
      !validEmails.includes(payload.email) ||
      payload.password !== "cee_secure_demo_pass_2026"
    ) {
      return NextResponse.json(
        {
          status: "error",
          error: {
            code: "INVALID_CREDENTIALS",
            message: "Incorrect email address or password.",
          },
          meta: {
            timestamp,
            request_id: reqId,
          },
        },
        { status: 401 },
      );
    }

    let role = "RESIDENT";
    let homeId = "home-rajesh-v104";
    let name = "Resident User";

    if (payload.email === "rajesh.sharma@palmmeadows.in") {
      name = "Rajesh Sharma";
    } else if (payload.email === "meenakshi.sundaram@palmmeadows.in") {
      name = "Dr. Meenakshi Sundaram";
      homeId = "home-meenakshi-a402";
    } else if (payload.email === "president.nair@palmmeadows.in") {
      name = "Col. V. K. Nair";
      role = "RWA_ADMIN";
      homeId = "home-nair-c201";
    }

    return NextResponse.json({
      status: "success",
      data: {
        token: "dummy_jwt_bearer_token_for_cee_ai_session_2026",
        user: {
          email: payload.email,
          name,
          role,
          home_id: homeId,
        },
      },
      meta: {
        timestamp,
        request_id: reqId,
      },
    });
  } catch {
    return NextResponse.json(
      {
        status: "error",
        error: {
          code: "AUTH_FAILED",
          message: "Authentication failure.",
        },
        meta: {
          timestamp,
          request_id: reqId,
        },
      },
      { status: 500 },
    );
  }
}
