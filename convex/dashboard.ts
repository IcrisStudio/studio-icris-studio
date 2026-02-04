import { query } from "./_generated/server";
import { v } from "convex/values";

const getTimeFilter = (range: string) => {
  const now = Date.now();
  if (range === "7d") return now - 7 * 24 * 60 * 60 * 1000;
  if (range === "30d") return now - 30 * 24 * 60 * 60 * 1000;
  if (range === "90d") return now - 90 * 24 * 60 * 60 * 1000;
  if (range === "12m") return now - 365 * 24 * 60 * 60 * 1000;
  return 0; // All time
};

// Get dashboard metrics (admin only)
export const getMetrics = query({
  args: { timeRange: v.optional(v.string()) },
  handler: async (ctx, args) => {
    const minTime = getTimeFilter(args.timeRange || "all");

    // Get all tasks
    let tasks = await ctx.db.query("tasks").collect();
    if (minTime > 0) {
      tasks = tasks.filter(t => t.created_at >= minTime);
    }

    // Get all task assignments
    let assignments = await ctx.db.query("task_assignments").collect();
    if (minTime > 0) {
      assignments = assignments.filter(a => a.assigned_at >= minTime);
    }

    // Calculate income from tasks (actual received cash)
    const totalIncome = tasks.reduce((sum, task) => {
      // Prioritize "paid" or "received" as full budget received
      if (task.payment_status === "paid" || task.income_status === "received") {
        return sum + (task.total_budget || 0);
      } else if (task.payment_status === "partial" || task.income_status === "partial") {
        return sum + (task.payment_received_amount || 0);
      }
      return sum;
    }, 0);

    const pendingIncome = tasks.reduce((sum, task) => {
      if (task.payment_status === "pending" || task.income_status === "pending") {
        return sum + (task.total_budget || 0);
      } else if (task.payment_status === "partial" || task.income_status === "partial") {
        return sum + (task.remaining_amount || 0);
      }
      return sum;
    }, 0);

    // Calculate salary metrics from assignments
    const taskPaymentsPaid = assignments.filter(a => a.payment_status === "paid").reduce((sum, a) => sum + (a.assigned_salary || 0), 0);
    const taskPaymentsPending = assignments.filter(a => a.payment_status === "pending").reduce((sum, a) => sum + (a.assigned_salary || 0), 0);

    // Get all expenses
    let expenses = await ctx.db.query("expenses").collect();
    if (minTime > 0) {
      expenses = expenses.filter(e => e.date >= minTime);
    }
    const totalExpenses = expenses.reduce((sum, e) => sum + e.amount, 0);

    // Get staff payments from ledger
    let payments = await ctx.db.query("payments").collect();
    if (minTime > 0) {
      payments = payments.filter(p => p.created_at >= minTime);
    }
    const completedPayments = payments.filter(p => p.status === "completed");
    const requestedPayments = payments.filter(p => p.status === "payout_requested");
    const pendingPayments = payments.filter(p => p.status === "pending");

    const totalPaidOut = completedPayments.reduce((sum, p) => sum + p.amount, 0);
    const requestedPaymentsAmount = requestedPayments.reduce((sum, p) => sum + p.amount, 0);
    const pendingPaymentsAmount = pendingPayments.reduce((sum, p) => sum + p.amount, 0);

    // Net retained is actual received revenue minus all operational costs (including settled salaries)
    const netProfit = totalIncome - totalExpenses;

    return {
      total_income: totalIncome,
      pending_income: pendingIncome,
      total_expenses: totalExpenses,
      net_profit: netProfit,
      task_payments_paid: taskPaymentsPaid,
      task_payments_pending: taskPaymentsPending,
      pending_staff_payments: pendingPaymentsAmount,
      requested_staff_payments: requestedPaymentsAmount,
      completed_staff_payments: totalPaidOut,
      total_tasks: tasks.length,
      completed_tasks: tasks.filter(t => t.status === "completed").length,
      in_progress_tasks: tasks.filter(t => t.status === "in_progress").length,
      pending_tasks: tasks.filter(t => t.status === "pending").length,
    };
  },
});

// Get monthly income vs expenses data
export const getMonthlyData = query({
  args: { timeRange: v.optional(v.string()) },
  handler: async (ctx, args) => {
    const minTime = getTimeFilter(args.timeRange || "12m");

    let tasks = await ctx.db.query("tasks").collect();
    let expenses = await ctx.db.query("expenses").collect();

    if (minTime > 0) {
      tasks = tasks.filter(t => t.received_date >= minTime || t.created_at >= minTime);
      expenses = expenses.filter(e => e.date >= minTime);
    }

    const monthlyData: Record<string, { income: number; expenses: number; timestamp: number }> = {};

    tasks.forEach(task => {
      const date = new Date(task.received_date || task.created_at);
      const monthLabel = date.toLocaleString("default", {
        year: "numeric",
        month: "short",
      });
      const timestamp = new Date(date.getFullYear(), date.getMonth(), 1).getTime();

      if (!monthlyData[monthLabel]) {
        monthlyData[monthLabel] = { income: 0, expenses: 0, timestamp };
      }

      if (task.payment_status === "paid" || task.income_status === "received") {
        monthlyData[monthLabel].income += (task.total_budget || 0);
      } else if (task.payment_status === "partial" || task.income_status === "partial") {
        monthlyData[monthLabel].income += (task.payment_received_amount || 0);
      }
    });

    expenses.forEach(expense => {
      const date = new Date(expense.date);
      const monthLabel = date.toLocaleString("default", {
        year: "numeric",
        month: "short",
      });
      const timestamp = new Date(date.getFullYear(), date.getMonth(), 1).getTime();

      if (!monthlyData[monthLabel]) {
        monthlyData[monthLabel] = { income: 0, expenses: 0, timestamp };
      }

      monthlyData[monthLabel].expenses += expense.amount;
    });

    return Object.entries(monthlyData)
      .map(([month, data]) => ({
        month,
        ...data,
      }))
      .sort((a, b) => a.timestamp - b.timestamp);
  },
});

// Get staff payment distribution
export const getStaffPaymentDistribution = query({
  args: { timeRange: v.optional(v.string()) },
  handler: async (ctx, args) => {
    const minTime = getTimeFilter(args.timeRange || "all");

    let payments = await ctx.db.query("payments").collect();
    if (minTime > 0) {
      payments = payments.filter(p => p.created_at >= minTime);
    }

    const result: Record<string, number> = {};
    for (const payment of payments) {
      const staff = await ctx.db.get(payment.staff_id);
      const staffName = staff?.full_name || "Unknown";

      if (!result[staffName]) {
        result[staffName] = 0;
      }

      result[staffName] += payment.amount;
    }

    return Object.entries(result)
      .map(([name, amount]) => ({
        name,
        amount,
      }))
      .sort((a, b) => b.amount - a.amount);
  },
});
