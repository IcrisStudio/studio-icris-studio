import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

// Get all taxes
export const list = query({
  handler: async (ctx) => {
    const taxes = await ctx.db.query("taxes").collect();

    const result = [];
    for (const tax of taxes) {
      const task = await ctx.db.get(tax.task_id);
      result.push({
        ...tax,
        project_name: task?.project_name,
        client_name: task?.client_name,
      });
    }

    return result;
  },
});

// Get taxes for a specific task
export const getByTaskId = query({
  args: { task_id: v.id("tasks") },
  handler: async (ctx, args) => {
    const taxes = await ctx.db
      .query("taxes")
      .withIndex("by_task_id", (q) => q.eq("task_id", args.task_id))
      .collect();

    return taxes;
  },
});

// Get pending taxes
export const getPendingTaxes = query({
  handler: async (ctx) => {
    const taxes = await ctx.db
      .query("taxes")
      .withIndex("by_status", (q) => q.eq("tax_status", "pending"))
      .collect();

    const result = [];
    for (const tax of taxes) {
      const task = await ctx.db.get(tax.task_id);
      result.push({
        ...tax,
        project_name: task?.project_name,
        client_name: task?.client_name,
      });
    }

    return result;
  },
});

// Create new tax
export const create = mutation({
  args: {
    task_id: v.id("tasks"),
    project_name: v.string(),
    tax_type: v.string(),
    tax_amount: v.number(),
    assigned_to: v.array(v.id("users")),
    description: v.optional(v.string()),
    due_date: v.number(),
  },
  handler: async (ctx, args) => {
    // Validate task exists
    const task = await ctx.db.get(args.task_id);
    if (!task) {
      throw new Error("Task not found");
    }

    const taxId = await ctx.db.insert("taxes", {
      task_id: args.task_id,
      project_name: args.project_name,
      tax_type: args.tax_type,
      tax_amount: args.tax_amount,
      tax_status: "pending",
      assigned_to: args.assigned_to,
      description: args.description || "",
      due_date: args.due_date || Date.now() + (30 * 24 * 60 * 60 * 1000), // Default 30 days
      created_at: Date.now(),
    });

    return { success: true, taxId };
  },
});

// Update tax (assign to staff or mark as paid)
export const update = mutation({
  args: {
    taxId: v.id("taxes"),
    assigned_to: v.optional(v.array(v.id("users"))),
    tax_status: v.optional(v.string()),
    paid_at: v.optional(v.number()),
    proof: v.optional(v.id("_storage")),
    notes: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const tax = await ctx.db.get(args.taxId);
    if (!tax) {
      throw new Error("Tax not found");
    }

    const updates: any = {};
    if (args.assigned_to) updates.assigned_to = args.assigned_to;
    if (args.tax_status) updates.tax_status = args.tax_status;
    if (args.paid_at) updates.paid_at = args.paid_at;
    if (args.proof) updates.proof = args.proof;
    if (args.notes) updates.notes = args.notes;

    await ctx.db.patch(args.taxId, updates);

    return { success: true };
  },
});

// Delete tax
export const remove = mutation({
  args: { taxId: v.id("taxes") },
  handler: async (ctx, args) => {
    await ctx.db.delete(args.taxId);
    return { success: true };
  },
});

// Get tax summary
export const getTaxSummary = query({
  handler: async (ctx) => {
    const taxes = await ctx.db.query("taxes").collect();

    const totalPending = taxes
      .filter(t => t.tax_status === "pending")
      .reduce((sum, t) => sum + t.tax_amount, 0);

    const totalPaid = taxes
      .filter(t => t.tax_status === "paid")
      .reduce((sum, t) => sum + t.tax_amount, 0);

    const pendingCount = taxes.filter(t => t.tax_status === "pending").length;
    const paidCount = taxes.filter(t => t.tax_status === "paid").length;

    return {
      total_pending: totalPending,
      total_paid: totalPaid,
      pending_count: pendingCount,
      paid_count: paidCount,
      total_taxes: taxes.length,
    };
  },
});
