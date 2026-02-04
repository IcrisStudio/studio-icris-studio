"use client";

import Link from "next/link";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import DashboardLayout from "@/components/DashboardLayout";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import {
  Wallet,
  CheckCircle,
  Clock,
  Calendar,
  Settings,
  ArrowRight,
  TrendingUp,
  Loader2,
} from "lucide-react";

export default function StaffDashboardPage() {
  const { user, isAdmin } = useAuth();

  const staffSummary = useQuery(api.payments.getStaffSummary, {
    staff_id: user?.id as any,
  });

  const staffTasks = useQuery(api.tasks.getStaffTasks, {
    staff_id: user?.id as any,
  });

  if (isAdmin) {
    return (
      <DashboardLayout>
        <div className="flex h-[400px] items-center justify-center text-sm text-muted-foreground">
          Administrative dashboard access required for system management.
        </div>
      </DashboardLayout>
    );
  }

  if (!staffSummary || !staffTasks) {
    return (
      <DashboardLayout>
        <div className="flex h-screen items-center justify-center">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      </DashboardLayout>
    );
  }

  const inProgressTasks = staffTasks.filter((t: any) => t.status === "in_progress");
  const completedCount = staffTasks.filter((t: any) => t.status === "completed").length;

  return (
    <DashboardLayout>
      <div className="container max-w-7xl space-y-8 py-6 animate-in fade-in duration-500">
        <div className="text-left space-y-1">
          <h1 className="text-xl font-semibold tracking-tight">Overview</h1>
          <p className="text-sm text-muted-foreground">Personal performance and production summary.</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            label="Outstanding"
            value={`NPR ${staffSummary.pending_payment.toLocaleString()}`}
            icon={<Clock className="h-4 w-4 text-orange-600" />}
            description="Available for payout"
          />
          <StatCard
            label="Total Settled"
            value={`NPR ${staffSummary.total_paid.toLocaleString()}`}
            icon={<CheckCircle className="h-4 w-4 text-emerald-600" />}
            description="Lifetime payments"
          />
          <StatCard
            label="In Production"
            value={inProgressTasks.length.toString()}
            icon={<TrendingUp className="h-4 w-4 text-blue-600" />}
            description="Active assignments"
          />
          <StatCard
            label="Work Volume"
            value={staffTasks.length.toString()}
            icon={<Calendar className="h-4 w-4 text-muted-foreground" />}
            description="Total assigned tasks"
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
          <Card className="md:col-span-8 rounded-lg border shadow-none bg-card overflow-hidden">
            <CardHeader className="border-b bg-muted/20 pb-4">
              <CardTitle className="text-sm font-semibold">Production Status</CardTitle>
              <CardDescription className="text-xs">Summary of task distribution and progress.</CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              <div className="divide-y text-xs">
                <div className="flex items-center justify-between p-4 px-6">
                  <span className="font-medium text-muted-foreground">Finished Tasks</span>
                  <span className="font-bold">{completedCount}</span>
                </div>
                <div className="flex items-center justify-between p-4 px-6">
                  <span className="font-medium text-muted-foreground">In Progress</span>
                  <span className="font-bold">{inProgressTasks.length}</span>
                </div>
                <div className="flex items-center justify-between p-4 px-6">
                  <span className="font-medium text-muted-foreground">Pending Start</span>
                  <span className="font-bold">{staffTasks.filter((t: any) => t.status === "pending").length}</span>
                </div>
                <div className="flex items-center justify-between p-4 px-6 bg-muted/10 font-semibold border-t">
                  <span className="text-foreground">Total Cumulative Earnings</span>
                  <p className="text-sm font-black">NPR {staffSummary.total_earned.toLocaleString()}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="md:col-span-4 rounded-lg border shadow-none overflow-hidden">
            <CardHeader className="border-b bg-muted/20 pb-4">
              <CardTitle className="text-sm font-semibold">Internal Links</CardTitle>
            </CardHeader>
            <CardContent className="p-2 space-y-1 pt-4">
              <QuickLink
                href="/staff-tasks"
                icon={<Calendar className="h-3.5 w-3.5" />}
                label="My Tasks"
                sub="View production queue"
              />
              <QuickLink
                href="/payouts"
                icon={<Wallet className="h-3.5 w-3.5" />}
                label="Withdrawals"
                sub="Request earnings"
              />
              <QuickLink
                href="/payment-methods"
                icon={<Settings className="h-3.5 w-3.5" />}
                label="Payout Setup"
                sub="Bank & wallet info"
              />
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
}

function StatCard({ label, value, icon, description }: any) {
  return (
    <Card className="rounded-lg border shadow-none overflow-hidden">
      <CardContent className="p-5 space-y-1.5">
        <div className="flex items-center justify-between">
          <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">{label}</p>
          <div className="opacity-70">{icon}</div>
        </div>
        <p className="text-xl font-bold tracking-tight">{value}</p>
        <p className="text-[10px] text-muted-foreground font-medium">{description}</p>
      </CardContent>
    </Card>
  );
}

function QuickLink({ href, icon, label, sub }: any) {
  return (
    <Link
      href={href}
      className="flex items-center justify-between p-3 rounded-md hover:bg-muted/50 transition-colors group"
    >
      <div className="flex items-center gap-3 font-semibold text-xs leading-none">
        <div className="h-7 w-7 rounded-md bg-primary/5 flex items-center justify-center text-primary border">
          {icon}
        </div>
        <div>
          <p className="text-[11px] mb-0.5">{label}</p>
          <p className="text-[9px] text-muted-foreground font-normal tracking-tight">{sub}</p>
        </div>
      </div>
      <ArrowRight size={12} className="text-muted-foreground opacity-0 group-hover:opacity-100 transition-all translate-x-[-4px] group-hover:translate-x-0" />
    </Link>
  );
}


