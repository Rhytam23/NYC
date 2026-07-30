"use client";

import { useSearchParams } from "next/navigation";
import { useState, Suspense } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Clock, AlertTriangle, PowerOff, ShieldAlert } from "lucide-react";

function EmergencyCenterContent() {
  const searchParams = useSearchParams();
  const activeTab = searchParams.get("tab") || "overview";

  // Blackout simulation state
  const [blackoutActive, setBlackoutActive] = useState(true);
  const [forceChargeActive, setForceChargeActive] = useState(false);

  // VPP parameters during crisis
  const emergencyStats = {
    autonomousHours: blackoutActive ? 5.42 : 12.0,
    activeTriageHomes: 8,
    shedLoads: 45,
    aggregateSoc: blackoutActive ? 78.5 : 95.0,
    dgSavedLiters: 112.5,
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="font-headline text-2xl font-bold text-foreground flex items-center gap-2">
            <AlertTriangle className="h-6 w-6 text-energy-critical animate-pulse" />
            Emergency Control Center
          </h2>
          <p className="text-body-sm text-muted-foreground">
            Monitor and manage community energy reserves during grid outages or
            severe weather.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant={blackoutActive ? "emergency" : "outline"}
            size="sm"
            onClick={() => setBlackoutActive(!blackoutActive)}
            className="font-semibold"
          >
            <PowerOff className="h-4 w-4 mr-1.5" />
            {blackoutActive ? "Simulating Grid Failure" : "Simulate Outage"}
          </Button>
        </div>
      </div>

      {/* Outage Countdown Ticker (ui_rules.md §3.3) */}
      {blackoutActive && (
        <div className="rounded-(--radius-lg) border-2 border-energy-critical bg-energy-critical/10 p-4 sm:p-5 text-energy-critical flex flex-col sm:flex-row items-center sm:justify-between gap-4 sm:gap-0 shadow-lg">
          <div className="flex items-center gap-3">
            <Clock className="h-8 w-8 animate-pulse shrink-0" />
            <div>
              <h3 className="font-headline font-bold text-base sm:text-lg leading-tight text-center sm:text-left">
                Estimated Community Autonomous Runtime
              </h3>
              <p className="text-xs opacity-90 mt-1 text-center sm:text-left">
                Virtual power plant active. Supporting Tier 0 and Tier 1 loads
                with neighbor reserves.
              </p>
            </div>
          </div>
          <div className="text-center sm:text-right w-full sm:w-auto shrink-0 border-t sm:border-t-0 border-energy-critical/20 pt-3 sm:pt-0">
            <div className="font-headline font-extrabold text-2xl tracking-tight">
              {emergencyStats.autonomousHours.toFixed(2)} Hours
            </div>
            <Badge
              variant="critical"
              className="text-[10px] uppercase font-bold tracking-wider mt-1 px-2.5 py-0.5 animate-pulse bg-energy-critical text-white border-none"
            >
              DG Avoided
            </Badge>
          </div>
        </div>
      )}

      {/* Expanded Tab Switching inside Workspace Panel */}
      {activeTab === "overview" && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Operations Summary */}
          <Card className="border border-border lg:col-span-2">
            <CardHeader>
              <CardTitle className="text-headline-md text-foreground">
                Critical Feeder Status
              </CardTitle>
              <CardDescription className="text-body-sm text-muted-foreground">
                Current energy netting layout across Whitefield residential
                secondary bus.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-3 gap-4 text-center font-data">
                <div className="p-3 bg-surface-container-low rounded-lg border border-border/50">
                  <div className="text-2xl font-bold text-energy-solar">
                    {emergencyStats.aggregateSoc.toFixed(1)}%
                  </div>
                  <div className="text-[10px] text-muted-foreground uppercase font-semibold mt-1">
                    VPP Aggregate SOC
                  </div>
                </div>
                <div className="p-3 bg-surface-container-low rounded-lg border border-border/50">
                  <div className="text-2xl font-bold text-energy-critical">
                    {emergencyStats.activeTriageHomes}
                  </div>
                  <div className="text-[10px] text-muted-foreground uppercase font-semibold mt-1">
                    T0 Medical Active
                  </div>
                </div>
                <div className="p-3 bg-surface-container-low rounded-lg border border-border/50">
                  <div className="text-2xl font-bold text-energy-warning">
                    {emergencyStats.shedLoads}
                  </div>
                  <div className="text-[10px] text-muted-foreground uppercase font-semibold mt-1">
                    EV/HVAC Shedded
                  </div>
                </div>
              </div>

              {/* Crisis details */}
              <div className="space-y-3">
                <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  Feeder Bus Allocation
                </h4>
                <div className="space-y-2 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">
                      Tier 0 (Medical) draw:
                    </span>
                    <span className="font-semibold font-data">6.40 kW</span>
                  </div>
                  <Progress
                    value={90}
                    className="h-2"
                    indicatorClassName="bg-energy-critical"
                  />
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">
                      Tier 1 (Common area) draw:
                    </span>
                    <span className="font-semibold font-data">8.50 kW</span>
                  </div>
                  <Progress
                    value={75}
                    className="h-2"
                    indicatorClassName="bg-energy-warning"
                  />
                </div>
              </div>
            </CardContent>
            <CardFooter className="border-t border-border/50 p-4 bg-surface-container-low rounded-b-lg flex items-center justify-between text-xs text-muted-foreground">
              <span>Feeder Sync: Active</span>
              <span className="text-energy-solar font-semibold">
                0 Liters Diesel Burned
              </span>
            </CardFooter>
          </Card>

          {/* Alert Center Incidents Panel */}
          <Card className="border border-border">
            <CardHeader>
              <CardTitle className="text-headline-md text-foreground">
                Incident Log
              </CardTitle>
              <CardDescription className="text-body-sm text-muted-foreground">
                Recent critical occurrences in Palm Meadows.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3 font-data text-xs">
              {[
                {
                  time: "14:15",
                  message: "DISCOM transformer failure. Grid outage detected.",
                  type: "critical",
                },
                {
                  time: "14:16",
                  message:
                    "Emergency Priority Lock activated. Minimum SOC set to 30%.",
                  type: "warning",
                },
                {
                  time: "14:16",
                  message:
                    "Shedded EV chargers for 45 homes via OCPP throttle commands.",
                  type: "success",
                },
              ].map((inc, i) => (
                <div
                  key={i}
                  className="flex gap-2.5 items-start bg-surface-container-low border border-border/50 p-2.5 rounded-lg"
                >
                  <span className="font-bold text-[10px] text-muted-foreground shrink-0 mt-0.5">
                    {inc.time}
                  </span>
                  <p className="text-foreground">{inc.message}</p>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      )}

      {activeTab === "triage" && (
        <Card className="border border-border">
          <CardHeader>
            <CardTitle className="text-headline-md text-foreground">
              Priority Triage Lists
            </CardTitle>
            <CardDescription className="text-body-sm text-muted-foreground">
              Active load shedding and lock commands based on PRD §7.3 4-tier
              priorities.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {[
              {
                tier: "Tier 0 (Medical)",
                description:
                  "Oxygen concentrators, ventilators, medical refrigeration. Minimum 30% SOC floor.",
                color: "text-energy-critical bg-energy-critical/10",
                count: 8,
                homes: "Dr. Meenakshi Sundaram (A-402), 7 other homes",
              },
              {
                tier: "Tier 1 (Lifeline)",
                description:
                  "Water pumps, lifts, fire security, gate control. Allocated dynamically.",
                color: "text-energy-warning bg-energy-warning/10",
                count: 12,
                homes: "Feeder Pump 1, Gate Terminal 2, Common Lift Block A",
              },
              {
                tier: "Tier 2 & 3 (Deferrable)",
                description:
                  "Air conditioning, EV charging, non-essential plugs. Automatically paused or throttled.",
                color: "text-muted-foreground bg-muted",
                count: 45,
                homes: "Rajesh Sharma (V-104 - EV charger paused)",
              },
            ].map((prio, i) => (
              <div
                key={i}
                className="p-4 rounded-xl border border-border bg-surface-container-low space-y-2"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Badge
                      className={`font-headline font-bold text-xs ${prio.color} border-none`}
                    >
                      {prio.tier}
                    </Badge>
                    <span className="text-xs text-muted-foreground font-semibold">
                      {prio.count} Active
                    </span>
                  </div>
                </div>
                <p className="text-xs text-muted-foreground">
                  {prio.description}
                </p>
                <div className="text-[11px] font-data text-foreground border-t border-border/30 pt-2">
                  Active circuits:{" "}
                  <span className="font-semibold">{prio.homes}</span>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {activeTab === "grid" && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Grid Health Telemetry */}
          <Card className="border border-border lg:col-span-2">
            <CardHeader>
              <CardTitle className="text-headline-md text-foreground">
                Feeder Telemetry & Voltage Sags
              </CardTitle>
              <CardDescription className="text-body-sm text-muted-foreground">
                DISCOM grid voltage, transformer frequency, and phase alignment
                status.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-3 font-data text-xs">
                <div className="flex justify-between items-center border-b border-border/50 pb-2">
                  <span className="text-muted-foreground">
                    Incoming Line Voltage:
                  </span>
                  <span
                    className={`font-semibold ${blackoutActive ? "text-energy-critical" : "text-energy-solar"}`}
                  >
                    {blackoutActive ? "0.0 V (Slight Sag)" : "228.4 V"}
                  </span>
                </div>
                <div className="flex justify-between items-center border-b border-border/50 pb-2">
                  <span className="text-muted-foreground">
                    Feeder Bus Frequency:
                  </span>
                  <span className="font-semibold text-foreground">
                    50.02 Hz
                  </span>
                </div>
                <div className="flex justify-between items-center border-b border-border/50 pb-2">
                  <span className="text-muted-foreground">
                    Transformer Impedance:
                  </span>
                  <span className="font-semibold text-foreground">
                    0.08 Ohm
                  </span>
                </div>
              </div>
            </CardContent>
            <CardFooter className="border-t border-border/50 p-4 bg-surface-container-low rounded-b-lg flex items-center justify-between text-xs text-muted-foreground">
              <span>IEEE 1547 Grid Standard: Compliant</span>
              <span className="text-energy-solar font-semibold">
                Anti-Islanding Engaged
              </span>
            </CardFooter>
          </Card>

          {/* Precharge trigger */}
          <Card className="border border-border">
            <CardHeader>
              <CardTitle className="text-headline-md text-foreground">
                Severe Weather Alert
              </CardTitle>
              <CardDescription className="text-body-sm text-muted-foreground">
                IMD Cyclone / storm alerts monitoring.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="p-3 bg-energy-warning/10 border border-energy-warning/20 rounded-lg text-xs text-energy-warning flex gap-2">
                <ShieldAlert className="h-4.5 w-4.5 shrink-0 mt-0.5" />
                <p>
                  IMD severe monsoon warning active for South Bangalore. Outage
                  risk calculated: 72%.
                </p>
              </div>

              <Button
                variant={forceChargeActive ? "outline" : "default"}
                onClick={() => setForceChargeActive(!forceChargeActive)}
                className="w-full text-xs font-semibold"
              >
                {forceChargeActive
                  ? "Cancel Force Charge"
                  : "Activate Force Charge (VPP)"}
              </Button>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}

export default function EmergencyCenter() {
  return (
    <Suspense fallback={<div>Loading Emergency Console…</div>}>
      <EmergencyCenterContent />
    </Suspense>
  );
}
