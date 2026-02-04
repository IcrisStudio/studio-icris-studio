"use client";

import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import DashboardLayout from "@/components/DashboardLayout";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Wallet,
  Receipt,
  Calendar,
  Info,
  ArrowRight,
} from "lucide-react";
import { format } from "date-fns";

export default function PaymentDetailsPage() {
  const { user, isAdmin } = useAuth();

  const staffPayments = useQuery(api.payments.getStaffPayments, {
    staff_id: user?.id as any,
  });

  if (isAdmin) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <p className="text-muted-foreground">This page is for staff members only</p>
        </div>
      </DashboardLayout>
    );
  }

  if (!staffPayments) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
        </div>
      </DashboardLayout>
    );
  }

  const completedPayments = staffPayments.filter((p: any) => p.status === "completed");
  const pendingPayments = staffPayments.filter((p: any) => p.status === "pending");

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-semibold tracking-tight">Payment History</h1>
          <p className="text-muted-foreground mt-1">Complete payment transactions</p>
        </div>

        {/* Stats Grid */}
        <div className="grid gap-4 sm:grid-cols-3">
          <Card className="border-border/50">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Total Payments
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2">
                <Receipt className="h-5 w-5 text-muted-foreground" />
                <p className="text-2xl font-semibold tracking-tight">
                  {completedPayments.length}
                </p>
              </div>
            </CardContent>
          </Card>

          <Card className="border-border/50">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Total Received
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2">
                <Wallet className="h-5 w-5 text-primary" />
                <p className="text-2xl font-semibold tracking-tight text-primary">
                  NPR {completedPayments.reduce((sum, p: any) => sum + p.amount, 0).toLocaleString()}
                </p>
              </div>
            </CardContent>
          </Card>

          <Card className="border-border/50">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Pending
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2">
                <Calendar className="h-5 w-5 text-orange-600" />
                <p className="text-2xl font-semibold tracking-tight text-orange-600">
                  {pendingPayments.length}
                </p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Payment List */}
        <Card className="border-border/50">
          <CardHeader>
            <CardTitle>Transactions</CardTitle>
          </CardHeader>
          <CardContent>
            {staffPayments.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 text-center">
                <Wallet className="h-16 w-16 text-muted-foreground/50 mb-4" />
                <p className="text-lg font-medium text-muted-foreground">No payments yet</p>
                <p className="text-sm text-muted-foreground mt-1">Complete your first task to start earning!</p>
              </div>
            ) : (
              <div className="space-y-3">
                {staffPayments
                  .sort((a: any, b: any) => (b.created_at || b.paid_at) - (a.created_at || a.paid_at))
                  .map((payment: any) => (
                    <div
                      key={payment._id}
                      className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 py-3 border-b last:border-0"
                    >
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <Badge
                            className={`${
                              payment.status === "completed"
                                ? "bg-green-100 text-green-700"
                                : "bg-orange-100 text-orange-700"
                            }`}
                          >
                            {payment.status.toUpperCase()}
                          </Badge>
                          <p className="text-xs text-muted-foreground">
                            {format(new Date(payment.created_at), "MMM d, yyyy")}
                          </p>
                        </div>
                        <p className="font-semibold text-lg">
                          NPR {payment.amount.toLocaleString()}
                        </p>
                        {payment.notes && (
                          <p className="text-sm text-muted-foreground">Ref: {payment.notes}</p>
                        )}
                      </div>
                      <div className="text-right sm:text-left flex-shrink-0">
                        {payment.status === "completed" ? (
                          <div className="flex items-center gap-1 text-sm text-muted-foreground">
                            <Calendar className="h-4 w-4" />
                            Paid {format(new Date(payment.paid_at), "MMM d, yyyy")}
                          </div>
                        ) : (
                          <div className="flex items-center gap-1 text-sm text-orange-600">
                            <Calendar className="h-4 w-4" />
                            Awaiting payout
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Info Card */}
        <Card className="border-border/50 bg-muted/30">
          <CardContent className="pt-6">
            <div className="flex items-start gap-3">
              <Info className="h-5 w-5 text-muted-foreground mt-0.5 flex-shrink-0" />
              <div className="space-y-2 text-sm">
                <p className="font-medium">Payment Details</p>
                <p className="text-muted-foreground">
                  View all your salary payment history here. Payments are processed by the admin and marked as completed once transferred to your bank or wallet account.
                </p>
                <Button
                  variant="link"
                  className="p-0 h-auto text-sm"
                  asChild
                >
                  <a href="/payouts" className="flex items-center gap-1">
                    Manage payment methods
                    <ArrowRight className="h-4 w-4" />
                  </a>
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
