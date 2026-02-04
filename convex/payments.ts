import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

// Get all payments
export const list = query({
  handler: async (ctx) => {
    const payments = await ctx.db.query("payments").collect();

    const result: any[] = [];
    for (const payment of payments) {
      const staff = await ctx.db.get(payment.staff_id);
      const staffProfile = await ctx.db
        .query("staff_profiles")
        .withIndex("by_user_id", (q) => q.eq("user_id", payment.staff_id))
        .first();

      // Unified profile for the frontend - merging User + Profile details
      const enrichedProfile = {
        ...(staffProfile || {}),
        full_name: staff?.full_name,
        username: staff?.username,
        profile_picture: staff?.profile_picture,
        // Ensure defaults if record is missing
        payment_method: staffProfile?.payment_method || "bank_transfer",
        role_name: staffProfile?.role_name || "Staff",
      };

      result.push({
        ...payment,
        staff_name: staff?.full_name || "Unknown Identity",
        staff_username: staff?.username,
        staff_profile: enrichedProfile,
      });
    }

    return result;
  },
});

// Get pending payments
export const getPendingPayments = query({
  handler: async (ctx) => {
    const payments = await ctx.db
      .query("payments")
      .filter((q) => q.or(
        q.eq(q.field("status"), "pending"),
        q.eq(q.field("status"), "payout_requested")
      ))
      .collect();

    const result: any[] = [];
    for (const payment of payments) {
      const staff = await ctx.db.get(payment.staff_id);
      const staffProfile = await ctx.db
        .query("staff_profiles")
        .withIndex("by_user_id", (q) => q.eq("user_id", payment.staff_id))
        .first();

      const enrichedProfile = {
        ...(staffProfile || {}),
        full_name: staff?.full_name,
        username: staff?.username,
        profile_picture: staff?.profile_picture,
        payment_method: staffProfile?.payment_method || "bank_transfer",
        role_name: staffProfile?.role_name || "Staff",
      };

      result.push({
        ...payment,
        staff_name: staff?.full_name || "Unknown Identity",
        staff_username: staff?.username,
        staff_profile: enrichedProfile,
      });
    }

    return result;
  },
});

// Get payments for a specific staff member
export const getStaffPayments = query({
  args: { staff_id: v.id("users") },
  handler: async (ctx, args) => {
    const payments = await ctx.db
      .query("payments")
      .withIndex("by_staff_id", (q) => q.eq("staff_id", args.staff_id))
      .collect();

    return payments.sort((a, b) => b.created_at - a.created_at);
  },
});

// Request payout (consolidates all 'pending' task payments into one request)
export const requestPayout = mutation({
  args: { staff_id: v.id("users") },
  handler: async (ctx, args) => {
    const pendingPayments = await ctx.db
      .query("payments")
      .withIndex("by_staff_id", (q) => q.eq("staff_id", args.staff_id))
      .filter((q) => q.eq(q.field("status"), "pending"))
      .collect();

    if (pendingPayments.length === 0) {
      throw new Error("No pending payments available");
    }

    const totalAmount = pendingPayments.reduce((sum, p) => sum + p.amount, 0);

    if (totalAmount < 100) {
      throw new Error("Minimum payout amount is NPR 100");
    }

    // Delete individual pending records
    for (const p of pendingPayments) {
      await ctx.db.delete(p._id);
    }

    // Create a consolidated payout request
    const payoutId = await ctx.db.insert("payments", {
      staff_id: args.staff_id,
      amount: totalAmount,
      status: "payout_requested",
      created_at: Date.now(),
      notes: "Payout Request",
    });

    return { success: true, payoutId, amount: totalAmount };
  },
});

// Process payment (upload proof and mark as completed)
export const processPayment = mutation({
  args: {
    paymentId: v.id("payments"),
    payment_proof: v.optional(v.id("_storage")),
    notes: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const payment = await ctx.db.get(args.paymentId);
    if (!payment) {
      throw new Error("Payment not found");
    }

    // Update payment status
    await ctx.db.patch(args.paymentId, {
      status: "completed",
      payment_proof: args.payment_proof,
      notes: args.notes || payment.notes,
      paid_at: Date.now(),
    });

    // Update all related task assignments for this staff to paid status 
    // (This is a simplified approach, marking all as paid since we consolidated)
    const taskAssignments = await ctx.db
      .query("task_assignments")
      .withIndex("by_staff_id", (q) => q.eq("staff_id", payment.staff_id))
      .filter(q => q.or(
        q.eq(q.field("payment_status"), "pending"),
        q.eq(q.field("payment_status"), "partial")
      ))
      .collect();

    for (const assignment of taskAssignments) {
      await ctx.db.patch(assignment._id, {
        payment_status: "paid",
      });
    }

    // Add to expenses as staff salary
    await ctx.db.insert("expenses", {
      type: "staff_salary",
      amount: payment.amount,
      description: `Staff salary payment for ${payment.staff_id}`,
      date: Date.now(),
      created_at: Date.now(),
    });

    return { success: true, message: "Payment processed successfully" };
  },
});

// Get staff payment summary
export const getStaffSummary = query({
  args: { staff_id: v.id("users") },
  handler: async (ctx, args) => {
    // Get all payments for this staff member
    const payments = await ctx.db
      .query("payments")
      .withIndex("by_staff_id", (q) => q.eq("staff_id", args.staff_id))
      .collect();

    const totalPaid = payments
      .filter(p => p.status === "completed")
      .reduce((sum, p) => sum + p.amount, 0);

    const pendingPayments = payments.filter(p => p.status === "pending");
    const pendingAmount = pendingPayments.reduce((sum, p) => sum + p.amount, 0);

    const requestedPayments = payments.filter(p => p.status === "payout_requested");
    const requestedAmount = requestedPayments.reduce((sum, p) => sum + p.amount, 0);

    // Get task assignments for earnings
    const assignments = await ctx.db
      .query("task_assignments")
      .withIndex("by_staff_id", (q) => q.eq("staff_id", args.staff_id))
      .collect();

    const totalEarned = assignments.reduce((sum, a) => sum + a.assigned_salary, 0);

    return {
      total_earned: totalEarned,
      total_paid: totalPaid,
      pending_payment: pendingAmount,
      requested_payment: requestedAmount,
    };
  },
});

// Reject payment
export const rejectPayment = mutation({
  args: {
    paymentId: v.id("payments"),
    notes: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const payment = await ctx.db.get(args.paymentId);
    if (!payment) {
      throw new Error("Payment not found");
    }

    await ctx.db.patch(args.paymentId, {
      status: "rejected",
      notes: args.notes,
    });

    return { success: true };
  },
});
// Update payment status directly (admin only)
export const patchStatus = mutation({
  args: {
    paymentId: v.id("payments"),
    status: v.string(),
  },
  handler: async (ctx, args) => {
    const payment = await ctx.db.get(args.paymentId);
    if (!payment) {
      throw new Error("Payment not found");
    }

    await ctx.db.patch(args.paymentId, {
      status: args.status,
    });

    return { success: true };
  },
});
