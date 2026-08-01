"use client";

import { useState, useEffect } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  User,
  Shield,
  Bell,
  Settings,
  Mail,
  Phone,
  MapPin,
  Building,
  Key,
  Database,
  Lock,
  Smartphone,
  Laptop,
  Cpu,
  CheckCircle2,
  Activity,
  FileText,
} from "lucide-react";

export default function ProfilePage() {
  const [activeTab, setActiveTab] = useState("overview");

  // Synchronize active tab from URL query params
  useEffect(() => {
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      const tab = params.get("tab");
      if (tab && ["overview", "security", "preferences"].includes(tab)) {
        Promise.resolve().then(() => {
          setActiveTab(tab);
        });
      }
    }
  }, []);

  // Read demo user from localStorage if available
  const [profileData] = useState(() => {
    let name = "Rajesh Sharma";
    let email = "rajesh.sharma@palmmeadows.in";
    let roleName = "Resident";
    let access = "Resident Access";
    let org = "Palm Meadows RWA";
    
    if (typeof window !== "undefined") {
      const stored = localStorage.getItem("cee_demo_user");
      if (stored) {
        try {
          const user = JSON.parse(stored);
          if (user.name) name = user.name;
          if (user.email) email = user.email;
          if (user.persona === "consumer") {
            roleName = "Medical Priority Consumer";
            access = "Tier 0 Medical Access";
          } else if (user.persona === "admin") {
            roleName = "RWA Board President";
            access = "RWA Admin Access";
          } else if (user.persona === "manager") {
            roleName = "Community Energy Manager";
            access = "Manager Access";
          } else if (user.persona === "platform_admin") {
            roleName = "Platform Operations Director";
            access = "Global Superadmin Access";
            org = "CEE-AI Grid Systems";
          }
        } catch {}
      }
    }

    return {
      name,
      email,
      role: roleName,
      department: "Microgrid Operations & VPP Netting",
      employeeId: "EMP-2026-089",
      phone: "+91 98450 12089",
      location: "Bangalore, India",
      joinDate: "June 15, 2025",
      status: "ONLINE",
      about: "Senior energy grid manager and microgrid administrator. Oversees virtual power plant dispatch logic, local rooftop solar netting rules, and emergency backup battery triage routing parameters to protect critical life-support loads.",
      username: email.split("@")[0],
      organization: org,
      accessLevel: access,
      lastLogin: new Date().toLocaleString(),
      address: "Villa V-104, Palm Meadows Phase 1, Whitefield, Bangalore, Karnataka 560066",
      timezone: "Asia/Kolkata (IST, UTC+05:30)",
    };
  });

  // Toggles and settings state
  const [twoFactor, setTwoFactor] = useState(true);
  const [notifs, setNotifs] = useState({
    email: true,
    sms: false,
    system: true,
    ai: true,
    emergency: true,
  });
  const [prefSettings, setPrefSettings] = useState({
    theme: "light",
    language: "en-US",
    timezone: "IST (UTC+05:30)",
    dateFormat: "DD/MM/YYYY",
  });

  const handleToggleNotif = (key: keyof typeof notifs) => {
    setNotifs((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  return (
    <div className="space-y-6">
      {/* Header Profile Section */}
      <Card className="border border-border overflow-hidden">
        <div className="h-32 bg-gradient-to-r from-[#1B5E20] to-[#2E7D32]" />
        <CardContent className="pt-0 relative px-6 pb-6">
          <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between -mt-16 gap-4">
            <div className="flex flex-col sm:flex-row items-center sm:items-end gap-4 text-center sm:text-left">
              <div className="h-28 w-28 rounded-2xl bg-white p-1 shadow-lg shrink-0 border border-border">
                <div className="h-full w-full rounded-xl bg-[#E8F5E9] flex items-center justify-center">
                  <User className="h-14 w-14 text-[#2E7D32]" />
                </div>
              </div>
              <div className="space-y-1 pb-1">
                <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
                  <h2 className="font-headline text-2xl font-bold text-foreground leading-tight">
                    {profileData.name}
                  </h2>
                  <Badge variant="outline" className="bg-green-50 border-green-200 text-green-700 font-semibold gap-1 py-0 px-2.5">
                    <span className="h-1.5 w-1.5 rounded-full bg-green-500 animate-pulse" /> {profileData.status}
                  </Badge>
                </div>
                <p className="text-sm font-semibold text-[#2E7D32]">{profileData.role}</p>
                <div className="flex flex-wrap items-center justify-center sm:justify-start gap-x-4 gap-y-1 text-xs text-muted-foreground font-medium pt-1">
                  <span className="flex items-center gap-1">
                    <Building className="h-3.5 w-3.5" /> {profileData.department}
                  </span>
                  <span>•</span>
                  <span>ID: {profileData.employeeId}</span>
                  <span>•</span>
                  <span>Org: {profileData.organization}</span>
                </div>
              </div>
            </div>
            <div className="flex justify-center shrink-0">
              <Button className="bg-[#2E7D32] hover:bg-[#1B5E20] text-white">
                Edit SaaS Profile
              </Button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 border-t border-border/60 mt-6 pt-6 text-xs font-semibold text-muted-foreground">
            <div className="flex items-center gap-2.5">
              <Mail className="h-4 w-4 text-[#2E7D32]" />
              <div>
                <span className="text-[10px] text-muted-foreground uppercase block font-semibold">Email</span>
                <span className="text-foreground font-medium block mt-0.5">{profileData.email}</span>
              </div>
            </div>
            <div className="flex items-center gap-2.5">
              <Phone className="h-4 w-4 text-[#2E7D32]" />
              <div>
                <span className="text-[10px] text-muted-foreground uppercase block font-semibold">Phone</span>
                <span className="text-foreground font-medium block mt-0.5">{profileData.phone}</span>
              </div>
            </div>
            <div className="flex items-center gap-2.5">
              <MapPin className="h-4 w-4 text-[#2E7D32]" />
              <div>
                <span className="text-[10px] text-muted-foreground uppercase block font-semibold">Location & Join Date</span>
                <span className="text-foreground font-medium block mt-0.5">{profileData.location} (Joined {profileData.joinDate})</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tabs Control */}
      <div className="flex border-b border-border gap-2">
        {[
          { id: "overview", label: "Overview", icon: User },
          { id: "security", label: "Security & API", icon: Shield },
          { id: "preferences", label: "Preferences & Alerts", icon: Bell },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-2 px-4 py-2.5 text-xs font-bold transition-all border-b-2 -mb-px rounded-t-lg ${
              activeTab === tab.id
                ? "border-[#2E7D32] text-[#2E7D32] bg-white"
                : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
          >
            <tab.icon className="h-4 w-4" />
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab Contents */}
      {activeTab === "overview" && (
        <div className="space-y-6">
          {/* About & Contact Section */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card className="border border-border">
              <CardHeader className="pb-2">
                <CardTitle className="text-headline-md text-foreground">About Professional</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-xs text-muted-foreground leading-relaxed font-medium">
                  {profileData.about}
                </p>
              </CardContent>
            </Card>

            <Card className="border border-border">
              <CardHeader className="pb-2">
                <CardTitle className="text-headline-md text-foreground">Contact & Timezone Details</CardTitle>
              </CardHeader>
              <CardContent className="text-xs font-semibold text-muted-foreground space-y-3 pt-2">
                <div className="flex justify-between border-b border-border/40 pb-2">
                  <span className="text-muted-foreground">Email Address</span>
                  <span className="text-foreground font-medium">{profileData.email}</span>
                </div>
                <div className="flex justify-between border-b border-border/40 pb-2">
                  <span className="text-muted-foreground">Phone Number</span>
                  <span className="text-foreground font-medium">{profileData.phone}</span>
                </div>
                <div className="flex justify-between border-b border-border/40 pb-2">
                  <span className="text-muted-foreground">Office Address</span>
                  <span className="text-foreground font-medium text-right max-w-[220px] leading-tight">
                    {profileData.address}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Discom Timezone</span>
                  <span className="text-foreground font-medium">{profileData.timezone}</span>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Activity Summary Cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              { label: "Dispatches Reviewed", value: "342", sub: "+12 this week", icon: Activity, color: "text-[#2E7D32]" },
              { label: "AI Decisions Approved", value: "98.4%", sub: "Decision rate", icon: Cpu, color: "text-purple-600" },
              { label: "Reports Generated", value: "24", sub: "Monthly CAM metrics", icon: FileText, color: "text-amber-600" },
              { label: "Communities Managed", value: "1", sub: "Palm Meadows RWA", icon: Building, color: "text-blue-600" },
            ].map((stat, i) => (
              <Card key={i} className="border border-border">
                <CardContent className="p-4 flex items-center justify-between font-data">
                  <div>
                    <span className="text-[10px] text-muted-foreground uppercase font-semibold block">{stat.label}</span>
                    <span className="text-xl font-bold text-foreground block mt-0.5">{stat.value}</span>
                    <span className="text-[9px] text-muted-foreground block mt-1">{stat.sub}</span>
                  </div>
                  <div className={`h-9 w-9 rounded-lg bg-muted/40 flex items-center justify-center shrink-0 ${stat.color}`}>
                    <stat.icon className="h-5 w-5" />
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Assigned Communities */}
            <Card className="border border-border flex flex-col justify-between">
              <CardHeader>
                <CardTitle className="text-headline-md text-foreground">Assigned Communities</CardTitle>
                <CardDescription className="text-body-sm text-muted-foreground">Grid clusters under your immediate VPP administration.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="p-4 border border-border rounded-xl bg-surface-container-low/40 flex gap-4 items-start">
                  <div className="h-10 w-10 rounded-lg bg-green-50 border border-green-200 text-green-700 flex items-center justify-center shrink-0 mt-0.5">
                    <Building className="h-5 w-5" />
                  </div>
                  <div className="flex-1 space-y-2 text-xs font-semibold text-muted-foreground">
                    <div className="flex justify-between items-center">
                      <span className="font-headline font-bold text-sm text-foreground">Palm Meadows RWA</span>
                      <Badge variant="outline" className="bg-green-50 border-green-200 text-green-700 py-0">ACTIVE</Badge>
                    </div>
                    <div className="grid grid-cols-3 gap-2 font-data text-[10px] pt-1">
                      <div>
                        <span className="block text-muted-foreground font-semibold">Homes Connected</span>
                        <span className="block text-foreground font-bold text-xs mt-0.5">142 Flats</span>
                      </div>
                      <div>
                        <span className="block text-muted-foreground font-semibold">Battery Pool</span>
                        <span className="block text-foreground font-bold text-xs mt-0.5">120 kWh LFP</span>
                      </div>
                      <div>
                        <span className="block text-muted-foreground font-semibold">Solar Roof Capacity</span>
                        <span className="block text-foreground font-bold text-xs mt-0.5">48.5 kWp</span>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Recent Activity Timeline */}
            <Card className="border border-border">
              <CardHeader>
                <CardTitle className="text-headline-md text-foreground">Recent Activity Timeline</CardTitle>
                <CardDescription className="text-body-sm text-muted-foreground">Audit trails of your recent grid operator events.</CardDescription>
              </CardHeader>
              <CardContent className="relative pl-6 space-y-4">
                <div className="absolute left-3.5 top-0 bottom-4 w-0.5 bg-border" />
                {[
                  { title: "Grid operator session initialized", time: "Today, 10:38 AM", icon: CheckCircle2, color: "text-[#2E7D32]" },
                  { title: "Reviewed manual VPP dispatch log file dsp-10048", time: "Today, 8:45 AM", icon: Cpu, color: "text-blue-600" },
                  { title: "Updated notification alert SMS preferences", time: "Yesterday, 4:12 PM", icon: Settings, color: "text-purple-600" },
                  { title: "Generated monthly energy ledger audit PDF report", time: "July 31, 2026, 12:00 PM", icon: FileText, color: "text-amber-600" },
                  { title: "Exported microgrid transaction logs for CAM accounting", time: "July 30, 2026, 3:30 PM", icon: Database, color: "text-teal-600" },
                ].map((act, i) => (
                  <div key={i} className="relative flex gap-3 text-xs">
                    <div className="absolute -left-[19px] h-6 w-6 rounded-full bg-white flex items-center justify-center border border-border text-xs z-10 shrink-0">
                      <act.icon className={`h-3.5 w-3.5 ${act.color}`} />
                    </div>
                    <div>
                      <p className="font-semibold text-foreground">{act.title}</p>
                      <span className="text-[10px] text-muted-foreground/75 block mt-0.5">{act.time}</span>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>
        </div>
      )}

      {activeTab === "security" && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left panel: Account details */}
          <div className="space-y-6 lg:col-span-2">
            <Card className="border border-border">
              <CardHeader>
                <CardTitle className="text-headline-md text-foreground">Account Information</CardTitle>
              </CardHeader>
              <CardContent className="text-xs font-semibold text-muted-foreground">
                <div className="border border-border rounded-xl divide-y divide-border bg-surface-container-low/40">
                  <div className="p-3.5 flex justify-between">
                    <span className="text-muted-foreground font-semibold">Username</span>
                    <span className="font-medium text-foreground">{profileData.username}</span>
                  </div>
                  <div className="p-3.5 flex justify-between">
                    <span className="text-muted-foreground font-semibold">Organization</span>
                    <span className="font-medium text-foreground">{profileData.organization}</span>
                  </div>
                  <div className="p-3.5 flex justify-between">
                    <span className="text-muted-foreground font-semibold">Community Cluster</span>
                    <span className="font-medium text-foreground">Sector 4 Feeders</span>
                  </div>
                  <div className="p-3.5 flex justify-between">
                    <span className="text-muted-foreground font-semibold">Access Level</span>
                    <span className="font-medium text-foreground">{profileData.accessLevel}</span>
                  </div>
                  <div className="p-3.5 flex justify-between">
                    <span className="text-muted-foreground font-semibold">Operator Permissions</span>
                    <span className="font-medium text-[#2E7D32] flex items-center gap-1">
                      <CheckCircle2 className="h-3.5 w-3.5" /> VPP_DISPATCH, AUDIT_READ, LEDGER_WRITE
                    </span>
                  </div>
                  <div className="p-3.5 flex justify-between">
                    <span className="text-muted-foreground font-semibold">Last Login Session</span>
                    <span className="font-medium text-foreground">{profileData.lastLogin}</span>
                  </div>
                  <div className="p-3.5 flex justify-between">
                    <span className="text-muted-foreground font-semibold">Account Status</span>
                    <Badge variant="outline" className="bg-green-50 border-green-200 text-green-700 py-0">PROVISIONED</Badge>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Login History */}
            <Card className="border border-border">
              <CardHeader>
                <CardTitle className="text-headline-md text-foreground">Session Log History</CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-border bg-surface-container-low text-muted-foreground font-semibold">
                      <th className="p-3">Device / OS</th>
                      <th className="p-3">IP Address</th>
                      <th className="p-3">Location</th>
                      <th className="p-3">Session Date</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border font-medium text-muted-foreground">
                    {[
                      { os: "Windows 11 (Firefox)", ip: "192.168.1.14", loc: "Bangalore, IN", time: "Today, 10:38 AM" },
                      { os: "macOS 14 (Safari)", ip: "106.51.28.140", loc: "Bangalore, IN", time: "July 31, 2026, 4:15 PM" },
                      { os: "iPhone 15 Pro (MyGate app)", ip: "106.51.28.140", loc: "Bangalore, IN", time: "July 30, 2026, 9:20 AM" },
                    ].map((hist, i) => (
                      <tr key={i} className="hover:bg-muted/10">
                        <td className="p-3 text-foreground font-semibold">{hist.os}</td>
                        <td className="p-3 font-data">{hist.ip}</td>
                        <td className="p-3">{hist.loc}</td>
                        <td className="p-3 whitespace-nowrap">{hist.time}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </CardContent>
            </Card>
          </div>

          {/* Right panel: Security actions */}
          <div className="space-y-6">
            <Card className="border border-border">
              <CardHeader>
                <CardTitle className="text-headline-md text-foreground flex items-center gap-1.5">
                  <Lock className="h-5 w-5 text-[#2E7D32]" /> Credentials
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Button variant="outline" className="w-full text-xs" size="sm">
                    Change Password
                  </Button>
                </div>
                <div className="border-t border-border pt-4 space-y-3">
                  <div className="flex justify-between items-center">
                    <div>
                      <span className="text-xs font-bold text-foreground block">Two-Factor Authentication</span>
                      <span className="text-[10px] text-muted-foreground block font-medium">Protect account with secondary SMS OTP keys.</span>
                    </div>
                    <button
                      onClick={() => setTwoFactor(!twoFactor)}
                      className={`relative w-9 h-5 rounded-full transition-colors shrink-0 ${
                        twoFactor ? "bg-[#2E7D32]" : "bg-muted"
                      }`}
                    >
                      <div className={`absolute top-0.5 left-0.5 h-4 w-4 rounded-full bg-white shadow transition-transform ${
                        twoFactor ? "translate-x-4" : "translate-x-0"
                      }`} />
                    </button>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border border-border">
              <CardHeader>
                <CardTitle className="text-headline-md text-foreground flex items-center gap-1.5">
                  <Key className="h-5 w-5 text-[#2E7D32]" /> API Gateway Credentials
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-xs">
                <p className="text-muted-foreground leading-relaxed font-medium">
                  Use these credentials to authenticate gateway Modbus daemons directly to the VPP exchange queue.
                </p>
                <div className="p-3 bg-surface-container rounded-xl border border-border/80 font-data space-y-2">
                  <div>
                    <span className="text-[9px] text-muted-foreground uppercase block font-semibold">Client ID</span>
                    <span className="text-foreground font-bold select-all block">cee_client_gw_palm_089</span>
                  </div>
                  <div>
                    <span className="text-[9px] text-muted-foreground uppercase block font-semibold">Secret Key</span>
                    <span className="text-foreground font-bold select-all block">••••••••••••••••••••••••</span>
                  </div>
                </div>
                <Button variant="outline" className="w-full text-xs mt-1" size="sm">
                  Regenerate Keys
                </Button>
              </CardContent>
            </Card>

            <Card className="border border-border">
              <CardHeader>
                <CardTitle className="text-headline-md text-foreground flex items-center gap-1.5">
                  <Laptop className="h-5 w-5 text-[#2E7D32]" /> Active Sessions
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-xs">
                <div className="flex justify-between items-start gap-2">
                  <div className="flex gap-2">
                    <Laptop className="h-4 w-4 text-[#2E7D32] shrink-0 mt-0.5" />
                    <div>
                      <span className="font-bold text-foreground block leading-tight">Desktop Web Console</span>
                      <span className="text-[10px] text-muted-foreground block mt-0.5">Windows 11 • Bangalore (Current)</span>
                    </div>
                  </div>
                  <Badge variant="outline" className="bg-green-50 border-green-200 text-green-700 py-0">ACTIVE</Badge>
                </div>
                <div className="flex justify-between items-start gap-2 border-t border-border pt-3">
                  <div className="flex gap-2">
                    <Smartphone className="h-4 w-4 text-muted-foreground shrink-0 mt-0.5" />
                    <div>
                      <span className="font-bold text-foreground block leading-tight">MyGate Mobile App</span>
                      <span className="text-[10px] text-muted-foreground block mt-0.5">iOS 17 • Bangalore</span>
                    </div>
                  </div>
                  <Button variant="ghost" className="h-6 text-[10px] text-red-500 hover:text-red-700 hover:bg-red-50/50 p-1">Revoke</Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      )}

      {activeTab === "preferences" && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Notifications config */}
          <Card className="border border-border">
            <CardHeader>
              <CardTitle className="text-headline-md text-foreground">Notification Preferences</CardTitle>
              <CardDescription className="text-body-sm text-muted-foreground">Configure your RWA emergency alerts and AI optimization notification criteria.</CardDescription>
            </CardHeader>
            <CardContent className="divide-y divide-border">
              {[
                { key: "email", label: "Email Notifications", desc: "Receive weekly CEE netting ledger transaction receipts and monthly CAM bills." },
                { key: "sms", label: "SMS Notifications", desc: "Receive immediate SMS notification overrides when VPP triage activates." },
                { key: "system", label: "System Alerts", desc: "Receive desktop notifications for edge gateway heartbeat failures or Modbus dropouts." },
                { key: "ai", label: "AI Optimization Recommendations", desc: "Receive automated recommendations to pre-charge battery before monsoons." },
                { key: "emergency", label: "Emergency Dispatch Alerts", desc: "Receive high-priority alerts when grid outages require shedding of EV charging loads." },
              ].map((opt) => (
                <div key={opt.key} className="flex justify-between items-start gap-4 py-4 first:pt-0 last:pb-0">
                  <div className="space-y-0.5">
                    <span className="text-xs font-bold text-foreground block">{opt.label}</span>
                    <span className="text-[10px] text-muted-foreground block leading-relaxed font-medium">{opt.desc}</span>
                  </div>
                  <button
                    onClick={() => handleToggleNotif(opt.key as keyof typeof notifs)}
                    className={`relative w-9 h-5 rounded-full transition-colors shrink-0 mt-0.5 ${
                      notifs[opt.key as keyof typeof notifs] ? "bg-[#2E7D32]" : "bg-muted"
                    }`}
                  >
                    <div className={`absolute top-0.5 left-0.5 h-4 w-4 rounded-full bg-white shadow transition-transform ${
                      notifs[opt.key as keyof typeof notifs] ? "translate-x-4" : "translate-x-0"
                    }`} />
                  </button>
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Regional settings */}
          <Card className="border border-border flex flex-col justify-between">
            <div>
              <CardHeader>
                <CardTitle className="text-headline-md text-foreground">Regional Settings & Layout</CardTitle>
                <CardDescription className="text-body-sm text-muted-foreground">Configure display preferences, local DISCOM timezone, and date layouts.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4 text-xs font-semibold text-muted-foreground">
                <div className="space-y-2">
                  <span className="text-muted-foreground font-semibold">Active Theme Mode</span>
                  <select
                    className="w-full border border-border rounded-lg text-xs p-2.5 bg-background font-medium outline-none text-foreground"
                    value={prefSettings.theme}
                    onChange={(e) => setPrefSettings((prev) => ({ ...prev, theme: e.target.value }))}
                  >
                    <option value="light">Enterprise Light Theme (Brand Green)</option>
                    <option value="dark">Enterprise High-Contrast Theme (Brand Green)</option>
                  </select>
                </div>

                <div className="space-y-2 border-t border-border pt-4">
                  <span className="text-muted-foreground font-semibold">Language / Regional Locale</span>
                  <select
                    className="w-full border border-border rounded-lg text-xs p-2.5 bg-background font-medium outline-none text-foreground"
                    value={prefSettings.language}
                    onChange={(e) => setPrefSettings((prev) => ({ ...prev, language: e.target.value }))}
                  >
                    <option value="en-US">English (United States)</option>
                    <option value="en-IN">English (India)</option>
                    <option value="kn-IN">ಕನ್ನಡ (Kannada - Karnataka)</option>
                  </select>
                </div>

                <div className="space-y-2 border-t border-border pt-4">
                  <span className="text-muted-foreground font-semibold">Local Discom Timezone</span>
                  <select
                    className="w-full border border-border rounded-lg text-xs p-2.5 bg-background font-medium outline-none text-foreground"
                    value={prefSettings.timezone}
                    onChange={(e) => setPrefSettings((prev) => ({ ...prev, timezone: e.target.value }))}
                  >
                    <option value="IST (UTC+05:30)">Indian Standard Time (IST - Asia/Kolkata)</option>
                    <option value="UTC">Coordinated Universal Time (UTC)</option>
                  </select>
                </div>

                <div className="space-y-2 border-t border-border pt-4 pb-1">
                  <span className="text-muted-foreground font-semibold">Date Format Layout</span>
                  <select
                    className="w-full border border-border rounded-lg text-xs p-2.5 bg-background font-medium outline-none text-foreground"
                    value={prefSettings.dateFormat}
                    onChange={(e) => setPrefSettings((prev) => ({ ...prev, dateFormat: e.target.value }))}
                  >
                    <option value="DD/MM/YYYY">DD/MM/YYYY (e.g. 01/08/2026)</option>
                    <option value="YYYY-MM-DD">YYYY-MM-DD (e.g. 2026-08-01)</option>
                    <option value="MM/DD/YYYY">MM/DD/YYYY (e.g. 08/01/2026)</option>
                  </select>
                </div>
              </CardContent>
            </div>
            <div className="p-4 border-t border-border bg-surface-container-low rounded-b-lg flex justify-end">
              <Button className="bg-[#2E7D32] hover:bg-[#1B5E20] text-white">
                Save Display Preferences
              </Button>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}
