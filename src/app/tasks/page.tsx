"use client";

import { useState, useMemo } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import DashboardLayout from "@/components/DashboardLayout";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
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
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  ColumnDef,
  flexRender,
  getCoreRowModel,
  useReactTable,
  getPaginationRowModel,
  getFilteredRowModel,
  SortingState,
  getSortedRowModel,
} from "@tanstack/react-table";
import { Plus, MoreHorizontal, Calendar, Search, Filter, ArrowUpDown, Briefcase, Clock } from "lucide-react";
import { Separator } from "@/components/ui/separator";
import { format } from "date-fns";
import { TaskSheet } from "@/components/TaskSheet";
import { toast } from "sonner";

// --- Types ---
interface Task {
  _id: string;
  project_name: string;
  client_name: string;
  task_type: string;
  deadline: number;
  total_budget: number;
  payment_status: string;
  status: string;
  created_at: number;
  // ... other fields
}

// --- Status Colors ---
const STATUS_COLORS: Record<string, string> = {
  pending: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/40 dark:text-yellow-300",
  in_progress: "bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300",
  completed: "bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-300",
};

const PAYMENT_COLORS: Record<string, string> = {
  pending: "bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-300",
  partial: "bg-orange-100 text-orange-800 dark:bg-orange-900/40 dark:text-orange-300",
  paid: "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300",
};


