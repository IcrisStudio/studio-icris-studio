"use client";

import { useState, useMemo } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import DashboardLayout from "@/components/DashboardLayout";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
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
} from "@tanstack/react-table";
import {
  UserPlus,
  Search,
  ShieldCheck,
  Mail,
  Briefcase,
  ChevronRight,
  Loader2
} from "lucide-react";
import { StaffSheet } from "@/components/StaffSheet";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "@/components/ui/select";
import { toast } from "sonner";

// --- Types ---
interface Staff {
  id: string;
  username: string;
  full_name: string;
  profile_picture?: string;
  role_name: string;
  payment_method: string;
  status: string;
}

export default function StaffPage() {
  const { isAdmin } = useAuth();

  // Data Fetching
  const staffList = useQuery(api.users.listAllStaff);
  const updateStaff = useMutation(api.users.update);

  // State
  const [sheetOpen, setSheetOpen] = useState(false);
  const [selectedStaff, setSelectedStaff] = useState<Staff | null>(null);
  const [globalFilter, setGlobalFilter] = useState("");

  const handleStatusChange = async (userId: string, status: string) => {
    try {
      await updateStaff({ userId: userId as any, status });
      toast.success(`Staff status updated to ${status}`);
    } catch (e: any) {
      toast.error(e.message || "Update failed");
    }
  };

  // Table Columns
  const columns = useMemo<ColumnDef<Staff>[]>(() => [
    {
      accessorKey: "full_name",
      header: "Member",
      cell: ({ row }) => (
        <div className="flex items-center gap-3">
          <Avatar className="h-9 w-9 border">
            <AvatarImage src={row.original.profile_picture} />
            <AvatarFallback className="bg-primary/5 text-primary text-xs font-bold">
              {row.original.full_name?.substring(0, 2).toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <div className="flex flex-col">
            <span className="font-semibold text-sm">{row.original.full_name}</span>
            <div className="flex items-center gap-1 text-[11px] text-muted-foreground">
              <Mail className="h-3 w-3" /> {row.original.username}
            </div>
          </div>
        </div>
      ),
    },
    {
      accessorKey: "role_name",
      header: "Job Role",
      cell: ({ row }) => (
        <div className="flex items-center gap-2">
          <Briefcase className="h-3 w-3 text-muted-foreground" />
          <span className="text-sm font-medium">{row.original.role_name}</span>
        </div>
      ),
    },
    {
      accessorKey: "status",
      header: "Status",
      cell: ({ row }) => (
        <div onClick={(e) => e.stopPropagation()}>
          <Select
            defaultValue={row.original.status}
            onValueChange={(val) => handleStatusChange(row.original.id, val)}
          >
            <SelectTrigger className={`h-7 w-24 text-[10px] font-bold uppercase rounded-md border-none shadow-none ring-1 px-2 ${row.original.status === 'active'
                ? 'ring-emerald-100 bg-emerald-50 text-emerald-700'
                : 'ring-red-100 bg-red-50 text-red-700'
              }`}>
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="rounded-lg shadow-none border">
              <SelectItem value="active" className="text-[10px] font-bold uppercase">Active</SelectItem>
              <SelectItem value="disabled" className="text-[10px] font-bold uppercase">Disabled</SelectItem>
            </SelectContent>
          </Select>
        </div>
      ),
    },
    {
      accessorKey: "payment_method",
      header: "Payroll",
      cell: ({ row }) => (
        <span className="text-xs text-muted-foreground capitalize">
          {row.original.payment_method?.replace('_', ' ')}
        </span>
      ),
    },
    {
      id: "actions",
      header: "",
      cell: ({ row }) => (
        <Button
          variant="ghost"
          size="sm"
          className="h-8 w-8 p-0 rounded-md"
          onClick={(e) => {
            e.stopPropagation();
            setSelectedStaff(row.original);
            setSheetOpen(true);
          }}
        >
          <ChevronRight className="h-4 w-4 text-muted-foreground opacity-30" />
        </Button>
      ),
    }
  ], []);

  // Filter logic
  const filteredData = useMemo(() => {
    return (staffList || []).filter((s: any) => {
      const search = globalFilter.toLowerCase();
      return (
        s.full_name?.toLowerCase().includes(search) ||
        s.username?.toLowerCase().includes(search) ||
        s.role_name?.toLowerCase().includes(search)
      );
    });
  }, [staffList, globalFilter]);

  const table = useReactTable({
    data: filteredData,
    columns,
    getCoreRowModel: getCoreRowModel(),
  });

  if (!isAdmin) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-[50vh]">
          <p className="text-muted-foreground text-sm font-medium">Unauthorized access restricted.</p>
        </div>
      </DashboardLayout>
    );
  }

  if (!staffList) {
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
      <div className="container max-w-7xl space-y-8 py-6 animate-in fade-in duration-500">

        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div className="text-left space-y-1">
            <h1 className="text-xl font-semibold tracking-tight">Team Management</h1>
            <p className="text-sm text-muted-foreground">Modify access, roles and status of studio members.</p>
          </div>
          <Button onClick={() => { setSelectedStaff(null); setSheetOpen(true); }} size="sm" className="rounded-md shadow-none px-4 text-xs font-semibold">
            <UserPlus className="mr-2 h-3.5 w-3.5" /> New Member
          </Button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
          <Card className="shadow-none border rounded-lg bg-muted/20">
            <CardContent className="p-4 flex items-center justify-between">
              <div className="space-y-0.5">
                <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-widest">Total Staff</p>
                <p className="text-2xl font-bold tracking-tight">{staffList.length}</p>
              </div>
              <ShieldCheck className="h-8 w-8 text-primary opacity-10" />
            </CardContent>
          </Card>
        </div>

        <div className="space-y-4">
          <div className="relative max-w-sm">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
            <Input
              placeholder="Filter roster..."
              className="pl-8 h-8 text-xs bg-card border shadow-none rounded-md"
              value={globalFilter}
              onChange={(e) => setGlobalFilter(e.target.value)}
            />
          </div>

          <Card className="rounded-lg border shadow-none overflow-hidden">
            <Table>
              <TableHeader className="bg-muted/50">
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
                      className="hover:bg-muted/20 transition-all"
                    >
                      {row.getVisibleCells().map(cell => (
                        <TableCell key={cell.id} className="h-14 px-6">
                          {flexRender(cell.column.columnDef.cell, cell.getContext())}
                        </TableCell>
                      ))}
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={columns.length} className="h-32 text-center text-xs text-muted-foreground">
                      No matching roster entries found.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </Card>
        </div>

        <StaffSheet
          open={sheetOpen}
          onOpenChange={setSheetOpen}
          staff={selectedStaff}
        />
      </div>
    </DashboardLayout>
  );
}
