import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  // Users table - stores authentication and profile info
  users: defineTable({
    username: v.string(),
    password_hash: v.string(),
    role: v.string(), // "super_admin" or "staff"
    full_name: v.optional(v.string()),
    profile_picture: v.optional(v.id("_storage")),
    status: v.string(), // "active" or "disabled"
    created_at: v.number(),
  }).index("by_username", ["username"])
   .index("by_status", ["status"]),

  // Staff profiles - extended profile info for staff members
  staff_profiles: defineTable({
    user_id: v.id("users"),
    role_name: v.string(), // Job role (Content Creator, Digital Marketer, etc.)
    payment_method: v.string(), // "bank_transfer" or "digital_wallet"
    // Bank details
    bank_name: v.optional(v.string()),
    account_holder_name: v.optional(v.string()),
    account_number: v.optional(v.string()),
    bank_qr_code: v.optional(v.id("_storage")),
    // Wallet details
    wallet_name: v.optional(v.string()), // "Khalti" or "eSewa"
    wallet_number: v.optional(v.string()),
    wallet_qr_code: v.optional(v.id("_storage")),
    first_login_completed: v.boolean(),
  }).index("by_user_id", ["user_id"]),

  // Tasks table - stores project tasks
  tasks: defineTable({
    project_name: v.string(),
    client_name: v.string(),
    task_type: v.string(),
    deadline: v.number(), // timestamp
    received_date: v.number(), // timestamp
    total_budget: v.number(),
    payment_status: v.string(), // "pending", "partial", "paid"
    payment_received_amount: v.number(),
    remaining_amount: v.number(),
    income_status: v.string(), // "pending", "received", "partial"
    status: v.string(), // "pending", "in_progress", "completed"
    reference_files: v.optional(v.array(v.id("_storage"))),
    created_at: v.number(),
  }).index("by_status", ["status"])
   .index("by_created_at", ["created_at"]),

  // Task assignments - links tasks to staff members
  task_assignments: defineTable({
    task_id: v.id("tasks"),
    staff_id: v.id("users"),
    assigned_role: v.string(),
    assigned_salary: v.number(),
    payment_status: v.string(), // "pending", "paid"
    assigned_at: v.number(),
  }).index("by_task_id", ["task_id"])
   .index("by_staff_id", ["staff_id"])
   .index("by_payment_status", ["payment_status"]),

  // Payments - salary payments to staff
  payments: defineTable({
    staff_id: v.id("users"),
    amount: v.number(),
    payment_proof: v.optional(v.id("_storage")),
    status: v.string(), // "pending", "completed", "rejected"
    notes: v.optional(v.string()),
    created_at: v.number(),
    paid_at: v.optional(v.number()),
  }).index("by_staff_id", ["staff_id"])
   .index("by_status", ["status"])
   .index("by_created_at", ["created_at"]),

  // Expenses - business expenses
  expenses: defineTable({
    type: v.string(), // "staff_salary", "advertising", "tools_and_software", "miscellaneous", "tax"
    amount: v.number(),
    description: v.string(),
    date: v.number(), // timestamp
    proof: v.optional(v.id("_storage")),
    created_at: v.number(),
  }).index("by_type", ["type"])
   .index("by_date", ["date"])
   .index("by_created_at", ["created_at"]),

  // Taxes - tax assignments to tasks/projects
  taxes: defineTable({
    task_id: v.id("tasks"),
    project_name: v.string(),
    tax_type: v.string(), // "vat", "service_tax", "withholding_tax", "other"
    tax_amount: v.number(),
    tax_status: v.string(), // "pending", "paid"
    assigned_to: v.array(v.string()), // Array of staff IDs assigned to this tax
    description: v.optional(v.string()),
    due_date: v.number(), // timestamp
    paid_at: v.optional(v.number()), // timestamp
    proof: v.optional(v.id("_storage")),
    created_at: v.number(),
  }).index("by_status", ["tax_status"])
   .index("by_task_id", ["task_id"])
   .index("by_created_at", ["created_at"]),
});
