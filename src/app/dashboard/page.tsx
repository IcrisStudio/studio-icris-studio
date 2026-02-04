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
} from "lucide-react";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
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
        title: "Gross Revenue",
        value: `NPR ${metrics.total_income.toLocaleString()}`,
        description: "Confirmed receipts & paid tasks",
        icon: <DollarSign className="h-3.5 w-3.5" />,
        accent: "bg-emerald-500/10 text-emerald-600",
      },
      {
        title: "Retained Profit",
        value: `NPR ${metrics.net_profit.toLocaleString()}`,
        description: "Revenue minus all overheads",
        icon: <TrendingUp className="h-3.5 w-3.5" />,
        accent: "bg-blue-500/10 text-blue-600",
      },
      {
        title: "OpEx (Expenses)",
        value: `NPR ${metrics.total_expenses.toLocaleString()}`,
        description: "Salaries and operational costs",
        icon: <TrendingDown className="h-3.5 w-3.5" />,
        accent: "bg-rose-500/10 text-rose-600",
      },
      {
        title: "Ledger Payable",
        value: `NPR ${(metrics as any).pending_staff_payments.toLocaleString()}`,
        description: "Awaiting staff disbursement",
        icon: <Wallet className="h-3.5 w-3.5" />,
        accent: "bg-amber-500/10 text-amber-600",
      },
    ];
  }, [metrics]);

  const drillingMetrics = useMemo(() => {
    if (!metrics) return [];
    const m = metrics as any;
    return [
      { label: "Production Paid", value: m.task_payments_paid, color: "text-emerald-500" },
      { label: "Production Pending", value: m.task_payments_pending, color: "text-amber-500" },
      { label: "Staff Requests", value: m.requested_staff_payments, color: "text-indigo-500" },
      { label: "Staff Settled", value: m.completed_staff_payments, color: "text-blue-500" },
    ];
  }, [metrics]);

  if (!isAdmin) {
    return (
      <DashboardLayout>
        <div className="flex h-[450px] flex-col items-center justify-center text-center space-y-3">
          <div className="h-10 w-10 rounded-full bg-destructive/10 flex items-center justify-center text-destructive">
            <AlertCircle size={20} />
          </div>
          <div>
            <h2 className="text-lg font-bold tracking-tight">Security Restriction</h2>
            <p className="text-xs text-muted-foreground max-w-xs mx-auto">
              Only administrative entities are authorized to access the studio data warehouse.
            </p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  const isLoading = !metrics || !monthlyData || !staffDistribution;

  return (
    <DashboardLayout>
      <div className="container max-w-7xl animate-in fade-in duration-700 space-y-10 py-8">

        {/* Header Block */}
        <div className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between border-b pb-8">
          <div className="space-y-1.5">
            <h1 className="text-3xl font-black tracking-tightest uppercase font-sans">Studio Cockpit</h1>
            <div className="flex items-center gap-2 text-[10px] font-bold text-muted-foreground uppercase tracking-[0.2em] opacity-60">
              <span className="flex items-center gap-1"><div className="h-1 w-1 rounded-full bg-emerald-500 animate-pulse" /> Live Intelligence</span>
              <span>•</span>
              <span>Icris Studio Internal v2.0</span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Tabs value={timeRange} onValueChange={setTimeRange} className="hidden lg:block">
              <TabsList className="h-10 rounded-lg bg-muted/40 p-1 border">
                {['7d', '30d', '90d', 'all'].map((range) => (
                  <TabsTrigger key={range} value={range} className="text-[10px] font-black uppercase px-4 h-8 rounded-md data-[state=active]:shadow-sm">
                    {range}
                  </TabsTrigger>
                ))}
              </TabsList>
            </Tabs>

            <Select value={timeRange} onValueChange={setTimeRange}>
              <SelectTrigger className="w-[140px] h-10 text-[10px] font-black uppercase rounded-lg border shadow-none bg-muted/5 sm:lg:hidden">
                <Calendar className="mr-2 h-3.5 w-3.5 opacity-40" />
                <SelectValue placeholder="Period" />
              </SelectTrigger>
              <SelectContent className="rounded-xl border shadow-2xl">
                <SelectItem value="7d" className="text-[10px] font-bold uppercase">Last 7 Days</SelectItem>
                <SelectItem value="30d" className="text-[10px] font-bold uppercase">Last 30 Days</SelectItem>
                <SelectItem value="90d" className="text-[10px] font-bold uppercase">Last 90 Days</SelectItem>
                <SelectItem value="all" className="text-[10px] font-bold uppercase">Master History</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Primary Stats */}
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {isLoading ? Array(4).fill(0).map((_, i) => <StatCardSkeleton key={i} />) :
            statCards.map((card) => (
              <Card key={card.title} className="rounded-2xl border border-border/50 shadow-none bg-card/50 overflow-hidden group hover:border-border transition-colors">
                <CardContent className="p-6 space-y-4">
                  <div className="flex items-center justify-between">
                    <p className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground opacity-50">
                      {card.title}
                    </p>
                    <div className={`p-2 rounded-xl ${card.accent}`}>
                      {card.icon}
                    </div>
                  </div>
                  <div className="space-y-1">
                    <h3 className="text-3xl font-black tracking-tightest font-sans">{card.value}</h3>
                    <p className="text-[9px] font-bold text-muted-foreground uppercase tracking-tight opacity-40">{card.description}</p>
                  </div>
                </CardContent>
              </Card>
            ))
          }
        </div>

        {/* Operational Grid */}
        <div className="grid gap-8 md:grid-cols-12">
          {/* Main Chart */}
          <Card className="md:col-span-8 rounded-3xl border shadow-none overflow-hidden bg-card/30">
            <CardHeader className="bg-muted/10 border-b p-8 pb-6">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-lg font-black tracking-tightest uppercase font-sans">Growth Dynamics</CardTitle>
                  <CardDescription className="text-[10px] uppercase font-bold tracking-widest text-muted-foreground opacity-50 mt-1">Fiscal year projection vs actuals</CardDescription>
                </div>
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-1.5"><div className="h-2 w-2 rounded-full bg-emerald-500" /><span className="text-[9px] font-black uppercase opacity-60">Revenue</span></div>
                  <div className="flex items-center gap-1.5"><div className="h-2 w-2 rounded-full bg-rose-500" /><span className="text-[9px] font-black uppercase opacity-60">Costs</span></div>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-8 pt-10">
              {isLoading ? <Skeleton className="h-[320px] w-full rounded-2xl" /> :
                <div className="h-[320px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={monthlyData}>
                      <defs>
                        <linearGradient id="colorInc" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#10b981" stopOpacity={0.08} />
                          <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                        </linearGradient>
                        <linearGradient id="colorExp" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#f43f5e" stopOpacity={0.08} />
                          <stop offset="95%" stopColor="#f43f5e" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="6 6" vertical={false} stroke="#e2e8f0" opacity={0.4} />
                      <XAxis
                        dataKey="month"
                        axisLine={false}
                        tickLine={false}
                        tick={{ fontSize: 9, fontWeight: 900, fill: '#64748b', textTransform: 'uppercase' }}
                        dy={15}
                      />
                      <YAxis
                        axisLine={false}
                        tickLine={false}
                        tick={{ fontSize: 9, fontWeight: 900, fill: '#64748b' }}
                        width={45}
                      />
                      <Tooltip
                        contentStyle={{ borderRadius: '16px', border: '1px solid #e2e8f0', boxShadow: '0 20px 50px rgba(0,0,0,0.1)', padding: '16px' }}
                        itemStyle={{ fontSize: '10px', fontWeight: '900', textTransform: 'uppercase' }}
                        labelStyle={{ fontSize: '11px', fontWeight: '900', marginBottom: '8px', opacity: 0.5 }}
                      />
                      <Area type="monotone" dataKey="income" stroke="#10b981" strokeWidth={3} fillOpacity={1} fill="url(#colorInc)" />
                      <Area type="monotone" dataKey="expenses" stroke="#f43f5e" strokeWidth={3} fillOpacity={1} fill="url(#colorExp)" />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              }
            </CardContent>
          </Card>

          {/* Drilldown Vitals */}
          <div className="md:col-span-4 space-y-8">
            <Card className="rounded-3xl border shadow-none bg-card/50">
              <CardHeader className="p-8 pb-2">
                <CardTitle className="text-xs font-black uppercase tracking-[0.2em] text-muted-foreground opacity-50">Operational Vitals</CardTitle>
              </CardHeader>
              <CardContent className="p-8 space-y-8">
                <div className="grid grid-cols-2 gap-x-6 gap-y-8">
                  {isLoading ? Array(4).fill(0).map((_, i) => <Skeleton key={i} className="h-10 w-full rounded-lg" />) :
                    drillingMetrics.map((item) => (
                      <div key={item.label} className="space-y-1">
                        <span className="text-[9px] font-black uppercase tracking-widest text-muted-foreground opacity-40">{item.label}</span>
                        <p className={`text-sm font-black tracking-tightest ${item.color}`}>NPR {item.value.toLocaleString()}</p>
                      </div>
                    ))
                  }
                </div>

                <div className="space-y-5 pt-4 border-t border-dashed">
                  {isLoading ? null : (metrics as any).completed_tasks > 0 && (
                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-[10px] font-black uppercase tracking-widest">
                        <span className="opacity-40">Efficiency Rate</span>
                        <span className="text-emerald-500">{Math.round(((metrics as any).completed_tasks / (metrics as any).total_tasks) * 100)}%</span>
                      </div>
                      <div className="h-1.5 w-full bg-muted rounded-full overflow-hidden">
                        <div className="h-full bg-emerald-500 rounded-full" style={{ width: `${((metrics as any).completed_tasks / (metrics as any).total_tasks) * 100}%` }} />
                      </div>
                    </div>
                  )}
                  <div className="flex items-center justify-between p-4 rounded-2xl bg-muted/30 border border-border/50">
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-lg bg-background border shadow-sm text-primary"><ArrowUpRight size={14} /></div>
                      <div>
                        <p className="text-[10px] font-black uppercase tracking-tight">System Status</p>
                        <p className="text-[9px] font-bold text-muted-foreground uppercase opacity-40 tracking-widest">Stable / Nominal</p>
                      </div>
                    </div>
                    <div className="h-2 w-2 rounded-full bg-emerald-500 shadow-[0_0_10px_#10b981]" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="rounded-3xl border shadow-none bg-primary text-primary-foreground overflow-hidden relative group">
              <CardContent className="p-8 space-y-4">
                <div className="relative z-10 space-y-1">
                  <p className="text-[10px] font-black uppercase tracking-[0.2em] opacity-40">Accounts Receivable</p>
                  <h3 className="text-3xl font-black tracking-tightest">NPR {(metrics as any)?.pending_income?.toLocaleString() || "0"}</h3>
                  <p className="text-[9px] font-bold uppercase tracking-widest opacity-30">Outstanding balance from clients</p>
                </div>
                <div className="absolute top-[-10%] right-[-10%] opacity-10 group-hover:rotate-12 transition-transform duration-1000">
                  <DollarSign size={140} />
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
    <Card className="rounded-2xl border shadow-none">
      <CardContent className="p-6 space-y-4">
        <Skeleton className="h-3 w-16" />
        <div className="space-y-2">
          <Skeleton className="h-8 w-32" />
          <Skeleton className="h-2 w-48" />
        </div>
      </CardContent>
    </Card>
  );
}
