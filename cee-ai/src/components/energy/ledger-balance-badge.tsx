import { formatCeeCredits } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { TrendingUp, TrendingDown } from "lucide-react";

interface LedgerBalanceBadgeProps {
  balance: number;
}

/**
 * LedgerBalanceBadge — Stitch design system element
 * Source: ui_rules.md §3.2 Net Energy Ledger Badge
 * Format: "+18.50 CEE Credits (Net Provider)" or "-4.20 CEE Credits (Net Receiver)"
 */
export function LedgerBalanceBadge({ balance }: LedgerBalanceBadgeProps) {
  const { display, label, isProvider } = formatCeeCredits(balance);

  return (
    <Badge
      variant={isProvider ? "provider" : "receiver"}
      className="flex items-center gap-1 px-3 py-1 text-xs font-semibold"
    >
      {isProvider ? (
        <TrendingUp className="h-3.5 w-3.5" />
      ) : (
        <TrendingDown className="h-3.5 w-3.5" />
      )}
      <span>{display}</span>
      <span className="opacity-70">({label})</span>
    </Badge>
  );
}
