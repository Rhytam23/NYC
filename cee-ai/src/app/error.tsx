"use client";

import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter,
} from "@/components/ui/card";
import { ShieldAlert, RefreshCw } from "lucide-react";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    if (process.env.NODE_ENV !== "production") {
      console.error("Application runtime error:", error);
    }
  }, [error]);

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-6 relative">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,var(--tw-gradient-stops))] from-accent/20 via-background to-background -z-10" />

      <Card className="max-w-md w-full border border-border shadow-none">
        <CardHeader className="text-center pb-2">
          <div className="mx-auto h-12 w-12 rounded-xl bg-energy-critical/10 flex items-center justify-center mb-3">
            <ShieldAlert className="h-6 w-6 text-energy-critical" />
          </div>
          <CardTitle className="text-headline-md text-foreground">
            Application Error
          </CardTitle>
          <CardDescription className="text-body-sm text-muted-foreground">
            A critical system error occurred in the CEE-AI portal.
          </CardDescription>
        </CardHeader>
        <CardContent className="text-xs font-mono text-muted-foreground bg-surface-container border border-border/50 p-3 rounded-lg overflow-x-auto max-h-32 mb-6 mx-6">
          {error.message || "Unknown runtime exception"}
        </CardContent>
        <CardFooter className="flex justify-center pb-6">
          <Button onClick={reset} className="font-semibold gap-1.5">
            <RefreshCw className="h-4 w-4" />
            Reload Portal
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
