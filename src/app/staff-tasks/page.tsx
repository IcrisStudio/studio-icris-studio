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
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Search, Calendar, Briefcase, Clock, MoreHorizontal, Loader2 } from "lucide-react";
import { format } from "date-fns";
import { toast } from "sonner";

export default function StaffTasksPage() {
  const { user, isAdmin } = useAuth();

  const staffTasks = useQuery(api.tasks.getStaffTasks, user?.id ? { staff_id: user.id as any } : "skip");
  const updateTaskStatus = useMutation((api.tasks as any).updateStatus);

  const [globalFilter, setGlobalFilter] = useState("");
  const [statusTab, setStatusTab] = useState("all");

  const filteredTasks = useMemo(() => {
    if (!staffTasks) return [];
    return (staffTasks as any[])
      .filter((task: any) => {
        const matchesStatus = statusTab === "all" || task.status === statusTab;
        const matchesSearch = task.project_name.toLowerCase().includes(globalFilter.toLowerCase()) ||
          task.task_type.toLowerCase().includes(globalFilter.toLowerCase());
        return matchesStatus && matchesSearch;
      })
      .sort((a, b) => b.created_at - a.created_at);
  }, [staffTasks, statusTab, globalFilter]);

  if (isAdmin) {
    return (
      <DashboardLayout>
        <div className="flex h-[400px] items-center justify-center text-sm text-muted-foreground">
          Admin portal restricted to staff assignments.
        </div>
      </DashboardLayout>
    );
  }

  if (!staffTasks) {
    return (
      <DashboardLayout>
        <div className="flex h-screen items-center justify-center">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="container max-w-7xl space-y-6 py-6 animate-in fade-in duration-500">
        <div className="flex flex-col gap-1 text-left">
          <h1 className="text-xl font-semibold tracking-tight">Assigned Tasks</h1>
          <p className="text-sm text-muted-foreground">Overview of your current production queue and assignments.</p>
        </div>

        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-wrap items-center gap-1">
            {["all", "pending", "in_progress", "completed"].map((tab) => (
              <Button
                key={tab}
                variant={statusTab === tab ? "secondary" : "ghost"}
                size="sm"
                onClick={() => setStatusTab(tab)}
                className="h-8 rounded-md px-3 text-xs font-medium capitalize"
              >
                {tab.replace("_", " ")}
              </Button>
            ))}
          </div>
          <div className="relative w-full sm:w-64">
            <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-muted-foreground" />
            <Input
              placeholder="Filter tasks..."
              value={globalFilter}
              onChange={(e) => setGlobalFilter(e.target.value)}
              className="h-8 pl-8 text-xs shadow-none"
            />
          </div>
        </div>

        <Card className="rounded-lg border shadow-none overflow-hidden">
          <Table>
            <TableHeader className="bg-muted/50">
              <TableRow>
                <TableHead className="text-xs font-medium px-4 h-10">Project</TableHead>
                <TableHead className="text-xs font-medium h-10">Compensation</TableHead>
                <TableHead className="text-xs font-medium h-10">Status</TableHead>
                <TableHead className="text-xs font-medium h-10">Deadline</TableHead>
                <TableHead className="w-10 h-10"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredTasks.length > 0 ? (
                filteredTasks.map((task: any) => (
                  <TableRow key={task._id} className="hover:bg-muted/30 transition-colors">
                    <TableCell className="px-4 py-3">
                      <div className="flex flex-col gap-0.5">
                        <span className="text-sm font-semibold">{task.project_name}</span>
                        <span className="text-[10px] text-muted-foreground flex items-center gap-1 uppercase tracking-wider">
                          <Briefcase className="h-3 w-3" /> {task.task_type}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell className="py-3">
                      <div className="flex flex-col gap-0.5">
                        <span className="text-sm font-medium">NPR {task.assigned_salary?.toLocaleString()}</span>
                        <span className={`text-[10px] font-bold uppercase tracking-tight ${task.payment_status === 'paid' ? 'text-emerald-600' : 'text-amber-600'}`}>
                          {task.payment_status || 'unpaid'}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell className="py-3">
                      <Badge variant="outline" className={`h-5 rounded-md px-2 text-[10px] font-bold uppercase ${task.status === 'completed' ? 'border-emerald-200 bg-emerald-50 text-emerald-700 shadow-none' :
                        task.status === 'in_progress' ? 'border-blue-200 bg-blue-50 text-blue-700 shadow-none' :
                          'border-amber-200 bg-amber-50 text-amber-700 shadow-none'
                        }`}>
                        {task.status.replace('_', ' ')}
                      </Badge>
                    </TableCell>
                    <TableCell className="py-3">
                      <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                        <Calendar className="h-3 w-3" />
                        <span>{format(new Date(task.deadline), "MMM d, yyyy")}</span>
                      </div>
                    </TableCell>
                    <TableCell className="px-4 py-3 text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-7 w-7 rounded-md">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-40 shadow-none rounded-md">
                          <DropdownMenuLabel className="text-[10px] text-muted-foreground uppercase px-2 font-bold tracking-widest">Update State</DropdownMenuLabel>
                          <DropdownMenuItem onClick={() => updateTaskStatus({ taskId: task._id, status: "pending" })} className="text-xs">Pending</DropdownMenuItem>
                          <DropdownMenuItem onClick={() => updateTaskStatus({ taskId: task._id, status: "in_progress" })} className="text-xs">In Progress</DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem onClick={() => updateTaskStatus({ taskId: task._id, status: "completed" })} className="text-xs font-semibold text-emerald-600">Mark Completed</DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={5} className="h-32 text-center text-xs text-muted-foreground">
                    No active assignments matching current filter.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </Card>
      </div>
    </DashboardLayout>
  );
}


