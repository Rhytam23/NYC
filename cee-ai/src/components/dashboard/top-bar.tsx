"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  Bell,
  Search,
  User,
  Menu,
  LogOut,
  X,
  Check,
  Sun,
  Battery,
  Zap,
  ShieldAlert,
  Settings,
  HelpCircle,
} from "lucide-react";
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
  
  // User name state
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

  // Full User Profile State for Dropdown Popover
  const [userProfile] = useState<{
    name: string;
    email: string;
    role: string;
    org: string;
    persona: string;
  }>(() => {
    let name = "Rajesh Sharma";
    let email = "rajesh.sharma@palmmeadows.in";
    let role = "Resident";
    let org = "Palm Meadows RWA";
    let persona = "resident";

    if (typeof window !== "undefined") {
      const stored = localStorage.getItem("cee_demo_user");
      if (stored) {
        try {
          const user = JSON.parse(stored);
          if (user.name) name = user.name;
          if (user.email) email = user.email;
          if (user.persona) persona = user.persona;
          if (user.persona === "consumer") {
            role = "Medical Priority Consumer";
          } else if (user.persona === "admin") {
            role = "RWA Board President";
          } else if (user.persona === "manager") {
            role = "Community Energy Manager";
          } else if (user.persona === "platform_admin") {
            role = "Platform Operations Director";
            org = "CEE-AI Grid Systems";
          }
        } catch {}
      }
    }
    return { name, email, role, org, persona };
  });

  // Search Palette State
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  // Notifications State
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [isProfileDropdownOpen, setIsProfileDropdownOpen] = useState(false);
  const [hasUnread, setHasUnread] = useState(true);

  // Close Search Dialog on Escape Key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setIsSearchOpen(false);
      }
    };
    if (isSearchOpen) {
      window.addEventListener("keydown", handleKeyDown);
    }
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [isSearchOpen]);

  // Search items definition
  const searchItems = [
    {
      name: "Resident Dashboard",
      description: "Realtime home energy telemetry, flows, and status overview",
      path: "/dashboard",
      icon: Sun,
    },
    {
      name: "Community Exchange (VPP)",
      description: "Virtual Power Plant netting, dispatching, and community battery pools",
      path: "/dashboard/community",
      icon: Zap,
    },
    {
      name: "Energy Ledger & Settlements",
      description: "Virtual CEE credits balance, settlement clearings, and transaction history",
      path: "/dashboard/ledger",
      icon: Battery,
    },
    {
      name: "Emergency Control Center",
      description: "Blackout forecasts, diesel generator triage, and load-shedding dispatch",
      path: "/dashboard/emergency",
      icon: ShieldAlert,
    },
    {
      name: "System Settings",
      description: "Configure hardware gateway keys, device metadata, and preferences",
      path: "/dashboard/settings",
      icon: Settings,
    },
    {
      name: "User Profile",
      description: "Manage your credentials, notification preferences, and assigned communities",
      path: "/dashboard/profile",
      icon: User,
    },
  ];

  // Filter items based on search query
  const filteredItems = searchItems.filter(
    (item) =>
      item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.description.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Mock Notifications data
  const notifications = [
    {
      id: "n1",
      title: "Outage Forecast Sag Alert",
      body: "High-priority grid stability warning issued for Sector 4.",
      time: "2 mins ago",
      color: "bg-energy-critical",
    },
    {
      id: "n2",
      title: "CEE Settlements Netted",
      body: "Settled virtual ledger matching with Dr. Sundaram for +1.2 kW flow.",
      time: "45 mins ago",
      color: "bg-energy-solar",
    },
    {
      id: "n3",
      title: "Edge Gateway Status Online",
      body: "RPi Genus Modbus adapter connection restored successfully.",
      time: "2 hours ago",
      color: "bg-primary",
    },
  ];

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
          onClick={() => setIsSearchOpen(true)}
          className="text-muted-foreground h-9 w-9 sm:h-10 sm:w-10"
          aria-label="Search"
        >
          <Search className="h-4 w-4" />
        </Button>

        {/* Notifications */}
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setIsNotificationsOpen(!isNotificationsOpen)}
          className="text-muted-foreground relative h-9 w-9 sm:h-10 sm:w-10"
          aria-label="View notifications"
        >
          <Bell className="h-4 w-4" />
          {hasUnread && (
            <span className="absolute top-2.5 right-2.5 h-2 w-2 rounded-full bg-energy-critical animate-pulse" />
          )}
        </Button>

        {/* User Dropdown/SignOut Combo */}
        <div className="flex items-center gap-2 border-l border-border pl-2 sm:pl-3 ml-1 sm:ml-2 relative">
          <div 
            onClick={() => setIsProfileDropdownOpen(!isProfileDropdownOpen)}
            className="flex items-center gap-1.5 px-2 py-1 text-muted-foreground cursor-pointer hover:bg-muted/50 rounded-lg transition-colors"
            title="View Profile Actions"
          >
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

          {/* Profile Dropdown Popover */}
          {isProfileDropdownOpen && (
            <>
              {/* Click outside overlay */}
              <div
                className="fixed inset-0 z-40 bg-transparent"
                onClick={() => setIsProfileDropdownOpen(false)}
              />
              <div className="absolute right-0 top-12 w-72 bg-card border border-border rounded-[18px] shadow-xl z-50 p-4 space-y-4 animate-in fade-in zoom-in-95 duration-150 font-data text-xs">
                {/* Header: Large profile avatar, Full name, Role, Org, Status */}
                <div className="flex gap-3 items-start pb-3 border-b border-border">
                  <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center shrink-0 border border-primary/20">
                    <User className="h-6 w-6 text-primary" />
                  </div>
                  <div className="space-y-1 min-w-0">
                    <div className="flex items-center gap-1.5">
                      <span className="font-headline font-bold text-sm text-foreground truncate block max-w-[140px]">
                        {userProfile.name}
                      </span>
                      <span className="h-2 w-2 rounded-full bg-green-500 shrink-0 animate-pulse" title="Online" />
                    </div>
                    <span className="text-[10px] font-semibold text-primary block leading-tight truncate">
                      {userProfile.role}
                    </span>
                    <span className="text-[10px] font-medium text-muted-foreground block truncate">
                      {userProfile.org}
                    </span>
                  </div>
                </div>

                {/* Account details */}
                <div className="space-y-2 bg-surface-container-low/40 p-2.5 rounded-xl border border-border/60">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground font-semibold">Email</span>
                    <span className="text-foreground font-medium truncate max-w-[140px]" title={userProfile.email}>
                      {userProfile.email}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground font-semibold">Community</span>
                    <span className="text-foreground font-medium truncate max-w-[140px]">
                      {userProfile.org}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground font-semibold">Last Login</span>
                    <span className="text-foreground font-medium whitespace-nowrap">
                      Just now
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground font-semibold">Status</span>
                    <Badge variant="outline" className="bg-green-50 border-green-200 text-green-700 font-bold py-0 text-[9px]">
                      Active
                    </Badge>
                  </div>
                </div>

                {/* Quick actions */}
                <div className="flex flex-col gap-1 border-t border-border pt-3">
                  <button
                    onClick={() => {
                      setIsProfileDropdownOpen(false);
                      router.push("/dashboard/profile");
                    }}
                    className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg hover:bg-muted text-left font-bold text-foreground transition-colors"
                  >
                    <User className="h-3.5 w-3.5 text-primary" />
                    View Profile
                  </button>
                  <button
                    onClick={() => {
                      setIsProfileDropdownOpen(false);
                      router.push("/dashboard/settings");
                    }}
                    className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg hover:bg-muted text-left font-bold text-foreground transition-colors"
                  >
                    <Settings className="h-3.5 w-3.5 text-primary" />
                    Account Settings
                  </button>
                  <button
                    onClick={() => {
                      setIsProfileDropdownOpen(false);
                      router.push("/dashboard/profile?tab=preferences");
                    }}
                    className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg hover:bg-muted text-left font-bold text-foreground transition-colors"
                  >
                    <Bell className="h-3.5 w-3.5 text-primary" />
                    Notifications
                  </button>
                  <button
                    onClick={() => {
                      setIsProfileDropdownOpen(false);
                      alert("CEE-AI Grid Operations Center support portal is active. Incident ID: INC-87291.");
                    }}
                    className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg hover:bg-muted text-left font-bold text-foreground transition-colors"
                  >
                    <HelpCircle className="h-3.5 w-3.5 text-primary" />
                    Help & Support
                  </button>
                  <button
                    onClick={() => {
                      setIsProfileDropdownOpen(false);
                      handleSignOut();
                    }}
                    className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg hover:bg-red-50 hover:text-red-700 text-left font-bold text-foreground transition-colors border-t border-border/40 mt-1"
                  >
                    <LogOut className="h-3.5 w-3.5 text-red-500" />
                    Sign Out
                  </button>
                </div>
              </div>
            </>
          )}

          {/* Notifications Dropdown Card */}
          {isNotificationsOpen && (
            <>
              {/* Click outside overlay */}
              <div
                className="fixed inset-0 z-40 bg-transparent"
                onClick={() => setIsNotificationsOpen(false)}
              />
              <div className="absolute right-0 top-12 w-80 bg-card border border-border rounded-xl shadow-xl z-50 p-4 space-y-3 animate-in fade-in slide-in-from-top-3 duration-150">
                <div className="flex items-center justify-between border-b border-border pb-2">
                  <span className="font-headline font-semibold text-sm text-foreground">
                    Notifications
                  </span>
                  {hasUnread && (
                    <button
                      onClick={() => setHasUnread(false)}
                      className="text-xs text-primary font-medium hover:underline flex items-center gap-1"
                    >
                      <Check className="h-3.5 w-3.5" />
                      Mark all read
                    </button>
                  )}
                </div>
                <div className="max-h-[250px] overflow-y-auto space-y-2">
                  {notifications.map((notif) => (
                    <div
                      key={notif.id}
                      className="flex items-start gap-2.5 p-2 rounded-lg hover:bg-muted/50 transition-colors text-xs border border-border/20 bg-surface-container-low"
                    >
                      <span className={`h-2 w-2 rounded-full mt-1.5 shrink-0 ${notif.color}`} />
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-foreground leading-normal">{notif.title}</p>
                        <p className="text-muted-foreground mt-0.5 leading-normal">{notif.body}</p>
                        <span className="text-[10px] text-muted-foreground/70 mt-1 block">
                          {notif.time}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Search Command Dialog Overlay */}
      {isSearchOpen && (
        <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-start justify-center pt-24 px-4">
          {/* Click outside overlay to close */}
          <div
            className="fixed inset-0 -z-10"
            onClick={() => setIsSearchOpen(false)}
          />
          <div className="relative w-full max-w-lg rounded-xl border border-border bg-card shadow-2xl p-4 space-y-4 animate-in fade-in zoom-in-95 duration-150">
            {/* Search Input */}
            <div className="flex items-center gap-3 border-b border-border pb-3">
              <Search className="h-5 w-5 text-muted-foreground" />
              <input
                type="text"
                placeholder="Search pages, settings, or devices..."
                className="flex-1 bg-transparent text-sm text-foreground outline-none placeholder:text-muted-foreground"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                autoFocus
              />
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 text-muted-foreground hover:text-foreground"
                onClick={() => setIsSearchOpen(false)}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>

            {/* Results */}
            <div className="max-h-[300px] overflow-y-auto space-y-1">
              {filteredItems.map((item) => (
                <button
                  key={item.path}
                  onClick={() => {
                    router.push(item.path);
                    setIsSearchOpen(false);
                  }}
                  className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-muted text-left transition-colors text-sm text-muted-foreground hover:text-foreground group"
                >
                  <item.icon className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors shrink-0" />
                  <div className="flex-1 min-w-0">
                    <div className="font-semibold truncate">{item.name}</div>
                    <div className="text-xs text-muted-foreground/75 truncate">{item.description}</div>
                  </div>
                </button>
              ))}
              {filteredItems.length === 0 && (
                <div className="py-8 text-center text-sm text-muted-foreground">
                  No matching results found.
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
