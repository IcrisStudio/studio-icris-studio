"use client";

import { useState, useMemo } from "react";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import DashboardLayout from "@/components/DashboardLayout";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  DollarSign,
  TrendingUp,
  TrendingDown,
  ClipboardCheck,
  Clock,
  AlertCircle,
  Calendar,
  Wallet,
  ArrowUpRight,
  Target,
  Zap
} from "lucide-react";
import {
  Area,
  AreaChart,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default function DashboardPage() {
  const { isAdmin } = useAuth();
  const [timeRange, setTimeRange] = useState("30d");

  // All hooks must be at the top
  const metrics = useQuery(api.dashboard.getMetrics, { timeRange });
  const monthlyData = useQuery(api.dashboard.getMonthlyData, { timeRange: "12m" });
  const staffDistribution = useQuery(api.dashboard.getStaffPaymentDistribution, { timeRange });

  const statCards = useMemo(() => {
    if (!metrics) return [];
    return [
      {
        title: "Capital Reservoir",
        value: `NPR ${metrics.total_income.toLocaleString()}`,
        description: "Cumulative verified revenue",
        icon: <DollarSign className="h-4 w-4" />,
        accent: "bg-emerald-500/10 text-emerald-600",
      },
      {
        title: "Retained Profit",
        value: `NPR ${metrics.net_profit.toLocaleString()}`,
        description: "Net yield after all OpEx",
        icon: <TrendingUp className="h-4 w-4" />,
        accent: "bg-blue-500/10 text-blue-600",
      },
      {
        title: "Burn Rate (OpEx)",
        value: `NPR ${metrics.total_expenses.toLocaleString()}`,
        description: "Operational expenditure",
        icon: <TrendingDown className="h-4 w-4" />,
        accent: "bg-rose-500/10 text-rose-600",
      },
      {
        title: "Ledger Liability",
        value: `NPR ${(metrics as any).pending_staff_payments.toLocaleString()}`,
        description: "Pending staff allocations",
        icon: <Wallet className="h-4 w-4" />,
        accent: "bg-amber-500/10 text-amber-600",
      },
    ];
  }, [metrics]);

  const drillingMetrics = useMemo(() => {
    if (!metrics) return [];
    const m = metrics as any;
    return [
      { label: "Production Paid", value: m.task_payments_paid, color: "text-emerald-500", detail: "Settled production work" },
      { label: "Production Pending", value: m.task_payments_pending, color: "text-amber-500", detail: "Work-in-progress liability" },
      { label: "Staff Requests", value: m.requested_staff_payments, color: "text-indigo-500", detail: "Active payout tickets" },
      { label: "Staff Settled", value: m.completed_staff_payments, color: "text-blue-500", detail: "Successfully disbursed" },
    ];
  }, [metrics]);

  if (!isAdmin) {
    return (
      <DashboardLayout>
        <div className="flex h-[450px] flex-col items-center justify-center text-center space-y-4">
          <div className="h-10 w-10 rounded-full bg-destructive/10 flex items-center justify-center text-destructive">
            <Target size={20} />
          </div>
          <p className="text-[10px] font-black uppercase tracking-[0.2em] opacity-40">Biometric Verification Required</p>
        </div>
      </DashboardLayout>
    );
  }

  const isLoading = !metrics || !monthlyData || !staffDistribution;

  return (
    <DashboardLayout>
      <div className="container max-w-7xl animate-in fade-in duration-1000 space-y-12 py-10">

        {/* Apple-Style Header */}
        <div className="flex flex-col gap-8 md:flex-row md:items-end md:justify-between border-b border-border/40 pb-10">
          <div className="space-y-2">
            <h1 className="text-4xl font-black tracking-tighter uppercase font-sans">Control Center</h1>
            <div className="flex items-center gap-4 text-[9px] font-black text-muted-foreground uppercase tracking-[0.2em] opacity-50">
              <span className="flex items-center gap-2 font-black"><div className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" /> Live System Monitor</span>
              <span>•</span>
              <span>OS v2.4.0</span>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <Tabs value={timeRange} onValueChange={setTimeRange} className="hidden lg:block">
              <TabsList className="h-11 rounded-xl bg-muted/30 p-1 border-none shadow-none ring-1 ring-border">
                {['7d', '30d', '90d', 'all'].map((range) => (
                  <TabsTrigger key={range} value={range} className="text-[9px] font-black uppercase px-6 h-9 rounded-lg data-[state=active]:bg-background data-[state=active]:shadow-xl transition-all">
                    {range}
                  </TabsTrigger>
                ))}
              </TabsList>
            </Tabs>

            <Select value={timeRange} onValueChange={setTimeRange}>
              <SelectTrigger className="w-[150px] h-11 text-[10px] font-black uppercase rounded-xl border-none shadow-none bg-muted/30 lg:hidden ring-1 ring-border">
                <Calendar className="mr-2 h-4 w-4 opacity-30" />
                <SelectValue placeholder="Period" />
              </SelectTrigger>
              <SelectContent className="rounded-2xl border shadow-2xl">
                <SelectItem value="7d" className="text-[10px] font-bold uppercase py-3 text-center">Last 7 Cycles</SelectItem>
                <SelectItem value="30d" className="text-[10px] font-bold uppercase py-3 text-center">Last 30 Cycles</SelectItem>
                <SelectItem value="90d" className="text-[10px] font-bold uppercase py-3 text-center">Quarterly Phase</SelectItem>
                <SelectItem value="all" className="text-[10px] font-bold uppercase py-3 text-center">Archive History</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Primary Matrix */}
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {isLoading ? Array(4).fill(0).map((_, i) => <StatCardSkeleton key={i} />) :
            statCards.map((card) => (
              <Card key={card.title} className="rounded-[2rem] border border-border/40 shadow-none bg-card/40 overflow-hidden hover:bg-card/60 transition-all cursor-default group hover:border-primary/10">
                <CardContent className="p-8 space-y-6">
                  <div className="flex items-center justify-between">
                    <p className="text-[9px] font-black uppercase tracking-[0.25em] text-muted-foreground opacity-30 group-hover:opacity-100 transition-opacity">
                      {card.title}
                    </p>
                    <div className={`p-2.5 rounded-2xl ${card.accent} shadow-sm transition-transform group-hover:rotate-12`}>
                      {card.icon}
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <h3 className="text-3xl font-black tracking-tightest font-sans">{card.value}</h3>
                    <p className="text-[8px] font-black text-muted-foreground uppercase tracking-widest opacity-40">{card.description}</p>
                  </div>
                </CardContent>
              </Card>
            ))
          }
        </div>

        {/* Performance Architecture */}
        <div className="grid gap-8 md:grid-cols-12">
          {/* Main Chart Architecture */}
          <Card className="md:col-span-8 rounded-[2.5rem] border border-border/40 shadow-none overflow-hidden bg-card/20 backdrop-blur-sm relative group">
            <div className="absolute top-0 right-0 p-8 opacity-[0.02] pointer-events-none group-hover:opacity-[0.05] transition-opacity duration-1000">
              <Zap size={200} />
            </div>
            <CardHeader className="bg-muted/10 border-b border-border/40 p-10 pb-8">
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <CardTitle className="text-xl font-black tracking-tighter uppercase font-sans">Growth Architecture</CardTitle>
                  <CardDescription className="text-[9px] uppercase font-black tracking-[0.2em] text-muted-foreground opacity-40">Capital inflow vs operational burn</CardDescription>
                </div>
                <div className="flex items-center gap-6">
                  <div className="flex items-center gap-2"><div className="h-1.5 w-1.5 rounded-full bg-emerald-500 shadow-[0_0_10px_#10b981]" /><span className="text-[8px] font-black uppercase tracking-widest opacity-40">Inflow</span></div>
                  <div className="flex items-center gap-2"><div className="h-1.5 w-1.5 rounded-full bg-rose-500 shadow-[0_0_10px_#f43f5e]" /><span className="text-[8px] font-black uppercase tracking-widest opacity-40">Outflow</span></div>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-10 pt-12">
              {isLoading ? <Skeleton className="h-[350px] w-full rounded-2xl" /> :
                <div className="h-[350px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={monthlyData}>
                      <defs>
                        <linearGradient id="cInc" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#10b981" stopOpacity={0.1} />
                          <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                        </linearGradient>
                        <linearGradient id="cExp" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#f43f5e" stopOpacity={0.1} />
                          <stop offset="95%" stopColor="#f43f5e" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="8 8" vertical={false} stroke="#e2e8f0" opacity={0.3} />
                      <XAxis
                        dataKey="month"
                        axisLine={false}
                        tickLine={false}
                        tick={{ fontSize: 8, fontWeight: 900, fill: '#94a3b8', textTransform: 'uppercase' }}
                        dy={20}
                      />
                      <YAxis
                        axisLine={false}
                        tickLine={false}
                        tick={{ fontSize: 8, fontWeight: 900, fill: '#94a3b8' }}
                        width={50}
                      />
                      <Tooltip
                        contentStyle={{ borderRadius: '24px', border: 'none', background: 'white', boxShadow: '0 30px 60px rgba(0,0,0,0.1)', padding: '24px' }}
                        itemStyle={{ fontSize: '9px', fontWeight: '900', textTransform: 'uppercase', padding: '4px 0' }}
                        labelStyle={{ fontSize: '10px', fontWeight: '900', marginBottom: '12px', opacity: 0.3, letterSpacing: '0.1em' }}
                        cursor={{ stroke: '#cbd5e1', strokeWidth: 1 }}
                      />
                      <Area type="monotone" dataKey="income" stroke="#10b981" strokeWidth={4} fillOpacity={1} fill="url(#cInc)" />
                      <Area type="monotone" dataKey="expenses" stroke="#f43f5e" strokeWidth={4} fillOpacity={1} fill="url(#cExp)" />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              }
            </CardContent>
          </Card>

          {/* Core Vitals */}
          <div className="md:col-span-4 space-y-8">
            <Card className="rounded-[2.5rem] border border-border/40 shadow-none bg-card/40 backdrop-blur-sm">
              <CardHeader className="p-10 pb-4">
                <CardTitle className="text-[10px] font-black uppercase tracking-[0.3em] text-muted-foreground opacity-30">Operational Vitals</CardTitle>
              </CardHeader>
              <CardContent className="p-10 pt-0 space-y-10">
                <div className="grid grid-cols-1 gap-8">
                  {isLoading ? Array(4).fill(0).map((_, i) => <Skeleton key={i} className="h-12 w-full rounded-2xl" />) :
                    drillingMetrics.map((item) => (
                      <div key={item.label} className="group cursor-default">
                        <div className="flex items-center justify-between mb-1.5">
                          <span className="text-[8px] font-black uppercase tracking-[0.1em] text-muted-foreground opacity-40 group-hover:opacity-100 transition-opacity">{item.label}</span>
                          <ArrowUpRight size={10} className="opacity-[0.05] group-hover:opacity-40" />
                        </div>
                        <p className={`text-xl font-black tracking-tightest ${item.color}`}>NPR {item.value.toLocaleString()}</p>
                        <p className="text-[7px] font-black text-muted-foreground uppercase tracking-widest opacity-20 mt-1">{item.detail}</p>
                      </div>
                    ))
                  }
                </div>

                <div className="space-y-6 pt-8 border-t border-border/30 border-dashed">
                  {isLoading ? null : (metrics as any).total_tasks > 0 && (
                    <div className="space-y-3">
                      <div className="flex items-center justify-between text-[9px] font-black uppercase tracking-[0.2em]">
                        <span className="opacity-30">Delivery Velocity</span>
                        <span className="text-emerald-500 font-black">{Math.round(((metrics as any).completed_tasks / (metrics as any).total_tasks) * 100)}% Unit Completion</span>
                      </div>
                      <div className="h-2 w-full bg-muted/40 rounded-full overflow-hidden p-[2px] ring-1 ring-border/20">
                        <div className="h-full bg-emerald-500 rounded-full shadow-[0_0_10px_rgba(16,185,129,0.4)]" style={{ width: `${((metrics as any).completed_tasks / (metrics as any).total_tasks) * 100}%` }} />
                      </div>
                    </div>
                  )}
                  <div className="p-6 rounded-[1.8rem] bg-emerald-500/5 ring-1 ring-emerald-500/10 border-none shadow-none group active:scale-95 transition-all">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4 text-emerald-600">
                        <Zap size={18} fill="currentColor" />
                        <div>
                          <p className="text-[9px] font-black uppercase tracking-widest">Health</p>
                          <p className="text-[10px] font-bold uppercase opacity-60">Stable Node</p>
                        </div>
                      </div>
                      <div className="h-2 w-2 rounded-full bg-emerald-500 animate-ping" />
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="rounded-[2.5rem] border-none bg-primary text-primary-foreground shadow-2xl overflow-hidden relative group cursor-pointer hover:scale-[1.02] active:scale-[0.98] transition-all">
              <CardContent className="p-10 space-y-4">
                <div className="relative z-10 space-y-2">
                  <p className="text-[9px] font-black uppercase tracking-[0.3em] opacity-40 font-sans">Accounts Receivable</p>
                  <h3 className="text-4xl font-black tracking-tightest">NPR {(metrics as any)?.pending_income?.toLocaleString() || "0"}</h3>
                  <p className="text-[8px] font-black uppercase tracking-widest opacity-30 mt-2">Outstanding client credit ledger</p>
                </div>
                <div className="absolute top-[-10%] right-[-10%] opacity-[0.08] group-hover:rotate-45 transition-transform duration-1000 scale-125">
                  <DollarSign size={200} />
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}

function StatCardSkeleton() {
  return (
    <Card className="rounded-[2rem] border border-border/40 shadow-none">
      <CardContent className="p-8 space-y-6">
        <Skeleton className="h-4 w-12 rounded-full" />
        <div className="space-y-2">
          <Skeleton className="h-10 w-44 rounded-lg" />
          <Skeleton className="h-2 w-32 rounded-full" />
        </div>
      </CardContent>
    </Card>
  );
}
