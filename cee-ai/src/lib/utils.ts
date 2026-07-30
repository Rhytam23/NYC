import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Format energy values with unit suffix
 * Per ui_rules.md: "Always display energy quantities with units (kWh, kW, % SOC)"
 */
export function formatEnergy(
  value: number,
  unit: "kW" | "kWh" | "%" = "kWh",
): string {
  if (unit === "%") {
    return `${value.toFixed(1)}%`;
  }
  return `${value.toFixed(2)} ${unit}`;
}

/**
 * Format currency in INR
 * Per ENERGY_LEDGER.md: clearing rate ₹9.50/kWh
 */
export function formatINR(value: number): string {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
}

/**
 * Format CEE Credits balance
 * Per ui_rules.md §3.2: "+18.50 CEE Credits (Net Provider)" or "-4.20 CEE Credits (Net Receiver)"
 */
export function formatCeeCredits(balance: number): {
  display: string;
  label: string;
  isProvider: boolean;
} {
  const isProvider = balance >= 0;
  const sign = isProvider ? "+" : "";
  return {
    display: `${sign}${balance.toFixed(2)} CEE Credits`,
    label: isProvider ? "Net Provider" : "Net Receiver",
    isProvider,
  };
}

/**
 * Get status color class based on energy state
 * Per ui_rules.md §1.2 color codes
 */
export function getEnergyStatusColor(status: string): string {
  switch (status) {
    case "NORMAL":
      return "text-energy-solar"; // Green
    case "HIGH_DEMAND":
    case "CYCLONE_ALERT":
      return "text-energy-warning"; // Amber
    case "OUTAGE_DG_ACTIVE":
    case "OUTAGE":
      return "text-energy-critical"; // Red
    default:
      return "text-energy-battery"; // Blue
  }
}
