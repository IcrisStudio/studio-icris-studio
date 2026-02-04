"use client";

import { useState, useMemo } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import DashboardLayout from "@/components/DashboardLayout";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  ColumnDef,
  flexRender,
  getCoreRowModel,
  useReactTable,
  getPaginationRowModel,
  getSortedRowModel,
} from "@tanstack/react-table";
import { Search, ArrowUpDown, Clock, Wallet, CheckCircle, Loader2 } from "lucide-react";
import { format } from "date-fns";
import { PaymentSheet } from "@/components/PaymentSheet";
import { ProofPreview } from "@/components/ProofPreview";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "@/components/ui/select";
import { toast } from "sonner";

// --- Types ---
interface Payment {
  _id: string;
  amount: number;
  status: string;
  created_at: number;
  paid_at?: number;
  notes?: string;
  staff_name?: string;
  staff_username?: string;
  staff_profile?: any;
  payment_proof?: any;
}

export default function PaymentsPage() {
  const { isAdmin } = useAuth();
  const allPayments = useQuery(api.payments.list);
  const patchStatus = useMutation((api.payments as any).patchStatus);

  const [sheetOpen, setSheetOpen] = useState(false);
  const [selectedPayment, setSelectedPayment] = useState<Payment | null>(null);
  const [globalFilter, setGlobalFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState<string | null>(null);

  const handleStatusChange = async (paymentId: string, status: string) => {
    try {
      await patchStatus({ paymentId: paymentId as any, status });
      toast.success(`Disbursement status: ${status}`);
    } catch (e: any) {
      toast.error("Status update failed");
    }
  };

  const columns = useMemo<ColumnDef<Payment>[]>(() => [
    {
      accessorKey: "staff_name",
      header: "Staff Member",
      cell: ({ row }) => (
        <div className="flex flex-col">
          <span className="font-semibold text-sm">{row.original.staff_name || "Unknown"}</span>
          <span className="text-[10px] text-muted-foreground opacity-60 uppercase">{row.original.staff_username}</span>
        </div>
      ),
    },
    {
      accessorKey: "amount",
      header: "Amount (NPR)",
      cell: ({ row }) => (
        <div className="font-bold text-sm">NPR {row.original.amount.toLocaleString()}</div>
      ),
    },
    {
      accessorKey: "status",
      header: "Status",
      cell: ({ row }) => (
        <div onClick={(e) => e.stopPropagation()}>
          <Select
            defaultValue={row.original.status}
            onValueChange={(val) => handleStatusChange(row.original._id, val)}
          >
            <SelectTrigger className={`h-7 w-32 text-[10px] font-black uppercase rounded-md border-none shadow-none ring-1 px-2 ${row.original.status === 'completed' ? 'ring-emerald-100 bg-emerald-50 text-emerald-700' :
                row.original.status === 'payout_requested' ? 'ring-blue-100 bg-blue-50 text-blue-700' :
                  row.original.status === 'pending' ? 'ring-amber-100 bg-amber-50 text-amber-700' :
                    'ring-red-100 bg-red-50 text-red-700'
              }`}>
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="rounded-lg shadow-none border">
              <SelectItem value="pending" className="text-[10px] font-black uppercase">Pending</SelectItem>
              <SelectItem value="payout_requested" className="text-[10px] font-black uppercase">Requested</SelectItem>
              <SelectItem value="completed" className="text-[10px] font-black uppercase text-emerald-600">Completed</SelectItem>
              <SelectItem value="rejected" className="text-[10px] font-black uppercase text-rose-600">Rejected</SelectItem>
            </SelectContent>
          </Select>
        </div>
      ),
    },
    {
      accessorKey: "payment_proof",
      header: "Proof",
      cell: ({ row }) => (
        <div className="flex justify-center scale-90" onClick={(e) => e.stopPropagation()}>
          {row.original.payment_proof ? (
            <ProofPreview storageId={row.original.payment_proof} />
          ) : (
            <span className="text-[10px] text-muted-foreground opacity-20">—</span>
          )}
        </div>
      ),
    },
    {
      accessorKey: "created_at",
      header: "Date",
      cell: ({ row }) => (
        <div className="text-muted-foreground text-[11px] font-medium">{format(row.original.paid_at || row.original.created_at, "MMM d, yyyy")}</div>
      )
    },
    {
      id: "actions",
      cell: ({ row }) => (
        <Button
          size="sm"
          variant="ghost"
          onClick={(e) => {
            e.stopPropagation();
            setSelectedPayment(row.original);
            setSheetOpen(true);
          }}
          className="rounded-md h-8 w-8 p-0"
        >
          <ArrowUpDown className="h-3 w-3 text-muted-foreground" />
        </Button>
      )
    }
  ], []);

  const filteredData = useMemo(() => {
    return (allPayments || []).filter((item: any) => {
      if (statusFilter && item.status !== statusFilter) return false;
      if (globalFilter) {
        const search = globalFilter.toLowerCase();
        return (
          item.staff_name?.toLowerCase().includes(search) ||
          item.staff_username?.toLowerCase().includes(search)
        );
      }
      return true;
    }).sort((a: any, b: any) => {
      if (a.status === 'payout_requested' && b.status !== 'payout_requested') return -1;
      if (a.status !== 'payout_requested' && b.status === 'payout_requested') return 1;
      return b.created_at - a.created_at;
    });
  }, [allPayments, statusFilter, globalFilter]);

  const table = useReactTable({
    data: filteredData,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    initialState: {
      pagination: { pageSize: 15 }
    }
  });

  const stats = useMemo(() => {
    if (!allPayments) return { pending: 0, pendingCount: 0, paid: 0 };
    return allPayments.reduce((acc: any, curr: any) => {
      if (curr.status === 'pending' || curr.status === 'payout_requested') {
        acc.pending += curr.amount;
        acc.pendingCount += 1;
      } else if (curr.status === 'completed') {
        acc.paid += curr.amount;
      }
      return acc;
    }, { pending: 0, pendingCount: 0, paid: 0 });
  }, [allPayments]);

  if (!isAdmin) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-[50vh]">
          <p className="text-sm font-medium text-muted-foreground">Administrative access required.</p>
        </div>
      </DashboardLayout>
    );
  }

  if (!allPayments) {
    return (
      <DashboardLayout>
        <div className="flex h-[400px] items-center justify-center">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout>
      <div className="container max-w-7xl animate-in fade-in duration-500 space-y-8 py-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div className="text-left space-y-1">
            <h1 className="text-xl font-semibold tracking-tight">Financial Ledger</h1>
            <p className="text-sm text-muted-foreground">Manage staff disbursements and payment verification.</p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Card className="rounded-lg border shadow-none bg-muted/20">
            <CardContent className="p-4 space-y-1">
              <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Awaiting Settlement</p>
              <div className="flex items-center justify-between">
                <p className="text-2xl font-bold tracking-tight">NPR {stats.pending.toLocaleString()}</p>
                <Clock className="h-4 w-4 text-amber-600 opacity-60" />
              </div>
            </CardContent>
          </Card>
          <Card className="rounded-lg border shadow-none bg-muted/20">
            <CardContent className="p-4 space-y-1">
              <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Successfully Disbursed</p>
              <div className="flex items-center justify-between">
                <p className="text-2xl font-bold tracking-tight">NPR {stats.paid.toLocaleString()}</p>
                <CheckCircle className="h-4 w-4 text-emerald-600 opacity-60" />
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="relative w-full sm:w-64">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
              <Input
                placeholder="Filter staff or ID..."
                value={globalFilter}
                onChange={(e) => setGlobalFilter(e.target.value)}
                className="pl-8 h-8 text-xs bg-card border shadow-none rounded-md"
              />
            </div>

            <div className="flex items-center gap-1">
              {['all', 'payout_requested', 'pending', 'completed'].map((s) => (
                <Button
                  key={s}
                  variant={statusFilter === (s === 'all' ? null : s) ? "secondary" : "ghost"}
                  size="sm"
                  onClick={() => setStatusFilter(s === 'all' ? null : s)}
                  className="h-8 rounded-md px-3 text-xs font-medium capitalize"
                >
                  {s.replace('_', ' ')}
                </Button>
              ))}
            </div>
          </div>

          <Card className="rounded-lg border shadow-none overflow-hidden">
            <Table>
              <TableHeader className="bg-muted/50 text-left">
                {table.getHeaderGroups().map(hg => (
                  <TableRow key={hg.id} className="hover:bg-transparent border-none">
                    {hg.headers.map(h => (
                      <TableHead key={h.id} className="text-[10px] uppercase font-bold tracking-widest text-muted-foreground h-10 px-6">
                        {flexRender(h.column.columnDef.header, h.getContext())}
                      </TableHead>
                    ))}
                  </TableRow>
                ))}
              </TableHeader>
              <TableBody>
                {table.getRowModel().rows.length > 0 ? (
                  table.getRowModel().rows.map(row => (
                    <TableRow
                      key={row.id}
                      className="hover:bg-muted/20 cursor-pointer transition-all"
                      onClick={() => {
                        setSelectedPayment(row.original);
                        setSheetOpen(true);
                      }}
                    >
                      {row.getVisibleCells().map(cell => (
                        <TableCell key={cell.id} className="h-14 px-6 text-left">
                          {flexRender(cell.column.columnDef.cell, cell.getContext())}
                        </TableCell>
                      ))}
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={columns.length} className="h-32 text-center text-xs text-muted-foreground">
                      No financial records matching current filter.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </Card>
        </div>

        <PaymentSheet
          open={sheetOpen}
          onOpenChange={setSheetOpen}
          payment={selectedPayment}
        />
      </div>
    </DashboardLayout>
  );
}
