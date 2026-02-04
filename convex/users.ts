import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

// Simple hash function for passwords
async function hashPassword(password: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(password);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  return hashHex;
}

// Get all users (admin only)
export const list = query({
  handler: async (ctx) => {
    const users = await ctx.db.query("users").collect();
    return users.map(user => ({
      id: user._id,
      username: user.username,
      role: user.role,
      full_name: user.full_name,
      profile_picture: user.profile_picture,
      status: user.status,
      created_at: user.created_at,
    }));
  },
});

// Get all staff members (active and disabled)
export const listAllStaff = query({
  handler: async (ctx) => {
    const users = await ctx.db
      .query("users")
      .filter(q => q.eq(q.field("role"), "staff"))
      .collect();

    const result: any[] = [];
    for (const user of users) {
      const staffProfile = await ctx.db
        .query("staff_profiles")
        .withIndex("by_user_id", (q) => q.eq("user_id", user._id))
        .first();

      result.push({
        _id: user._id,
        username: user.username,
        full_name: user.full_name,
        profile_picture: user.profile_picture,
        role_name: staffProfile?.role_name || "Not assigned",
        payment_method: staffProfile?.payment_method || "Not set",
        status: user.status,
      });
    }

    return result;
  },
});

// Get active staff members (for task assignments)
export const listActiveStaff = query({
  handler: async (ctx) => {
    const users = await ctx.db
      .query("users")
      .withIndex("by_status", (q) => q.eq("status", "active"))
      .collect();

    const staffUsers = users.filter(user => user.role === "staff");

    const result: any[] = [];
    for (const user of staffUsers) {
      const staffProfile = await ctx.db
        .query("staff_profiles")
        .withIndex("by_user_id", (q) => q.eq("user_id", user._id))
        .first();

      result.push({
        _id: user._id,
        username: user.username,
        full_name: user.full_name,
        profile_picture: user.profile_picture,
        role_name: staffProfile?.role_name || "Not assigned",
        payment_method: staffProfile?.payment_method || "Not set",
        status: user.status,
      });
    }

    return result;
  },
});



// Create new user (admin only)
export const create = mutation({
  args: {
    username: v.string(),
    password: v.string(),
    full_name: v.string(),
    role: v.string(),
  },
  handler: async (ctx, args) => {
    // Check if username exists
    const existing = await ctx.db
      .query("users")
      .withIndex("by_username", (q) => q.eq("username", args.username))
      .first();

    if (existing) {
      throw new Error("Username already exists");
    }

    const password_hash = await hashPassword(args.password);

    const userId = await ctx.db.insert("users", {
      username: args.username,
      password_hash,
      role: args.role,
      full_name: args.full_name,
      status: "active",
      created_at: Date.now(),
    });

    return { success: true, userId };
  },
});

// Update user
export const update = mutation({
  args: {
    userId: v.id("users"),
    username: v.optional(v.string()),
    password: v.optional(v.string()),
    full_name: v.optional(v.string()),
    status: v.optional(v.string()),
    role: v.optional(v.string()),
    profile_picture: v.optional(v.id("_storage")),
  },
  handler: async (ctx, args) => {
    const { userId, password, ...updates } = args;

    const user = await ctx.db.get(userId);
    if (!user) {
      throw new Error("User not found");
    }

    const patch: any = { ...updates };

    if (password) {
      patch.password_hash = await hashPassword(password);
    }

    if (updates.username && updates.username !== user.username) {
      const existing = await ctx.db
        .query("users")
        .withIndex("by_username", (q) => q.eq("username", updates.username!))
        .first();
      if (existing) throw new Error("Username already taken");
    }

    await ctx.db.patch(userId, patch);

    return { success: true };
  },
});

// Disable user
export const disable = mutation({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    const user = await ctx.db.get(args.userId);
    if (!user) {
      throw new Error("User not found");
    }

    if (user.role === "super_admin") {
      throw new Error("Cannot disable super admin");
    }

    await ctx.db.patch(args.userId, { status: "disabled" });

    return { success: true };
  },
});

// Update staff profile
export const updateStaffProfile = mutation({
  args: {
    user_id: v.id("users"),
    role_name: v.string(),
    payment_method: v.string(),
    bank_name: v.optional(v.string()),
    account_holder_name: v.optional(v.string()),
    account_number: v.optional(v.string()),
    bank_qr_code: v.optional(v.id("_storage")),
    wallet_name: v.optional(v.string()),
    wallet_number: v.optional(v.string()),
    wallet_qr_code: v.optional(v.id("_storage")),
  },
  handler: async (ctx, args) => {
    // Check if profile exists
    const existingProfile = await ctx.db
      .query("staff_profiles")
      .withIndex("by_user_id", (q) => q.eq("user_id", args.user_id))
      .first();

    const profileData = {
      user_id: args.user_id,
      role_name: args.role_name,
      payment_method: args.payment_method,
      bank_name: args.bank_name,
      account_holder_name: args.account_holder_name,
      account_number: args.account_number,
      bank_qr_code: args.bank_qr_code,
      wallet_name: args.wallet_name,
      wallet_number: args.wallet_number,
      wallet_qr_code: args.wallet_qr_code,
      first_login_completed: true,
    };

    if (existingProfile) {
      await ctx.db.patch(existingProfile._id, profileData);
    } else {
      await ctx.db.insert("staff_profiles", profileData);
    }

    return { success: true };
  },
});

// Get staff profile
export const getStaffProfile = query({
  args: { user_id: v.id("users") },
  handler: async (ctx, args) => {
    const profile = await ctx.db
      .query("staff_profiles")
      .withIndex("by_user_id", (q) => q.eq("user_id", args.user_id))
      .first();
    return profile;
  },
});
