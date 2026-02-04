"use client";

import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import DashboardLayout from "@/components/DashboardLayout";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { DollarSign, Wallet, CheckCircle, ClipboardCheck, Clock } from "lucide-react";
import { format } from "date-fns";

export default function SalaryPage() {
  const { user, isAdmin } = useAuth();

  // Get staff summary - always call hook, check if it should be used in rendering
  const staffSummary = useQuery(api.payments.getStaffSummary, {
    staff_id: user?.id as any,
  });

  // Get staff tasks
  const staffTasks = useQuery(api.tasks.getStaffTasks, {
    staff_id: user?.id as any,
  });

  // Get staff payments
  const staffPayments = useQuery(api.payments.getStaffPayments, {
    staff_id: user?.id as any,
  });

  if (isAdmin) {
    return (
      <DashboardLayout>
        <div className="text-center py-12">
          <p className="text-muted-foreground">This page is for staff members only</p>
        </div>
      </DashboardLayout>
    );
  }

  if (!user || !staffSummary || !staffTasks || !staffPayments) {
    return (
      <DashboardLayout>
        <div className="space-y-6">
          <div>
            <h1 className="text-3xl font-bold">My Salary</h1>
            <p className="text-muted-foreground mt-1">View your earnings and payment history</p>
          </div>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {[1, 2, 3, 4].map((i) => (
              <Card key={i}>
                <CardHeader className="pb-2">
                  <Skeleton className="h-4 w-24" />
                </CardHeader>
                <CardContent>
                  <Skeleton className="h-8 w-20 mb-2" />
                  <Skeleton className="h-3 w-32" />
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </DashboardLayout>
    );
  }

  const stats = [
    {
      title: "Total Earned",
      value: `NPR ${staffSummary.total_earned.toLocaleString()}`,
      icon: DollarSign,
      description: "From completed tasks",
    },
    {
      title: "Total Paid",
      value: `NPR ${staffSummary.total_paid.toLocaleString()}`,
      icon: CheckCircle,
      description: "Successfully received",
    },
    {
      title: "Pending Payment",
      value: `NPR ${staffSummary.pending_payment.toLocaleString()}`,
      icon: Clock,
      description: "Awaiting processing",
    },
    {
      title: "Completed Tasks",
      value: `${staffSummary.completed_tasks}/${staffSummary.assigned_tasks}`,
      icon: ClipboardCheck,
      description: "Tasks you've completed",
    },
  ];

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">My Salary</h1>
          <p className="text-muted-foreground mt-1">View your earnings and payment history</p>
        </div>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {stats.map((stat) => (
            <Card key={stat.title}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">{stat.title}</CardTitle>
                <stat.icon className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stat.value}</div>
                <p className="text-xs text-muted-foreground mt-1">{stat.description}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        <Card>
          <CardHeader>
            <CardTitle>My Tasks</CardTitle>
            <CardDescription>Tasks assigned to you</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {staffTasks.map((task: any) => (
                <div key={task._id} className="flex items-center justify-between p-4 border rounded-lg">
                  <div>
                    <h3 className="font-semibold">{task.project_name}</h3>
                    <p className="text-sm text-muted-foreground">{task.client_name}</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      Role: {task.assigned_role} · Deadline: {format(new Date(task.deadline), "MMM d, yyyy")}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-lg font-bold">NPR {task.assigned_salary.toLocaleString()}</p>
                    <Badge
                      variant={task.status === "completed" ? "default" : "secondary"}
                      className="mt-1"
                    >
                      {task.status.replace("_", " ").toUpperCase()}
                    </Badge>
                  </div>
                </div>
              ))}
              {staffTasks.length === 0 && (
                <div className="text-center py-8 text-muted-foreground">
                  No tasks assigned to you yet
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Payment History</CardTitle>
            <CardDescription>Your salary payment records</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {staffPayments
                .sort((a: any, b: any) => b.created_at - a.created_at)
                .map((payment: any) => (
                  <div key={payment._id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div>
                      <h3 className="font-semibold">NPR {payment.amount.toLocaleString()}</h3>
                      <p className="text-sm text-muted-foreground">
                        {format(new Date(payment.created_at), "MMM d, yyyy")}
                      </p>
                      {payment.notes && (
                        <p className="text-xs text-muted-foreground mt-1">
                          Reference: {payment.notes}
                        </p>
                      )}
                    </div>
                    <Badge
                      variant={payment.status === "completed" ? "default" : "secondary"}
                      className={
                        payment.status === "completed"
                          ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
                          : "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200"
                      }
                    >
                      {payment.status.toUpperCase()}
                    </Badge>
                  </div>
                ))}
              {staffPayments.length === 0 && (
                <div className="text-center py-8 text-muted-foreground">
                  No payment history yet
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}

function Skeleton({ className }: { className?: string }) {
  return (
    <div className={`animate-pulse bg-muted rounded ${className}`} />
  );
}
