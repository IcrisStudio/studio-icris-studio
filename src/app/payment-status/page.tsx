"use client";

import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import DashboardLayout from "@/components/DashboardLayout";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import {
  DollarSign,
  TrendingUp,
  Calendar,
  CheckCircle,
  Clock,
  Wallet,
  ArrowRight,
  Info,
  AlertCircle,
  FileText,
  Receipt,
} from "lucide-react";
import { format } from "date-fns";
import { Bar, BarChart, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Line, LineChart, PieChart, Pie, Cell } from "recharts";

const COLORS = ['#10b981', '#3b82f6', '#f59e0b', '#ef4444', '#8b5cf6'];

export default function PaymentStatusPage() {
  const { user, isAdmin } = useAuth();

  // Get data
  const staffSummary = useQuery(api.payments.getStaffSummary, {
    staff_id: user?.id as any,
  });

  const staffPayments = useQuery(api.payments.getStaffPayments, {
    staff_id: user?.id as any,
  });

  const staffTasks = useQuery(api.tasks.getStaffTasks, {
    staff_id: user?.id as any,
  });

  const staffProfile = useQuery(api.users.getStaffProfile, {
    user_id: user?.id as any,
  });

  if (isAdmin) {
    return (
      <DashboardLayout>
        <div className="text-center py-12">
          <AlertCircle className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
          <h2 className="text-2xl font-bold mb-2">Access Denied</h2>
          <p className="text-muted-foreground">This page is for staff members only</p>
        </div>
      </DashboardLayout>
    );
  }

  if (!staffSummary || !staffPayments || !staffTasks) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="animate-spin rounded-full h-12 w-12 border-b-4 border-primary"></div>
        </div>
      </DashboardLayout>
    );
  }

  const completedPayments = staffPayments.filter((p: any) => p.status === "completed");
  const pendingPayments = staffPayments.filter((p: any) => p.status === "pending");
  const completedTasks = staffTasks.filter((task: any) => task.status === "completed");

  const monthlyEarnings = completedPayments
    .map((p: any) => ({
      month: format(new Date(p.paid_at || p.created_at), "MMM yyyy"),
      amount: p.amount,
    }))
    .reduce((acc: any, curr) => {
      const existing = acc.find((item: any) => item.month === curr.month);
      if (existing) {
        existing.amount += curr.amount;
      } else {
        acc.push({ ...curr });
      }
      return acc;
    }, []);

  return (
    <DashboardLayout>
      <div className="space-y-8">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
              Payment Status
            </h1>
            <p className="text-muted-foreground text-lg">
              Track your earnings and pending payouts
            </p>
          </div>
          <Avatar className="h-16 w-16 border-4 border-primary/20">
            <AvatarImage src={user?.profile_picture as any} />
            <AvatarFallback className="text-3xl font-bold bg-primary text-primary-foreground">
              {user?.full_name?.[0] || "U"}
            </AvatarFallback>
          </Avatar>
        </div>

        {/* Stats Row */}
        <div className="grid gap-6 md:grid-cols-4">
          <Card className="hover:shadow-xl transition-all duration-300 border-2 hover:border-green-500/50">
            <CardHeader className="flex flex-row items-center justify-between pb-3">
              <CardTitle className="text-base font-medium text-muted-foreground">Total Earnings</CardTitle>
              <div className="p-3 bg-green-500/10 rounded-lg">
                <DollarSign className="h-6 w-6 text-green-500" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-4xl font-bold text-green-600">
                NPR {staffSummary.total_earned.toLocaleString()}
              </div>
              <p className="text-sm text-muted-foreground mt-2">
                From {completedTasks.length} completed tasks
              </p>
            </CardContent>
          </Card>

          <Card className="hover:shadow-xl transition-all duration-300 border-2 hover:border-blue-500/50">
            <CardHeader className="flex flex-row items-center justify-between pb-3">
              <CardTitle className="text-base font-medium text-muted-foreground">Total Received</CardTitle>
              <div className="p-3 bg-blue-500/10 rounded-lg">
                <CheckCircle className="h-6 w-6 text-blue-500" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-4xl font-bold text-blue-600">
                NPR {staffSummary.total_paid.toLocaleString()}
              </div>
              <p className="text-sm text-muted-foreground mt-2">
                {completedPayments.length} successful transactions
              </p>
            </CardContent>
          </Card>

          <Card className="hover:shadow-xl transition-all duration-300 border-2 hover:border-orange-500/50 bg-gradient-to-br from-orange-50 to-white dark:from-orange-950/20 dark:to-background">
            <CardHeader className="flex flex-row items-center justify-between pb-3">
              <CardTitle className="text-base font-medium">Available Balance</CardTitle>
              <div className="p-3 bg-orange-500/10 rounded-lg">
                <Wallet className="h-6 w-6 text-orange-500" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-5xl font-bold text-orange-600">
                NPR {staffSummary.pending_payment.toLocaleString()}
              </div>
              <div className="mt-4">
                <Progress 
                  value={(staffSummary.pending_payment / staffSummary.total_earned) * 100} 
                  className="h-3"
                />
                <div className="flex justify-between mt-2 text-sm">
                  <span className="text-muted-foreground">
                    {((staffSummary.pending_payment / staffSummary.total_earned) * 100).toFixed(1)}% of earnings available
                  </span>
                  <Badge variant={staffSummary.pending_payment >= 500 ? "default" : "secondary"} className="ml-2">
                    {staffSummary.pending_payment >= 500 ? "Can Request" : "Min NPR 500"}
                  </Badge>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="hover:shadow-xl transition-all duration-300 border-2 hover:border-purple-500/50">
            <CardHeader className="flex flex-row items-center justify-between pb-3">
              <CardTitle className="text-base font-medium text-muted-foreground">Completed Tasks</CardTitle>
              <div className="p-3 bg-purple-500/10 rounded-lg">
                <FileText className="h-6 w-6 text-purple-500" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-4xl font-bold text-purple-600">
                {completedTasks.length}/{staffTasks.length}
              </div>
              <p className="text-sm text-muted-foreground mt-2">
                Tasks completed
              </p>
            </CardContent>
          </Card>

          <Card className="hover:shadow-xl transition-all duration-300 border-2 hover:border-primary/30 bg-primary text-primary-foreground">
            <CardHeader className="flex flex-row items-center justify-between pb-3">
              <CardTitle className="text-base font-medium text-primary-foreground">Actions</CardTitle>
              <Receipt className="h-6 w-6" />
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <Button 
                  size="lg" 
                  className="w-full gap-3" 
                  asChild
                  disabled={staffSummary.pending_payment < 500}
                >
                  <a href="/payouts">
                    <Wallet className="h-5 w-5" />
                    Request Payout
                  </a>
                </Button>
                <Button size="lg" variant="outline" className="w-full gap-3" asChild>
                  <a href="/payment-details">
                    <Receipt className="h-5 w-5" />
                    View Payment History
                  </a>
                </Button>
              </div>
              <div className="p-4 bg-primary/10 rounded-lg space-y-2">
                <div className="flex items-start gap-3">
                  <Info className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
                  <div className="text-sm space-y-1">
                    <p className="font-medium">Minimum Payout Amount: NPR 500</p>
                    <p className="text-primary-foreground/80">
                      You can request a payout once your available balance reaches NPR 500 or more
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Charts Row */}
        <div className="grid gap-6 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle className="text-xl">Monthly Earnings</CardTitle>
              <CardDescription>Income trends over time</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={350}>
                <LineChart data={monthlyEarnings}>
                  <CartesianGrid strokeDasharray="3 3" stroke="currentColor" opacity={0.1} />
                  <XAxis dataKey="month" />
                  <YAxis />
                  <Tooltip
                    content={({ active, payload }) => {
                      if (active && payload && payload.length) {
                        return (
                          <div className="bg-background border rounded-lg shadow-lg p-4">
                            <p className="font-semibold">{payload[0].month}</p>
                            <p className="text-primary font-bold text-xl">
                              NPR {payload[0].amount.toLocaleString()}
                            </p>
                          </div>
                        );
                      }
                      return null;
                    }}
                  />
                  <Line
                    type="monotone"
                    dataKey="amount"
                    stroke="#10b981"
                    strokeWidth={3}
                    dot={{ fill: "#10b981", r: 6 }}
                    activeDot={{ r: 8, stroke: "#10b981", strokeWidth: 2 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-xl">Payment Breakdown</CardTitle>
              <CardDescription>Status distribution</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={350}>
                <PieChart>
                  <Pie
                    data={[
                      { name: "Completed", value: staffSummary.total_paid, amount: completedPayments.length },
                      { name: "Pending", value: staffSummary.pending_payment, amount: pendingPayments.length },
                    ]}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => (
                      <text
                        fill="currentColor"
                        textAnchor="middle"
                        dominantBaseline="middle"
                        className="text-sm font-medium"
                      >
                        {`${name} ${(percent * 100).toFixed(0)}%`}
                      </text>
                    )}
                    outerRadius={120}
                    fill="#8884d8"
                  >
                    <Cell fill="#10b981" />
                    <Cell fill="#f59e0b" />
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>

        {/* Recent Payments */}
        <Card>
          <CardHeader>
            <CardTitle className="text-2xl">Recent Payouts</CardTitle>
            <CardDescription>Your latest payment transactions</CardDescription>
          </CardHeader>
          <CardContent>
            {completedPayments.length === 0 ? (
              <div className="text-center py-16 text-muted-foreground">
                <Wallet className="h-20 w-20 mx-auto mb-4 opacity-30" />
                <p className="text-lg">No payments received yet</p>
                <p className="text-sm mt-2">Complete your tasks to start earning!</p>
              </div>
            ) : (
              <div className="space-y-4 max-h-[500px] overflow-y-auto">
                {completedPayments.slice(0, 10).map((payment: any) => (
                  <div
                    key={payment._id}
                    className="group p-5 rounded-2xl border-2 transition-all duration-300 hover:shadow-lg hover:border-green-500/50"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-3">
                          <div className="p-2 bg-green-500 rounded-full">
                            <CheckCircle className="h-4 w-4 text-white" />
                          </div>
                          <div>
                            <p className="text-sm text-muted-foreground">
                              Paid on {format(new Date(payment.paid_at || payment.created_at), "MMMM d, yyyy")}
                            </p>
                            <p className="text-2xl font-bold text-primary">
                              NPR {payment.amount.toLocaleString()}
                            </p>
                          </div>
                        </div>
                        {payment.notes && (
                          <div className="mt-2 p-3 bg-muted/50 rounded-lg">
                            <p className="text-xs text-muted-foreground">
                              Reference: {payment.notes}
                            </p>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Payout Info Card */}
        <Card className="bg-gradient-to-br from-primary/5 to-primary text-primary-foreground border-primary">
          <CardContent className="py-8">
            <div className="flex items-start gap-6">
              <div className="flex-1">
                <h3 className="text-2xl font-bold mb-3">Request Payout</h3>
                <p className="text-primary-foreground/90 text-lg mb-6">
                  When your balance reaches NPR 500 or more, you can request a payout directly from your dashboard.
                </p>
                <div className="space-y-4 mt-6">
                  <div className="flex items-start gap-3">
                    <CheckCircle className="h-5 w-5 flex-shrink-0" />
                    <p>View all your completed tasks and earnings</p>
                  </div>
                  <div className="flex items-start gap-3">
                    <CheckCircle className="h-5 w-5 flex-shrink-0" />
                    <p>Track your payment status and history</p>
                  </div>
                  <div className="flex items-start gap-3">
                    <CheckCircle className="h-5 w-5 flex-shrink-0" />
                    <p>Manage your bank and wallet details for payouts</p>
                  </div>
                  <div className="flex items-start gap-3">
                    <CheckCircle className="h-5 w-5 flex-shrink-0" />
                    <p>Minimum payout amount is NPR 500</p>
                  </div>
                </div>
              </div>
              <Button
                size="lg"
                variant="secondary"
                className="bg-white text-primary hover:bg-primary-foreground gap-3 shrink-0"
                asChild
              >
                <a href="/payouts">
                  Go to Payouts
                  <ArrowRight className="h-5 w-5" />
                </a>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
