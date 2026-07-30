import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

/**
 * Badge — Stitch Design System
 * Per Stitch designMd: "Use a light tinted background (10% opacity of the functional color)
 * with high-contrast bold text of the same color."
 * Per ui_rules.md: Status pills use fully rounded "pill" shape.
 */
const badgeVariants = cva(
  "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
  {
    variants: {
      variant: {
        default: "border-transparent bg-primary text-primary-foreground",
        secondary: "border-transparent bg-secondary/10 text-secondary",
        destructive: "border-transparent bg-destructive/10 text-destructive",
        outline: "text-foreground",
        /* Energy-specific badges per ui_rules.md color codes */
        solar:
          "border-transparent bg-energy-solar/10 text-energy-solar font-data",
        battery:
          "border-transparent bg-energy-battery/10 text-energy-battery font-data",
        warning:
          "border-transparent bg-energy-warning/10 text-energy-warning font-data",
        critical:
          "border-transparent bg-energy-critical/10 text-energy-critical font-data",
        provider:
          "border-transparent bg-energy-solar/10 text-energy-solar font-semibold",
        receiver:
          "border-transparent bg-energy-battery/10 text-energy-battery font-semibold",
        /* Emergency tier badges */
        tier0:
          "border-transparent bg-energy-critical/10 text-energy-critical animate-pulse",
        tier1: "border-transparent bg-energy-warning/10 text-energy-warning",
        tier2: "border-transparent bg-energy-battery/10 text-energy-battery",
        tier3: "border-transparent bg-muted text-muted-foreground",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  },
);

export interface BadgeProps
  extends
    React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return (
    <div className={cn(badgeVariants({ variant }), className)} {...props} />
  );
}

export { Badge, badgeVariants };
