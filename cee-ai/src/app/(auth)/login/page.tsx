"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Zap,
  Key,
  ArrowRight,
  ShieldAlert,
  Heart,
  Building,
  Home,
  CheckCircle2,
  Users,
} from "lucide-react";

/**
 * Login Page — Authentic Stitch design language representation.
 * Includes a premium "Quick Demo Login" panel for hackathon judges/evaluators
 * to log in as one of the three core personas from USER_PERSONAS.md:
 * 1. Rajesh Sharma (Surplus Provider)
 * 2. Dr. Meenakshi Sundaram (Deficit Consumer - Tier 0 Medical)
 * 3. Col. V. K. Nair (RWA Admin / President)
 */
export default function LoginPage() {
  const router = useRouter();
  const supabase = createClient();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Handle standard email login
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg(null);

    const cleanEmail = email.trim().toLowerCase();

    try {
      // 1. Call secure authentication API route
      const response = await fetch("/api/v1/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email: cleanEmail, password }),
      });

      const result = await response.json();

      if (!response.ok) {
        setErrorMsg(result.error?.message || "Incorrect email address or password.");
        setLoading(false);
        return;
      }

      const { token, user } = result.data;

      // 2. Set cryptographically signed session cookie (CWE-614 / SameSite=Lax, Secure)
      // eslint-disable-next-line react-hooks/immutability
      document.cookie = `cee_demo_session=${token}; path=/; max-age=86400; SameSite=Lax; Secure`;

      // 3. Map role back to persona for frontend compatibility
      let persona = "provider";
      if (user.role === "RWA_ADMIN") persona = "admin";
      else if (user.role === "COMMUNITY_MANAGER") persona = "manager";
      else if (user.role === "PLATFORM_ADMIN") persona = "platform_admin";
      else if (user.email === "meenakshi.sundaram@palmmeadows.in") persona = "consumer";

      localStorage.setItem(
        "cee_demo_user",
        JSON.stringify({
          email: user.email,
          name: user.name,
          role: user.role,
          persona,
        }),
      );

      // 4. Authenticate with Supabase if it's a real client config
      const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
      const isRealClient = url && url.startsWith("http") && !url.includes("your-proj");

      if (isRealClient) {
        const authResult = await supabase.auth.signInWithPassword({
          email: cleanEmail,
          password,
        });

        // Auto-register demo account in Supabase Auth if credentials match but user doesn't exist
        if (
          authResult.error &&
          (authResult.error.message.includes("Invalid login credentials") ||
            authResult.error.message.includes("Email not confirmed") ||
            authResult.error.status === 400)
        ) {
          const signUpResult = await supabase.auth.signUp({
            email: cleanEmail,
            password,
            options: {
              data: {
                name: user.name,
                role: user.role,
              },
            },
          });

          if (!signUpResult.error) {
            await supabase.auth.signInWithPassword({
              email: cleanEmail,
              password,
            });
          }
        }
      }

      router.push("/dashboard");
      router.refresh();
    } catch {
      setErrorMsg("An unexpected error occurred during login.");
    } finally {
      setLoading(false);
    }
  };

  // Quick Demo Login Handler for Hackathon/Pitch evaluation
  const handleQuickLogin = async (
    role: "provider" | "consumer" | "admin" | "manager" | "platform_admin"
  ) => {
    setLoading(true);
    setErrorMsg(null);

    // Seed email mapping corresponding to database seed file
    let demoEmail = "";
    let demoName = "";
    let userRole = "RESIDENT";

    switch (role) {
      case "provider":
        demoEmail = "rajesh.sharma@palmmeadows.in";
        demoName = "Rajesh Sharma";
        userRole = "RESIDENT";
        break;
      case "consumer":
        demoEmail = "meenakshi.sundaram@palmmeadows.in";
        demoName = "Dr. Meenakshi S.";
        userRole = "RESIDENT";
        break;
      case "admin":
        demoEmail = "president.nair@palmmeadows.in";
        demoName = "Col. V. K. Nair";
        userRole = "RWA_ADMIN";
        break;
      case "manager":
        demoEmail = "manager.patel@palmmeadows.in";
        demoName = "Amit Patel";
        userRole = "COMMUNITY_MANAGER";
        break;
      case "platform_admin":
        demoEmail = "ops.admin@cee-ai.com";
        demoName = "Ops Admin";
        userRole = "PLATFORM_ADMIN";
        break;
    }

    try {
      // 1. Call secure authentication API route with isQuickLogin flag
      const response = await fetch("/api/v1/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email: demoEmail, isQuickLogin: true }),
      });

      const result = await response.json();

      if (!response.ok) {
        setErrorMsg(result.error?.message || "Quick login failed.");
        setLoading(false);
        return;
      }

      const { token } = result.data;

      // 2. Set cryptographically signed session cookie (CWE-614 / SameSite=Lax, Secure)
      // eslint-disable-next-line react-hooks/immutability
      document.cookie = `cee_demo_session=${token}; path=/; max-age=86400; SameSite=Lax; Secure`;

      // 3. Always write the user metadata to localStorage so frontend pages can render persona views
      localStorage.setItem(
        "cee_demo_user",
        JSON.stringify({
          email: demoEmail,
          name: demoName,
          role: userRole,
          persona: role,
        }),
      );

      // 4. Authenticate with Supabase if it's a real client
      const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
      const isRealClient = url && url.startsWith("http") && !url.includes("your-proj");

      if (isRealClient) {
        // Use the demo password for Supabase synchronization
        const demoPassword = "cee_secure_demo_pass_2026";
        const authResult = await supabase.auth.signInWithPassword({
          email: demoEmail,
          password: demoPassword,
        });

        // Auto-register demo account in Supabase Auth if not already existing
        if (
          authResult.error &&
          (authResult.error.message.includes("Invalid login credentials") ||
            authResult.error.message.includes("Email not confirmed") ||
            authResult.error.status === 400)
        ) {
          const signUpResult = await supabase.auth.signUp({
            email: demoEmail,
            password: demoPassword,
            options: {
              data: {
                name: demoName,
                role: userRole,
              },
            },
          });

          if (!signUpResult.error) {
            await supabase.auth.signInWithPassword({
              email: demoEmail,
              password: demoPassword,
            });
          }
        }
      }

      router.push("/dashboard");
      router.refresh();
    } catch {
      setErrorMsg("An unexpected error occurred during quick login.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full bg-background flex flex-col items-center justify-center p-6 relative">
      {/* Background visual asset overlay — styled as the Stitch Shader */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,var(--tw-gradient-stops))] from-accent/20 via-background to-background -z-10" />

      <div className="w-full max-w-md space-y-6">
        {/* Branding header */}
        <div className="flex flex-col items-center text-center space-y-2">
          <div className="h-12 w-12 rounded-xl bg-primary flex items-center justify-center shadow-lg">
            <Zap className="h-7 w-7 text-primary-foreground" />
          </div>
          <h1 className="font-headline text-2xl font-bold text-primary">
            CEE-AI Platform
          </h1>
          <p className="text-body-sm text-muted-foreground">
            Resilient Community Energy Exchange Portal
          </p>
        </div>

        {/* Main Login Card */}
        <Card className="border border-border shadow-none">
          <CardHeader className="space-y-1">
            <CardTitle className="text-headline-md text-foreground">
              Sign In
            </CardTitle>
            <CardDescription className="text-body-sm text-muted-foreground">
              Enter your credentials or use a demo profile below
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {errorMsg && (
              <div className="rounded-md bg-destructive/10 border border-destructive/20 p-3 text-body-sm text-destructive flex items-start gap-2.5">
                <ShieldAlert className="h-4 w-4 shrink-0 mt-0.5" />
                <span>{errorMsg}</span>
              </div>
            )}

            <form onSubmit={handleLogin} className="space-y-3">
              <div className="space-y-1">
                <label
                  htmlFor="email"
                  className="text-xs font-semibold uppercase tracking-wider text-muted-foreground"
                >
                  Email Address
                </label>
                <Input
                  id="email"
                  type="email"
                  placeholder="name@society.in…"
                  value={email}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    setEmail(e.target.value)
                  }
                  required
                  disabled={loading}
                  autoComplete="email"
                  spellCheck={false}
                />
              </div>

              <div className="space-y-1">
                <label
                  htmlFor="password"
                  className="text-xs font-semibold uppercase tracking-wider text-muted-foreground"
                >
                  Password
                </label>
                <Input
                  id="password"
                  type="password"
                  placeholder="••••••••…"
                  value={password}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    setPassword(e.target.value)
                  }
                  required
                  disabled={loading}
                  autoComplete="current-password"
                />
              </div>

              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? "Authenticating…" : "Sign In with Credentials"}
                {!loading && <ArrowRight className="h-4 w-4 ml-1" />}
              </Button>
            </form>
          </CardContent>

          <div className="relative px-6 py-2">
            <div className="absolute inset-0 flex items-center px-6">
              <div className="w-full border-t border-border" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-card px-2 text-muted-foreground font-semibold tracking-wider">
                Or Quick Demo Sign-In
              </span>
            </div>
          </div>

          {/* Quick Demo Section (Pitch/Hackathon friendly) */}
          <CardContent className="grid grid-cols-1 gap-2 pt-2">
            {[
              {
                role: "provider",
                title: "Rajesh Sharma",
                description: "Resident Provider (Solar + Battery)",
                icon: Home,
                variant: "solar" as const,
              },
              {
                role: "consumer",
                title: "Dr. M. Sundaram",
                description: "Resident Consumer (Tier 0 Medical)",
                icon: Heart,
                variant: "critical" as const,
              },
              {
                role: "admin",
                title: "Col. V. K. Nair",
                description: "RWA Admin (President/Command Center)",
                icon: Building,
                variant: "warning" as const,
              },
              {
                role: "manager",
                title: "Amit Patel",
                description: "Community Manager (CAM & Settlements)",
                icon: Users,
                variant: "default" as const,
              },
              {
                role: "platform_admin",
                title: "Ops Admin",
                description: "Platform Admin (CEE-AI Operations)",
                icon: ShieldAlert,
                variant: "critical" as const,
              },
            ].map((persona) => (
              <button
                key={persona.role}
                onClick={() =>
                  handleQuickLogin(
                    persona.role as
                      | "provider"
                      | "consumer"
                      | "admin"
                      | "manager"
                      | "platform_admin",
                  )
                }
                disabled={loading}
                className="flex items-center gap-3 rounded-(--radius-lg) border border-border/80 bg-surface-container-low p-2.5 text-left hover:bg-surface-container transition-colors duration-150 group disabled:opacity-50"
              >
                <div className="h-8 w-8 rounded-lg bg-background flex items-center justify-center border border-border">
                  <persona.icon className="h-4.5 w-4.5 text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5">
                    <span className="font-headline text-sm font-semibold text-foreground">
                      {persona.title}
                    </span>
                    <Badge
                      variant={persona.variant}
                      className="text-[9px] py-0 px-1 font-semibold leading-normal"
                    >
                      {persona.role.toUpperCase()}
                    </Badge>
                  </div>
                  <p className="text-[11px] text-muted-foreground truncate">
                    {persona.description}
                  </p>
                </div>
                <CheckCircle2 className="h-4 w-4 text-muted-foreground/30 group-hover:text-primary transition-colors shrink-0" />
              </button>
            ))}
          </CardContent>

          <CardFooter className="flex justify-between border-t border-border/50 py-4 bg-surface-container-lowest">
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <Key className="h-3.5 w-3.5" />
              <span>Zero-Trust Architecture</span>
            </div>
            <a
              href="#"
              className="text-xs text-primary font-medium hover:underline"
            >
              Request Access
            </a>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}
