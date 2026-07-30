"use client";

import { useState } from "react";
import Link from "next/link";
import {
  Zap,
  Menu,
  X,
  Bell,
  Settings,
  User,
  Sparkles,
  ArrowRight,
  DollarSign,
  CloudRain,
  BrainCircuit,
  BatteryCharging,
  ShieldCheck,
  PiggyBank,
  Leaf,
  Globe,
  Mail,
  FileText,
} from "lucide-react";

export default function LandingPage() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const toggleMobileMenu = () => {
    setMobileMenuOpen(!mobileMenuOpen);
  };

  return (
    <div className="min-h-screen bg-background text-foreground overflow-x-hidden selection:bg-secondary/30">
      {/* TopNavBar */}
      <nav className="flex justify-between items-center px-6 md:px-8 w-full h-16 bg-surface/80 backdrop-blur-md border-b border-border/50 fixed top-0 z-50">
        <div className="flex items-center gap-4">
          {/* Mobile menu trigger */}
          <button
            onClick={toggleMobileMenu}
            className="md:hidden flex items-center justify-center p-2 text-on-surface-variant hover:text-secondary transition-colors"
          >
            <Menu className="h-6 w-6" />
          </button>

          <Link href="/" className="flex items-center gap-2">
            <Zap className="h-6 w-6 text-secondary fill-secondary/20" />
            <span className="font-headline text-lg font-bold text-primary">
              CEE-AI
            </span>
          </Link>
        </div>

        {/* Desktop nav links */}
        <div className="hidden md:flex items-center gap-6">
          <Link
            href="/dashboard"
            className="font-body text-sm text-secondary font-bold border-b-2 border-secondary pb-1"
          >
            Dashboard
          </Link>
          <Link
            href="/dashboard/ledger"
            className="font-body text-sm text-muted-foreground hover:text-secondary transition-colors"
          >
            Ledger
          </Link>
          <Link
            href="/dashboard/ai-insights"
            className="font-body text-sm text-muted-foreground hover:text-secondary transition-colors"
          >
            Insights
          </Link>
          <Link
            href="/dashboard/emergency"
            className="font-body text-sm text-muted-foreground hover:text-secondary transition-colors"
          >
            Emergency
          </Link>
        </div>

        {/* Global actions */}
        <div className="flex items-center gap-3">
          <Link href="/dashboard/settings">
            <button className="p-2 text-muted-foreground hover:text-primary transition-colors flex items-center justify-center">
              <Bell className="h-5 w-5" />
            </button>
          </Link>
          <Link href="/dashboard/settings">
            <button className="p-2 text-muted-foreground hover:text-primary transition-colors flex items-center justify-center">
              <Settings className="h-5 w-5" />
            </button>
          </Link>
          <Link href="/login">
            <button className="p-2 text-primary hover:text-secondary transition-colors flex items-center justify-center">
              <User className="h-6 w-6" />
            </button>
          </Link>
        </div>
      </nav>

      {/* Hero Section */}
      <header className="relative pt-32 pb-20 px-6 md:px-8 overflow-hidden bg-gradient-to-tr from-secondary-container/5 via-background to-background">
        <div className="absolute inset-0 -z-10 bg-[radial-gradient(circle_at_top_right,_var(--tw-gradient-stops))] from-secondary-container/10 via-transparent to-transparent"></div>
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center gap-10">
          <div className="flex-1 space-y-6">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-secondary-container/30 border border-secondary/20">
              <Sparkles className="h-4 w-4 text-secondary" />
              <span className="font-label text-xs font-semibold text-secondary-foreground uppercase tracking-wider">
                AI-Driven Grid Resilience
              </span>
            </div>
            <h1 className="font-headline text-display-lg text-primary tracking-tight leading-tight">
              Resilient Energy for <br />
              <span className="text-secondary">Resilient Communities.</span>
            </h1>
            <p className="font-body text-body-lg text-muted-foreground max-w-xl">
              CEE-AI orchestrates community-owned solar and battery assets to
              ensure your neighborhood stays powered through grid instability,
              lowering costs and carbon emissions simultaneously.
            </p>
            <div className="flex flex-wrap gap-4 pt-2">
              <Link href="/login">
                <button className="px-6 py-3 bg-primary text-primary-foreground font-body text-sm font-bold rounded-lg hover:bg-primary/95 transition-all hover:scale-[1.02] active:scale-95 shadow-md flex items-center gap-2">
                  Join the Exchange
                  <ArrowRight className="h-4 w-4" />
                </button>
              </Link>
              <a href="#how-it-works">
                <button className="px-6 py-3 bg-card border border-border text-primary font-body text-sm font-bold rounded-lg hover:bg-surface transition-all active:scale-95">
                  How it Works
                </button>
              </a>
            </div>
          </div>

          <div className="flex-1 w-full relative">
            <div className="aspect-square w-full bg-card/60 backdrop-blur-md border border-border/80 rounded-2xl flex flex-col items-center justify-center p-6 relative overflow-hidden shadow-sm">
              <div className="absolute inset-0 opacity-5">
                <svg className="w-full h-full" viewBox="0 0 100 100">
                  <pattern
                    id="grid"
                    width="10"
                    height="10"
                    patternUnits="userSpaceOnUse"
                  >
                    <path
                      d="M 10 0 L 0 0 0 10"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="0.5"
                    />
                  </pattern>
                  <rect width="100" height="100" fill="url(#grid)" />
                </svg>
              </div>

              {/* Central Biophilic Energy visualization */}
              <div className="relative w-48 h-48 rounded-full bg-secondary-container/10 border border-secondary/20 flex items-center justify-center">
                <div
                  className="absolute inset-2 rounded-full border border-dashed border-secondary/30 animate-spin"
                  style={{ animationDuration: "12s" }}
                ></div>
                <div className="absolute inset-6 rounded-full bg-secondary/5 flex items-center justify-center">
                  <Zap className="h-16 w-16 text-secondary fill-secondary/10" />
                </div>
              </div>
              <div className="mt-8 text-center">
                <div className="font-headline text-lg font-bold text-primary">
                  Virtual Power Plant
                </div>
                <div className="text-body text-sm text-muted-foreground mt-1">
                  AI-coordinated swarming logic active
                </div>
              </div>
            </div>

            {/* Floating Live Badge */}
            <div
              className="absolute -top-4 -right-4 bg-card/90 backdrop-blur-md border border-border/80 p-4 rounded-xl shadow-md animate-bounce"
              style={{ animationDuration: "4s" }}
            >
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-secondary rounded-full animate-pulse"></div>
                <span className="font-label text-xs font-bold text-secondary uppercase tracking-wider">
                  GRID STATUS: OPTIMAL
                </span>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Challenge Section */}
      <section
        id="how-it-works"
        className="py-20 bg-surface-container-low/50 border-y border-border/40"
      >
        <div className="max-w-7xl mx-auto px-6 md:px-8">
          <div className="mb-12">
            <span className="font-label text-xs font-bold text-secondary uppercase tracking-wider">
              The Challenge
            </span>
            <h2 className="font-headline text-headline-lg text-primary mt-1">
              Grid Instability & High Costs
            </h2>
            <div className="w-20 h-1 bg-secondary mt-3"></div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-card border border-border/80 p-6 rounded-xl hover:border-secondary transition-all group hover:shadow-md">
              <Zap className="h-10 w-10 text-destructive mb-4 group-hover:scale-110 transition-transform" />
              <h3 className="font-headline text-headline-md text-primary mb-2">
                Centralized Vulnerability
              </h3>
              <p className="font-body text-body-md text-muted-foreground">
                Relying on a centralized, aging grid infrastructure makes
                communities vulnerable to extreme weather events and outages.
              </p>
            </div>
            <div className="bg-card border border-border/80 p-6 rounded-xl hover:border-secondary transition-all group hover:shadow-md">
              <DollarSign className="h-10 w-10 text-destructive mb-4 group-hover:scale-110 transition-transform" />
              <h3 className="font-headline text-headline-md text-primary mb-2">
                Skyrocketing Diesel Costs
              </h3>
              <p className="font-body text-body-md text-muted-foreground">
                Backup diesel generators are noisy, highly polluting, and
                extremely expensive to run (up to ₹26.00 per kWh in billing
                cycles).
              </p>
            </div>
            <div className="bg-card border border-border/80 p-6 rounded-xl hover:border-secondary transition-all group hover:shadow-md">
              <CloudRain className="h-10 w-10 text-destructive mb-4 group-hover:scale-110 transition-transform" />
              <h3 className="font-headline text-headline-md text-primary mb-2">
                Unutilized Local Solar
              </h3>
              <p className="font-body text-body-md text-muted-foreground">
                Surplus residential solar is often wasted or sold back to grid
                companies for pennies, rather than helping neighbors.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* The Solution Section (Bento Style) */}
      <section className="py-20">
        <div className="max-w-7xl mx-auto px-6 md:px-8">
          <div className="mb-12 text-center">
            <span className="font-label text-xs font-bold text-secondary uppercase tracking-wider">
              Our Technology
            </span>
            <h2 className="font-headline text-headline-lg text-primary mt-1">
              AI-Coordinated Shared Energy
            </h2>
          </div>

          <div className="grid grid-cols-12 gap-6">
            {/* Large Bento Box: Dynamic Load Balancing */}
            <div className="col-span-12 md:col-span-8 bg-card border border-border/80 rounded-2xl p-8 flex flex-col justify-between overflow-hidden relative group hover:border-secondary transition-colors shadow-sm">
              <div className="relative z-10 space-y-2">
                <h3 className="font-headline text-headline-md text-primary">
                  Dynamic Load Balancing
                </h3>
                <p className="font-body text-body-md text-muted-foreground max-w-lg">
                  Our AI engine predicts consumption patterns across the
                  neighborhood, shifting battery discharge dynamically to
                  precisely match the highest local demand.
                </p>
              </div>
              <div className="mt-8 h-48 bg-primary-container/20 border border-border/40 rounded-xl overflow-hidden relative flex items-center justify-center">
                <div className="absolute inset-0 opacity-15">
                  <svg className="w-full h-full" preserveAspectRatio="none">
                    <path
                      className="animate-flow"
                      d="M0,50 Q25,30 50,50 T100,50"
                      fill="none"
                      stroke="#10b981"
                      strokeWidth="2"
                    />
                    <path
                      className="animate-flow"
                      d="M0,70 Q25,90 50,70 T100,70"
                      fill="none"
                      stroke="#3b82f6"
                      strokeWidth="2"
                    />
                  </svg>
                </div>
                <BrainCircuit className="h-16 w-16 text-secondary/40 animate-pulse" />
              </div>
            </div>

            {/* Side Bento 1: Battery Swarming */}
            <div className="col-span-12 md:col-span-4 bg-secondary text-secondary-foreground rounded-2xl p-8 flex flex-col justify-between shadow-sm">
              <div className="w-12 h-12 bg-white/10 rounded-xl flex items-center justify-center mb-6">
                <BatteryCharging className="h-6 w-6 text-white" />
              </div>
              <div className="space-y-2">
                <h3 className="font-headline text-headline-md text-white">
                  Battery Swarming
                </h3>
                <p className="font-body text-sm text-white/80">
                  Unified control of hundreds of residential batteries acting as
                  a single, massive virtual power plant (VPP).
                </p>
              </div>
            </div>

            {/* Side Bento 2: Solar Harvesting */}
            <div className="col-span-12 md:col-span-4 bg-card border border-border/80 rounded-2xl p-8 flex flex-col justify-between group hover:border-secondary transition-colors shadow-sm">
              <div className="space-y-2">
                <h3 className="font-headline text-headline-md text-primary">
                  Solar Harvesting
                </h3>
                <p className="font-body text-sm text-muted-foreground">
                  Maximize self-consumption by trading excess solar energy
                  locally instead of wasting it.
                </p>
              </div>
              <div className="mt-8 grid grid-cols-3 gap-2">
                <div className="h-12 bg-secondary-container/20 rounded border border-secondary/10 flex items-center justify-center">
                  <span className="font-data text-xs text-secondary font-bold">
                    12 kW
                  </span>
                </div>
                <div className="h-20 bg-secondary-container/40 rounded border border-secondary/20 flex items-center justify-center">
                  <span className="font-data text-xs text-secondary font-bold">
                    28 kW
                  </span>
                </div>
                <div className="h-16 bg-secondary-container/30 rounded border border-secondary/15 flex items-center justify-center">
                  <span className="font-data text-xs text-secondary font-bold">
                    20 kW
                  </span>
                </div>
              </div>
            </div>

            {/* Large Bento Box 2: Energy Exchange Ledger */}
            <div className="col-span-12 md:col-span-8 bg-card border border-border/80 rounded-2xl p-8 group hover:border-secondary transition-colors shadow-sm">
              <div className="flex items-center gap-2 mb-6">
                <span className="px-2 py-0.5 bg-secondary/10 text-secondary font-label text-[10px] rounded border border-secondary/20 uppercase tracking-wider font-bold">
                  AI Powered
                </span>
                <h3 className="font-headline text-headline-md text-primary">
                  The Energy Exchange Ledger
                </h3>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left font-body text-sm">
                  <thead>
                    <tr className="text-secondary font-bold border-b border-border">
                      <th className="py-2">TIMESTAMP</th>
                      <th className="py-2">ACTION</th>
                      <th className="py-2">NODE</th>
                      <th className="py-2 text-right">CREDIT</th>
                    </tr>
                  </thead>
                  <tbody className="font-data text-xs">
                    <tr className="border-b border-border/50">
                      <td className="py-2.5">12:45:02</td>
                      <td className="py-2.5 text-emerald-600 font-semibold">
                        Export
                      </td>
                      <td className="py-2.5">House_V104</td>
                      <td className="py-2.5 text-right font-bold text-emerald-600">
                        +1.2 kWh
                      </td>
                    </tr>
                    <tr className="border-b border-border/30 bg-surface-container-low/50">
                      <td className="py-2.5">12:44:58</td>
                      <td className="py-2.5 text-blue-600 font-semibold">
                        Import
                      </td>
                      <td className="py-2.5">House_A402</td>
                      <td className="py-2.5 text-right font-bold text-blue-600">
                        -0.8 kWh
                      </td>
                    </tr>
                    <tr>
                      <td className="py-2.5">12:44:30</td>
                      <td className="py-2.5 text-emerald-600 font-semibold">
                        Export
                      </td>
                      <td className="py-2.5">House_B202</td>
                      <td className="py-2.5 text-right font-bold text-emerald-600">
                        +0.4 kWh
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Cost Comparison */}
      <section className="bg-surface-container-low py-20 border-y border-border/40">
        <div className="mx-auto max-w-7xl px-6 md:px-8">
          <h2 className="font-headline text-headline-lg text-center text-primary mb-12">
            65% Cheaper Than Diesel Generators
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-3xl mx-auto">
            <div className="rounded-xl border-2 border-border/40 bg-card p-6 text-center shadow-sm">
              <div className="font-data text-3xl font-bold text-primary mb-2">
                ₹8.50
              </div>
              <div className="font-label text-xs text-muted-foreground uppercase tracking-wider">
                DISCOM Grid
              </div>
              <div className="font-body text-xs text-muted-foreground mt-1">
                per kWh
              </div>
            </div>

            <div className="rounded-xl border-2 border-secondary bg-secondary/5 p-6 text-center ring-4 ring-secondary/15 scale-105 shadow-sm">
              <div className="font-data text-3xl font-bold text-secondary mb-2">
                ₹9.50
              </div>
              <div className="font-label text-xs text-secondary font-bold uppercase tracking-wider">
                CEE-AI Community Rate
              </div>
              <div className="font-body text-xs text-secondary mt-1">
                per kWh
              </div>
            </div>

            <div className="rounded-xl border-2 border-border/40 bg-card p-6 text-center shadow-sm">
              <div className="font-data text-3xl font-bold text-destructive mb-2">
                ₹26.00
              </div>
              <div className="font-label text-xs text-destructive uppercase tracking-wider">
                Diesel Generator
              </div>
              <div className="font-body text-xs text-muted-foreground mt-1">
                per kWh
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Microgrid Topology Visualization */}
      <section className="py-20 bg-primary text-primary-foreground">
        <div className="max-w-7xl mx-auto px-6 md:px-8 text-center">
          <h2 className="font-headline text-headline-lg mb-12">
            Community Microgrid Topology
          </h2>
          <div className="relative w-full aspect-video md:aspect-[21/9] bg-primary-container/20 rounded-2xl border border-white/10 flex items-center justify-center p-6 overflow-hidden">
            {/* SVG Diagram */}
            <svg
              className="absolute inset-0 w-full h-full p-6 md:p-12"
              viewBox="0 0 1000 400"
            >
              {/* Central AI Hub */}
              <rect
                x="470"
                y="170"
                width="60"
                height="60"
                rx="8"
                fill="#10b981"
                className="animate-pulse"
              />
              <text
                x="500"
                y="255"
                fill="#ffffff"
                className="font-label text-[10px]"
                textAnchor="middle"
              >
                CEE-AI CORE
              </text>

              {/* Houses Nodes */}
              <circle cx="200" cy="100" r="12" fill="#3b82f6" />
              <circle cx="200" cy="300" r="12" fill="#10b981" />
              <circle cx="800" cy="100" r="12" fill="#10b981" />
              <circle cx="800" cy="300" r="12" fill="#3b82f6" />

              {/* Connection Lines */}
              <g fill="none" opacity="0.3" stroke="#10b981" strokeWidth="2">
                <path
                  className="animate-flow"
                  d="M210,100 L470,185"
                  strokeDasharray="5,5"
                />
                <path
                  className="animate-flow"
                  d="M210,300 L470,215"
                  strokeDasharray="5,5"
                />
                <path
                  className="animate-flow"
                  d="M790,100 L530,185"
                  strokeDasharray="5,5"
                />
                <path
                  className="animate-flow"
                  d="M790,300 L530,215"
                  strokeDasharray="5,5"
                />
              </g>

              {/* Labels */}
              <text
                x="160"
                y="105"
                fill="white"
                className="font-label text-[10px]"
              >
                HOUSE V104 (Surplus)
              </text>
              <text
                x="160"
                y="305"
                fill="white"
                className="font-label text-[10px]"
              >
                HOUSE B202 (Surplus)
              </text>
              <text
                x="820"
                y="105"
                fill="white"
                className="font-label text-[10px]"
              >
                HOUSE A402 (Deficit)
              </text>
              <text
                x="820"
                y="305"
                fill="white"
                className="font-label text-[10px]"
              >
                HOUSE C103 (Deficit)
              </text>
            </svg>
            <div className="relative z-10 bg-primary-container/85 border border-white/10 p-4 rounded-xl backdrop-blur-md max-w-md shadow-lg">
              <p className="font-body text-xs text-white/90">
                AI real-time coordination visualization. Energy flows from
                surplus nodes to deficit nodes dynamically to protect community
                stability.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section className="py-20">
        <div className="max-w-7xl mx-auto px-6 md:px-8">
          <div className="text-center mb-16">
            <h2 className="font-headline text-headline-lg text-primary">
              Engineered for Impact
            </h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="text-center group">
              <div className="w-16 h-16 bg-secondary-container/20 rounded-full flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform border border-secondary/15">
                <ShieldCheck className="h-8 w-8 text-secondary" />
              </div>
              <h3 className="font-headline text-headline-md text-primary mb-2">
                Resilience
              </h3>
              <p className="font-body text-body-md text-muted-foreground px-4">
                Maintain critical power during main grid failure. Virtual Island
                Mode activates automatically to support emergency loads.
              </p>
            </div>
            <div className="text-center group">
              <div className="w-16 h-16 bg-secondary-container/20 rounded-full flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform border border-secondary/15">
                <PiggyBank className="h-8 w-8 text-secondary" />
              </div>
              <h3 className="font-headline text-headline-md text-primary mb-2">
                Cost Reduction
              </h3>
              <p className="font-body text-body-md text-muted-foreground px-4">
                Reduce energy bills by up to 40% through peer-to-peer credit
                settlements mapped directly on your RWA maintenance ledger.
              </p>
            </div>
            <div className="text-center group">
              <div className="w-16 h-16 bg-secondary-container/20 rounded-full flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform border border-secondary/15">
                <Leaf className="h-8 w-8 text-secondary" />
              </div>
              <h3 className="font-headline text-headline-md text-primary mb-2">
                Zero Carbon Peak Shaving
              </h3>
              <p className="font-body text-body-md text-muted-foreground px-4">
                Maximize clean energy usage. Every kWh traded locally replaces
                high-carbon backup diesel fuel.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-surface-container-low border-t border-border/50 pt-16 pb-12">
        <div className="max-w-7xl mx-auto px-6 md:px-8">
          <div className="flex flex-col md:flex-row justify-between items-start gap-10 mb-12">
            <div className="max-w-sm space-y-4">
              <div className="flex items-center gap-2">
                <Zap className="h-6 w-6 text-secondary fill-secondary/10" />
                <span className="font-headline text-lg font-bold text-primary">
                  CEE-AI
                </span>
              </div>
              <p className="font-body text-sm text-muted-foreground">
                Empowering gated communities with virtual microgrid intelligence
                for a cleaner, self-reliant future.
              </p>
              <div className="flex gap-4 pt-2">
                <a
                  href="#"
                  className="text-muted-foreground hover:text-secondary"
                >
                  <Globe className="h-5 w-5" />
                </a>
                <a
                  href="#"
                  className="text-muted-foreground hover:text-secondary"
                >
                  <Mail className="h-5 w-5" />
                </a>
                <a
                  href="#"
                  className="text-muted-foreground hover:text-secondary"
                >
                  <FileText className="h-5 w-5" />
                </a>
              </div>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-3 gap-10 w-full md:w-auto">
              <div>
                <h4 className="font-label text-xs font-bold text-primary mb-4 uppercase tracking-wider">
                  Product
                </h4>
                <ul className="space-y-2 font-body text-sm text-muted-foreground">
                  <li>
                    <Link href="/dashboard" className="hover:text-secondary">
                      Dashboard
                    </Link>
                  </li>
                  <li>
                    <Link
                      href="/dashboard/ledger"
                      className="hover:text-secondary"
                    >
                      Energy Ledger
                    </Link>
                  </li>
                  <li>
                    <Link
                      href="/dashboard/ai-insights"
                      className="hover:text-secondary"
                    >
                      API Docs
                    </Link>
                  </li>
                </ul>
              </div>
              <div>
                <h4 className="font-label text-xs font-bold text-primary mb-4 uppercase tracking-wider">
                  Resources
                </h4>
                <ul className="space-y-2 font-body text-sm text-muted-foreground">
                  <li>
                    <a href="#" className="hover:text-secondary">
                      Case Studies
                    </a>
                  </li>
                  <li>
                    <a href="#" className="hover:text-secondary">
                      Impact Reports
                    </a>
                  </li>
                  <li>
                    <a href="#" className="hover:text-secondary">
                      Community
                    </a>
                  </li>
                </ul>
              </div>
              <div>
                <h4 className="font-label text-xs font-bold text-primary mb-4 uppercase tracking-wider">
                  Legal
                </h4>
                <ul className="space-y-2 font-body text-sm text-muted-foreground">
                  <li>
                    <a href="#" className="hover:text-secondary">
                      Privacy Policy
                    </a>
                  </li>
                  <li>
                    <a href="#" className="hover:text-secondary">
                      Terms of Service
                    </a>
                  </li>
                </ul>
              </div>
            </div>
          </div>

          <div className="flex flex-col md:flex-row justify-between items-center pt-8 border-t border-border/30 gap-4">
            <p className="font-body text-xs text-muted-foreground">
              © 2026 CEE-AI Climate Technologies. All rights reserved.
            </p>
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 bg-secondary rounded-full"></span>
              <span className="font-label text-[10px] text-secondary uppercase tracking-wider font-bold">
                SYSTEMS OPERATIONAL
              </span>
            </div>
          </div>
        </div>
      </footer>

      {/* Mobile Sidebar Overlay */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 bg-primary/80 backdrop-blur-sm z-[60] flex">
          <div className="w-[280px] bg-card h-full flex flex-col py-6 px-4 gap-6 animate-in slide-in-from-left duration-300">
            <div className="flex items-center justify-between">
              <span className="font-headline text-xl font-bold text-primary">
                CEE-AI
              </span>
              <button
                onClick={toggleMobileMenu}
                className="p-1 text-muted-foreground hover:text-primary"
              >
                <X className="h-6 w-6" />
              </button>
            </div>
            <div className="flex flex-col gap-2">
              <Link
                href="/dashboard"
                onClick={toggleMobileMenu}
                className="flex items-center gap-3 px-4 py-2.5 bg-secondary-container/20 text-secondary-foreground rounded-lg font-body text-sm font-semibold"
              >
                <Zap className="h-5 w-5" />
                <span>Home</span>
              </Link>
              <Link
                href="/dashboard/ledger"
                onClick={toggleMobileMenu}
                className="flex items-center gap-3 px-4 py-2.5 text-muted-foreground hover:bg-surface rounded-lg font-body text-sm"
              >
                <DollarSign className="h-5 w-5" />
                <span>Energy Ledger</span>
              </Link>
              <Link
                href="/dashboard/ai-insights"
                onClick={toggleMobileMenu}
                className="flex items-center gap-3 px-4 py-2.5 text-muted-foreground hover:bg-surface rounded-lg font-body text-sm"
              >
                <BrainCircuit className="h-5 w-5" />
                <span>AI Insights</span>
              </Link>
              <Link
                href="/dashboard/emergency"
                onClick={toggleMobileMenu}
                className="flex items-center gap-3 px-4 py-2.5 text-muted-foreground hover:bg-surface rounded-lg font-body text-sm"
              >
                <ShieldCheck className="h-5 w-5 text-destructive" />
                <span>Emergency</span>
              </Link>
            </div>
            <div className="mt-auto border-t border-border pt-4">
              <Link href="/dashboard/emergency" onClick={toggleMobileMenu}>
                <button className="w-full py-3 bg-destructive text-white font-bold rounded-lg text-sm transition-transform active:scale-95">
                  Emergency Shutdown
                </button>
              </Link>
            </div>
          </div>
          {/* Click outside to close */}
          <div
            onClick={toggleMobileMenu}
            className="flex-1 h-full cursor-pointer"
          ></div>
        </div>
      )}
    </div>
  );
}
