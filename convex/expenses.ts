import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

// Get all expenses
export const list = query({
  handler: async (ctx) => {
    const expenses = await ctx.db.query("expenses").collect();
    return expenses;
  },
});

// Get expenses by type
export const getByType = query({
  args: { type: v.string() },
  handler: async (ctx, args) => {
    const expenses = await ctx.db
      .query("expenses")
      .withIndex("by_type", (q) => q.eq("type", args.type))
      .collect();
    return expenses;
  },
});

// Create expense
export const create = mutation({
  args: {
    type: v.string(),
    amount: v.number(),
    description: v.string(),
    date: v.number(),
    proof: v.optional(v.id("_storage")),
  },
  handler: async (ctx, args) => {
    const expenseId = await ctx.db.insert("expenses", {
      ...args,
      created_at: Date.now(),
    });

    return { success: true, expenseId };
  },
});

// Update expense
export const update = mutation({
  args: {
    expenseId: v.id("expenses"),
    type: v.optional(v.string()),
    amount: v.optional(v.number()),
    description: v.optional(v.string()),
    date: v.optional(v.number()),
    proof: v.optional(v.id("_storage")),
  },
  handler: async (ctx, args) => {
    const { expenseId, ...updates } = args;

    const expense = await ctx.db.get(expenseId);
    if (!expense) {
      throw new Error("Expense not found");
    }

    await ctx.db.patch(expenseId, updates);

    return { success: true };
  },
});

// Delete expense
export const remove = mutation({
  args: { expenseId: v.id("expenses") },
  handler: async (ctx, args) => {
    await ctx.db.delete(args.expenseId);
    return { success: true };
  },
});

// Get expense summary
export const getSummary = query({
  args: {},
  handler: async (ctx) => {
    const expenses = await ctx.db.query("expenses").collect();

    const totalExpenses = expenses.reduce((sum, e) => sum + e.amount, 0);

    const byType = {
      staff_salary: 0,
      advertising: 0,
      tools_and_software: 0,
      miscellaneous: 0,
    };

    expenses.forEach((expense) => {
      if (byType[expense.type as keyof typeof byType] !== undefined) {
        byType[expense.type as keyof typeof byType] += expense.amount;
      }
    });

    return {
      total: totalExpenses,
      by_type: byType,
    };
  },
});
