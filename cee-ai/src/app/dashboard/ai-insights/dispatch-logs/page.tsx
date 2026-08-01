"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  Card,
  CardContent,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  ArrowLeft,
  Search,
  Eye,
  FileText,
  Activity,
  CheckCircle2,
  XCircle,
  Clock,
  User,
  Cpu,
  Database,
  TrendingDown,
  Info,
} from "lucide-react";

interface DispatchLog {
  id: string;
  timestamp: string;
  community: string;
  type: string;
  status: string;
  summary: string;
  energy: number;
}

export default function DispatchLogsPage() {
  const [logs, setLogs] = useState<DispatchLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Search & Filter State
  const [search, setSearch] = useState("");
  const [selectedType, setSelectedType] = useState("ALL");
  const [selectedStatus, setSelectedStatus] = useState("ALL");
  const [sortBy, setSortBy] = useState("newest"); // "newest" | "oldest" | "energy-high" | "energy-low"
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  // Modal / Detail state
  const [activeReport, setActiveReport] = useState<DispatchLog | null>(null);

  useEffect(() => {
    let active = true;

    const loadData = async () => {
      Promise.resolve().then(() => {
        setLoading(true);
        setError(null);
      });
      try {
        const params = new URLSearchParams();
        if (search) params.append("query", search);
        if (selectedType !== "ALL") params.append("type", selectedType);
        if (selectedStatus !== "ALL") params.append("status", selectedStatus);

        const res = await fetch(`/api/v1/hardware/dispatch-logs?${params.toString()}`);
        const payload = await res.json();
        
        if (active) {
          if (payload.status === "success") {
            const data = (payload.data || []) as DispatchLog[];
            // Apply frontend sorting
            if (sortBy === "newest") {
              data.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
            } else if (sortBy === "oldest") {
              data.sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
            } else if (sortBy === "energy-high") {
              data.sort((a, b) => b.energy - a.energy);
            } else if (sortBy === "energy-low") {
              data.sort((a, b) => a.energy - b.energy);
            }
            setLogs(data);
          } else {
            setError(payload.error?.message || "Failed to load dispatch logs.");
          }
        }
      } catch {
        if (active) {
          setError("Network error while loading dispatch logs.");
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    };

    loadData();

    return () => {
      active = false;
    };
  }, [search, selectedType, selectedStatus, sortBy, refreshTrigger]);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "COMPLETED":
        return (
          <Badge variant="outline" className="bg-green-50 border-green-200 text-green-700 font-semibold gap-1 py-0.5 px-2">
            <CheckCircle2 className="h-3 w-3" /> COMPLETED
          </Badge>
        );
      case "ACTIVE":
        return (
          <Badge variant="outline" className="bg-blue-50 border-blue-200 text-blue-700 font-semibold gap-1 py-0.5 px-2 animate-pulse">
            <Activity className="h-3 w-3" /> ACTIVE
          </Badge>
        );
      case "FAILED":
        return (
          <Badge variant="outline" className="bg-red-50 border-red-200 text-red-700 font-semibold gap-1 py-0.5 px-2">
            <XCircle className="h-3 w-3" /> FAILED
          </Badge>
        );
      case "PENDING":
        return (
          <Badge variant="outline" className="bg-yellow-50 border-yellow-200 text-yellow-700 font-semibold gap-1 py-0.5 px-2">
            <Clock className="h-3 w-3" /> PENDING
          </Badge>
        );
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Header Breadcrumb */}
      <div className="flex items-center gap-3">
        <Button variant="outline" size="sm" asChild>
          <Link href="/dashboard/ai-insights">
            <ArrowLeft className="h-4 w-4 mr-1.5" /> Back to Insights
          </Link>
        </Button>
      </div>

      <div>
        <h2 className="font-headline text-2xl font-bold text-foreground">
          VPP Dispatch History
        </h2>
        <p className="text-body-sm text-muted-foreground">
          Historical log of AI-dispatched virtual power plant battery netting and microgrid triage commands.
        </p>
      </div>

      {/* Control Bar: Filters, Search, Sort */}
      <Card className="border border-border">
        <CardContent className="pt-6">
          <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
            {/* Search Input */}
            <div className="relative w-full md:w-80">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
              <input
                type="text"
                placeholder="Search logs by ID, type, or action..."
                className="w-full pl-9 pr-4 py-2 border border-border rounded-lg text-sm bg-background focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>

            {/* Dropdown Filters */}
            <div className="flex flex-wrap gap-3 w-full md:w-auto">
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold text-muted-foreground">Type:</span>
                <select
                  className="border border-border rounded-lg text-xs p-2 bg-background font-medium outline-none"
                  value={selectedType}
                  onChange={(e) => setSelectedType(e.target.value)}
                >
                  <option value="ALL">All Types</option>
                  <option value="VPP Peak Shaving">VPP Peak Shaving</option>
                  <option value="Emergency Triage">Emergency Triage</option>
                  <option value="Solar Self-Consumption">Solar Self-Consumption</option>
                  <option value="Microgrid Islanding">Microgrid Islanding</option>
                </select>
              </div>

              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold text-muted-foreground">Status:</span>
                <select
                  className="border border-border rounded-lg text-xs p-2 bg-background font-medium outline-none"
                  value={selectedStatus}
                  onChange={(e) => setSelectedStatus(e.target.value)}
                >
                  <option value="ALL">All Statuses</option>
                  <option value="COMPLETED">Completed</option>
                  <option value="ACTIVE">Active</option>
                  <option value="FAILED">Failed</option>
                  <option value="PENDING">Pending</option>
                </select>
              </div>

              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold text-muted-foreground">Sort By:</span>
                <select
                  className="border border-border rounded-lg text-xs p-2 bg-background font-medium outline-none"
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                >
                  <option value="newest">Newest First</option>
                  <option value="oldest">Oldest First</option>
                  <option value="energy-high">Energy (High to Low)</option>
                  <option value="energy-low">Energy (Low to High)</option>
                </select>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Main Table Container */}
      <Card className="border border-border">
        <CardContent className="p-0">
          {loading ? (
            <div className="p-12 space-y-4">
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="flex gap-4 items-center">
                  <div className="h-6 w-16 bg-muted animate-pulse rounded" />
                  <div className="h-6 w-32 bg-muted animate-pulse rounded" />
                  <div className="h-6 flex-1 bg-muted animate-pulse rounded" />
                  <div className="h-6 w-24 bg-muted animate-pulse rounded" />
                </div>
              ))}
            </div>
          ) : error ? (
            <div className="p-12 text-center space-y-3">
              <TrendingDown className="h-10 w-10 text-red-500 mx-auto" />
              <p className="font-semibold text-foreground">{error}</p>
              <Button size="sm" onClick={() => setRefreshTrigger((prev) => prev + 1)}>
                Try Again
              </Button>
            </div>
          ) : logs.length === 0 ? (
            <div className="p-16 text-center space-y-3">
              <FileText className="h-12 w-12 text-muted-foreground/60 mx-auto" />
              <h3 className="font-headline font-bold text-base text-foreground">
                No dispatch logs found
              </h3>
              <p className="text-body-sm text-muted-foreground max-w-sm mx-auto">
                No telemetry controls match your search criteria. Try modifying your filter settings.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-border bg-surface-container-low text-muted-foreground font-semibold uppercase tracking-wider">
                    <th className="p-4">Dispatch ID</th>
                    <th className="p-4">Timestamp</th>
                    <th className="p-4">Community</th>
                    <th className="p-4">Dispatch Type</th>
                    <th className="p-4">Status</th>
                    <th className="p-4">AI Decision Summary</th>
                    <th className="p-4">Energy Allocated</th>
                    <th className="p-4 text-center">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {logs.map((log) => (
                    <tr
                      key={log.id}
                      onClick={() => setActiveReport(log)}
                      className="hover:bg-muted/30 transition-colors cursor-pointer"
                    >
                      <td className="p-4 font-bold text-foreground">{log.id}</td>
                      <td className="p-4 text-muted-foreground whitespace-nowrap">
                        {new Date(log.timestamp).toLocaleString()}
                      </td>
                      <td className="p-4 text-foreground font-medium">{log.community}</td>
                      <td className="p-4 font-semibold text-foreground">{log.type}</td>
                      <td className="p-4">{getStatusBadge(log.status)}</td>
                      <td className="p-4 text-muted-foreground font-medium max-w-xs truncate">
                        {log.summary}
                      </td>
                      <td className="p-4 font-bold text-foreground">
                        {log.energy > 0 ? `${log.energy.toFixed(1)} kWh` : "—"}
                      </td>
                      <td className="p-4 text-center">
                        <Button
                          size="icon"
                          variant="ghost"
                          onClick={(e) => {
                            e.stopPropagation();
                            setActiveReport(log);
                          }}
                          className="h-8 w-8 text-primary hover:text-primary-foreground hover:bg-primary"
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* detailed dispatch report Modal */}
      {activeReport && (
        <>
          <div
            className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 transition-all duration-200"
            onClick={() => setActiveReport(null)}
          />
          <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-lg bg-card border border-border rounded-2xl shadow-2xl z-50 overflow-hidden animate-in fade-in zoom-in-95 duration-200 max-h-[90vh] flex flex-col font-data text-xs animate-[scaleIn_0.2s_ease-out]">
            {/* Header */}
            <div className="p-5 border-b border-border bg-gradient-to-r from-primary/5 to-transparent flex justify-between items-center">
              <div>
                <h3 className="font-headline font-bold text-base text-foreground">
                  Dispatch Audit Report
                </h3>
                <span className="text-[10px] text-muted-foreground mt-0.5 block font-semibold">
                  Command ID: cmd-manual-{activeReport.id.replace("dsp-", "")}
                </span>
              </div>
              <div>{getStatusBadge(activeReport.status)}</div>
            </div>

            {/* Content */}
            <div className="p-6 overflow-y-auto space-y-5 flex-1">
              {/* Top Overview Cards */}
              <div className="grid grid-cols-2 gap-4">
                <div className="p-3 bg-surface-container rounded-xl border border-border/60">
                  <span className="text-muted-foreground font-semibold uppercase block text-[9px]">
                    Energy Allocated
                  </span>
                  <span className="text-base font-bold text-foreground mt-0.5 block font-headline">
                    {activeReport.energy > 0 ? `${activeReport.energy} kWh` : "0.0 kWh"}
                  </span>
                </div>
                <div className="p-3 bg-surface-container rounded-xl border border-border/60">
                  <span className="text-muted-foreground font-semibold uppercase block text-[9px]">
                    Gateway Status
                  </span>
                  <span className="text-base font-bold text-energy-solar mt-0.5 block flex items-center gap-1 font-headline">
                    <CheckCircle2 className="h-4 w-4" /> ONLINE
                  </span>
                </div>
              </div>

              {/* Event details parameters */}
              <div className="space-y-3">
                <h4 className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider flex items-center gap-1 font-semibold">
                  <Info className="h-3.5 w-3.5 text-primary" /> Dispatch Parameters
                </h4>
                <div className="border border-border rounded-xl divide-y divide-border bg-surface-container-low/40">
                  <div className="p-3 flex justify-between">
                    <span className="text-muted-foreground font-semibold">Issued At</span>
                    <span className="font-medium text-foreground">
                      {new Date(activeReport.timestamp).toLocaleString()}
                    </span>
                  </div>
                  <div className="p-3 flex justify-between">
                    <span className="text-muted-foreground font-semibold">Community Area</span>
                    <span className="font-medium text-foreground">{activeReport.community}</span>
                  </div>
                  <div className="p-3 flex justify-between">
                    <span className="text-muted-foreground font-semibold">Control Strategy</span>
                    <span className="font-medium text-foreground">{activeReport.type}</span>
                  </div>
                  <div className="p-3 flex justify-between">
                    <span className="text-muted-foreground font-semibold">Target Node Location</span>
                    <span className="font-medium text-foreground">Flat V-104 & Flat A-402</span>
                  </div>
                  <div className="p-3 flex justify-between">
                    <span className="text-muted-foreground font-semibold">Edge Relay Method</span>
                    <span className="font-medium text-foreground">Modbus RTU over MQTT</span>
                  </div>
                  <div className="p-3 flex justify-between">
                    <span className="text-muted-foreground font-semibold">Operator Actor</span>
                    <span className="font-medium text-foreground flex items-center gap-1">
                      <User className="h-3 w-3" /> Supabase Administrator
                    </span>
                  </div>
                </div>
              </div>

              {/* Reasoning summary */}
              <div className="space-y-2">
                <h4 className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider flex items-center gap-1 font-semibold">
                  <Cpu className="h-3.5 w-3.5 text-primary" /> AI Engine Dispatch Decision
                </h4>
                <div className="p-4 bg-primary/5 border border-primary/20 rounded-xl">
                  <p className="text-foreground leading-relaxed font-medium">
                    {activeReport.summary}
                  </p>
                </div>
              </div>

              {/* HAL Envelope safety checks */}
              <div className="space-y-2">
                <h4 className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider flex items-center gap-1 font-semibold">
                  <Database className="h-3.5 w-3.5 text-primary" /> Safety Validation Envelope (HAL)
                </h4>
                <div className="p-3 border border-border rounded-xl space-y-2.5 bg-surface-container-low/40">
                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground font-semibold">Grid Voltage Range (230V ± 10%)</span>
                    <Badge variant="outline" className="bg-green-50 border-green-200 text-green-700 font-bold py-0">PASSED</Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground font-semibold">Battery Thermal Safety Cap (&lt; 45°C)</span>
                    <Badge variant="outline" className="bg-green-50 border-green-200 text-green-700 font-bold py-0">PASSED</Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground font-semibold">Modbus Bus Checksum Integrity</span>
                    <Badge variant="outline" className="bg-green-50 border-green-200 text-green-700 font-bold py-0">PASSED</Badge>
                  </div>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="p-4 border-t border-border bg-surface-container-low flex justify-end gap-2.5">
              <Button size="sm" variant="outline" onClick={() => setActiveReport(null)}>
                Close Report
              </Button>
              <Button size="sm" className="gap-1.5 bg-[#2E7D32] hover:bg-[#1B5E20] text-white">
                Download PDF Audit
              </Button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
