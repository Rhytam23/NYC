"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import {
  LayoutDashboard,
  Users,
  BookOpen,
  AlertTriangle,
  Brain,
  Settings,
  Zap,
  ChevronDown,
  ChevronRight,
  Shield,
  Radio,
  Activity,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";

/**
 * Dashboard Sidebar — Navigation with Emergency expandable section
 * Per revised plan: Emergency sub-items are sidebar links that
 * update the main workspace, not separate route trees.
 */

interface NavItem {
  label: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  badge?: string;
  badgeVariant?: "default" | "destructive" | "solar" | "warning" | "critical";
}

interface NavGroup {
  title?: string;
  items: NavItem[];
  collapsible?: boolean;
  defaultOpen?: boolean;
}

const navigation: NavGroup[] = [
  {
    items: [
      {
        label: "Dashboard",
        href: "/dashboard",
        icon: LayoutDashboard,
      },
      {
        label: "Community",
        href: "/dashboard/community",
        icon: Users,
      },
      {
        label: "Energy Ledger",
        href: "/dashboard/ledger",
        icon: BookOpen,
      },
    ],
  },
  {
    title: "Emergency Center",
    collapsible: true,
    defaultOpen: true,
    items: [
      {
        label: "Overview",
        href: "/dashboard/emergency",
        icon: AlertTriangle,
        badge: "NORMAL",
        badgeVariant: "solar",
      },
      {
        label: "Triage Status",
        href: "/dashboard/emergency?tab=triage",
        icon: Shield,
      },
      {
        label: "Grid Monitor",
        href: "/dashboard/emergency?tab=grid",
        icon: Radio,
      },
    ],
  },
  {
    items: [
      {
        label: "AI Insights",
        href: "/dashboard/ai-insights",
        icon: Brain,
      },
      {
        label: "Settings",
        href: "/dashboard/settings",
        icon: Settings,
      },
    ],
  },
];

function NavLink({ item, isActive }: { item: NavItem; isActive: boolean }) {
  return (
    <Link
      href={item.href}
      className={cn(
        "flex items-center gap-3 rounded-[var(--radius-lg)] px-3 py-2.5 text-sm font-medium transition-colors duration-150",
        isActive
          ? "bg-primary/10 text-primary"
          : "text-muted-foreground hover:bg-accent hover:text-accent-foreground",
      )}
    >
      <item.icon className="h-4 w-4 shrink-0" />
      <span className="flex-1">{item.label}</span>
      {item.badge && (
        <Badge
          variant={
            item.badgeVariant as
              "solar" | "warning" | "critical" | "default" | undefined
          }
          className="text-[10px] px-1.5 py-0"
        >
          {item.badge}
        </Badge>
      )}
    </Link>
  );
}

function CollapsibleNavGroup({
  group,
  pathname,
}: {
  group: NavGroup;
  pathname: string;
}) {
  const [isOpen, setIsOpen] = useState(group.defaultOpen ?? false);
  const hasActiveChild = group.items.some(
    (item) =>
      pathname === item.href || pathname.startsWith(item.href.split("?")[0]),
  );

  return (
    <div>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          "flex w-full items-center gap-2 px-3 py-2 text-xs font-semibold uppercase tracking-wider transition-colors",
          hasActiveChild
            ? "text-primary"
            : "text-muted-foreground hover:text-foreground",
        )}
      >
        <AlertTriangle className="h-3.5 w-3.5" />
        <span className="flex-1 text-left">{group.title}</span>
        {isOpen ? (
          <ChevronDown className="h-3.5 w-3.5" />
        ) : (
          <ChevronRight className="h-3.5 w-3.5" />
        )}
      </button>
      {isOpen && (
        <div className="ml-2 space-y-0.5">
          {group.items.map((item) => (
            <NavLink
              key={item.href}
              item={item}
              isActive={
                pathname === item.href || pathname === item.href.split("?")[0]
              }
            />
          ))}
        </div>
      )}
    </div>
  );
}

export function DashboardSidebar() {
  const pathname = usePathname();

  return (
    <aside className="flex w-[var(--sidebar-width)] flex-col border-r border-border bg-surface-container-lowest">
      {/* Logo */}
      <div className="flex h-16 items-center gap-2.5 px-6 border-b border-border">
        <div className="h-8 w-8 rounded-lg bg-primary flex items-center justify-center">
          <Zap className="h-5 w-5 text-primary-foreground" />
        </div>
        <div>
          <span className="font-headline text-lg font-bold text-primary">
            CEE-AI
          </span>
          <Activity className="inline ml-1.5 h-3 w-3 text-energy-solar animate-energy-pulse" />
        </div>
      </div>

      {/* Navigation */}
      <ScrollArea className="flex-1 py-4">
        <nav className="space-y-1 px-3">
          {navigation.map((group, i) => (
            <div key={i}>
              {i > 0 && <Separator className="my-3" />}

              {group.collapsible ? (
                <CollapsibleNavGroup group={group} pathname={pathname} />
              ) : (
                <div className="space-y-0.5">
                  {group.title && (
                    <div className="px-3 py-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                      {group.title}
                    </div>
                  )}
                  {group.items.map((item) => (
                    <NavLink
                      key={item.href}
                      item={item}
                      isActive={pathname === item.href}
                    />
                  ))}
                </div>
              )}
            </div>
          ))}
        </nav>
      </ScrollArea>

      {/* Community Info Footer */}
      <div className="border-t border-border p-4">
        <div className="rounded-[var(--radius-lg)] bg-surface-container p-3">
          <div className="text-label-caps text-muted-foreground mb-1">
            Community
          </div>
          <div className="font-headline text-sm font-semibold text-foreground">
            Palm Meadows RWA
          </div>
          <div className="text-body-sm text-muted-foreground">
            Whitefield, Bangalore
          </div>
        </div>
      </div>
    </aside>
  );
}
