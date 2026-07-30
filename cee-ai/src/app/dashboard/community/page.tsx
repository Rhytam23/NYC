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
import { Input } from "@/components/ui/input";
import { MOCK_COMMUNITY, MOCK_HOMES } from "@/lib/mock-store";
import {
  Zap,
  Sun,
  Battery,
  Clock,
  Search,
  HelpCircle,
  Users,
  Download,
  ArrowUpRight,
  Activity,
} from "lucide-react";
import { formatEnergy, cn } from "@/lib/utils";

/**
 * Community Dashboard — Pixel-faithful implementation of Stitch Screen 1c992a948ebf487a9cc707a089d609c1.
 * Shows VPP statistics, community aggregate telemetry, and list of community members with their emergency tier.
 */
export default function CommunityDashboard() {
  const [searchTerm, setSearchTerm] = useState("");
  const [filterTier, setFilterTier] = useState<string>("ALL");

  // VPP aggregate statistics (from API_SPEC.md §2.3)
  const vppStats = {
    totalActiveHomes: 142,
    totalSolarGenKw: 284.5,
    totalBatteryStorageKwh: 1420.0,
    aggregateSocPct: 81.2,
    totalCommunityDemandKw: 310.0,
    dgLitersAvoidedToday: 96.4,
    autonomousSurvivalHours: 5.42,
  };

  // Filter homes based on search and selected tier
  const filteredHomes = MOCK_HOMES.filter((home) => {
    const matchesSearch =
      home.resident_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      home.mygate_flat_id.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesTier =
      filterTier === "ALL" || home.emergency_tier === filterTier;
    return matchesSearch && matchesTier;
  });

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="font-headline text-2xl font-bold text-foreground">
            Community Virtual Power Plant
          </h2>
          <p className="text-body-sm text-muted-foreground">
            Aggregate microgrid telemetry and resident profiles for{" "}
            {MOCK_COMMUNITY.rwa_name}.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm">
            <Download className="h-4 w-4 mr-1.5" />
            Export Report
          </Button>
        </div>
      </div>

      {/* VPP Aggregates Grid (PRD §7.4, BUSINESS_MODEL.md §3) */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="border border-border">
          <CardHeader className="p-4 pb-2">
            <CardDescription className="text-label-caps flex items-center gap-1.5 text-[10px]">
              <Users className="h-3.5 w-3.5 text-primary" /> Active Households
            </CardDescription>
          </CardHeader>
          <CardContent className="p-4 pt-0">
            <div className="text-3xl font-headline font-bold">
              {vppStats.totalActiveHomes}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              100% cloud-API integrated
            </p>
          </CardContent>
        </Card>

        <Card className="border border-border">
          <CardHeader className="p-4 pb-2">
            <CardDescription className="text-label-caps flex items-center gap-1.5 text-[10px]">
              <Sun className="h-3.5 w-3.5 text-energy-solar" /> Solar Capacity
            </CardDescription>
          </CardHeader>
          <CardContent className="p-4 pt-0">
            <div className="text-3xl font-headline font-bold text-energy-solar">
              {formatEnergy(vppStats.totalSolarGenKw, "kW")}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Aggregate peak output
            </p>
          </CardContent>
        </Card>

        <Card className="border border-border">
          <CardHeader className="p-4 pb-2">
            <CardDescription className="text-label-caps flex items-center gap-1.5 text-[10px]">
              <Battery className="h-3.5 w-3.5 text-energy-battery" /> Storage
              Reserve
            </CardDescription>
          </CardHeader>
          <CardContent className="p-4 pt-0">
            <div className="text-3xl font-headline font-bold text-energy-battery">
              {vppStats.aggregateSocPct.toFixed(1)}% SOC
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {vppStats.totalBatteryStorageKwh.toFixed(0)} kWh capacity
            </p>
          </CardContent>
        </Card>

        <Card className="border border-border bg-secondary/5">
          <CardHeader className="p-4 pb-2">
            <CardDescription className="text-label-caps flex items-center gap-1.5 text-[10px] text-secondary">
              <Zap className="h-3.5 w-3.5" /> Diesel Avoided
            </CardDescription>
          </CardHeader>
          <CardContent className="p-4 pt-0">
            <div className="text-3xl font-headline font-bold text-secondary">
              {vppStats.dgLitersAvoidedToday.toFixed(1)} L
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              ₹{(vppStats.dgLitersAvoidedToday * 92).toLocaleString("en-IN")}{" "}
              saved today
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Main Workspace: Telemetry Map Card and Member List */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left/Middle: VPP Load vs Gen Chart & Member Grid */}
        <Card className="border border-border lg:col-span-2 flex flex-col justify-between">
          <CardHeader className="pb-3">
            <CardTitle className="text-headline-md text-foreground">
              Active Microgrid Load & Balance
            </CardTitle>
            <CardDescription className="text-body-sm text-muted-foreground">
              Total community electricity demand matched against live battery
              and solar generation.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Simple visual bar chart representing load vs gen */}
            <div className="space-y-4">
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs font-semibold">
                  <span className="text-muted-foreground">
                    COMMUNITY LOAD DEMAND
                  </span>
                  <span className="font-data">
                    {formatEnergy(vppStats.totalCommunityDemandKw, "kW")}
                  </span>
                </div>
                <div className="h-3 rounded-full bg-muted overflow-hidden">
                  <div
                    className="h-full bg-energy-battery rounded-full"
                    style={{
                      width: `${(vppStats.totalCommunityDemandKw / (vppStats.totalSolarGenKw + 100)) * 100}%`,
                    }}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs font-semibold">
                  <span className="text-muted-foreground">
                    CLEAN SOLAR GENERATION
                  </span>
                  <span className="text-energy-solar font-data">
                    {formatEnergy(vppStats.totalSolarGenKw, "kW")}
                  </span>
                </div>
                <div className="h-3 rounded-full bg-muted overflow-hidden">
                  <div
                    className="h-full bg-energy-solar rounded-full"
                    style={{
                      width: `${(vppStats.totalSolarGenKw / (vppStats.totalSolarGenKw + 100)) * 100}%`,
                    }}
                  />
                </div>
              </div>
            </div>

            {/* In-use feeder indicator */}
            <div className="rounded-xl border border-border bg-surface-container-low p-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-lg bg-energy-solar/10 flex items-center justify-center">
                  <Activity className="h-5 w-5 text-energy-solar animate-energy-pulse" />
                </div>
                <div>
                  <h4 className="text-sm font-semibold text-foreground">
                    Feeder Bus Synchronized
                  </h4>
                  <p className="text-xs text-muted-foreground">
                    Virtual microgrid balancing active.
                  </p>
                </div>
              </div>
              <Badge variant="solar" className="text-[10px]">
                STABLE FREQUENCY
              </Badge>
            </div>
          </CardContent>

          {/* Emergency Autonomous countdown timer */}
          <div className="border-t border-border/50 p-4 flex items-center justify-between bg-surface-container-low rounded-b-lg">
            <span className="text-xs text-muted-foreground flex items-center gap-1.5">
              <Clock className="h-4 w-4" /> Aggregate autonomy duration:
            </span>
            <span className="font-headline font-bold text-sm text-foreground">
              {vppStats.autonomousSurvivalHours.toFixed(2)} hours remaining
            </span>
          </div>
        </Card>

        {/* Right: Search Filter and Members List */}
        <Card className="border border-border flex flex-col justify-between">
          <CardHeader className="pb-3">
            <CardTitle className="text-headline-md text-foreground">
              Household Tiers
            </CardTitle>
            <CardDescription className="text-body-sm text-muted-foreground">
              Tenants registered under Palm Meadows.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4 flex-1">
            {/* Search input */}
            <div className="relative">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search flat / name..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-8 text-xs h-9"
              />
            </div>

            {/* Filter buttons */}
            <div className="flex flex-wrap gap-1.5">
              {[
                "ALL",
                "TIER_0_MEDICAL",
                "TIER_1_LIFELINE",
                "TIER_2_BASIC",
                "TIER_3_DEFERRABLE",
              ].map((tier) => (
                <button
                  key={tier}
                  onClick={() => setFilterTier(tier)}
                  className={cn(
                    "text-[10px] px-2 py-1 font-semibold rounded-md border tracking-wide uppercase transition-colors",
                    filterTier === tier
                      ? "bg-primary text-primary-foreground border-primary"
                      : "bg-background text-muted-foreground border-border hover:bg-accent",
                  )}
                >
                  {tier === "ALL"
                    ? "All"
                    : tier.replace("TIER_", "").replace("_", " ")}
                </button>
              ))}
            </div>

            {/* List */}
            <div className="space-y-2 max-h-55 overflow-y-auto scrollbar-thin pr-1">
              {filteredHomes.length > 0 ? (
                filteredHomes.map((home) => {
                  let badgeVariant: "tier0" | "tier1" | "tier2" | "tier3" =
                    "tier2";
                  if (home.emergency_tier === "TIER_0_MEDICAL")
                    badgeVariant = "tier0";
                  else if (home.emergency_tier === "TIER_1_LIFELINE")
                    badgeVariant = "tier1";
                  else if (home.emergency_tier === "TIER_3_DEFERRABLE")
                    badgeVariant = "tier3";

                  return (
                    <div
                      key={home.id}
                      className="flex items-center justify-between p-2.5 rounded-lg border border-border bg-surface-container-low hover:bg-surface-container transition-colors duration-150"
                    >
                      <div className="min-w-0">
                        <div className="font-headline text-xs font-semibold text-foreground truncate">
                          {home.resident_name}
                        </div>
                        <div className="text-[10px] text-muted-foreground">
                          Flat {home.mygate_flat_id} • Reserve{" "}
                          {home.min_soc_reserve_pct}%
                        </div>
                      </div>
                      <Badge
                        variant={badgeVariant}
                        className="text-[9px] py-0 px-1 font-semibold"
                      >
                        {home.emergency_tier.replace("TIER_", "")}
                      </Badge>
                    </div>
                  );
                })
              ) : (
                <div className="text-center text-xs text-muted-foreground py-6 flex flex-col items-center gap-1">
                  <HelpCircle className="h-5 w-5 text-muted-foreground/50" />
                  No residents match filter
                </div>
              )}
            </div>
          </CardContent>
          <div className="p-4 border-t border-border/50 bg-surface-container-low rounded-b-lg">
            <Button size="sm" className="w-full text-xs" variant="outline">
              Request Tier Change Approval
              <ArrowUpRight className="h-3 w-3 ml-1" />
            </Button>
          </div>
        </Card>
      </div>
    </div>
  );
}
