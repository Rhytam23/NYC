"use client";

import { useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { MOCK_COMMUNITY } from "@/lib/mock-store";
import { Brain, Sparkles, RefreshCw } from "lucide-react";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from "recharts";

/**
 * AI Insights Page — Pixel-faithful implementation of Stitch Screen de082f6b2b3b49e297c54775f6cce7c1.
 * Displays 24-hr demand and solar generation forecast curves.
 */
export default function AiInsights() {
  const [loading, setLoading] = useState(false);

  // Simulated 24-hour forecast data (bell curve solar vs dual-peak demand)
  const forecastData = Array.from({ length: 24 }).map((_, i) => {
    const hour = (7 + i) % 24; // start from morning 7 AM

    // Bell curve solar output
    let solar = 0;
    if (hour >= 6 && hour <= 18) {
      const peakHour = 12;
      solar = 320 * Math.exp(-Math.pow(hour - peakHour, 2) / 16);
    }

    // Dual peak household demand
    let demand = 140;
    if (hour >= 8 && hour <= 10) demand = 260; // morning peak
    if (hour >= 18 && hour <= 21) demand = 310; // evening peak

    return {
      time: `${hour}:00`,
      Solar: Math.max(0, parseFloat(solar.toFixed(1))),
      Demand: parseFloat((demand + Math.sin(i) * 10).toFixed(1)),
    };
  });

  const handleRecalculate = () => {
    setLoading(true);
    setTimeout(() => setLoading(false), 800);
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="font-headline text-2xl font-bold text-foreground flex items-center gap-2">
            <Brain className="h-6 w-6 text-secondary" /> AI Insights Center
          </h2>
          <p className="text-body-sm text-muted-foreground">
            24-hour predictive demand and generation modeling for{" "}
            {MOCK_COMMUNITY.rwa_name}.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleRecalculate}
            disabled={loading}
          >
            <RefreshCw
              className={`h-4 w-4 mr-1.5 ${loading ? "animate-spin" : ""}`}
            />
            Recalculate VPP Model
          </Button>
        </div>
      </div>

      {/* Main forecast charts layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Forecast charts */}
        <Card className="border border-border lg:col-span-2">
          <CardHeader className="pb-2 flex flex-row items-center justify-between">
            <div>
              <CardTitle className="text-headline-md text-foreground">
                24-Hour Irradiance & Load Model
              </CardTitle>
              <CardDescription className="text-body-sm text-muted-foreground">
                Predictive PV output matched against residential secondary bus
                demand curves.
              </CardDescription>
            </div>
            <div className="flex items-center gap-2 text-xs">
              <span className="flex items-center gap-1">
                <span className="h-3 w-3 bg-energy-solar/20 border border-energy-solar rounded-sm" />{" "}
                Solar
              </span>
              <span className="flex items-center gap-1">
                <span className="h-3 w-3 bg-energy-battery/20 border border-energy-battery rounded-sm" />{" "}
                Load
              </span>
            </div>
          </CardHeader>
          <CardContent className="h-72 pt-4">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart
                data={forecastData}
                margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
              >
                <defs>
                  <linearGradient id="colorSolar" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.2} />
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="colorDemand" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.2} />
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis
                  dataKey="time"
                  tickLine={false}
                  style={{ fontSize: 10, fontFamily: "var(--font-label)" }}
                />
                <YAxis
                  tickLine={false}
                  style={{ fontSize: 10, fontFamily: "var(--font-label)" }}
                />
                <Tooltip
                  contentStyle={{
                    fontSize: 12,
                    borderRadius: "var(--radius-md)",
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="Solar"
                  stroke="#10b981"
                  strokeWidth={2}
                  fillOpacity={1}
                  fill="url(#colorSolar)"
                />
                <Area
                  type="monotone"
                  dataKey="Demand"
                  stroke="#3b82f6"
                  strokeWidth={2}
                  fillOpacity={1}
                  fill="url(#colorDemand)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* AI Recommendations */}
        <Card className="border border-border flex flex-col justify-between">
          <CardHeader>
            <CardTitle className="text-headline-md text-foreground flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-secondary" /> VPP Optimization
            </CardTitle>
            <CardDescription className="text-body-sm text-muted-foreground">
              Automated actions dispatched by the Decision Engine.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4 text-xs font-data">
            <div className="p-3 bg-surface-container-low border border-border/80 rounded-lg flex justify-between items-center">
              <div>
                <span className="text-muted-foreground uppercase font-semibold">
                  Grid Cleared Net Rate
                </span>
                <div className="text-base font-bold text-foreground mt-0.5">
                  ₹9.50 / kWh
                </div>
              </div>
              <Badge variant="solar">STABLE</Badge>
            </div>

            <div className="p-3 bg-surface-container-low border border-border/80 rounded-lg flex justify-between items-center">
              <div>
                <span className="text-muted-foreground uppercase font-semibold">
                  Solar self-consumption
                </span>
                <div className="text-base font-bold text-energy-solar mt-0.5">
                  92.4%
                </div>
              </div>
              <Badge variant="solar">HIGH</Badge>
            </div>

            <div className="space-y-2">
              <span className="text-muted-foreground uppercase font-semibold">
                VPP Schedule Priority
              </span>
              <div className="space-y-2 text-xs">
                <div className="flex justify-between items-center">
                  <span>1. Peak Shaving</span>
                  <span className="font-semibold text-energy-solar">
                    Completed
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span>2. Medical Triage Lock</span>
                  <span className="font-semibold text-energy-battery">
                    Active
                  </span>
                </div>
              </div>
            </div>
          </CardContent>
          <div className="p-4 border-t border-border/50 bg-surface-container-low rounded-b-lg">
            <Button size="sm" className="w-full text-xs" variant="outline">
              Review Dispatch Logs
            </Button>
          </div>
        </Card>
      </div>
    </div>
  );
}
