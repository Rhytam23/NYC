"use client";

import { useState } from "react";
import { DashboardSidebar } from "@/components/dashboard/sidebar";
import { DashboardTopBar } from "@/components/dashboard/top-bar";
import { NavigationDrawer } from "@/components/dashboard/nav-drawer";
import { MobileBottomNav } from "@/components/dashboard/bottom-nav";

/**
 * Dashboard Layout — Responsive shell for all dashboard pages
 * Adaptive Navigation:
 * - Desktop (>=1024px): Static Sidebar
 * - Tablet (768px - 1023px): Topbar Hamburger + Drawer
 * - Mobile (<768px): Bottom Nav + Topbar Hamburger + Drawer
 */
export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      {/* Sidebar — visible only on desktop (lg: flex, hidden otherwise) */}
      <div className="hidden lg:flex h-full shrink-0">
        <DashboardSidebar />
      </div>

      {/* Slide-over navigation drawer for mobile and tablet */}
      <NavigationDrawer
        isOpen={isDrawerOpen}
        onClose={() => setIsDrawerOpen(false)}
      />

      {/* Main content area */}
      <div className="flex flex-1 flex-col overflow-hidden">
        {/* Pass menu toggle trigger to top bar */}
        <DashboardTopBar onMenuClick={() => setIsDrawerOpen(true)} />

        {/* Main Workspace — Add bottom padding on mobile to clear the bottom nav bar */}
        <main className="flex-1 overflow-y-auto scrollbar-thin p-4 lg:p-6 pb-20 md:pb-6">
          {children}
        </main>
      </div>

      {/* Bottom Nav Bar — visible only on mobile (below md breakpoint) */}
      <MobileBottomNav />
    </div>
  );
}
