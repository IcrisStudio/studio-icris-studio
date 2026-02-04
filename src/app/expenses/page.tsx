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
import {
  Plus,
  Receipt,
  Loader2,
  Search,
  Filter,
  TrendingDown,
  ArrowUpRight,
  PieChart,
  Calendar,
  Briefcase,
  Globe,
  Shapes
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

const EXPENSE_TYPES = [
  { value: "staff_salary", label: "Personnel & Payroll", icon: <Briefcase className="h-4 w-4" /> },
  { value: "advertising", label: "Media & Acquisition", icon: <Globe className="h-4 w-4" /> },
  { value: "tools_and_software", label: "SaaS & Infrastructure", icon: <Shapes className="h-4 w-4" /> },
  { value: "miscellaneous", label: "Operating Overheads", icon: <Receipt className="h-4 w-4" /> },
];

const TYPE_STYLES: Record<string, { bg: string, text: string, ring: string }> = {
  staff_salary: { bg: "bg-indigo-50", text: "text-indigo-700", ring: "ring-indigo-100" },
  advertising: { bg: "bg-sky-50", text: "text-sky-700", ring: "ring-sky-100" },
  tools_and_software: { bg: "bg-emerald-50", text: "text-emerald-700", ring: "ring-emerald-100" },
  miscellaneous: { bg: "bg-slate-100", text: "text-slate-700", ring: "ring-slate-100" },
};

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
      const matchesSearch = e.description.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesType = typeFilter === "all" || e.type === typeFilter;
      return matchesSearch && matchesType;
    }).sort((a, b) => b.date - a.date);
  }, [expenses, searchTerm, typeFilter]);

  if (!isAdmin) {
    return (
      <DashboardLayout>
        <div className="flex h-[400px] items-center justify-center text-sm font-medium text-muted-foreground uppercase opacity-40 tracking-widest">
          Unauthorized Access
        </div>
      </DashboardLayout>
    );
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await createExpense({
        type: expenseForm.type,
        amount: parseFloat(expenseForm.amount),
        description: expenseForm.description,
        date: new Date(expenseForm.date).getTime(),
      });
      toast.success("Expense recorded");
      setIsCreateDialogOpen(false);
      resetForm();
    } catch (error: any) {
      toast.error(error.message || "Failed to record");
    } finally {
      setIsSubmitting(false);
    }
  };

  const resetForm = () => {
    setExpenseForm({
      type: "miscellaneous",
      amount: "",
      description: "",
      date: new Date().toISOString().split("T")[0],
    });
  };

  return (
    <DashboardLayout>
      <div className="container max-w-7xl animate-in fade-in duration-500 space-y-10 py-8">

        {/* Header Block */}
        <div className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between border-b pb-8">
          <div className="space-y-1.5">
            <h1 className="text-3xl font-black tracking-tightest uppercase">Operating Costs</h1>
            <div className="flex items-center gap-2 text-[10px] font-bold text-muted-foreground uppercase tracking-[0.2em] opacity-60">
              <span className="flex items-center gap-1">Expense Ledger</span>
              <span>•</span>
              <span>Financial Year 2026</span>
            </div>
          </div>

          <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
            <DialogTrigger asChild>
              <Button size="sm" className="h-9 rounded-lg px-6 text-[10px] font-black uppercase tracking-widest shadow-none">
                <Plus className="h-3.5 w-3.5 mr-2" />
                Record Transaction
              </Button>
            </DialogTrigger>
            <DialogContent className="rounded-2xl border shadow-2xl max-w-md">
              <DialogHeader>
                <DialogTitle className="text-lg font-black uppercase tracking-tightest">New Disbursement</DialogTitle>
                <DialogDescription className="text-xs uppercase font-bold opacity-40">Add a business overhead to the system ledger.</DialogDescription>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-6 pt-4">
                <div className="grid gap-6">
                  <div className="space-y-2">
                    <Label className="text-[10px] font-black uppercase opacity-60">Classification</Label>
                    <Select
                      value={expenseForm.type}
                      onValueChange={(value) => setExpenseForm({ ...expenseForm, type: value })}
                    >
                      <SelectTrigger className="h-10 text-xs font-bold rounded-lg bg-muted/20 border-none shadow-none ring-1 ring-border">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="rounded-xl border shadow-2xl">
                        {EXPENSE_TYPES.map((type) => (
                          <SelectItem key={type.value} value={type.value} className="text-[10px] font-bold uppercase">
                            {type.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label className="text-[10px] font-black uppercase opacity-60">Transaction Magnitude (NPR)</Label>
                    <Input
                      type="number"
                      value={expenseForm.amount}
                      onChange={(e) => setExpenseForm({ ...expenseForm, amount: e.target.value })}
                      className="h-10 text-xs font-bold rounded-lg bg-muted/20 border-none shadow-none ring-1 ring-border"
                      placeholder="0.00"
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label className="text-[10px] font-black uppercase opacity-60">Line Description</Label>
                    <Textarea
                      value={expenseForm.description}
                      onChange={(e) => setExpenseForm({ ...expenseForm, description: e.target.value })}
                      className="min-h-[80px] text-xs font-bold rounded-lg bg-muted/20 border-none shadow-none ring-1 ring-border resize-none p-3"
                      placeholder="Specify transaction details..."
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label className="text-[10px] font-black uppercase opacity-60">Date of Settlement</Label>
                    <Input
                      type="date"
                      value={expenseForm.date}
                      onChange={(e) => setExpenseForm({ ...expenseForm, date: e.target.value })}
                      className="h-10 text-xs font-bold rounded-lg bg-muted/20 border-none shadow-none ring-1 ring-border"
                      required
                    />
                  </div>
                </div>

                <div className="flex justify-end gap-3 pt-4">
                  <Button type="button" variant="ghost" className="h-10 text-[10px] font-black uppercase tracking-widest" onClick={() => setIsCreateDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button type="submit" disabled={isSubmitting} className="h-10 px-8 text-[10px] font-black uppercase tracking-widest rounded-lg">
                    {isSubmitting ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : "Authorize"}
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        {/* Global Summary */}
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-5">
          <Card className="rounded-2xl border bg-primary text-primary-foreground shadow-none lg:col-span-1">
            <CardContent className="p-6 space-y-4">
              <p className="text-[10px] font-black uppercase tracking-[0.2em] opacity-40">Total Burn</p>
              <div className="space-y-1">
                <h3 className="text-2xl font-black tracking-tightest">NPR {expenseSummary?.total?.toLocaleString() || 0}</h3>
                <div className="flex items-center gap-1.5 text-[9px] font-black uppercase opacity-50">
                  <TrendingDown size={10} /> Cumulative
                </div>
              </div>
            </CardContent>
          </Card>

          {EXPENSE_TYPES.map((type) => (
            <Card key={type.value} className="rounded-2xl border bg-card/50 shadow-none hover:bg-card transition-colors">
              <CardContent className="p-6 space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-[9px] font-black uppercase tracking-[0.2em] text-muted-foreground opacity-50 truncate max-w-[120px]">
                    {type.label.split(' ')[0]}
                  </span>
                  <div className="p-1.5 rounded-lg bg-muted/50 text-muted-foreground opacity-40">
                    {type.icon}
                  </div>
                </div>
                <h3 className="text-xl font-black tracking-tightest">
                  NPR {(expenseSummary?.by_type?.[type.value as keyof typeof expenseSummary.by_type] || 0) > 1000 ? (expenseSummary?.by_type?.[type.value as keyof typeof expenseSummary.by_type] / 1000).toFixed(1) + 'K' : (expenseSummary?.by_type?.[type.value as keyof typeof expenseSummary.by_type] || 0).toLocaleString()}
                </h3>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* History Ledger */}
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-6">
            <div className="relative w-full sm:w-80">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground opacity-30" />
              <Input
                placeholder="Filter transactions..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="h-10 pl-10 text-[11px] font-bold rounded-xl bg-card border shadow-none"
              />
            </div>

            <div className="flex items-center gap-2 overflow-x-auto pb-1 sm:pb-0 w-full sm:w-auto">
              <Button
                variant={typeFilter === "all" ? "secondary" : "ghost"}
                size="sm"
                onClick={() => setTypeFilter("all")}
                className="h-8 text-[9px] font-black uppercase tracking-widest rounded-lg"
              >
                Master Ledger
              </Button>
              {EXPENSE_TYPES.map(type => (
                <Button
                  key={type.value}
                  variant={typeFilter === type.value ? "secondary" : "ghost"}
                  size="sm"
                  onClick={() => setTypeFilter(type.value)}
                  className="h-8 text-[9px] font-black uppercase tracking-widest rounded-lg whitespace-nowrap"
                >
                  {type.label.split(' ')[0]}
                </Button>
              ))}
            </div>
          </div>

          <Card className="rounded-2xl border shadow-none bg-card/30 overflow-hidden">
            <Table>
              <TableHeader className="bg-muted/10">
                <TableRow className="hover:bg-transparent border-none">
                  <TableHead className="text-[10px] font-black uppercase tracking-widest h-12 px-8">Settlement Date</TableHead>
                  <TableHead className="text-[10px] font-black uppercase tracking-widest h-12">Disbursement Narrative</TableHead>
                  <TableHead className="text-[10px] font-black uppercase tracking-widest h-12">Classification</TableHead>
                  <TableHead className="text-[10px] font-black uppercase tracking-widest h-12 text-right px-8">Magnitude</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredExpenses.length > 0 ? (
                  filteredExpenses.map((expense) => {
                    const style = TYPE_STYLES[expense.type] || TYPE_STYLES.miscellaneous;
                    return (
                      <TableRow key={expense._id} className="hover:bg-muted/5 transition-colors h-16 cursor-default">
                        <TableCell className="px-8 text-[11px] font-black tracking-widest text-muted-foreground uppercase opacity-40">
                          {format(new Date(expense.date), "MMM d, yyyy")}
                        </TableCell>
                        <TableCell>
                          <div className="max-w-md">
                            <p className="text-xs font-bold leading-tight">{expense.description}</p>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className={`h-6 rounded-md border-none shadow-none ring-1 px-2.5 text-[9px] font-black uppercase tracking-widest ${style.bg} ${style.text} ${style.ring}`}>
                            {EXPENSE_TYPES.find(t => t.value === expense.type)?.label.split(' ')[0]}
                          </Badge>
                        </TableCell>
                        <TableCell className="px-8 text-right">
                          <p className="text-sm font-black tracking-tightest">NPR {expense.amount.toLocaleString()}</p>
                        </TableCell>
                      </TableRow>
                    );
                  })
                ) : (
                  <TableRow>
                    <TableCell colSpan={4} className="h-40 text-center text-[10px] font-black uppercase tracking-widest text-muted-foreground opacity-30">
                      {searchTerm ? "Negative results for current query." : "Ledger is currently empty."}
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
}
