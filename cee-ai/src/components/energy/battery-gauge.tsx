import { cn } from "@/lib/utils";
import { Zap } from "lucide-react";

interface BatteryGaugeProps {
  soc: number;
  flowKw?: number;
  size?: "sm" | "md" | "lg";
  className?: string;
}

/**
 * BatteryGauge — Stitch Design System
 * Visualizes State of Charge (SOC) as a circular telemetry element.
 * Follows enterprise green colors and animated flow indicators.
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
    sm: "w-24 h-24 text-xs",
    md: "w-36 h-36 text-sm",
    lg: "w-48 h-48 text-base",
  };

  const isCharging = flowKw > 0;
  const isDischarging = flowKw < 0;

  // Determine battery color status: Charging is green, Discharging is red, Idle is brand green
  const activeColor = isCharging ? "#22C55E" : isDischarging ? "#EF4444" : "#2E7D32";

  return (
    <div
      className={cn(
        "relative flex flex-col items-center justify-center font-data",
        sizeClasses[size],
        className,
      )}
    >
      <style>{`
        @keyframes pulseActive {
          0%, 100% { opacity: 0.9; }
          50% { opacity: 0.4; }
        }
        @keyframes fillWave {
          0% { transform: translateY(0); }
          50% { transform: translateY(-4px); }
          100% { transform: translateY(0); }
        }
        .animate-pulse-active {
          animation: pulseActive 2s infinite ease-in-out;
        }
        .animate-fill-wave {
          animation: fillWave 1.5s infinite ease-in-out;
        }
      `}</style>

      <svg className="w-full h-full transform -rotate-90">
        {/* Track circle */}
        <circle
          cx="50%"
          cy="50%"
          r={radius}
          className="stroke-muted fill-none"
          strokeWidth={6}
        />
        {/* Progress circle */}
        <circle
          cx="50%"
          cy="50%"
          r={radius}
          className="fill-none transition-all duration-500 ease-out"
          stroke={activeColor}
          strokeWidth={6}
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          strokeLinecap="round"
        />
      </svg>

      {/* Central SOC display */}
      <div className="absolute flex flex-col items-center justify-center text-center">
        {/* Animated Battery Cell */}
        <div className="relative w-7 h-11 border-2 border-muted-foreground/50 rounded-sm p-0.5 flex flex-col justify-end overflow-hidden mb-1 bg-background/80 shadow-inner">
          {/* Battery Cap */}
          <div className="absolute -top-1 left-1/2 -translate-x-1/2 w-2.5 h-1 bg-muted-foreground/50 rounded-t-sm" />
          
          {/* Fill level with wave/pulse animation */}
          <div
            className={cn(
              "w-full rounded-2xs transition-all duration-500 ease-out",
              isCharging
                ? "bg-[#22C55E] animate-fill-wave"
                : isDischarging
                  ? "bg-[#EF4444] animate-pulse-active"
                  : "bg-[#2E7D32]"
            )}
            style={{ height: `${Math.max(6, soc)}%` }}
          />

          {/* Icon Overlay inside battery */}
          {isCharging && (
            <div className="absolute inset-0 flex items-center justify-center">
              <Zap className="h-3.5 w-3.5 text-white fill-white drop-shadow-[0_1px_2px_rgba(0,0,0,0.3)] animate-pulse" />
            </div>
          )}
          {isDischarging && (
            <div className="absolute inset-0 flex items-center justify-center animate-bounce">
              <span className="text-[8px] font-black text-white drop-shadow-[0_1px_2px_rgba(0,0,0,0.3)]">▼</span>
            </div>
          )}
        </div>

        <span className="font-headline font-bold text-base text-foreground leading-none">
          {soc.toFixed(0)}%
        </span>
        <span
          className={cn(
            "text-[8px] font-semibold tracking-wide uppercase px-1.5 py-0.5 rounded-sm mt-1 leading-none",
            isCharging
              ? "text-[#22C55E] bg-[#22C55E]/10"
              : isDischarging
                ? "text-[#EF4444] bg-[#EF4444]/10"
                : "text-muted-foreground bg-muted/20",
          )}
        >
          {isCharging ? "Charging" : isDischarging ? "Discharging" : "Idle"}
        </span>
      </div>
    </div>
  );
}
