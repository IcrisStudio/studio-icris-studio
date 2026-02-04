"use client";

import { useState, useMemo, useEffect } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import DashboardLayout from "@/components/DashboardLayout";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Wallet,
  Clock,
  History,
  Info,
  Search,
  Loader2,
  Banknote,
} from "lucide-react";
import { format } from "date-fns";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ProofPreview } from "@/components/ProofPreview";
import { toast } from "sonner";

const MIN_PAYOUT = 100;

export default function PayoutsPage() {
  const { user, isAdmin } = useAuth();
  const [searchTerm, setSearchTerm] = useState("");
  const [isRequesting, setIsRequesting] = useState(false);

  const staffSummary = useQuery(api.payments.getStaffSummary, {
    staff_id: user?.id as any,
  });

  const staffPayments = useQuery(api.payments.getStaffPayments, {
    staff_id: user?.id as any,
  });

  const requestPayout = useMutation((api.payments as any).requestPayout);

  useEffect(() => {
    if (staffSummary && staffSummary.pending_payment > 0 && staffSummary.pending_payment < MIN_PAYOUT) {
      toast.info(`Min payout: NPR ${MIN_PAYOUT}`, {
        id: "min-payout-toast",
      });
    }
  }, [staffSummary]);

  const filteredPayments = useMemo(() => {
    return (staffPayments || [])
      .filter((p: any) =>
        (p.notes || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.amount.toString().includes(searchTerm)
      )
      .sort((a, b) => (b.created_at || 0) - (a.created_at || 0));
  }, [staffPayments, searchTerm]);

  const handleRequestPayout = async () => {
    if (!user?.id) return;
    setIsRequesting(true);
    try {
      await requestPayout({ staff_id: user.id });
      toast.success("Request submitted successfully.");
    } catch (error: any) {
      toast.error(error.message || "Request failed");
    } finally {
      setIsRequesting(false);
    }
  };

  if (isAdmin) {
    return (
      <DashboardLayout>
        <div className="flex h-[400px] items-center justify-center text-sm text-muted-foreground">
          Administrative accounts manage payouts through the Payroll portal.
        </div>
      </DashboardLayout>
    );
  }

  if (!staffSummary || !staffPayments) {
    return (
      <DashboardLayout>
        <div className="flex h-screen items-center justify-center">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      </DashboardLayout>
    );
  }

  const canRequest = (staffSummary.pending_payment || 0) >= MIN_PAYOUT;
  const isPendingRequest = ((staffSummary as any).requested_payment || 0) > 0;

  return (
    <DashboardLayout>
      <div className="container max-w-4xl space-y-8 py-6 animate-in fade-in duration-500">
        <div className="text-left space-y-1">
          <h1 className="text-xl font-semibold tracking-tight">Earnings & Withdrawals</h1>
          <p className="text-sm text-muted-foreground">View your balance and transaction history.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-start">
          <div className="md:col-span-4 space-y-4">
            <Card className="rounded-lg border shadow-none bg-muted/20">
              <CardContent className="p-4 space-y-4">
                <div className="space-y-1">
                  <p className="text-[10px] font-bold uppercase text-muted-foreground">Available Balance</p>
                  <p className="text-2xl font-bold">NPR {staffSummary.pending_payment.toLocaleString()}</p>
                </div>

                <Button
                  onClick={handleRequestPayout}
                  disabled={!canRequest || isRequesting || isPendingRequest}
                  size="sm"
                  className="w-full h-9 rounded-md text-xs font-semibold shadow-none"
                >
                  {isRequesting ? "Processing..." : isPendingRequest ? "Request Pending" : "Request Payout"}
                </Button>

                {isPendingRequest && (
                  <div className="flex items-center gap-2 text-[10px] text-blue-600 bg-blue-50 p-2 rounded-md border border-blue-100">
                    <Clock className="h-3 w-3" />
                    <span>Processing NPR {((staffSummary as any).requested_payment || 0).toLocaleString()}</span>
                  </div>
                )}

                {!canRequest && staffSummary.pending_payment > 0 && (
                  <p className="text-[9px] text-amber-600 font-medium">Min payout NPR {MIN_PAYOUT} required.</p>
                )}
              </CardContent>
            </Card>

            <div className="flex items-start gap-3 p-3 rounded-lg border bg-card/50 shadow-none">
              <Info className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" />
              <p className="text-[10px] text-muted-foreground leading-normal">
                Payouts are processed within 24 hours. Ensure your payment methods are up to date.
              </p>
            </div>
          </div>

          <div className="md:col-span-8 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold flex items-center gap-2">
                <History className="h-4 w-4 text-muted-foreground" /> Recent Transactions
              </h3>
              <div className="relative w-48">
                <Search className="absolute left-2.5 top-2.5 h-3 w-3 text-muted-foreground" />
                <Input
                  placeholder="Filter ID..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="h-8 pl-8 text-[11px] shadow-none"
                />
              </div>
            </div>

            <Card className="rounded-lg border shadow-none overflow-hidden">
              <Table>
                <TableHeader className="bg-muted/50">
                  <TableRow>
                    <TableHead className="text-xs font-medium px-4 h-10">Date</TableHead>
                    <TableHead className="text-xs font-medium h-10">Amount</TableHead>
                    <TableHead className="text-xs font-medium h-10 text-center">Status</TableHead>
                    <TableHead className="text-xs font-medium px-4 h-10 text-right">Proof</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredPayments.length > 0 ? (
                    filteredPayments.map((payment: any) => (
                      <TableRow key={payment._id} className="hover:bg-muted/20 transition-colors">
                        <TableCell className="px-4 py-3 text-xs font-medium">
                          {format(new Date(payment.created_at), "MMM d, yyyy")}
                        </TableCell>
                        <TableCell className="py-3 text-xs font-semibold">
                          NPR {payment.amount.toLocaleString()}
                        </TableCell>
                        <TableCell className="py-3 text-center">
                          <Badge
                            variant="secondary"
                            className={`rounded-md h-5 px-1.5 text-[9px] font-bold uppercase shadow-none ${payment.status === 'completed' ? 'bg-emerald-50 text-emerald-700' :
                                payment.status === 'payout_requested' ? 'bg-blue-50 text-blue-700' :
                                  'bg-amber-50 text-amber-700'
                              }`}
                          >
                            {payment.status.replace("_", " ")}
                          </Badge>
                        </TableCell>
                        <TableCell className="px-4 py-3 text-right">
                          {payment.payment_proof ? (
                            <div className="flex justify-end scale-75 origin-right opacity-50 hover:opacity-100 transition-opacity">
                              <ProofPreview storageId={payment.payment_proof} />
                            </div>
                          ) : (
                            <span className="text-[10px] text-muted-foreground opacity-20">—</span>
                          )}
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={4} className="h-32 text-center text-xs text-muted-foreground">
                        No transactions found.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </Card>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
