import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

// Generate upload URL
export const generateUploadUrl = mutation({
  handler: async (ctx) => {
    return await ctx.storage.generateUploadUrl();
  },
});

// Store file URL reference (if needed)
export const storeFileId = mutation({
  args: {
    storageId: v.id("_storage"),
  },
  handler: async (ctx, args) => {
    return {
      storageId: args.storageId,
      url: await ctx.storage.getUrl(args.storageId),
    };
  },
});

// Get file URL
export const getFileUrl = query({
  args: {
    storageId: v.id("_storage"),
  },
  handler: async (ctx, args) => {
    return await ctx.storage.getUrl(args.storageId);
  },
});
