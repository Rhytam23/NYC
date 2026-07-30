"use client";

import { useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Slider } from "@/components/ui/slider";
import { Badge } from "@/components/ui/badge";
import {
  Settings,
  Shield,
  Key,
  Bell,
  Save,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
} from "lucide-react";
import { formatEnergy } from "@/lib/utils";

/**
 * Settings Page — Pixel-faithful implementation of Stitch Screen ab8255a79ac142abbf14176177ccbac5.
 * Allows residents to configure emergency reserve battery SOC sliders and priority tiers.
 */
export default function SettingsPage() {
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  // Rajesh's editable settings
  const [socFloor, setSocFloor] = useState<number>(35);
  const [emailAlerts, setEmailAlerts] = useState(true);
  const [pushAlerts, setPushAlerts] = useState(true);
  const [triageAlerts, setTriageAlerts] = useState(true);

  const handleSave = () => {
    setLoading(true);
    setSuccess(false);
    setTimeout(() => {
      setLoading(false);
      setSuccess(true);
      // Save local setting for runtime updates
      const demoUser = localStorage.getItem("cee_demo_user");
      if (demoUser) {
        const parsed = JSON.parse(demoUser);
        localStorage.setItem(
          "cee_demo_user",
          JSON.stringify({ ...parsed, minSocReservePct: socFloor }),
        );
      }
    }, 1000);
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h2 className="font-headline text-2xl font-bold text-foreground flex items-center gap-2">
            <Settings className="h-6 w-6 text-primary" /> Settings
          </h2>
          <p className="text-body-sm text-muted-foreground">
            Configure your household battery reserve levels, smart-load tiers,
            and notifications.
          </p>
        </div>
        <Button
          onClick={handleSave}
          disabled={loading}
          className="font-semibold gap-1.5 self-start md:self-auto"
        >
          {loading ? (
            "Saving…"
          ) : (
            <>
              <Save className="h-4 w-4" />
              Save Settings
            </>
          )}
        </Button>
      </div>

      {/* Success banner */}
      {success && (
        <div className="rounded-(--radius-lg) bg-energy-solar/10 border border-energy-solar/20 p-4 text-energy-solar flex items-center gap-3">
          <CheckCircle2 className="h-5 w-5 shrink-0" />
          <p className="text-body-sm font-medium">
            Settings saved successfully!
          </p>
        </div>
      )}

      {/* Grid of Settings Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Card 1: Battery Reserve settings (slider) */}
        <Card className="border border-border">
          <CardHeader>
            <CardTitle className="text-headline-md text-foreground flex items-center gap-2">
              <Shield className="h-5 w-5 text-energy-battery" /> Battery Reserve
              Floor
            </CardTitle>
            <CardDescription className="text-body-sm text-muted-foreground">
              Define the minimum State of Charge (SOC) to reserve for your home.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="p-4 rounded-xl bg-surface-container border border-border/50 text-center space-y-2">
              <span className="text-muted-foreground text-xs uppercase font-semibold">
                Reserved Capacity
              </span>
              <div className="text-3xl font-headline font-bold text-foreground font-data">
                {formatEnergy(socFloor, "%")}
              </div>
              <p className="text-[10px] text-muted-foreground">
                In VPP sharing mode, CEE-AI will never discharge your battery
                below this level.
              </p>
            </div>

            <div className="space-y-4">
              <Slider
                value={[socFloor]}
                onValueChange={(val) => setSocFloor(val[0])}
                min={20}
                max={90}
                step={5}
                className="py-4"
              />
              <div className="flex justify-between text-[10px] font-semibold text-muted-foreground tracking-wide font-data">
                <span>MIN: 20%</span>
                <span>RECOMMENDED: 35%</span>
                <span>MAX: 90%</span>
              </div>
            </div>
          </CardContent>
          <CardFooter className="border-t border-border/50 p-4 bg-surface-container-low rounded-b-lg flex gap-2 text-xs text-muted-foreground">
            <AlertTriangle className="h-4 w-4 text-energy-warning shrink-0" />
            <span>
              Medical homes must maintain a reserve floor of at least 30%.
            </span>
          </CardFooter>
        </Card>

        {/* Card 2: Emergency Triage load classification */}
        <Card className="border border-border">
          <CardHeader>
            <CardTitle className="text-headline-md text-foreground flex items-center gap-2">
              <Shield className="h-5 w-5 text-energy-critical" /> Smart Load
              Shedding
            </CardTitle>
            <CardDescription className="text-body-sm text-muted-foreground">
              Assign household circuits to emergency priorities.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4 text-xs font-data">
            {[
              {
                circuit: "Living Room Lights & Fans",
                tier: "TIER_2_BASIC",
                color: "tier2" as const,
              },
              {
                circuit: "Tata Nexon EV Charger",
                tier: "TIER_3_DEFERRABLE",
                color: "tier3" as const,
              },
              {
                circuit: "Kitchen Refrigerator",
                tier: "TIER_2_BASIC",
                color: "tier2" as const,
              },
              {
                circuit: "Water Booster Pump",
                tier: "TIER_1_LIFELINE",
                color: "tier1" as const,
              },
            ].map((c, i) => (
              <div
                key={i}
                className="flex items-center justify-between p-3 rounded-lg border border-border bg-surface-container-low"
              >
                <span className="font-semibold text-foreground">
                  {c.circuit}
                </span>
                <Badge
                  variant={c.color}
                  className="text-[9px] py-0 px-1.5 font-bold uppercase tracking-wider"
                >
                  {c.tier.replace("TIER_", "")}
                </Badge>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Card 3: Inverter integration (OAuth connect) */}
        <Card className="border border-border">
          <CardHeader>
            <CardTitle className="text-headline-md text-foreground flex items-center gap-2">
              <Key className="h-5 w-5 text-primary" /> OEM Credentials
            </CardTitle>
            <CardDescription className="text-body-sm text-muted-foreground">
              Connect or update your smart inverter API credentials.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Connected Provider
              </label>
              <Input
                value="Enphase Enlighten API"
                disabled
                className="bg-muted text-muted-foreground"
              />
            </div>

            <div className="space-y-2">
              <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Inverter Serial Number
              </label>
              <Input
                value="EN-1049283-MEADOWS"
                disabled
                className="bg-muted text-muted-foreground"
              />
            </div>

            <Button
              variant="outline"
              className="w-full text-xs font-semibold gap-1.5"
            >
              Reconnect Enphase Account
              <ArrowRight className="h-3.5 w-3.5" />
            </Button>
          </CardContent>
        </Card>

        {/* Card 4: Notification preferences */}
        <Card className="border border-border">
          <CardHeader>
            <CardTitle className="text-headline-md text-foreground flex items-center gap-2">
              <Bell className="h-5 w-5 text-secondary" /> Alerts & Notifications
            </CardTitle>
            <CardDescription className="text-body-sm text-muted-foreground">
              Manage how CEE-AI alerts you of grid changes or storm risks.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <div className="text-sm font-semibold text-foreground">
                  Email Outage Notifications
                </div>
                <div className="text-xs text-muted-foreground">
                  Receive details about community blackouts.
                </div>
              </div>
              <Switch checked={emailAlerts} onCheckedChange={setEmailAlerts} />
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <div className="text-sm font-semibold text-foreground">
                  Push Alerts
                </div>
                <div className="text-xs text-muted-foreground">
                  Realtime mobile alerts for emergency shifts.
                </div>
              </div>
              <Switch checked={pushAlerts} onCheckedChange={setPushAlerts} />
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <div className="text-sm font-semibold text-foreground">
                  IMD Storm Warning pre-charges
                </div>
                <div className="text-xs text-muted-foreground">
                  Receive notification before FORCE_CHARGE is triggered.
                </div>
              </div>
              <Switch
                checked={triageAlerts}
                onCheckedChange={setTriageAlerts}
              />
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
