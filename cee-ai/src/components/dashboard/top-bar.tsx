"use client";

import { Bell, Search, User, Menu } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

interface DashboardTopBarProps {
  onMenuClick?: () => void;
}

/**
 * Dashboard Top Bar — Status indicators, search, user menu
 * Per Stitch: Header height 64px, clean minimal design
 */
export function DashboardTopBar({ onMenuClick }: DashboardTopBarProps) {
  return (
    <header className="flex h-16 shrink-0 items-center justify-between border-b border-border bg-surface-container-lowest px-4 lg:px-6">
      {/* Left: Hamburger & Breadcrumb / Page Context */}
      <div className="flex items-center gap-3">
        {onMenuClick && (
          <Button
            variant="ghost"
            size="icon"
            onClick={onMenuClick}
            className="lg:hidden text-muted-foreground"
            aria-label="Open menu"
          >
            <Menu className="h-5 w-5" />
          </Button>
        )}
        <div className="flex items-center gap-2 sm:gap-4">
          <h1 className="font-headline text-base sm:text-lg font-semibold text-foreground truncate max-w-[120px] sm:max-w-none">
            Resident Dashboard
          </h1>
          <Badge
            variant="solar"
            className="text-[9px] sm:text-[10px] whitespace-nowrap"
          >
            GRID NORMAL
          </Badge>
        </div>
      </div>

      {/* Right: Actions */}
      <div className="flex items-center gap-1 sm:gap-2">
        {/* Search */}
        <Button
          variant="ghost"
          size="icon"
          className="text-muted-foreground h-9 w-9 sm:h-10 sm:w-10"
          aria-label="Search"
        >
          <Search className="h-4 w-4" />
        </Button>

        {/* Notifications */}
        <Button
          variant="ghost"
          size="icon"
          className="text-muted-foreground relative h-9 w-9 sm:h-10 sm:w-10"
          aria-label="View notifications"
        >
          <Bell className="h-4 w-4" />
          <span className="absolute top-2 right-2 h-2 w-2 rounded-full bg-energy-critical" />
        </Button>

        {/* User */}
        <Button
          variant="ghost"
          size="sm"
          className="gap-2 text-muted-foreground ml-1 sm:ml-2 h-9 sm:h-10 px-2 sm:px-3"
        >
          <div className="h-7 w-7 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
            <User className="h-4 w-4 text-primary" />
          </div>
          <span className="text-sm font-medium text-foreground hidden sm:inline truncate max-w-[80px]">
            Rajesh S.
          </span>
        </Button>
      </div>
    </header>
  );
}
