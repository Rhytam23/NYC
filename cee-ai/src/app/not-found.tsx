"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { AlertCircle, Home } from "lucide-react";

export default function NotFound() {
  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-6 relative">
      {/* Background visual asset overlay */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-accent/20 via-background to-background -z-10" />

      <Card className="max-w-md w-full border border-border shadow-none">
        <CardHeader className="text-center pb-2">
          <div className="mx-auto h-12 w-12 rounded-xl bg-energy-critical/10 flex items-center justify-center mb-3">
            <AlertCircle className="h-6 w-6 text-energy-critical" />
          </div>
          <CardTitle className="text-headline-md text-foreground">
            Page Not Found
          </CardTitle>
          <CardDescription className="text-body-sm text-muted-foreground">
            The page you are looking for does not exist or has been moved.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex justify-center pb-6">
          <Link href="/">
            <Button className="font-semibold gap-1.5">
              <Home className="h-4 w-4" />
              Return Home
            </Button>
          </Link>
        </CardContent>
      </Card>
    </div>
  );
}
