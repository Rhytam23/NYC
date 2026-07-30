import type { Metadata } from "next";
import { Inter, Source_Sans_3, JetBrains_Mono, Geist } from "next/font/google";
import { Providers } from "@/components/providers";
import "./globals.css";

/* =============================================================================
   Stitch Typography Configuration
   - Inter: Headlines & UI anchors (clean, geometric)
   - Source Sans 3: Body text & data grids (legibility in dense dashboards)
   - JetBrains Mono: Labels, telemetry data, timestamps (tabular alignment)
   - Geist: Standard font for mobile design layout
   ============================================================================= */

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

const sourceSans = Source_Sans_3({
  subsets: ["latin"],
  variable: "--font-source-sans",
  display: "swap",
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-jetbrains",
  display: "swap",
});

const geist = Geist({
  subsets: ["latin"],
  variable: "--font-geist",
  display: "swap",
});

export const metadata: Metadata = {
  title: "CEE-AI | Community Energy Exchange",
  description:
    "AI-powered community energy exchange platform. Transform fragmented residential solar and battery storage into a resilient, self-healing virtual microgrid.",
  keywords: [
    "community energy",
    "virtual microgrid",
    "solar sharing",
    "battery storage",
    "diesel generator elimination",
    "climate tech",
    "energy credits",
    "RWA energy management",
  ],
  authors: [{ name: "CEE-AI" }],
  openGraph: {
    title: "CEE-AI | Community Energy Exchange",
    description:
      "Software-first AI platform for community energy resilience. Zero hardware required.",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${inter.variable} ${sourceSans.variable} ${jetbrainsMono.variable} ${geist.variable} antialiased`}
      >
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
