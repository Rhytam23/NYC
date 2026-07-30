import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  Zap,
  Shield,
  TrendingUp,
  ArrowRight,
  Sun,
  Battery,
  Users,
} from "lucide-react";

/**
 * Landing Page — Placeholder structure
 * Will be fully implemented from Stitch screen 4677074a0e874260a91d51001716d0f4
 * in Milestone 6. This provides navigation to the dashboard for development.
 */
export default function LandingPage() {
  return (
    <div className="min-h-screen bg-background">
      {/* Navigation */}
      <nav className="border-b border-border/50 bg-surface-container-lowest/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="mx-auto max-w-7xl px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-lg bg-primary flex items-center justify-center">
              <Zap className="h-5 w-5 text-primary-foreground" />
            </div>
            <span className="font-headline text-xl font-bold text-primary">
              CEE-AI
            </span>
          </div>
          <div className="flex items-center gap-4">
            <Link href="/login">
              <Button variant="ghost" size="sm">
                Log In
              </Button>
            </Link>
            <Link href="/dashboard">
              <Button size="sm">
                Open Dashboard
                <ArrowRight className="ml-1 h-4 w-4" />
              </Button>
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="mx-auto max-w-7xl px-6 py-24">
        <div className="text-center max-w-4xl mx-auto">
          <div className="inline-flex items-center gap-2 bg-secondary/10 text-secondary rounded-full px-4 py-1.5 text-sm font-medium mb-8">
            <Sun className="h-4 w-4" />
            NYC Climate Tech Fellowship 2026
          </div>
          <h1 className="text-display-lg text-foreground mb-6">
            Community Energy Exchange
            <span className="text-secondary"> AI</span>
          </h1>
          <p className="text-body-lg text-muted-foreground mb-10 max-w-2xl mx-auto">
            Transform fragmented residential solar and battery storage into a
            resilient, self-healing virtual microgrid. Zero hardware required.
          </p>
          <div className="flex items-center justify-center gap-4">
            <Link href="/dashboard">
              <Button size="lg" className="text-base">
                Launch Platform
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </Link>
            <Button variant="outline" size="lg" className="text-base">
              Watch Demo
            </Button>
          </div>
        </div>

        {/* Stats Bar */}
        <div className="mt-20 grid grid-cols-1 md:grid-cols-3 gap-8">
          {[
            {
              icon: Battery,
              value: "₹1,32,480",
              label: "Monthly DG Savings per Society",
              color: "text-energy-solar",
            },
            {
              icon: Shield,
              value: "4-Tier",
              label: "Emergency Triage (Life Critical First)",
              color: "text-energy-critical",
            },
            {
              icon: Users,
              value: "Zero Hardware",
              label: "Software-First Virtual Microgrid",
              color: "text-energy-battery",
            },
          ].map((stat) => (
            <div
              key={stat.label}
              className="flex flex-col items-center text-center p-6 rounded-[var(--radius-lg)] border border-border bg-card"
            >
              <stat.icon className={`h-8 w-8 ${stat.color} mb-3`} />
              <div className="text-headline-md text-foreground mb-1">
                {stat.value}
              </div>
              <div className="text-body-sm text-muted-foreground">
                {stat.label}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Cost Comparison — from BUSINESS_MODEL.md §3 */}
      <section className="bg-surface-container-low py-20">
        <div className="mx-auto max-w-7xl px-6">
          <h2 className="text-headline-lg text-center text-foreground mb-12">
            65% Cheaper Than Diesel Generators
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-3xl mx-auto">
            {[
              {
                rate: "₹8.50",
                label: "DISCOM Grid",
                color: "border-energy-battery",
                bg: "bg-energy-battery/5",
              },
              {
                rate: "₹9.50",
                label: "CEE-AI Community Rate",
                color: "border-energy-solar",
                bg: "bg-energy-solar/5",
                highlight: true,
              },
              {
                rate: "₹26.00",
                label: "Diesel Generator",
                color: "border-energy-critical",
                bg: "bg-energy-critical/5",
              },
            ].map((tier) => (
              <div
                key={tier.label}
                className={`rounded-[var(--radius-lg)] border-2 ${tier.color} ${tier.bg} p-6 text-center ${
                  tier.highlight ? "ring-2 ring-energy-solar/30 scale-105" : ""
                }`}
              >
                <div className="font-data text-3xl font-bold text-foreground mb-2">
                  {tier.rate}
                </div>
                <div className="text-label-caps text-muted-foreground">
                  {tier.label}
                </div>
                <div className="text-body-sm text-muted-foreground mt-1">
                  per kWh
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Value Props */}
      <section className="mx-auto max-w-7xl px-6 py-20">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {[
            {
              icon: Zap,
              title: "AI Emergency Triage",
              description:
                "4-tier priority system guarantees power to medical devices first. Oxygen concentrators never lose power.",
            },
            {
              icon: TrendingUp,
              title: "CEE Credit Ledger",
              description:
                "Immutable double-entry energy credits settled on your RWA maintenance bill. No crypto, no complexity.",
            },
            {
              icon: Sun,
              title: "Zero Hardware V1",
              description:
                "Connect your existing Enphase, GoodWe, or SolarEdge inverter via cloud API in 15 minutes.",
            },
          ].map((prop) => (
            <div key={prop.title} className="p-6">
              <prop.icon className="h-10 w-10 text-primary mb-4" />
              <h3 className="text-headline-md text-foreground mb-2">
                {prop.title}
              </h3>
              <p className="text-body-md text-muted-foreground">
                {prop.description}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border bg-primary text-primary-foreground py-12">
        <div className="mx-auto max-w-7xl px-6 text-center">
          <div className="flex items-center justify-center gap-2 mb-4">
            <Zap className="h-5 w-5" />
            <span className="font-headline text-lg font-bold">CEE-AI</span>
          </div>
          <p className="text-sm opacity-70">
            Community Energy Exchange AI — NYC Climate Tech Fellowship 2026
          </p>
          <p className="text-xs opacity-50 mt-2">
            Software-first AI platform for community energy resilience
          </p>
        </div>
      </footer>
    </div>
  );
}
