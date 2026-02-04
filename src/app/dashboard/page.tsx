"use client";

import { useState, useMemo } from "react";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import DashboardLayout from "@/components/DashboardLayout";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  DollarSign,
  TrendingUp,
  TrendingDown,
  Wallet,
  Calendar,
  Target,
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

export default function DashboardPage() {
  const { isAdmin } = useAuth();
  const [timeRange, setTimeRange] = useState("30d");

  const metrics = useQuery(api.dashboard.getMetrics, { timeRange });
  const monthlyData = useQuery(api.dashboard.getMonthlyData, { timeRange: "12m" });
  const staffDistribution = useQuery(api.dashboard.getStaffPaymentDistribution, { timeRange });

  const statCards = useMemo(() => {
    if (!metrics) return [];
    return [
      {
        title: "Total Revenue",
        value: `NPR ${metrics.total_income.toLocaleString()}`,
        description: "All time revenue",
        icon: <DollarSign className="h-4 w-4" />,
        trend: "+12.5%",
      },
      {
        title: "Net Profit",
        value: `NPR ${metrics.net_profit.toLocaleString()}`,
        description: "After expenses",
        icon: <TrendingUp className="h-4 w-4" />,
        trend: "+8.2%",
      },
      {
        title: "Total Expenses",
        value: `NPR ${metrics.total_expenses.toLocaleString()}`,
        description: "Operating costs",
        icon: <TrendingDown className="h-4 w-4" />,
        trend: "-3.1%",
      },
      {
        title: "Pending Payments",
        value: `NPR ${(metrics as any).pending_staff_payments.toLocaleString()}`,
        description: "Staff payouts",
        icon: <Wallet className="h-4 w-4" />,
        trend: "5 pending",
      },
    ];
  }, [metrics]);

  if (!isAdmin) {
    return (
      <DashboardLayout>
        <div className="flex h-[450px] flex-col items-center justify-center">
          <Target className="h-8 w-8 text-muted-foreground mb-4" />
          <p className="text-sm text-muted-foreground">Access restricted</p>
        </div>
      </DashboardLayout>
    );
  }

  const isLoading = !metrics || !monthlyData;

  return (
    <DashboardLayout>
      <div className="container max-w-7xl space-y-8 py-8">

        {/* Header */}
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
            <p className="text-sm text-muted-foreground mt-1">
              Monitor your business performance and metrics
            </p>
          </div>

          <Select value={timeRange} onValueChange={setTimeRange}>
            <SelectTrigger className="w-[180px]">
              <Calendar className="mr-2 h-4 w-4" />
              <SelectValue placeholder="Select period" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7d">Last 7 days</SelectItem>
              <SelectItem value="30d">Last 30 days</SelectItem>
              <SelectItem value="90d">Last 90 days</SelectItem>
              <SelectItem value="all">All time</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Stats Grid */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {isLoading ? (
            Array(4).fill(0).map((_, i) => <StatCardSkeleton key={i} />)
          ) : (
            statCards.map((card) => (
              <Card key={card.title}>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">
                    {card.title}
                  </CardTitle>
                  <div className="h-8 w-8 rounded-lg bg-muted flex items-center justify-center">
                    {card.icon}
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{card.value}</div>
                  <p className="text-xs text-muted-foreground mt-1">
                    {card.description}
                  </p>
                  <Badge variant="secondary" className="mt-2 text-xs">
                    {card.trend}
                  </Badge>
                </CardContent>
              </Card>
            ))
          )}
        </div>

        {/* Chart Section */}
        <div className="grid gap-4 md:grid-cols-7">
          <Card className="md:col-span-4">
            <CardHeader>
              <CardTitle>Revenue Overview</CardTitle>
              <CardDescription>
                Monthly revenue and expenses comparison
              </CardDescription>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <Skeleton className="h-[350px] w-full" />
              ) : (
                <div className="h-[350px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={monthlyData}>
                      <defs>
                        <linearGradient id="income" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                          <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                        </linearGradient>
                        <linearGradient id="expenses" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#ef4444" stopOpacity={0.3} />
                          <stop offset="95%" stopColor="#ef4444" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} />
                      <XAxis
                        dataKey="month"
                        tick={{ fontSize: 12 }}
                        tickLine={false}
                        axisLine={false}
                      />
                      <YAxis
                        tick={{ fontSize: 12 }}
                        tickLine={false}
                        axisLine={false}
                      />
                      <Tooltip />
                      <Area
                        type="monotone"
                        dataKey="income"
                        stroke="#10b981"
                        fill="url(#income)"
                      />
                      <Area
                        type="monotone"
                        dataKey="expenses"
                        stroke="#ef4444"
                        fill="url(#expenses)"
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="md:col-span-3">
            <CardHeader>
              <CardTitle>Quick Stats</CardTitle>
              <CardDescription>Key performance indicators</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {isLoading ? (
                <>
                  <Skeleton className="h-16 w-full" />
                  <Skeleton className="h-16 w-full" />
                  <Skeleton className="h-16 w-full" />
                </>
              ) : (
                <>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Task Payments Paid</span>
                      <span className="font-semibold">
                        NPR {((metrics as any).task_payments_paid || 0).toLocaleString()}
                      </span>
                    </div>
                    <Separator />
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Task Payments Pending</span>
                      <span className="font-semibold">
                        NPR {((metrics as any).task_payments_pending || 0).toLocaleString()}
                      </span>
                    </div>
                    <Separator />
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Staff Requests</span>
                      <span className="font-semibold">
                        NPR {((metrics as any).requested_staff_payments || 0).toLocaleString()}
                      </span>
                    </div>
                    <Separator />
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Completed Payments</span>
                      <span className="font-semibold">
                        NPR {((metrics as any).completed_staff_payments || 0).toLocaleString()}
                      </span>
                    </div>
                    <Separator />
                  </div>

                  {(metrics as any).total_tasks > 0 && (
                    <div className="space-y-2 pt-4">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">Task Completion</span>
                        <span className="font-semibold">
                          {Math.round(((metrics as any).completed_tasks / (metrics as any).total_tasks) * 100)}%
                        </span>
                      </div>
                      <div className="h-2 bg-muted rounded-full overflow-hidden">
                        <div
                          className="h-full bg-primary"
                          style={{
                            width: `${((metrics as any).completed_tasks / (metrics as any).total_tasks) * 100}%`
                          }}
                        />
                      </div>
                    </div>
                  )}
                </>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Additional Info */}
        <Card>
          <CardHeader>
            <CardTitle>Accounts Receivable</CardTitle>
            <CardDescription>Outstanding payments from clients</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">
              NPR {((metrics as any)?.pending_income || 0).toLocaleString()}
            </div>
            <p className="text-sm text-muted-foreground mt-2">
              Total pending client payments
            </p>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}

function StatCardSkeleton() {
  return (
    <Card>
      <CardHeader className="space-y-0 pb-2">
        <Skeleton className="h-4 w-24" />
      </CardHeader>
      <CardContent>
        <Skeleton className="h-8 w-32 mb-2" />
        <Skeleton className="h-3 w-20" />
      </CardContent>
    </Card>
  );
}
