"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Bell, Search, User, Menu, LogOut } from "lucide-react";
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
  const router = useRouter();
  const [userName] = useState(() => {
    if (typeof window !== "undefined") {
      const stored = localStorage.getItem("cee_demo_user");
      if (stored) {
        try {
          const user = JSON.parse(stored);
          if (user.name) return user.name;
          if (user.email) {
            const parts = user.email.split("@")[0].split(".");
            const first = parts[0];
            const last = parts[1] ? ` ${parts[1][0].toUpperCase()}.` : "";
            return first.charAt(0).toUpperCase() + first.slice(1) + last;
          }
        } catch {}
      }
    }
    return "Rajesh S.";
  });

  const handleSignOut = async () => {
    // Clear demo session cookie
    document.cookie = "cee_demo_session=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT";
    // Clear localStorage
    localStorage.removeItem("cee_demo_user");
    // Call Supabase Sign Out (if client is active)
    try {
      const { createClient } = await import("@/lib/supabase/client");
      const supabase = createClient();
      await supabase.auth.signOut();
    } catch (e) {
      console.warn("Supabase sign out bypassed:", e);
    }
    // Redirect to login page
    router.push("/login");
    router.refresh();
  };

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

        {/* User Dropdown/SignOut Combo */}
        <div className="flex items-center gap-2 border-l border-border pl-2 sm:pl-3 ml-1 sm:ml-2">
          <div className="flex items-center gap-1.5 px-2 py-1 text-muted-foreground">
            <div className="h-7 w-7 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
              <User className="h-4 w-4 text-primary" />
            </div>
            <span className="text-sm font-medium text-foreground hidden sm:inline truncate max-w-[80px]">
              {userName}
            </span>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={handleSignOut}
            className="text-muted-foreground hover:text-energy-critical hover:bg-energy-critical/10 h-8 w-8 rounded-lg"
            title="Sign Out"
            aria-label="Sign Out"
          >
            <LogOut className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </header>
  );
}