export default function TasksPage() {
  const { user, isAdmin } = useAuth();

  // Data Fetching
  const tasks = useQuery(api.tasks.list); // This is now sorted by created_at desc
  const staffTasks = useQuery(api.tasks.getStaffTasks, user?.id ? { staff_id: user.id as any } : "skip");
  const markCompleted = useMutation(api.tasks.markCompleted);

  // Local State
  const [sheetOpen, setSheetOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [globalFilter, setGlobalFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState<string | null>(null);
  const [selectedTab, setSelectedTab] = useState("all");

  // Table Columns Definition
  const columns = useMemo<ColumnDef<Task>[]>(() => [
    {
      accessorKey: "project_name",
      header: "Project / Client",
      cell: ({ row }) => (
        <div className="flex flex-col">
          <span className="font-semibold text-foreground">{row.original.project_name}</span>
          <span className="text-xs text-muted-foreground">{row.original.client_name}</span>
        </div>
      ),
    },
    {
      accessorKey: "task_type",
      header: "Type",
      cell: ({ row }) => (
        <Badge variant="outline" className="font-normal text-xs bg-muted/50">
          {row.getValue("task_type")}
        </Badge>
      ),
    },
    {
      accessorKey: "total_budget",
      header: ({ column }) => {
        return (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
            className="p-0 hover:bg-transparent"
          >
            Budget
            <ArrowUpDown className="ml-2 h-4 w-4" />
          </Button>
        )
      },
      cell: ({ row }) => {
        const amount = parseFloat(row.getValue("total_budget"));
        return <div className="font-medium">NPR {amount.toLocaleString()}</div>;
      },
    },
    {
      accessorKey: "payment_status",
      header: "Payment",
      cell: ({ row }) => {
        const status = row.getValue("payment_status") as string;
        return (
          <Badge variant="secondary" className={`capitalize border-0 ${PAYMENT_COLORS[status] || "bg-gray-100"}`}>
            {status}
          </Badge>
        );
      },
    },
    {
      accessorKey: "status",
      header: "Status",
      cell: ({ row }) => {
        const status = row.getValue("status") as string;
        return (
          <Badge variant="secondary" className={`capitalize border-0 ${STATUS_COLORS[status] || "bg-gray-100"}`}>
            {status.replace("_", " ")}
          </Badge>
        );
      },
    },
    {
      accessorKey: "deadline",
      header: "Deadline",
      cell: ({ row }) => {
        return (
          <div className="flex items-center text-sm text-muted-foreground">
            <Calendar className="mr-2 h-3 w-3" />
            {format(new Date(row.getValue("deadline")), "MMM d, yyyy")}
          </div>
        );
      },
    },
    {
      id: "actions",
      cell: ({ row }) => {
        const task = row.original;

        return (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="h-8 w-8 p-0">
                <span className="sr-only">Open menu</span>
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>Actions</DropdownMenuLabel>
              <DropdownMenuItem onClick={() => {
                setEditingTask(task);
                setSheetOpen(true);
              }}>
                Edit & Assign
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              {task.status !== "completed" && (
                <DropdownMenuItem onClick={async () => {
                  try {
                    await markCompleted({ taskId: task._id as any });
                    toast.success("Marked as active/completed");
                  } catch (e) { toast.error("Failed to update status"); }
                }}>
                  Mark Completed
                </DropdownMenuItem>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        );
      },
    },
  ], [markCompleted]);

  // Table Configuration
  const filteredData = useMemo(() => {
    return (tasks || []).filter((task: any) => {
      if (statusFilter && task.status !== statusFilter) return false;
      // Global filter search (simple implementation)
      if (globalFilter) {
        const searchLower = globalFilter.toLowerCase();
        return (
          task.project_name.toLowerCase().includes(searchLower) ||
          task.client_name.toLowerCase().includes(searchLower)
        );
      }
      return true;
    });
  }, [tasks, statusFilter, globalFilter]);

  const table = useReactTable({
    data: filteredData,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    initialState: {
      pagination: {
        pageSize: 10,
      }
    }
  });

  // Handlers
  const handleCreateNew = () => {
    setEditingTask(null);
    setSheetOpen(true);
  };

  if (!isAdmin) {
    const sortedStaffTasks = useMemo(() => {
      return (staffTasks || []).slice().sort((a: any, b: any) => b.created_at - a.created_at);
    }, [staffTasks]);

    const filteredStaffTasks = useMemo(() => {
      return sortedStaffTasks.filter((task: any) => {
        const matchesTab = selectedTab === "all" || task.status === selectedTab;
        const matchesSearch = globalFilter === "" ||
          task.project_name.toLowerCase().includes(globalFilter.toLowerCase()) ||
          task.task_type.toLowerCase().includes(globalFilter.toLowerCase());
        return matchesTab && matchesSearch;
      });
    }, [sortedStaffTasks, selectedTab, globalFilter]);

    const myStats = useMemo(() => {
      return (staffTasks || []).reduce((acc: any, curr: any) => {
        if (curr.status === 'completed') {
          acc.earned += curr.assigned_salary;
        } else {
          acc.pending += curr.assigned_salary;
        }
        return acc;
      }, { earned: 0, pending: 0 });
    }, [staffTasks]);

    const updateTaskStatus = useMutation((api.tasks as any).updateStatus);

    return (
      <DashboardLayout>
        <div className="space-y-8 animate-in fade-in duration-700 max-w-6xl mx-auto">

          {/* Header & Stats */}
          <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
            <div className="space-y-1">
              <h1 className="text-4xl font-black tracking-tight">Production Queue</h1>
              <p className="text-muted-foreground font-medium">Manage your assignments and track your earnings.</p>
            </div>

            <div className="flex gap-4 w-full md:w-auto">
              <div className="bg-primary/5 border border-primary/10 rounded-2xl p-4 flex-1 md:w-40">
                <p className="text-[10px] font-bold uppercase tracking-widest text-primary/60 mb-1">To Earn</p>
                <p className="text-xl font-black">NPR {myStats.pending.toLocaleString()}</p>
              </div>
              <div className="bg-green-500/5 border border-green-500/10 rounded-2xl p-4 flex-1 md:w-40">
                <p className="text-[10px] font-bold uppercase tracking-widest text-green-600/60 mb-1">Paid Out</p>
                <p className="text-xl font-black">NPR {myStats.earned.toLocaleString()}</p>
              </div>
            </div>
          </div>

          <Separator className="bg-foreground/5" />

          {/* Controls: Search & Tabs */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex flex-wrap items-center gap-1.5 p-1 bg-muted/50 rounded-xl border w-full sm:w-auto">
              {["all", "pending", "in_progress", "completed"].map((tab) => (
                <Button
                  key={tab}
                  variant={selectedTab === tab ? "secondary" : "ghost"}
                  onClick={() => setSelectedTab(tab)}
                  size="sm"
                  className={`rounded-lg h-8 capitalize text-xs font-bold px-4 transition-all ${selectedTab === tab ? 'bg-background shadow-sm' : ''
                    }`}
                >
                  {tab.replace('_', ' ')}
                </Button>
              ))}
            </div>

            <div className="relative w-full sm:w-[300px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search your projects..."
                value={globalFilter}
                onChange={(e) => setGlobalFilter(e.target.value)}
                className="pl-9 h-10 bg-card border-none ring-1 ring-foreground/10 focus-visible:ring-primary shadow-none rounded-xl"
              />
            </div>
          </div>

          {/* Task Table */}
          <div className="bg-card rounded-2xl border-none shadow-2xl shadow-foreground/5 overflow-hidden ring-1 ring-foreground/5">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/20 hover:bg-muted/20 border-b-0">
                  <TableHead className="font-black text-[10px] uppercase tracking-widest px-8 h-14">Project Details</TableHead>
                  <TableHead className="font-black text-[10px] uppercase tracking-widest h-14">Compensation</TableHead>
                  <TableHead className="font-black text-[10px] uppercase tracking-widest h-14 text-center">Status</TableHead>
                  <TableHead className="font-black text-[10px] uppercase tracking-widest h-14">Deadline</TableHead>
                  <TableHead className="w-[50px]"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredStaffTasks.length > 0 ? (
                  filteredStaffTasks.map((task: any) => (
                    <TableRow key={task._id} className="group border-b border-foreground/[0.03] last:border-0 hover:bg-primary/[0.01] transition-all">
                      <TableCell className="px-8 py-6">
                        <div className="flex flex-col">
                          <span className="font-extrabold text-lg text-foreground group-hover:text-primary transition-colors">{task.project_name}</span>
                          <span className="text-xs font-semibold text-muted-foreground flex items-center gap-1 mt-0.5 opacity-60">
                            <Briefcase className="h-3 w-3" /> {task.task_type}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-col">
                          <div className="text-xl font-black text-foreground">
                            <span className="text-[10px] align-top mr-1 font-bold text-muted-foreground">NPR</span>
                            {(task.assigned_salary || 0).toLocaleString()}
                          </div>
                          <Badge variant="outline" className={`w-fit text-[9px] h-4 mt-1.5 border-0 shadow-none px-2 font-bold uppercase tracking-tighter ${task.payment_status === 'paid' ? 'bg-emerald-50 text-emerald-700' : 'bg-orange-50 text-orange-700'
                            }`}>
                            {task.payment_status || 'unpaid'}
                          </Badge>
                        </div>
                      </TableCell>
                      <TableCell className="text-center">
                        <Badge
                          variant="outline"
                          className={`capitalize border-o shadow-none px-4 py-1.5 font-black text-[10px] rounded-full ${task.status === 'completed'
                            ? 'bg-emerald-500/10 text-emerald-600'
                            : task.status === 'in_progress'
                              ? 'bg-blue-500/10 text-blue-600'
                              : 'bg-orange-500/10 text-orange-600'
                            }`}
                        >
                          {task.status.replace('_', ' ')}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2.5 text-sm font-bold text-muted-foreground">
                          <Clock className="h-4 w-4 opacity-40 text-primary" />
                          <span>{format(new Date(task.deadline), "MMM d, yyyy")}</span>
                        </div>
                      </TableCell>
                      <TableCell className="px-6">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="rounded-full opacity-40 group-hover:opacity-100 transition-opacity">
                              <MoreHorizontal className="h-5 w-5" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="w-[180px] rounded-xl p-2 shadow-2xl">
                            <DropdownMenuLabel className="text-[10px] uppercase tracking-widest opacity-50 font-bold p-2">Update Progress</DropdownMenuLabel>
                            <DropdownMenuItem
                              onClick={() => updateTaskStatus({ taskId: task._id, status: "pending" })}
                              className="rounded-lg font-medium"
                            >
                              To Pending
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => updateTaskStatus({ taskId: task._id, status: "in_progress" })}
                              className="rounded-lg font-medium"
                            >
                              In Progress
                            </DropdownMenuItem>
                            <DropdownMenuSeparator className="bg-muted" />
                            <DropdownMenuItem
                              onClick={() => updateTaskStatus({ taskId: task._id, status: "completed" })}
                              className="rounded-lg font-bold text-emerald-600"
                            >
                              Finish Task
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={5} className="h-72 text-center">
                      <div className="flex flex-col items-center justify-center gap-4 py-12">
                        <div className="h-20 w-20 rounded-full bg-muted/30 flex items-center justify-center border-2 border-dashed border-foreground/10">
                          <Search className="h-8 w-8 text-foreground opacity-10" />
                        </div>
                        <div className="space-y-1">
                          <p className="text-foreground/80 font-black text-lg">No assignments found</p>
                          <p className="text-muted-foreground text-sm font-medium">Try changing your filters or searching for something else.</p>
                        </div>
                      </div>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6 animate-in fade-in duration-500">

        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Tasks Dashboard</h1>
            <p className="text-muted-foreground mt-1">Manage projects, track payments, and assign staff.</p>
          </div>
          <Button onClick={handleCreateNew} size="lg" className="shadow-lg hover:shadow-xl transition-all">
            <Plus className="mr-2 h-5 w-5" /> New Task
          </Button>
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-4 items-center justify-between bg-card p-4 rounded-xl border shadow-sm">
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <div className="relative w-full sm:w-[300px]">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search projects..."
                value={globalFilter}
                onChange={(e) => setGlobalFilter(e.target.value)}
                className="pl-8 bg-background"
              />
            </div>
          </div>
          <div className="flex items-center gap-2 w-full sm:w-auto overflow-x-auto pb-2 sm:pb-0">
            <Button
              variant={statusFilter === null ? "secondary" : "ghost"}
              onClick={() => setStatusFilter(null)}
              size="sm"
              className="rounded-full"
            >
              All
            </Button>
            <Button
              variant={statusFilter === "pending" ? "secondary" : "ghost"}
              onClick={() => setStatusFilter("pending")}
              size="sm"
              className="rounded-full"
            >
              Pending
            </Button>
            <Button
              variant={statusFilter === "in_progress" ? "secondary" : "ghost"}
              onClick={() => setStatusFilter("in_progress")}
              size="sm"
              className="rounded-full"
            >
              In Progress
            </Button>
            <Button
              variant={statusFilter === "completed" ? "secondary" : "ghost"}
              onClick={() => setStatusFilter("completed")}
              size="sm"
              className="rounded-full"
            >
              Completed
            </Button>
          </div>
        </div>

        {/* Data Table */}
        <div className="rounded-xl border bg-card shadow-sm overflow-hidden">
          <Table>
            <TableHeader>
              {table.getHeaderGroups().map((headerGroup) => (
                <TableRow key={headerGroup.id} className="bg-muted/30">
                  {headerGroup.headers.map((header) => {
                    return (
                      <TableHead key={header.id} className="font-semibold text-foreground/80">
                        {header.isPlaceholder
                          ? null
                          : flexRender(
                            header.column.columnDef.header,
                            header.getContext()
                          )}
                      </TableHead>
                    )
                  })}
                </TableRow>
              ))}
            </TableHeader>
            <TableBody>
              {table.getRowModel().rows?.length ? (
                table.getRowModel().rows.map((row) => (
                  <TableRow
                    key={row.id}
                    data-state={row.getIsSelected() && "selected"}
                    className="hover:bg-muted/40 cursor-pointer transition-colors"
                  >
                    {row.getVisibleCells().map((cell) => (
                      <TableCell key={cell.id} className="py-4">
                        {flexRender(cell.column.columnDef.cell, cell.getContext())}
                      </TableCell>
                    ))}
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={columns.length} className="h-24 text-center">
                    No results.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>

        {/* Pagination */}
        <div className="flex items-center justify-end space-x-2 py-4">
          <Button
            variant="outline"
            size="sm"
            onClick={() => table.previousPage()}
            disabled={!table.getCanPreviousPage()}
          >
            Previous
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => table.nextPage()}
            disabled={!table.getCanNextPage()}
          >
            Next
          </Button>
        </div>
      </div>

      <TaskSheet
        open={sheetOpen}
        onOpenChange={setSheetOpen}
        task={editingTask}
      />
    </DashboardLayout>
  );
}
