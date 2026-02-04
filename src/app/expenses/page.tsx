"use client";

import { useState, useMemo } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import DashboardLayout from "@/components/DashboardLayout";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  Plus,
  Receipt,
  Loader2,
  Search,
  TrendingDown,
  Calendar,
} from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from "@/components/ui/table";
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip as RechartsTooltip
} from "recharts";

const EXPENSE_TYPES = [
  { value: "staff_salary", label: "Staff Salary", color: "#3b82f6" },
  { value: "advertising", label: "Advertising", color: "#10b981" },
  { value: "tools_and_software", label: "Tools & Software", color: "#f59e0b" },
  { value: "miscellaneous", label: "Miscellaneous", color: "#6366f1" },
];

export default function ExpensesPage() {
  const { isAdmin } = useAuth();
  const expenses = useQuery(api.expenses.list);
  const expenseSummary = useQuery(api.expenses.getSummary);
  const createExpense = useMutation(api.expenses.create);

  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");

  const [expenseForm, setExpenseForm] = useState({
    type: "miscellaneous",
    amount: "",
    description: "",
    date: new Date().toISOString().split("T")[0],
  });

  const filteredExpenses = useMemo(() => {
    if (!expenses) return [];
    return expenses.filter(e => {
      const description = e.description || "";
      const matchesSearch = description.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesType = typeFilter === "all" || e.type === typeFilter;
      return matchesSearch && matchesType;
    }).sort((a, b) => b.date - a.date);
  }, [expenses, searchTerm, typeFilter]);

  const chartData = useMemo(() => {
    if (!expenseSummary?.by_type) return [];
    return EXPENSE_TYPES.map(type => ({
      name: type.label,
      value: expenseSummary.by_type[type.value as keyof typeof expenseSummary.by_type] || 0,
      color: type.color
    })).filter(d => d.value > 0);
  }, [expenseSummary]);

  if (!isAdmin) {
    return (
      <DashboardLayout>
        <div className="flex h-[450px] items-center justify-center">
          <p className="text-sm text-muted-foreground">Access restricted</p>
        </div>
      </DashboardLayout>
    );
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const amount = parseFloat(expenseForm.amount);
      if (isNaN(amount) || amount <= 0) {
        throw new Error("Please enter a valid amount");
      }
      await createExpense({
        type: expenseForm.type,
        amount,
        description: expenseForm.description,
        date: new Date(expenseForm.date).getTime(),
      });
      toast.success("Expense added successfully");
      setIsCreateDialogOpen(false);
      setExpenseForm({
        type: "miscellaneous",
        amount: "",
        description: "",
        date: new Date().toISOString().split("T")[0],
      });
    } catch (error: any) {
      toast.error(error.message || "Failed to add expense");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <DashboardLayout>
      <div className="container max-w-7xl space-y-8 py-8">

        {/* Header */}
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Expenses</h1>
            <p className="text-sm text-muted-foreground mt-1">
              Track and manage business expenses
            </p>
          </div>

          <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                Add Expense
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add New Expense</DialogTitle>
                <DialogDescription>
                  Record a new business expense
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="type">Category</Label>
                  <Select
                    value={expenseForm.type}
                    onValueChange={(value) => setExpenseForm({ ...expenseForm, type: value })}
                  >
                    <SelectTrigger id="type">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {EXPENSE_TYPES.map(type => (
                        <SelectItem key={type.value} value={type.value}>
                          {type.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="amount">Amount (NPR)</Label>
                  <Input
                    id="amount"
                    type="number"
                    placeholder="0.00"
                    value={expenseForm.amount}
                    onChange={(e) => setExpenseForm({ ...expenseForm, amount: e.target.value })}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    placeholder="Enter expense details"
                    value={expenseForm.description}
                    onChange={(e) => setExpenseForm({ ...expenseForm, description: e.target.value })}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="date">Date</Label>
                  <Input
                    id="date"
                    type="date"
                    value={expenseForm.date}
                    onChange={(e) => setExpenseForm({ ...expenseForm, date: e.target.value })}
                    required
                  />
                </div>

                <div className="flex gap-2 pt-4">
                  <Button type="button" variant="outline" onClick={() => setIsCreateDialogOpen(false)} className="flex-1">
                    Cancel
                  </Button>
                  <Button type="submit" disabled={isSubmitting} className="flex-1">
                    {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                    Add Expense
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        {/* Summary Cards */}
        <div className="grid gap-4 md:grid-cols-3">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Expenses</CardTitle>
              <TrendingDown className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                NPR {(expenseSummary?.total || 0).toLocaleString()}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                All time expenses
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">This Month</CardTitle>
              <Calendar className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                NPR {(expenseSummary?.this_month || 0).toLocaleString()}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Current month spending
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Transactions</CardTitle>
              <Receipt className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {expenses?.length || 0}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Total expense records
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Chart and Filters */}
        <div className="grid gap-4 md:grid-cols-7">
          <Card className="md:col-span-3">
            <CardHeader>
              <CardTitle>Expense Breakdown</CardTitle>
              <CardDescription>Distribution by category</CardDescription>
            </CardHeader>
            <CardContent>
              {chartData.length > 0 ? (
                <div className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={chartData}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="value"
                      >
                        {chartData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <RechartsTooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              ) : (
                <div className="h-[300px] flex items-center justify-center text-sm text-muted-foreground">
                  No expense data
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="md:col-span-4">
            <CardHeader>
              <CardTitle>Category Summary</CardTitle>
              <CardDescription>Spending by type</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {EXPENSE_TYPES.map(type => {
                const amount = expenseSummary?.by_type?.[type.value as keyof typeof expenseSummary.by_type] || 0;
                const percentage = expenseSummary?.total ? (amount / expenseSummary.total) * 100 : 0;

                return (
                  <div key={type.value} className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">{type.label}</span>
                      <span className="font-semibold">NPR {amount.toLocaleString()}</span>
                    </div>
                    <div className="h-2 bg-muted rounded-full overflow-hidden">
                      <div
                        className="h-full"
                        style={{
                          width: `${percentage}%`,
                          backgroundColor: type.color
                        }}
                      />
                    </div>
                  </div>
                );
              })}
            </CardContent>
          </Card>
        </div>

        {/* Expense List */}
        <Card>
          <CardHeader>
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
              <div>
                <CardTitle>Expense History</CardTitle>
                <CardDescription>All recorded expenses</CardDescription>
              </div>

              <div className="flex gap-2">
                <div className="relative flex-1 md:w-64">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search expenses..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-9"
                  />
                </div>

                <Select value={typeFilter} onValueChange={setTypeFilter}>
                  <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="Filter by type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Categories</SelectItem>
                    {EXPENSE_TYPES.map(type => (
                      <SelectItem key={type.value} value={type.value}>
                        {type.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead className="text-right">Amount</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredExpenses.length > 0 ? (
                  filteredExpenses.map((expense: any) => {
                    const typeConfig = EXPENSE_TYPES.find(t => t.value === expense.type);
                    return (
                      <TableRow key={expense._id}>
                        <TableCell className="text-sm">
                          {format(new Date(expense.date), "MMM d, yyyy")}
                        </TableCell>
                        <TableCell>
                          <Badge variant="secondary" className="text-xs">
                            {typeConfig?.label || expense.type}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-sm">{expense.description}</TableCell>
                        <TableCell className="text-right font-semibold">
                          NPR {expense.amount.toLocaleString()}
                        </TableCell>
                      </TableRow>
                    );
                  })
                ) : (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center h-32 text-sm text-muted-foreground">
                      No expenses found
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
