import type { Metadata } from "next";
import { Inter, Montserrat, JetBrains_Mono } from "next/font/google";
import { Providers } from "@/components/providers";
import "./globals.css";

/* =============================================================================
   Typography Configuration
   - Inter: Body (Regular / Medium / SemiBold)
   - Montserrat: Headings & Numbers (ExtraBold, SemiBold, Bold)
   - JetBrains Mono: Code & Monospace labels
   ============================================================================= */

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
  weight: ["400", "500", "600", "700"],
});

const montserrat = Montserrat({
  subsets: ["latin"],
  variable: "--font-montserrat",
  display: "swap",
  weight: ["600", "700", "800"],
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-jetbrains",
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
        className={`${inter.variable} ${montserrat.variable} ${jetbrainsMono.variable} antialiased`}
      >
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
