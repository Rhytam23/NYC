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
import { MOCK_COMMUNITY, runtimeState } from "@/lib/mock-store";
import { formatEnergy, formatINR } from "@/lib/utils";
import {
  BookOpen,
  ShieldCheck,
  ArrowDownLeft,
  ArrowUpRight,
  CheckCircle2,
  Send,
  FileJson,
} from "lucide-react";

/**
 * Energy Ledger Page — Pixel-faithful implementation of Stitch Screen bb5f72653f2046d2a0d16c612dcb80df.
 * Implements the double-entry virtual credit accounting system described in ENERGY_LEDGER.md.
 */
export default function EnergyLedger() {
  const [loading, setLoading] = useState(false);
  const [settled, setSettled] = useState(false);

  // Rajesh's energy aggregates
  const ledgerSummary = {
    energyGivenKwh: 180.5,
    energyReceivedKwh: 20.0,
    netEnergyBalanceKwh: 160.5,
    clearingRateInr: MOCK_COMMUNITY.clearing_rate_inr,
    projectedRebateInr: 1372.28, // 160.50 * 8.55 (90% of clearing rate)
  };

  const handleSettleLedger = () => {
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      setSettled(true);
    }, 1200);
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="font-headline text-2xl font-bold text-foreground">
            Energy Credit Ledger
          </h2>
          <p className="text-body-sm text-muted-foreground">
            Immutable double-entry virtual netting statement settled on your
            monthly RWA CAM bill.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" className="gap-1.5">
            <FileJson className="h-4 w-4" />
            MyGate JSON
          </Button>
          <Button
            variant={settled ? "outline" : "default"}
            size="sm"
            onClick={handleSettleLedger}
            disabled={loading || settled}
            className="font-semibold gap-1.5"
          >
            {settled ? (
              <>
                <CheckCircle2 className="h-4 w-4 text-energy-solar" />
                Settlement Completed
              </>
            ) : loading ? (
              "Calculating..."
            ) : (
              <>
                <Send className="h-4 w-4" />
                Settle & Export Billing
              </>
            )}
          </Button>
        </div>
      </div>

      {/* Monthly Netting Balance Cards (ENERGY_LEDGER.md §2) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Card 1: Energy Given */}
        <Card className="border border-border">
          <CardHeader className="pb-2">
            <CardDescription className="text-label-caps flex items-center gap-1.5 text-[10px]">
              <ArrowUpRight className="h-4 w-4 text-energy-solar" /> Energy
              Exported
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-headline font-bold text-energy-solar font-data">
              {formatEnergy(ledgerSummary.energyGivenKwh, "kWh")}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Shared with community bus
            </p>
          </CardContent>
        </Card>

        {/* Card 2: Energy Received */}
        <Card className="border border-border">
          <CardHeader className="pb-2">
            <CardDescription className="text-label-caps flex items-center gap-1.5 text-[10px]">
              <ArrowDownLeft className="h-4 w-4 text-energy-battery" /> Energy
              Imported
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-headline font-bold text-energy-battery font-data">
              {formatEnergy(ledgerSummary.energyReceivedKwh, "kWh")}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Drawn from community backup
            </p>
          </CardContent>
        </Card>

        {/* Card 3: Net Adjustment */}
        <Card className="border border-border bg-energy-solar/5">
          <CardHeader className="pb-2">
            <CardDescription className="text-label-caps flex items-center gap-1.5 text-[10px] text-energy-solar">
              <BookOpen className="h-4 w-4" /> CAM Bill Rebate
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-headline font-bold text-energy-solar font-data">
              {formatINR(ledgerSummary.projectedRebateInr)}
            </div>
            <div className="flex items-center gap-1.5 mt-1">
              <Badge variant="provider" className="text-[10px] py-0 px-1.5">
                +{ledgerSummary.netEnergyBalanceKwh.toFixed(1)} Credits
              </Badge>
              <span className="text-[10px] text-muted-foreground">
                Net Provider
              </span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Settlement Warning/Status Banner */}
      {settled && (
        <div className="rounded-(--radius-lg) bg-energy-solar/10 border border-energy-solar/20 p-4 text-energy-solar flex items-start gap-3">
          <CheckCircle2 className="h-5 w-5 shrink-0 mt-0.5" />
          <div>
            <h4 className="font-headline font-bold text-sm">
              Ledger Netting Settled Successfully
            </h4>
            <p className="text-body-sm opacity-90 mt-1">
              Net credit of{" "}
              <span className="font-semibold">
                {formatINR(ledgerSummary.projectedRebateInr)}
              </span>{" "}
              has been closed and dispatched to MyGate API. A rebate will appear
              on your RWA CAM statement on August 1st.
            </p>
          </div>
        </div>
      )}

      {/* Double-Entry Transaction Ledger Table (ENERGY_LEDGER.md §5) */}
      <Card className="border border-border">
        <CardHeader className="pb-3 border-b border-border/50 flex flex-row items-center justify-between">
          <div>
            <CardTitle className="text-headline-md text-foreground">
              Interval Transaction Log
            </CardTitle>
            <CardDescription className="text-body-sm text-muted-foreground">
              Immutable 15-minute virtual energy credits netting records.
            </CardDescription>
          </div>
          <Badge variant="solar" className="text-[10px]">
            CRYPTOGRAPHICALLY AUDITABLE
          </Badge>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-sm">
              <thead>
                <tr className="border-b border-border/50 bg-surface-container-low text-xs font-semibold text-muted-foreground uppercase">
                  <th className="p-4 pl-6">Interval Start (IST)</th>
                  <th className="p-4">Given (kWh)</th>
                  <th className="p-4">Received (kWh)</th>
                  <th className="p-4">Net Balance (CEE)</th>
                  <th className="p-4">Rate (₹)</th>
                  <th className="p-4">Value (INR)</th>
                  <th className="p-4 pr-6 text-right">Audit Signature</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/50 font-data text-xs">
                {runtimeState.transactions.map((tx) => {
                  const isCredit = tx.net_energy_balance_kwh >= 0;
                  return (
                    <tr
                      key={tx.id}
                      className="hover:bg-surface-container-low/50 transition-colors"
                    >
                      <td className="p-4 pl-6 font-semibold text-foreground">
                        {new Date(tx.interval_start).toLocaleString("en-IN", {
                          hour: "2-digit",
                          minute: "2-digit",
                          second: "2-digit",
                          hour12: true,
                        })}
                      </td>
                      <td className="p-4 text-energy-solar">
                        +{tx.energy_given_kwh.toFixed(2)}
                      </td>
                      <td className="p-4 text-energy-battery">
                        -{tx.energy_received_kwh.toFixed(2)}
                      </td>
                      <td className="p-4">
                        <span
                          className={
                            isCredit
                              ? "text-energy-solar font-semibold"
                              : "text-energy-critical font-semibold"
                          }
                        >
                          {isCredit ? "+" : ""}
                          {tx.net_energy_balance_kwh.toFixed(2)}
                        </span>
                      </td>
                      <td className="p-4">
                        ₹{tx.clearing_rate_inr.toFixed(2)}
                      </td>
                      <td className="p-4">
                        <span
                          className={
                            isCredit
                              ? "text-energy-solar font-semibold"
                              : "text-energy-critical font-semibold"
                          }
                        >
                          {isCredit ? "" : "-"}
                          {formatINR(Math.abs(tx.net_value_inr))}
                        </span>
                      </td>
                      <td className="p-4 pr-6 text-right font-mono text-[10px] text-muted-foreground flex items-center justify-end gap-1.5 mt-1">
                        <ShieldCheck className="h-3.5 w-3.5 text-energy-solar shrink-0" />
                        <span className="truncate max-w-30">
                          {tx.audit_signature}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
