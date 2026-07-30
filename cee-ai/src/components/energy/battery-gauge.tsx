import { formatEnergy } from "@/lib/utils";
import { cn } from "@/lib/utils";

interface BatteryGaugeProps {
  soc: number;
  flowKw?: number;
  size?: "sm" | "md" | "lg";
  className?: string;
}

/**
 * BatteryGauge — Stitch Design System
 * Visualizes State of Charge (SOC) as a circular telemetry element.
 * Follows Stitch designTheme colors and namedColors.
 */
export function BatteryGauge({
  soc,
  flowKw = 0,
  size = "md",
  className,
}: BatteryGaugeProps) {
  const radius = 40;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (soc / 100) * circumference;

  const sizeClasses = {
    sm: "w-20 h-20 text-xs",
    md: "w-32 h-32 text-sm",
    lg: "w-44 h-44 text-base",
  };

  const isCharging = flowKw > 0;
  const isDischarging = flowKw < 0;

  // Determine battery color status based on SOC and flow per ui_rules.md §1.2
  let strokeColor = "stroke-energy-battery"; // Default Blue
  if (soc < 20) {
    strokeColor = "stroke-energy-critical"; // Red (<20% SOC)
  } else if (isCharging) {
    strokeColor = "stroke-energy-solar"; // Green (Charging)
  } else if (isDischarging) {
    strokeColor = "stroke-energy-warning"; // Amber (Discharging / sharing)
  }

  return (
    <div
      className={cn(
        "relative flex flex-col items-center justify-center font-data",
        sizeClasses[size],
        className,
      )}
    >
      <svg className="w-full h-full transform -rotate-90">
        {/* Track circle */}
        <circle
          cx="50%"
          cy="50%"
          r={radius}
          className="stroke-muted fill-none"
          strokeWidth={size === "sm" ? 4 : 6}
        />
        {/* Progress circle */}
        <circle
          cx="50%"
          cy="50%"
          r={radius}
          className={cn(
            "fill-none transition-all duration-500 ease-out",
            strokeColor,
          )}
          strokeWidth={size === "sm" ? 4 : 6}
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          strokeLinecap="round"
        />
      </svg>
      {/* Central SOC display */}
      <div className="absolute flex flex-col items-center justify-center text-center">
        <span className="font-headline font-bold text-2xl text-foreground">
          {formatEnergy(soc, "%")}
        </span>
        {flowKw !== 0 && (
          <span
            className={cn(
              "text-[10px] font-semibold tracking-wide uppercase px-1.5 py-0.5 rounded",
              isCharging
                ? "text-energy-solar bg-energy-solar/10"
                : "text-energy-warning bg-energy-warning/10",
            )}
          >
            {isCharging ? "Charging" : "Discharging"}
          </span>
        )}
      </div>
    </div>
  );
}
