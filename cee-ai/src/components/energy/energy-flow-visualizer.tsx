"use client";

import { Sun, Battery, Home, Zap } from "lucide-react";
import { formatEnergy, cn } from "@/lib/utils";

interface EnergyFlowProps {
  solarGen: number;
  batteryFlow: number; // positive = charge, negative = discharge
  batterySoc: number;
  homeDemand: number;
  netExport: number; // positive = export to community, negative = import from community
  gridStatus?: string;
}

/**
 * EnergyFlowVisualizer — Stitch Design System component
 * Source: ui_rules.md §3.1 Energy Flow Visualizer
 * Animates the realtime power flows between Solar, Battery, Home, and Community.
 * Responsive behaviors:
 * - Desktop/Tablet: 2x2 grid format with diagonal paths
 * - Mobile: Cross format (Solar top, Load bottom, Battery left, Grid right) with orthogonal paths
 */
export function EnergyFlowVisualizer({
  solarGen,
  batteryFlow,
  batterySoc,
  homeDemand,
  netExport,
  gridStatus = "NORMAL",
}: EnergyFlowProps) {
  const isCharging = batteryFlow > 0;
  const isExporting = netExport > 0;
  const isOutage = gridStatus.includes("OUTAGE");

  // Animation speed controls based on power levels
  const getDashSpeed = (kw: number) => {
    if (kw === 0) return "0s";
    const speed = Math.max(0.5, 4 - Math.abs(kw) * 0.5);
    return `${speed}s`;
  };

  return (
    <div className="w-full bg-card rounded-(--radius-lg) border border-border p-4 sm:p-6 font-data">
      {/* Title */}
      <div className="flex items-center justify-between border-b border-border/50 pb-3 mb-4">
        <span className="text-label-caps text-muted-foreground text-xs">
          Live Telemetry Flow
        </span>
        <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-energy-solar/10 text-energy-solar">
          {gridStatus}
        </span>
      </div>

      {/* ==========================================
          DESKTOP & TABLET LAYOUT (sm:block hidden)
          ========================================== */}
      <div className="relative hidden sm:block w-full aspect-4/3 max-w-lg mx-auto">
        {/* SVG Canvas for Flow Lines */}
        <svg
          className="absolute inset-0 w-full h-full pointer-events-none"
          viewBox="0 0 400 300"
        >
          <defs>
            <marker
              id="arrow-green"
              viewBox="0 0 10 10"
              refX="5"
              refY="5"
              markerWidth="6"
              markerHeight="6"
              orient="auto-start-reverse"
            >
              <path d="M 0 0 L 10 5 L 0 10 z" fill="#10b981" />
            </marker>
            <marker
              id="arrow-blue"
              viewBox="0 0 10 10"
              refX="5"
              refY="5"
              markerWidth="6"
              markerHeight="6"
              orient="auto-start-reverse"
            >
              <path d="M 0 0 L 10 5 L 0 10 z" fill="#3b82f6" />
            </marker>
            <marker
              id="arrow-red"
              viewBox="0 0 10 10"
              refX="5"
              refY="5"
              markerWidth="6"
              markerHeight="6"
              orient="auto-start-reverse"
            >
              <path d="M 0 0 L 10 5 L 0 10 z" fill="#ef4444" />
            </marker>
          </defs>

          {/* 1. Solar -> Home Path */}
          {solarGen > 0 && (
            <path
              d="M 80,70 L 200,150"
              className="stroke-energy-solar fill-none stroke-3"
              strokeDasharray="6,6"
              style={{
                animation: `flowDash ${getDashSpeed(solarGen)} linear infinite`,
              }}
            />
          )}

          {/* 2. Battery <-> Home Path */}
          {batteryFlow !== 0 && (
            <path
              d={isCharging ? "M 200,150 L 80,230" : "M 80,230 L 200,150"}
              className="stroke-energy-battery fill-none stroke-3"
              strokeDasharray="6,6"
              style={{
                animation: `flowDash ${getDashSpeed(batteryFlow)} linear infinite`,
              }}
            />
          )}

          {/* 3. Community <-> Home Path */}
          {netExport !== 0 && (
            <path
              d={isExporting ? "M 200,150 L 320,230" : "M 320,230 L 200,150"}
              className={
                isExporting
                  ? "stroke-energy-solar fill-none stroke-3"
                  : "stroke-energy-grid fill-none stroke-3"
              }
              strokeDasharray="6,6"
              style={{
                animation: `flowDash ${getDashSpeed(netExport)} linear infinite`,
              }}
            />
          )}

          {/* 4. Home Demand Flow Indicator */}
          {homeDemand > 0 && (
            <path
              d="M 200,150 L 320,70"
              className="stroke-energy-battery fill-none stroke-3"
              strokeDasharray="6,6"
              style={{
                animation: `flowDash ${getDashSpeed(homeDemand)} linear infinite`,
              }}
            />
          )}
        </svg>

        {/* Nodes absolutely positioned to align with SVG coordinates */}
        <div className="absolute inset-0 z-10 pointer-events-none">
          {/* Node 1: Solar (80, 70) -> left: 20%, top: 23.33% */}
          <div className="absolute top-[23.33%] left-[20%] transform -translate-x-1/2 -translate-y-1/2 flex flex-col items-center p-3 rounded-xl bg-surface-container border border-border/80 w-32 pointer-events-auto shadow-sm">
            <Sun className="h-6 w-6 text-energy-solar mb-1 animate-spin-slow" />
            <span className="text-xs font-semibold text-muted-foreground uppercase">
              Solar
            </span>
            <span className="font-headline font-bold text-sm text-foreground mt-0.5">
              {formatEnergy(solarGen, "kW")}
            </span>
          </div>

          {/* Node 2: Home Load (320, 70) -> left: 80%, top: 23.33% */}
          <div className="absolute top-[23.33%] left-[80%] transform -translate-x-1/2 -translate-y-1/2 flex flex-col items-center p-3 rounded-xl bg-surface-container border border-border/80 w-32 pointer-events-auto shadow-sm">
            <Home className="h-6 w-6 text-energy-battery mb-1" />
            <span className="text-xs font-semibold text-muted-foreground uppercase">
              Home Load
            </span>
            <span className="font-headline font-bold text-sm text-foreground mt-0.5">
              {formatEnergy(homeDemand, "kW")}
            </span>
          </div>

          {/* Node 3: Battery (80, 230) -> left: 20%, top: 76.66% */}
          <div className="absolute top-[76.66%] left-[20%] transform -translate-x-1/2 -translate-y-1/2 flex flex-col items-center p-3 rounded-xl bg-surface-container border border-border/80 w-32 pointer-events-auto shadow-sm">
            <Battery className="h-6 w-6 text-energy-battery mb-1" />
            <span className="text-xs font-semibold text-muted-foreground uppercase">
              Battery
            </span>
            <span className="font-headline font-bold text-sm text-foreground mt-0.5">
              {batterySoc.toFixed(0)}% SOC
            </span>
            <span className="text-[10px] text-muted-foreground">
              {batteryFlow > 0
                ? `+${batteryFlow.toFixed(2)} kW`
                : `${batteryFlow.toFixed(2)} kW`}
            </span>
          </div>

          {/* Node 4: Community Grid (320, 230) -> left: 80%, top: 76.66% */}
          <div className={cn(
            "absolute top-[76.66%] left-[80%] transform -translate-x-1/2 -translate-y-1/2 flex flex-col items-center p-3 rounded-xl border w-32 pointer-events-auto shadow-sm transition-colors duration-300",
            isOutage 
              ? "bg-red-50 border-red-200 text-red-700 dark:bg-red-950/20 dark:border-red-900/50" 
              : "bg-surface-container border border-border/80 text-foreground"
          )}>
            <Zap className={cn("h-6 w-6 mb-1", isOutage ? "text-red-500 fill-red-100 animate-pulse" : "text-energy-solar")} />
            <span className="text-xs font-semibold text-muted-foreground uppercase">
              CEE Grid
            </span>
            <span className={cn("font-headline font-bold text-sm mt-0.5", isOutage ? "text-red-600" : "text-foreground")}>
              {isOutage 
                ? "OFFLINE" 
                : netExport > 0
                  ? "Exporting"
                  : netExport < 0
                    ? "Importing"
                    : "Idle"}
            </span>
            <span className="text-[10px] text-muted-foreground">
              {isOutage 
                ? "0.00 kW" 
                : netExport > 0
                  ? `+${netExport.toFixed(2)} kW`
                  : `${netExport.toFixed(2)} kW`}
            </span>
          </div>
        </div>

        {/* Center Node (Home Inverter Hub) */}
        <div className="absolute top-[50%] left-[50%] transform -translate-x-1/2 -translate-y-1/2 h-14 w-14 rounded-full bg-primary border-4 border-background flex items-center justify-center shadow-lg z-20">
          <Zap className="h-5 w-5 text-primary-foreground" />
        </div>
      </div>

      {/* ==========================================
          MOBILE PORTRAIT CROSS LAYOUT (sm:hidden)
          ========================================== */}
      <div className="relative sm:hidden w-full h-80 mx-auto bg-surface-container-low/30 rounded-xl overflow-hidden">
        {/* SVG Canvas for Mobile Straight Flow Lines */}
        <svg
          className="absolute inset-0 w-full h-full pointer-events-none"
          viewBox="0 0 300 320"
        >
          {/* 1. Solar -> Inverter (Vertical down) */}
          {solarGen > 0 && (
            <path
              d="M 150,55 L 150,160"
              className="stroke-energy-solar fill-none stroke-3"
              strokeDasharray="6,6"
              style={{
                animation: `flowDash ${getDashSpeed(solarGen)} linear infinite`,
              }}
            />
          )}

          {/* 2. Battery <-> Inverter (Horizontal left/right) */}
          {batteryFlow !== 0 && (
            <path
              d={isCharging ? "M 150,160 L 58,160" : "M 58,160 L 150,160"}
              className="stroke-energy-battery fill-none stroke-3"
              strokeDasharray="6,6"
              style={{
                animation: `flowDash ${getDashSpeed(batteryFlow)} linear infinite`,
              }}
            />
          )}

          {/* 3. Inverter <-> Community Grid (Horizontal right/left) */}
          {netExport !== 0 && (
            <path
              d={isExporting ? "M 150,160 L 242,160" : "M 242,160 L 150,160"}
              className={
                isExporting
                  ? "stroke-energy-solar fill-none stroke-3"
                  : "stroke-energy-grid fill-none stroke-3"
              }
              strokeDasharray="6,6"
              style={{
                animation: `flowDash ${getDashSpeed(netExport)} linear infinite`,
              }}
            />
          )}

          {/* 4. Inverter -> Home Load (Vertical down) */}
          {homeDemand > 0 && (
            <path
              d="M 150,160 L 150,265"
              className="stroke-energy-battery fill-none stroke-3"
              strokeDasharray="6,6"
              style={{
                animation: `flowDash ${getDashSpeed(homeDemand)} linear infinite`,
              }}
            />
          )}
        </svg>

        {/* Node 1: Solar (Top Center) */}
        <div className="absolute top-2 left-1/2 -translate-x-1/2 flex flex-col items-center p-2 rounded-lg bg-surface-container border border-border w-28 text-center">
          <Sun className="h-5 w-5 text-energy-solar mb-0.5 animate-spin-slow" />
          <span className="text-[9px] font-semibold text-muted-foreground uppercase">
            Solar
          </span>
          <span className="font-headline font-bold text-xs text-foreground mt-0.5">
            {formatEnergy(solarGen, "kW")}
          </span>
        </div>

        {/* Node 3: Battery (Middle Left) */}
        <div className="absolute left-2 top-28.75 flex flex-col items-center p-2 rounded-lg bg-surface-container border border-border w-26 text-center">
          <Battery className="h-5 w-5 text-energy-battery mb-0.5" />
          <span className="text-[9px] font-semibold text-muted-foreground uppercase">
            Battery
          </span>
          <span className="font-headline font-bold text-xs text-foreground mt-0.5">
            {batterySoc.toFixed(0)}%
          </span>
          <span className="text-[9px] text-muted-foreground font-semibold">
            {batteryFlow > 0
              ? `+${batteryFlow.toFixed(1)}kW`
              : `${batteryFlow.toFixed(1)}kW`}
          </span>
        </div>

        {/* Center Node (Home Inverter Hub) */}
        <div className="absolute top-40 left-37.5 -translate-x-1/2 -translate-y-1/2 h-10 w-10 rounded-full bg-primary border-2 border-background flex items-center justify-center shadow-md z-20">
          <Zap className="h-4.5 w-4.5 text-primary-foreground" />
        </div>

        {/* Node 4: Community Grid (Middle Right) */}
        <div className={cn(
          "absolute right-2 top-28.75 flex flex-col items-center p-2 rounded-lg border w-26 text-center transition-colors duration-300 shadow-xs",
          isOutage 
            ? "bg-red-50 border-red-200 text-red-700 dark:bg-red-950/20 dark:border-red-900/50" 
            : "bg-surface-container border border-border w-26 text-center"
        )}>
          <Zap className={cn("h-5 w-5 mb-0.5", isOutage ? "text-red-500 fill-red-100 animate-pulse" : "text-energy-solar")} />
          <span className="text-[9px] font-semibold text-muted-foreground uppercase">
            CEE Grid
          </span>
          <span className={cn("font-headline font-bold text-xs mt-0.5", isOutage ? "text-red-600" : "text-foreground")}>
            {isOutage 
              ? "OFFLINE" 
              : netExport > 0 
                ? "Export" 
                : netExport < 0 
                  ? "Import" 
                  : "Idle"}
          </span>
          <span className="text-[9px] text-muted-foreground font-semibold">
            {isOutage 
              ? "0.0kW" 
              : netExport > 0
                ? `+${netExport.toFixed(1)}kW`
                : `${netExport.toFixed(1)}kW`}
          </span>
        </div>

        {/* Node 2: Home Load (Bottom Center) */}
        <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex flex-col items-center p-2 rounded-lg bg-surface-container border border-border w-28 text-center">
          <Home className="h-5 w-5 text-energy-battery mb-0.5" />
          <span className="text-[9px] font-semibold text-muted-foreground uppercase">
            Home Load
          </span>
          <span className="font-headline font-bold text-xs text-foreground mt-0.5">
            {formatEnergy(homeDemand, "kW")}
          </span>
        </div>
      </div>
    </div>
  );
}
