"use client";

import { useState, useEffect } from "react";
import { BatteryGauge } from "@/components/energy/battery-gauge";
import { EnergyFlowVisualizer } from "@/components/energy/energy-flow-visualizer";
import { LedgerBalanceBadge } from "@/components/energy/ledger-balance-badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Sun,
  Battery,
  Activity,
  ShieldAlert,
  AlertTriangle,
  ArrowRight,
  BrainCircuit,
  RefreshCw,
  Zap,
} from "lucide-react";
import { formatINR } from "@/lib/utils";

/**
 * Resident Dashboard — Pixel-faithful implementation of Stitch Screen 58d57dc8bf4a41188e4fcc56ad09f12b
 * and Live Flow Screen a987c7a9b03a4115b9b7b34941eb8a1a.
 */
export default function ResidentDashboard() {
  const [loading, setLoading] = useState(false);
  const [gridStatus, setGridStatus] = useState<
    "NORMAL" | "OUTAGE_DG_ACTIVE" | "CYCLONE_ALERT"
  >("NORMAL");

  // Simulated realtime telemetry state corresponding to Rajesh's home
  const [telemetry, setTelemetry] = useState(() => {
    const base = {
      solarGen: 5.82,
      batterySoc: 78.5,
      batteryFlow: 1.2, // charging
      homeDemand: 2.1,
      netExport: 2.52,
      ceeCredits: 160.5,
    };
    if (typeof window !== "undefined") {
      const stored = localStorage.getItem("cee_demo_user");
      if (stored) {
        try {
          const user = JSON.parse(stored);
          if (user.persona === "consumer") {
            return {
              solarGen: 0.0,
              batterySoc: 0.0,
              batteryFlow: 0.0,
              homeDemand: 1.2,
              netExport: -1.2,
              ceeCredits: -40.0,
            };
          } else if (user.persona === "admin") {
            return {
              solarGen: 0.0,
              batterySoc: 0.0,
              batteryFlow: 0.0,
              homeDemand: 3.5,
              netExport: -3.5,
              ceeCredits: -65.0,
            };
          } else if (user.persona === "manager") {
            return {
              solarGen: 284.5,
              batterySoc: 81.2,
              batteryFlow: 12.4,
              homeDemand: 310.0,
              netExport: 25.5,
              ceeCredits: 4520.0,
            };
          } else if (user.persona === "platform_admin") {
            return {
              solarGen: 1284.5,
              batterySoc: 83.5,
              batteryFlow: 54.2,
              homeDemand: 1520.0,
              netExport: -235.5,
              ceeCredits: 24500.0,
            };
          }
        } catch {}
      }
    }
    return base;
  });

  const [userName] = useState(() => {
    if (typeof window !== "undefined") {
      const stored = localStorage.getItem("cee_demo_user");
      if (stored) {
        try {
          const user = JSON.parse(stored);
          if (user.persona === "consumer") return "Dr. Meenakshi";
          if (user.persona === "admin") return "Col. Nair";
          if (user.persona === "manager") return "Amit";
          if (user.persona === "platform_admin") return "Ops Admin";
        } catch {}
      }
    }
    return "Rajesh";
  });

  const [userMessage] = useState(() => {
    if (typeof window !== "undefined") {
      const stored = localStorage.getItem("cee_demo_user");
      if (stored) {
        try {
          const user = JSON.parse(stored);
          if (user.persona === "consumer") {
            return "Your home is protected under Tier 0 Medical priority. Drawing clean backup power from Rajesh's battery.";
          }
          if (user.persona === "admin") {
            return "You are logged in as RWA Admin. You have access to the Emergency Control Center.";
          }
          if (user.persona === "manager") {
            return "You are logged in as Community Manager. Overseeing billing settlements and grid routing for Palm Meadows RWA.";
          }
          if (user.persona === "platform_admin") {
            return "You are logged in as CEE-AI Platform Admin. Overseeing community microgrids across Whitefield DISCOM feeders.";
          }
        } catch {}
      }
    }
    return "Your home energy network is balanced and exporting clean power to the community.";
  });

  const [hardwareStatus, setHardwareStatus] = useState<{
    hardware_mode: string;
    active_source: string;
    hardware_online: boolean;
    status_label: string;
    status_color: string;
    gateway_online: boolean;
  }>({
    hardware_mode: "simulated",
    active_source: "SIMULATED",
    hardware_online: false,
    status_label: "Simulation Mode",
    status_color: "amber",
    gateway_online: false,
  });

  useEffect(() => {
    fetch("/api/v1/hardware/status")
      .then((res) => res.json())
      .then((payload) => {
        if (payload.status === "success" && payload.data) {
          setHardwareStatus(payload.data);
        }
      })
      .catch((err) => console.error("Error fetching hardware status:", err));
  }, []);

  // Handle simulation of outage
  const toggleOutageSimulation = () => {
    if (gridStatus === "NORMAL") {
      setGridStatus("OUTAGE_DG_ACTIVE");
      setTelemetry((prev) => ({
        ...prev,
        solarGen: 3.2,
        batteryFlow: -1.5, // discharging to support community
        netExport: 1.2, // exporting virtual credits
        homeDemand: 2.0, // shedding deferrable loads
      }));
    } else {
      setGridStatus("NORMAL");
      setTelemetry((prev) => ({
        ...prev,
        solarGen: 5.82,
        batteryFlow: 1.2,
        netExport: 2.52,
        homeDemand: 2.1,
      }));
    }
  };

  const handleRefresh = () => {
    setLoading(true);
    setTimeout(() => setLoading(false), 500);
  };

  return (
    <div className="space-y-6">
      {/* Overview header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="font-headline text-2xl font-bold text-foreground">
            Welcome back, {userName}
          </h2>
          <p className="text-body-sm text-muted-foreground">
            {userMessage}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleRefresh}
            disabled={loading}
          >
            <RefreshCw
              className={`h-4 w-4 mr-1.5 ${loading ? "animate-spin" : ""}`}
            />
            Refresh
          </Button>
          <Button
            variant={gridStatus === "NORMAL" ? "outline" : "emergency"}
            size="sm"
            onClick={toggleOutageSimulation}
            className="font-semibold"
          >
            <AlertTriangle className="h-4 w-4 mr-1.5" />
            {gridStatus === "NORMAL" ? "Simulate Outage" : "Restore Grid"}
          </Button>
        </div>
      </div>

      {/* Grid status banners (ui_rules.md §1.1) */}
      {gridStatus !== "NORMAL" && (
        <div className="rounded-(--radius-lg) bg-energy-critical/10 border border-energy-critical/20 p-4 text-energy-critical flex items-start gap-3.5 animate-pulse">
          <ShieldAlert className="h-5 w-5 shrink-0 mt-0.5" />
          <div className="flex-1">
            <h4 className="font-headline font-bold text-sm">
              Active Grid Blackout Detected
            </h4>
            <p className="text-body-sm opacity-90 mt-1">
              Community Virtual Power Plant (VPP) active. Throttling
              Rajesh&apos;s EV charger and directing battery exports to protect
              medical emergency loads (Dr. Meenakshi Sundaram - Apartment 402).
            </p>
          </div>
          <Badge variant="tier0" className="mt-0.5">
            TRIAGE ACTIVE
          </Badge>
        </div>
      )}

      {/* Core Telemetry Widgets */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Widget 1: State of Charge (Battery) */}
        <Card className="border border-border flex flex-col justify-between">
          <CardHeader className="pb-2">
            <CardTitle className="text-label-caps text-muted-foreground flex items-center gap-1.5">
              <Battery className="h-4 w-4" /> Battery Storage
            </CardTitle>
            <CardDescription className="text-xs">
              Capacity: 10 kWh LFP bank
            </CardDescription>
          </CardHeader>
          <CardContent className="flex justify-center py-4">
            <BatteryGauge
              soc={telemetry.batterySoc}
              flowKw={telemetry.batteryFlow}
              size="md"
            />
          </CardContent>
          <div className="border-t border-border/50 p-4 flex items-center justify-between text-xs text-muted-foreground font-data bg-surface-container-low rounded-b-lg">
            <span>Temp: 28.5°C</span>
            <span>Cycles: 142</span>
            <span>SoH: 98.2%</span>
          </div>
        </Card>

        {/* Widget 2: CEE Credits Balance */}
        <Card className="border border-border flex flex-col justify-between">
          <CardHeader className="pb-2">
            <CardTitle className="text-label-caps text-muted-foreground flex items-center gap-1.5">
              <Zap className="h-4 w-4" /> Energy Ledger
            </CardTitle>
            <CardDescription className="text-xs">
              Billing Period: July 2026
            </CardDescription>
          </CardHeader>
          <CardContent className="py-6 flex flex-col items-center justify-center text-center space-y-4">
            <div className="text-4xl font-headline font-bold text-foreground">
              {formatINR(telemetry.ceeCredits * 8.55)}
            </div>
            <LedgerBalanceBadge balance={telemetry.ceeCredits} />
            <p className="text-xs text-muted-foreground max-w-50">
              Credited directly against your monthly RWA Common Area Maintenance
              (CAM) bill.
            </p>
          </CardContent>
          <div className="border-t border-border/50 p-4 flex items-center justify-between text-xs text-muted-foreground font-data bg-surface-container-low rounded-b-lg">
            <span>Shared: 180.5 kWh</span>
            <span>Received: 20 kWh</span>
          </div>
        </Card>

        {/* Widget 3: Live Flow & OEM Integration Status */}
        <Card className="border border-border flex flex-col justify-between">
          <CardHeader className="pb-2">
            <CardTitle className="text-label-caps text-muted-foreground flex items-center gap-1.5">
              <Sun className="h-4 w-4" /> Hardware Status
            </CardTitle>
            <CardDescription className="text-xs">
              Mode: {hardwareStatus.hardware_mode.toUpperCase()}
            </CardDescription>
          </CardHeader>
          <CardContent className="py-6 space-y-4">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Gateway:</span>
              <Badge variant={hardwareStatus.gateway_online || hardwareStatus.hardware_mode === "simulated" ? "solar" : "outline"} className="text-[10px]">
                {hardwareStatus.gateway_online || hardwareStatus.hardware_mode === "simulated" ? "ONLINE" : "OFFLINE"}
              </Badge>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Active Source:</span>
              <span className="font-semibold text-xs font-data">
                {hardwareStatus.active_source}
              </span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Status:</span>
              <span className={`font-semibold text-xs text-${hardwareStatus.status_color}-500`}>
                {hardwareStatus.status_label}
              </span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Local Bus:</span>
              <span className="font-data text-xs">Modbus RTU (9.6k)</span>
            </div>
          </CardContent>
          <div className="border-t border-border/50 p-4 flex items-center justify-between text-xs text-muted-foreground bg-surface-container-low rounded-b-lg">
            <span>Next telemetry sync in 15s</span>
          </div>
        </Card>
      </div>

      {/* Energy Flow Animation and Recommendations Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left: SVG Animated Flow visualizer */}
        <Card className="border border-border">
          <CardHeader className="pb-0">
            <CardTitle className="text-headline-md text-foreground">
              Energy Flow Visualization
            </CardTitle>
            <CardDescription className="text-body-sm text-muted-foreground">
              Real-time energy routing between resources and the community
              distribution line.
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-6">
            <EnergyFlowVisualizer
              solarGen={telemetry.solarGen}
              batteryFlow={telemetry.batteryFlow}
              batterySoc={telemetry.batterySoc}
              homeDemand={telemetry.homeDemand}
              netExport={telemetry.netExport}
              gridStatus={
                gridStatus === "NORMAL" ? "GRID NORMAL" : "OUTAGE - VPP ACTIVE"
              }
            />
          </CardContent>
        </Card>

        {/* Right: AI Engine Insights & Optimization (reduced for V1) */}
        <Card className="border border-border flex flex-col justify-between">
          <CardHeader>
            <CardTitle className="text-headline-md text-foreground flex items-center gap-2">
              <BrainCircuit className="h-5 w-5 text-secondary" /> AI Decision
              Engine
            </CardTitle>
            <CardDescription className="text-body-sm text-muted-foreground">
              AI-orchestrated dispatch schedules and home battery optimization.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {gridStatus === "NORMAL" ? (
              <div className="rounded-(--radius-lg) border border-border bg-surface-container-low p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-muted-foreground uppercase">
                    Current Strategy
                  </span>
                  <Badge variant="solar" className="text-[10px]">
                    SOLAR SELF-CONSUMPTION
                  </Badge>
                </div>
                <p className="text-body-sm text-foreground">
                  Rooftop solar generation is currently high. Power is
                  prioritizing home demand, charging battery to 100% and
                  exporting a net surplus of{" "}
                  <span className="font-semibold text-energy-solar">
                    2.52 kW
                  </span>{" "}
                  to the community grid.
                </p>
                <div className="text-xs text-muted-foreground font-data mt-2 flex items-center justify-between">
                  <span>Clearing rate: ₹9.50/kWh</span>
                  <span className="text-energy-solar font-semibold">
                    Earning ₹21.55/hr
                  </span>
                </div>
              </div>
            ) : (
              <div className="rounded-(--radius-lg) border border-energy-critical/30 bg-energy-critical/5 p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-energy-critical uppercase">
                    Current Strategy
                  </span>
                  <Badge variant="tier0" className="text-[10px]">
                    EMERGENCY TRIAGE
                  </Badge>
                </div>
                <p className="text-body-sm text-foreground">
                  The central grid is offline. The AI Engine has locked your
                  battery reserve at{" "}
                  <span className="font-semibold">35% SOC</span>. Paused EV
                  Charger Nexon. Exporting{" "}
                  <span className="font-semibold text-energy-solar">
                    1.20 kW
                  </span>{" "}
                  to the community common bus to maintain grid integrity for
                  Tier 0 Medical homes.
                </p>
                <div className="text-xs text-muted-foreground font-data mt-2 flex items-center justify-between">
                  <span>Clearing rate: ₹9.50/kWh</span>
                  <span className="text-energy-solar font-semibold">
                    DG Avoidance Active
                  </span>
                </div>
              </div>
            )}

            <div className="space-y-2">
              <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Recommendations
              </h4>
              <div className="space-y-2.5">
                {[
                  {
                    message:
                      "Solar output peak expected between 11:30 AM and 1:30 PM. Delay high-demand domestic loads.",
                    type: "info",
                  },
                  {
                    message:
                      "Monsoon storm forecast tomorrow. AI Engine recommends charging battery to 100% pre-charge.",
                    type: "charge",
                  },
                ].map((rec, i) => (
                  <div
                    key={i}
                    className="flex gap-2.5 items-start text-xs bg-surface-container/50 border border-border/50 p-2.5 rounded-lg"
                  >
                    <Activity className="h-4 w-4 text-secondary shrink-0 mt-0.5" />
                    <p className="text-muted-foreground">{rec.message}</p>
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
          <div className="p-6 pt-0">
            <Button className="w-full" variant="outline">
              View Detailed AI Schedule
              <ArrowRight className="h-4 w-4 ml-1.5" />
            </Button>
          </div>
        </Card>
      </div>
    </div>
  );
}
