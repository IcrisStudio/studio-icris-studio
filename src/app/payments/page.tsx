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
import { Search, Clock, CheckCircle2, Loader2, ArrowRight, Filter } from "lucide-react";
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
      toast.success(`Transaction marked as ${status}`);
    } catch (e: any) {
      toast.error("Failed to update status");
    }
  };

  const columns = useMemo<ColumnDef<Payment>[]>(() => [
    {
      accessorKey: "staff_name",
      header: "Merchant/Staff",
      cell: ({ row }) => (
        <div className="flex flex-col py-1">
          <span className="font-semibold text-slate-800 text-[13px]">{row.original.staff_name || "Unidentified"}</span>
          <span className="text-[10px] text-slate-400 font-medium uppercase tracking-wider">{row.original.staff_username}</span>
        </div>
      ),
    },
    {
      accessorKey: "amount",
      header: "Magnitude",
      cell: ({ row }) => (
        <div className="font-bold text-slate-900 text-[13px]">
          <span className="text-slate-300 font-normal mr-1">NPR</span>
          {row.original.amount.toLocaleString()}
        </div>
      ),
    },
    {
      accessorKey: "status",
      header: "Lifecycle",
      cell: ({ row }) => (
        <div onClick={(e) => e.stopPropagation()}>
          <Select
            defaultValue={row.original.status}
            onValueChange={(val) => handleStatusChange(row.original._id, val)}
          >
            <SelectTrigger className={`h-6 w-28 text-[9px] font-bold uppercase rounded-full border-none shadow-none ring-1 px-2.5 ${row.original.status === 'completed' ? 'ring-emerald-100 bg-emerald-50 text-emerald-700' :
                row.original.status === 'payout_requested' ? 'ring-blue-100 bg-blue-50 text-blue-700' :
                  row.original.status === 'pending' ? 'ring-amber-100 bg-amber-50 text-amber-700' :
                    'ring-slate-100 bg-slate-50 text-slate-500'
              }`}>
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="rounded-xl shadow-lg border-slate-200">
              <SelectItem value="pending" className="text-[10px] font-bold uppercase">Archive</SelectItem>
              <SelectItem value="payout_requested" className="text-[10px] font-bold uppercase">In Review</SelectItem>
              <SelectItem value="completed" className="text-[10px] font-bold uppercase text-emerald-600">Disbursed</SelectItem>
              <SelectItem value="rejected" className="text-[10px] font-bold uppercase text-rose-600">Reversed</SelectItem>
            </SelectContent>
          </Select>
        </div>
      ),
    },
    {
      accessorKey: "payment_proof",
      header: "Audit Proof",
      cell: ({ row }) => (
        <div className="flex justify-start opacity-60 hover:opacity-100 transition-opacity" onClick={(e) => e.stopPropagation()}>
          {row.original.payment_proof ? (
            <div className="scale-75 origin-left">
              <ProofPreview storageId={row.original.payment_proof} />
            </div>
          ) : (
            <span className="text-[10px] text-slate-300 font-bold uppercase">No Registry</span>
          )}
        </div>
      ),
    },
    {
      accessorKey: "created_at",
      header: "Timestamp",
      cell: ({ row }) => (
        <div className="text-slate-400 text-[11px] font-semibold uppercase tracking-tighter">
          {format(row.original.paid_at || row.original.created_at, "MMM d, yyyy")}
        </div>
      )
    },
    {
      id: "actions",
      header: "",
      cell: ({ row }) => (
        <div className="flex justify-end pr-4">
          <Button
            size="sm"
            variant="ghost"
            className="h-7 w-7 rounded-lg p-0 hover:bg-slate-100"
            onClick={(e) => {
              e.stopPropagation();
              setSelectedPayment(row.original);
              setSheetOpen(true);
            }}
          >
            <ArrowRight className="h-3.5 w-3.5 text-slate-400" />
          </Button>
        </div>
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
      pagination: { pageSize: 20 }
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
        <div className="flex items-center justify-center h-[50vh] text-slate-400 text-xs font-bold uppercase tracking-widest">
          Access Restriction Active
        </div>
      </DashboardLayout>
    );
  }

  if (!allPayments) {
    return (
      <DashboardLayout>
        <div className="flex h-[400px] items-center justify-center">
          <Loader2 className="h-5 w-5 animate-spin text-slate-200" />
        </div>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout>
      <div className="container max-w-7xl animate-in fade-in duration-700 space-y-10 py-10 px-6">

        {/* Shopify-Style Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-6">
          <div className="text-left space-y-1">
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">Financial Registry</h1>
            <p className="text-sm text-slate-500 font-medium">Detailed audit ledger for studio-wide capital disbursements.</p>
          </div>
          <div className="flex items-center gap-3">
            <div className="text-right hidden sm:block">
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Global Payout Capacity</p>
              <p className="text-lg font-bold text-slate-900 leading-none mt-1">NPR {stats.paid.toLocaleString()}</p>
            </div>
          </div>
        </div>

        {/* Dynamic Vitals */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <Card className="rounded-2xl border bg-white shadow-sm ring-1 ring-slate-100 hover:shadow-md transition-shadow">
            <CardContent className="p-6 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none">Net Liabilities</span>
                <div className="h-7 w-7 rounded-full bg-amber-50 flex items-center justify-center">
                  <Clock className="h-3.5 w-3.5 text-amber-500" />
                </div>
              </div>
              <div className="space-y-1">
                <p className="text-2xl font-bold text-slate-900 tracking-tight">NPR {stats.pending.toLocaleString()}</p>
                <p className="text-[10px] font-bold text-slate-400 uppercase">{stats.pendingCount} Operations Queued</p>
              </div>
            </CardContent>
          </Card>

          <Card className="rounded-2xl border bg-white shadow-sm ring-1 ring-slate-100 hover:shadow-md transition-shadow">
            <CardContent className="p-6 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Capital Disbursed</span>
                <div className="h-7 w-7 rounded-full bg-emerald-50 flex items-center justify-center">
                  <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />
                </div>
              </div>
              <div className="space-y-1">
                <p className="text-2xl font-bold text-slate-900 tracking-tight">NPR {stats.paid.toLocaleString()}</p>
                <p className="text-[10px] font-bold text-emerald-500 uppercase">Settlement Rate 100%</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Ledger Architecture */}
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 py-2 border-b border-slate-100">
            <div className="flex items-center gap-4 w-full sm:w-auto">
              <div className="relative flex-1 sm:w-64">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-300" />
                <Input
                  placeholder="Search registry..."
                  value={globalFilter}
                  onChange={(e) => setGlobalFilter(e.target.value)}
                  className="pl-9 h-9 text-xs bg-white border-slate-200 shadow-none rounded-lg focus:ring-1 focus:ring-slate-100"
                />
              </div>
              <Button variant="outline" size="sm" className="h-9 rounded-lg gap-2 text-xs font-bold text-slate-500">
                <Filter className="h-3.5 w-3.5" /> Filter
              </Button>
            </div>

            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0 scrollbar-hide">
              {['all', 'payout_requested', 'pending', 'completed'].map((s) => (
                <Button
                  key={s}
                  variant={statusFilter === (s === 'all' ? null : s) ? "secondary" : "ghost"}
                  size="sm"
                  onClick={() => setStatusFilter(s === 'all' ? null : s)}
                  className="h-8 rounded-full px-4 text-[10px] font-bold uppercase tracking-wider whitespace-nowrap"
                >
                  {s.replace('_', ' ')}
                </Button>
              ))}
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
            <Table>
              <TableHeader className="bg-slate-50/50">
                {table.getHeaderGroups().map(hg => (
                  <TableRow key={hg.id} className="hover:bg-transparent border-slate-100">
                    {hg.headers.map(h => (
                      <TableHead key={h.id} className="text-[10px] uppercase font-black tracking-[0.1em] text-slate-400 h-11 px-8">
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
                      className="group hover:bg-slate-50 cursor-pointer transition-colors border-slate-50"
                      onClick={() => {
                        setSelectedPayment(row.original);
                        setSheetOpen(true);
                      }}
                    >
                      {row.getVisibleCells().map(cell => (
                        <TableCell key={cell.id} className="py-4 px-8 border-none">
                          {flexRender(cell.column.columnDef.cell, cell.getContext())}
                        </TableCell>
                      ))}
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={columns.length} className="h-44 text-center">
                      <div className="space-y-2 opacity-30">
                        <Loader2 size={30} className="mx-auto text-slate-300" />
                        <p className="text-[10px] font-black uppercase tracking-widest">Registry entry not found</p>
                      </div>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
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
