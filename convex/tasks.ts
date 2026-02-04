import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

// Get all tasks
export const list = query({
  handler: async (ctx) => {
    const tasks = await ctx.db.query("tasks").withIndex("by_created_at").order("desc").collect();
    return tasks;
  },
});

// Get task by ID with assignments
export const getById = query({
  args: { taskId: v.id("tasks") },
  handler: async (ctx, args) => {
    const task = await ctx.db.get(args.taskId);
    if (!task) {
      return null;
    }

    const assignments = await ctx.db
      .query("task_assignments")
      .withIndex("by_task_id", (q) => q.eq("task_id", task._id))
      .collect();

    const enrichedAssignments: any[] = [];
    for (const assignment of assignments) {
      const staff = await ctx.db.get(assignment.staff_id);
      enrichedAssignments.push({
        ...assignment,
        staff_name: staff?.full_name,
        staff_username: staff?.username,
      });
    }

    return {
      ...task,
      assignments: enrichedAssignments,
    };
  },
});

// Get tasks for a specific staff member
export const getStaffTasks = query({
  args: { staff_id: v.id("users") },
  handler: async (ctx, args) => {
    const assignments = await ctx.db
      .query("task_assignments")
      .withIndex("by_staff_id", (q) => q.eq("staff_id", args.staff_id))
      .collect();

    const tasks: any[] = [];
    for (const assignment of assignments) {
      const task = await ctx.db.get(assignment.task_id);
      if (task) {
        tasks.push({
          ...task,
          assignment_id: assignment._id,
          assigned_role: assignment.assigned_role,
          assigned_salary: assignment.assigned_salary,
          payment_status: assignment.payment_status,
        });
      }
    }

    return tasks;
  },
});

// Create new task
export const create = mutation({
  args: {
    project_name: v.string(),
    client_name: v.string(),
    task_type: v.string(),
    deadline: v.number(),
    received_date: v.number(),
    total_budget: v.number(),
    payment_status: v.string(),
    payment_received_amount: v.number(),
    remaining_amount: v.number(),
    income_status: v.string(),
    reference_files: v.optional(v.array(v.id("_storage"))),
  },
  handler: async (ctx, args) => {
    const taskId = await ctx.db.insert("tasks", {
      ...args,
      status: "pending",
      created_at: Date.now(),
    });

    return { success: true, taskId };
  },
});

// Update task
export const update = mutation({
  args: {
    taskId: v.id("tasks"),
    project_name: v.optional(v.string()),
    client_name: v.optional(v.string()),
    task_type: v.optional(v.string()),
    deadline: v.optional(v.number()),
    received_date: v.optional(v.number()),
    total_budget: v.optional(v.number()),
    payment_status: v.optional(v.string()),
    payment_received_amount: v.optional(v.number()),
    remaining_amount: v.optional(v.number()),
    income_status: v.optional(v.string()),
    status: v.optional(v.string()),
    reference_files: v.optional(v.array(v.id("_storage"))),
  },
  handler: async (ctx, args) => {
    const { taskId, ...updates } = args;

    const task = await ctx.db.get(taskId);
    if (!task) {
      throw new Error("Task not found");
    }

    await ctx.db.patch(taskId, updates);

    return { success: true };
  },
});

// Assign staff to task
export const assignStaff = mutation({
  args: {
    task_id: v.id("tasks"),
    staff_id: v.id("users"),
    assigned_role: v.string(),
    assigned_salary: v.number(),
  },
  handler: async (ctx, args) => {
    await ctx.db.insert("task_assignments", {
      task_id: args.task_id,
      staff_id: args.staff_id,
      assigned_role: args.assigned_role,
      assigned_salary: args.assigned_salary,
      payment_status: "pending",
      assigned_at: Date.now(),
    });

    // Update task status to in_progress if assigned
    const task = await ctx.db.get(args.task_id);
    if (task && task.status === "pending") {
      await ctx.db.patch(args.task_id, { status: "in_progress" });
    }

    return { success: true };
  },
});

// Remove staff assignment
export const removeAssignment = mutation({
  args: { assignmentId: v.id("task_assignments") },
  handler: async (ctx, args) => {
    await ctx.db.delete(args.assignmentId);
    return { success: true };
  },
});

async function internalMarkCompleted(ctx: any, taskId: any) {
  const task = await ctx.db.get(taskId);
  if (!task) throw new Error("Task not found");

  // Update task status
  await ctx.db.patch(taskId, { status: "completed" });

  // Create payment records for all assigned staff
  const assignments = await ctx.db
    .query("task_assignments")
    .withIndex("by_task_id", (q) => q.eq("task_id", taskId))
    .collect();

  for (const assignment of assignments) {
    if (assignment.payment_status === "pending") {
      await ctx.db.insert("payments", {
        staff_id: assignment.staff_id,
        amount: assignment.assigned_salary,
        status: "pending",
        created_at: Date.now(),
      });
    }
  }
  return { success: true };
}

// Mark task as completed (adds salaries to pending payments)
export const markCompleted = mutation({
  args: { taskId: v.id("tasks") },
  handler: async (ctx, args) => {
    return await internalMarkCompleted(ctx, args.taskId);
  },
});

// Update task status
export const updateStatus = mutation({
  args: {
    taskId: v.id("tasks"),
    status: v.string(), // pending, in_progress, completed
  },
  handler: async (ctx, args) => {
    const task = await ctx.db.get(args.taskId);
    if (!task) throw new Error("Task not found");

    if (args.status === "completed") {
      // Use the existing markCompleted logic if finishing
      return await internalMarkCompleted(ctx, args.taskId);
    }

    await ctx.db.patch(args.taskId, { status: args.status });
    return { success: true };
  },
});

// Delete task
export const remove = mutation({
  args: { taskId: v.id("tasks") },
  handler: async (ctx, args) => {
    const assignments = await ctx.db
      .query("task_assignments")
      .withIndex("by_task_id", (q) => q.eq("task_id", args.taskId))
      .collect();

    // Delete all assignments first
    for (const assignment of assignments) {
      await ctx.db.delete(assignment._id);
    }

    // Delete the task
    await ctx.db.delete(args.taskId);

    return { success: true };
  },
});
