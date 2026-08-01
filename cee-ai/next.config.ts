import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Image optimization — allow Supabase storage as a remote pattern
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "*.supabase.co",
        port: "",
        pathname: "/storage/v1/object/public/**",
      },
    ],
  },

  // Disable source maps in production builds (CWE-615)
  productionBrowserSourceMaps: false,

  // Remove X-Powered-By header to reduce fingerprinting surface
  poweredByHeader: false,

  // Security headers — applied to all routes (OWASP A05:2021)
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          // Prevent clickjacking (CWE-1021)
          {
            key: "X-Frame-Options",
            value: "SAMEORIGIN",
          },
          // Prevent MIME type sniffing (CWE-430)
          {
            key: "X-Content-Type-Options",
            value: "nosniff",
          },
          // Control referrer information leakage
          {
            key: "Referrer-Policy",
            value: "strict-origin-when-cross-origin",
          },
          // Restrict browser feature access
          {
            key: "Permissions-Policy",
            value:
              "camera=(), microphone=(), geolocation=(), payment=(), usb=(), magnetometer=(), gyroscope=(), accelerometer=()",
          },
          // Enforce HTTPS (CWE-319) — 1 year, include subdomains
          {
            key: "Strict-Transport-Security",
            value: "max-age=31536000; includeSubDomains; preload",
          },
          // Content Security Policy — defense-in-depth against XSS (CWE-79)
          {
            key: "Content-Security-Policy",
            value: [
              "default-src 'self'",
              "script-src 'self' 'unsafe-inline' 'unsafe-eval'",
              "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
              "font-src 'self' https://fonts.gstatic.com data:",
              "img-src 'self' data: blob: https://*.supabase.co",
              "connect-src 'self' https://*.supabase.co wss://*.supabase.co",
              "frame-ancestors 'self'",
              "base-uri 'self'",
              "form-action 'self'",
              "object-src 'none'",
            ].join("; "),
          },
          // Isolate browsing context (Spectre mitigations)
          {
            key: "Cross-Origin-Opener-Policy",
            value: "same-origin",
          },
          // Resource isolation
          {
            key: "Cross-Origin-Resource-Policy",
            value: "same-origin",
          },
        ],
      },
    ];
  },
};

export default nextConfig;
