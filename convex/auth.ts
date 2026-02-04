import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

// Simple hash function for passwords (in production, use bcrypt or similar)
async function hashPassword(password: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(password);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  return hashHex;
}

// Login mutation
export const login = mutation({
  args: {
    username: v.string(),
    password: v.string(),
  },
  handler: async (ctx, args) => {
    const user = await ctx.db
      .query("users")
      .withIndex("by_username", (q) => q.eq("username", args.username))
      .first();

    if (!user) {
      throw new Error("Invalid username or password");
    }

    if (user.status === "disabled") {
      throw new Error("Account is disabled");
    }

    const password_hash = await hashPassword(args.password);

    if (user.password_hash !== password_hash) {
      throw new Error("Invalid username or password");
    }

    // Get staff profile if exists
    let staffProfile = null;
    if (user.role === "staff") {
      staffProfile = await ctx.db
        .query("staff_profiles")
        .withIndex("by_user_id", (q) => q.eq("user_id", user._id))
        .first();
    }

    return {
      user: {
        id: user._id,
        username: user.username,
        role: user.role,
        full_name: user.full_name,
        profile_picture: user.profile_picture,
        status: user.status,
      },
      staffProfile,
      firstLoginRequired: user.role === "staff" && (!staffProfile || !staffProfile.first_login_completed),
    };
  },
});

// Create default admin account
export const createDefaultAdmin = mutation({
  handler: async (ctx) => {
    // Check if admin already exists
    const existingAdmin = await ctx.db
      .query("users")
      .withIndex("by_username", (q) => q.eq("username", "admin@icrisstudio.com"))
      .first();

    if (existingAdmin) {
      return { success: false, message: "Admin already exists" };
    }

    const password_hash = await hashPassword("admin");

    const adminId = await ctx.db.insert("users", {
      username: "admin@icrisstudio.com",
      password_hash,
      role: "super_admin",
      full_name: "Super Admin",
      status: "active",
      created_at: Date.now(),
    });

    return { success: true, adminId };
  },
});

// Get current user (for session management)
export const getCurrentUser = query({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    const user = await ctx.db.get(args.userId);
    if (!user) {
      return null;
    }

    let staffProfile = null;
    if (user.role === "staff") {
      staffProfile = await ctx.db
        .query("staff_profiles")
        .withIndex("by_user_id", (q) => q.eq("user_id", user._id))
        .first();
    }

    return {
      id: user._id,
      username: user.username,
      role: user.role,
      full_name: user.full_name,
      profile_picture: user.profile_picture,
      status: user.status,
      staffProfile,
      firstLoginRequired: user.role === "staff" && (!staffProfile || !staffProfile.first_login_completed),
    };
  },
});
