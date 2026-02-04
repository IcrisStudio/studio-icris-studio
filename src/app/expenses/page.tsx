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
  PieChart as PieChartIcon,
  Calendar,
  Briefcase,
  Globe,
  Shapes,
  CreditCard
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
  { value: "staff_salary", label: "Personnel & Payroll", icon: <Briefcase className="h-4 w-4" />, color: "#4f46e5" },
  { value: "advertising", label: "Media & Acquisition", icon: <Globe className="h-4 w-4" />, color: "#0ea5e9" },
  { value: "tools_and_software", label: "SaaS & Infrastructure", icon: <Shapes className="h-4 w-4" />, color: "#10b981" },
  { value: "miscellaneous", label: "Operating Overheads", icon: <Receipt className="h-4 w-4" />, color: "#64748b" },
];

const TYPE_STYLES: Record<string, { bg: string, text: string, ring: string }> = {
  staff_salary: { bg: "bg-indigo-50/50", text: "text-indigo-700", ring: "ring-indigo-100" },
  advertising: { bg: "bg-sky-50/50", text: "text-sky-700", ring: "ring-sky-100" },
  tools_and_software: { bg: "bg-emerald-50/50", text: "text-emerald-700", ring: "ring-emerald-100" },
  miscellaneous: { bg: "bg-slate-100/50", text: "text-slate-700", ring: "ring-slate-100" },
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
      const description = e.description || "";
      const matchesSearch = description.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesType = typeFilter === "all" || e.type === typeFilter;
      return matchesSearch && matchesType;
    }).sort((a, b) => b.date - a.date);
  }, [expenses, searchTerm, typeFilter]);

  const chartData = useMemo(() => {
    if (!expenseSummary?.by_type) return [];
    return EXPENSE_TYPES.map(type => ({
      name: type.label.split(' ')[0],
      value: expenseSummary.by_type[type.value as keyof typeof expenseSummary.by_type] || 0,
      color: type.color
    })).filter(d => d.value > 0);
  }, [expenseSummary]);

  if (!isAdmin) {
    return (
      <DashboardLayout>
        <div className="flex h-[400px] flex-col items-center justify-center space-y-4">
          <div className="h-10 w-10 rounded-full bg-destructive/10 flex items-center justify-center text-destructive">
            <Filter size={20} />
          </div>
          <p className="text-[10px] font-black uppercase tracking-[0.2em] opacity-40">Administrative Seal Required</p>
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
      toast.success("Expense recorded and ledger synchronized");
      setIsCreateDialogOpen(false);
      resetForm();
    } catch (error: any) {
      toast.error(error.message || "Ledger sync failed");
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
      <div className="container max-w-7xl animate-in fade-in duration-700 space-y-12 py-10">

        {/* Header Block */}
        <div className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
          <div className="space-y-1.5">
            <h1 className="text-4xl font-black tracking-tighter uppercase font-sans">Expense Warehouse</h1>
            <div className="flex items-center gap-3 text-[10px] font-bold text-muted-foreground uppercase tracking-[0.2em] opacity-50">
              <span className="flex items-center gap-1.5"><div className="h-1 w-1 rounded-full bg-rose-500" /> Capital Outflow</span>
              <span>•</span>
              <span>Audit Level Intelligence</span>
            </div>
          </div>

          <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
            <DialogTrigger asChild>
              <Button className="h-11 rounded-2xl px-8 text-[11px] font-black uppercase tracking-widest shadow-2xl hover:scale-[1.02] active:scale-[0.98] transition-all">
                <Plus className="h-4 w-4 mr-2" />
                Deduct Capital
              </Button>
            </DialogTrigger>
            <DialogContent className="rounded-[2rem] border shadow-2xl max-w-md p-8 overflow-hidden">
              <div className="absolute top-0 right-0 p-8 opacity-[0.03] pointer-events-none">
                <TrendingDown size={140} />
              </div>
              <DialogHeader>
                <DialogTitle className="text-2xl font-black uppercase tracking-tighter">Expenditure Flow</DialogTitle>
                <DialogDescription className="text-[10px] uppercase font-bold opacity-40 tracking-widest">Verify capital deduction for the master ledger.</DialogDescription>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-8 pt-6">
                <div className="space-y-6">
                  <div className="space-y-2.5">
                    <Label className="text-[10px] font-black uppercase opacity-60 tracking-[0.1em]">Allocation Type</Label>
                    <Select
                      value={expenseForm.type}
                      onValueChange={(value) => setExpenseForm({ ...expenseForm, type: value })}
                    >
                      <SelectTrigger className="h-12 text-sm font-bold rounded-xl bg-muted/30 border-none shadow-none ring-1 ring-border focus:ring-primary/20 transition-all">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="rounded-2xl border shadow-2xl">
                        {EXPENSE_TYPES.map((type) => (
                          <SelectItem key={type.value} value={type.value} className="text-[10px] font-bold uppercase py-3">
                            <div className="flex items-center gap-2">
                              <div className="opacity-40">{type.icon}</div>
                              {type.label}
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2.5">
                    <Label className="text-[10px] font-black uppercase opacity-60 tracking-[0.1em]">Magnitude (NPR)</Label>
                    <div className="relative">
                      <div className="absolute left-4 top-1/2 -translate-y-1/2 text-[10px] font-black opacity-30">NPR</div>
                      <Input
                        type="number"
                        value={expenseForm.amount}
                        onChange={(e) => setExpenseForm({ ...expenseForm, amount: e.target.value })}
                        className="h-12 pl-12 text-sm font-black rounded-xl bg-muted/30 border-none shadow-none ring-1 ring-border focus:ring-primary/20"
                        placeholder="0.00"
                        required
                      />
                    </div>
                  </div>

                  <div className="space-y-2.5">
                    <Label className="text-[10px] font-black uppercase opacity-60 tracking-[0.1em]">Transaction Narrative</Label>
                    <Textarea
                      value={expenseForm.description}
                      onChange={(e) => setExpenseForm({ ...expenseForm, description: e.target.value })}
                      className="min-h-[100px] text-sm font-medium rounded-xl bg-muted/30 border-none shadow-none ring-1 ring-border resize-none p-4 focus:ring-primary/20"
                      placeholder="Describe the utilization..."
                      required
                    />
                  </div>

                  <div className="space-y-2.5">
                    <Label className="text-[10px] font-black uppercase opacity-60 tracking-[0.1em]">Settlement Date</Label>
                    <Input
                      type="date"
                      value={expenseForm.date}
                      onChange={(e) => setExpenseForm({ ...expenseForm, date: e.target.value })}
                      className="h-12 text-sm font-bold rounded-xl bg-muted/30 border-none shadow-none ring-1 ring-border focus:ring-primary/20"
                      required
                    />
                  </div>
                </div>

                <div className="flex gap-4 pt-2">
                  <Button type="button" variant="ghost" className="flex-1 h-12 text-[10px] font-black uppercase tracking-widest rounded-xl" onClick={() => setIsCreateDialogOpen(false)}>
                    Abort
                  </Button>
                  <Button type="submit" disabled={isSubmitting} className="flex-[2] h-12 text-[10px] font-black uppercase tracking-widest rounded-xl shadow-xl">
                    {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : "Authorize Payout"}
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        {/* Intelligence Matrix */}
        <div className="grid gap-8 md:grid-cols-12">
          {/* Visual Analytics */}
          <Card className="md:col-span-4 rounded-[2.5rem] border shadow-none bg-card/40 overflow-hidden relative group border-border/40">
            <CardHeader className="p-8 pb-0">
              <CardTitle className="text-xs font-black uppercase tracking-[0.2em] text-muted-foreground opacity-40">Capital Distribution</CardTitle>
            </CardHeader>
            <div className="h-[280px] w-full mt-4">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={chartData}
                    cx="50%"
                    cy="50%"
                    innerRadius={70}
                    outerRadius={100}
                    paddingAngle={8}
                    dataKey="value"
                    stroke="none"
                  >
                    {chartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} opacity={0.8} />
                    ))}
                  </Pie>
                  <RechartsTooltip
                    contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 20px 40px rgba(0,0,0,0.1)', padding: '12px' }}
                    itemStyle={{ fontSize: '10px', fontWeight: '900', textTransform: 'uppercase' }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="p-8 pt-0 grid grid-cols-2 gap-x-4 gap-y-3">
              {chartData.map((item) => (
                <div key={item.name} className="flex items-center gap-2">
                  <div className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: item.color }} />
                  <span className="text-[9px] font-black uppercase opacity-40 tracking-wider truncate">{item.name}</span>
                </div>
              ))}
            </div>
          </Card>

          {/* Performance Tiles */}
          <div className="md:col-span-8 space-y-8">
            <div className="grid gap-6 sm:grid-cols-2">
              <Card className="rounded-[2.5rem] border bg-primary text-primary-foreground shadow-2xl relative overflow-hidden group">
                <CardContent className="p-8 space-y-6">
                  <div className="p-3 rounded-2xl bg-white/10 w-fit">
                    <TrendingDown size={24} />
                  </div>
                  <div className="space-y-1.5">
                    <p className="text-[10px] font-black uppercase tracking-[0.2em] opacity-40">Total Burn Magnitude</p>
                    <h3 className="text-4xl font-black tracking-tightest">NPR {expenseSummary?.total?.toLocaleString() || 0}</h3>
                  </div>
                  <div className="absolute top-0 right-0 p-8 text-white opacity-[0.03] rotate-12 pointer-events-none group-hover:scale-110 transition-transform duration-1000">
                    <CreditCard size={180} />
                  </div>
                </CardContent>
              </Card>

              <div className="grid grid-cols-2 gap-4">
                {EXPENSE_TYPES.slice(0, 4).map((type) => (
                  <Card key={type.value} className="rounded-3xl border border-border/40 shadow-none bg-card/20 hover:bg-card/50 transition-all cursor-default group">
                    <CardContent className="p-6 space-y-4">
                      <div className="flex items-center justify-between">
                        <div className="p-2 rounded-xl bg-muted/40 group-hover:scale-110 transition-transform">{type.icon}</div>
                        <ArrowUpRight size={14} className="opacity-[0.05] group-hover:opacity-20 transition-opacity" />
                      </div>
                      <div>
                        <p className="text-[8px] font-black uppercase tracking-widest text-muted-foreground opacity-40 truncate">{type.label.split(' ')[0]}</p>
                        <h4 className="text-md font-black tracking-tightest mt-1">
                          NPR {(expenseSummary?.by_type?.[type.value as keyof typeof expenseSummary.by_type] || 0).toLocaleString()}
                        </h4>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>

            {/* Ledger Table */}
            <div className="space-y-6">
              <div className="flex flex-col sm:flex-row items-center justify-between gap-6">
                <div className="relative w-full sm:w-80">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground opacity-30" />
                  <Input
                    placeholder="Scan ledger narratives..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="h-12 pl-11 text-xs font-bold rounded-2xl bg-card/60 border-none shadow-none ring-1 ring-border focus:ring-primary/10 transition-all"
                  />
                </div>

                <div className="flex items-center gap-2 overflow-x-auto pb-1 sm:pb-0 w-full sm:w-auto scrollbar-hide">
                  <Button
                    variant={typeFilter === "all" ? "secondary" : "ghost"}
                    size="sm"
                    onClick={() => setTypeFilter("all")}
                    className="h-9 text-[9px] font-black uppercase tracking-widest rounded-xl px-4"
                  >
                    All Entries
                  </Button>
                  {EXPENSE_TYPES.map(type => (
                    <Button
                      key={type.value}
                      variant={typeFilter === type.value ? "secondary" : "ghost"}
                      size="sm"
                      onClick={() => setTypeFilter(type.value)}
                      className="h-9 text-[9px] font-black uppercase tracking-widest rounded-xl px-4 whitespace-nowrap"
                    >
                      {type.label.split(' ')[0]}
                    </Button>
                  ))}
                </div>
              </div>

              <Card className="rounded-[2.5rem] border border-border/40 shadow-none bg-card/20 overflow-hidden">
                <Table>
                  <TableHeader className="bg-muted/10 border-b border-border/40">
                    <TableRow className="hover:bg-transparent border-none h-14">
                      <TableHead className="text-[9px] font-black uppercase tracking-widest px-8">Settlement Date</TableHead>
                      <TableHead className="text-[9px] font-black uppercase tracking-widest">Disbursement Narrative</TableHead>
                      <TableHead className="text-[9px] font-black uppercase tracking-widest">Classification</TableHead>
                      <TableHead className="text-[9px] font-black uppercase tracking-widest text-right px-8">Magnitude</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredExpenses.length > 0 ? (
                      filteredExpenses.map((expense) => {
                        const style = TYPE_STYLES[expense.type] || TYPE_STYLES.miscellaneous;
                        return (
                          <TableRow key={expense._id} className="hover:bg-primary/[0.02] transition-colors h-20 border-border/30">
                            <TableCell className="px-8 text-[10px] font-black tracking-widest text-muted-foreground uppercase opacity-40">
                              {format(new Date(expense.date), "MMM d, yyyy")}
                            </TableCell>
                            <TableCell>
                              <div className="max-w-[400px]">
                                <p className="text-xs font-bold leading-relaxed">{expense.description}</p>
                              </div>
                            </TableCell>
                            <TableCell>
                              <Badge variant="outline" className={`h-7 rounded-xl border-none shadow-none ring-1 px-3 text-[8px] font-black uppercase tracking-widest ${style.bg} ${style.text} ${style.ring}`}>
                                {EXPENSE_TYPES.find(t => t.value === expense.type)?.label.split(' ')[0]}
                              </Badge>
                            </TableCell>
                            <TableCell className="px-8 text-right">
                              <div className="space-y-0.5">
                                <p className="text-sm font-black tracking-tightest">NPR {expense.amount.toLocaleString()}</p>
                                <div className="text-[8px] font-black uppercase opacity-20 tracking-tighter">Verified</div>
                              </div>
                            </TableCell>
                          </TableRow>
                        );
                      })
                    ) : (
                      <TableRow>
                        <TableCell colSpan={4} className="h-60 text-center">
                          <div className="flex flex-col items-center gap-3 opacity-20">
                            <Search size={40} strokeWidth={1} />
                            <span className="text-[10px] font-black uppercase tracking-widest">Negligible Ledger Data</span>
                          </div>
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
