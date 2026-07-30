"use client";

import React, { Component, type ErrorInfo, type ReactNode } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ShieldAlert, RefreshCw } from "lucide-react";

interface Props {
  children?: ReactNode;
}

interface State {
  hasError: boolean;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
  };

  public static getDerivedStateFromError(_error: Error): State {
    return { hasError: true };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("Uncaught boundary error:", error, errorInfo);
  }

  public render() {
    if (this.state.hasError) {
      return (
        <div className="flex h-screen items-center justify-center p-6 bg-background">
          <Card className="max-w-md w-full border border-border shadow-none">
            <CardHeader className="text-center">
              <div className="mx-auto h-12 w-12 rounded-xl bg-energy-critical/10 flex items-center justify-center mb-3">
                <ShieldAlert className="h-6 w-6 text-energy-critical" />
              </div>
              <CardTitle className="text-headline-md text-foreground">
                Critical Panel Error
              </CardTitle>
              <CardDescription className="text-body-sm text-muted-foreground">
                An unexpected error occurred in this telemetry module.
              </CardDescription>
            </CardHeader>
            <CardContent className="flex justify-center pb-6">
              <Button
                onClick={() => this.setState({ hasError: false })}
                className="font-semibold gap-1.5"
              >
                <RefreshCw className="h-4 w-4" />
                Retry Module
              </Button>
            </CardContent>
          </Card>
        </div>
      );
    }

    return this.props.children;
  }
}
