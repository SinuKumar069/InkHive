import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { getAuthUserId } from "./auth";

const platformValidator = v.union(
  v.literal("twitter"),
  v.literal("linkedin"),
  v.literal("facebook"),
  v.literal("instagram"),
);

const statusValidator = v.union(
  v.literal("connected"),
  v.literal("expired"),
  v.literal("error"),
  v.literal("disconnected"),
);

export const listMyConnections = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      return [];
    }

    const rows = await ctx.db
      .query("connectedAccounts")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .collect();

    return rows.map((row) => ({
      _id: row._id,
      _creationTime: row._creationTime,
      userId: row.userId,
      platform: row.platform,
      status: row.status,
      accountName: row.accountName,
      accountId: row.accountId,
      scopes: row.scopes,
      tokenExpiresAt: row.tokenExpiresAt,
      metadata: row.metadata,
      lastError: row.lastError,
      lastSyncedAt: row.lastSyncedAt,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
    }));
  },
});

export const getMyConnection = query({
  args: { platform: platformValidator },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      return null;
    }

    const row =
      (await ctx.db
        .query("connectedAccounts")
        .withIndex("by_user_and_platform", (q) =>
          q.eq("userId", userId).eq("platform", args.platform),
        )
        .first()) ?? null;

    if (!row) {
      return null;
    }

    return {
      _id: row._id,
      _creationTime: row._creationTime,
      userId: row.userId,
      platform: row.platform,
      status: row.status,
      accountName: row.accountName,
      accountId: row.accountId,
      scopes: row.scopes,
      tokenExpiresAt: row.tokenExpiresAt,
      metadata: row.metadata,
      lastError: row.lastError,
      lastSyncedAt: row.lastSyncedAt,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
    };
  },
});

export const upsertConnectionFromOAuth = mutation({
  args: {
    platform: platformValidator,
    status: statusValidator,
    accountName: v.optional(v.string()),
    accountId: v.optional(v.string()),
    encryptedAccessToken: v.optional(v.string()),
    encryptedRefreshToken: v.optional(v.string()),
    tokenExpiresAt: v.optional(v.number()),
    scopes: v.array(v.string()),
    metadata: v.optional(v.string()),
    lastError: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error("Unauthorized");
    }

    const now = Date.now();
    const existing = await ctx.db
      .query("connectedAccounts")
      .withIndex("by_user_and_platform", (q) =>
        q.eq("userId", userId).eq("platform", args.platform),
      )
      .first();

    const patch = {
      status: args.status,
      scopes: args.scopes,
      lastSyncedAt: now,
      updatedAt: now,
      ...(args.accountName !== undefined
        ? { accountName: args.accountName }
        : {}),
      ...(args.accountId !== undefined ? { accountId: args.accountId } : {}),
      ...(args.encryptedAccessToken !== undefined
        ? { encryptedAccessToken: args.encryptedAccessToken }
        : {}),
      ...(args.encryptedRefreshToken !== undefined
        ? { encryptedRefreshToken: args.encryptedRefreshToken }
        : {}),
      ...(args.tokenExpiresAt !== undefined
        ? { tokenExpiresAt: args.tokenExpiresAt }
        : {}),
      ...(args.metadata !== undefined ? { metadata: args.metadata } : {}),
      ...(args.lastError !== undefined ? { lastError: args.lastError } : {}),
    };

    if (existing) {
      await ctx.db.patch(existing._id, patch);
      return existing._id;
    }

    return await ctx.db.insert("connectedAccounts", {
      userId,
      platform: args.platform,
      ...patch,
      createdAt: now,
    });
  },
});

export const disconnectConnection = mutation({
  args: {
    platform: platformValidator,
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error("Unauthorized");
    }

    const existing = await ctx.db
      .query("connectedAccounts")
      .withIndex("by_user_and_platform", (q) =>
        q.eq("userId", userId).eq("platform", args.platform),
      )
      .first();

    if (!existing) {
      return null;
    }

    await ctx.db.patch(existing._id, {
      status: "disconnected",
      lastError: "Disconnected by user",
      updatedAt: Date.now(),
    });

    return existing._id;
  },
});

export const markConnectionError = mutation({
  args: {
    platform: platformValidator,
    message: v.string(),
    status: v.optional(v.union(v.literal("expired"), v.literal("error"))),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error("Unauthorized");
    }

    const existing = await ctx.db
      .query("connectedAccounts")
      .withIndex("by_user_and_platform", (q) =>
        q.eq("userId", userId).eq("platform", args.platform),
      )
      .first();

    if (!existing) {
      return null;
    }

    await ctx.db.patch(existing._id, {
      status: args.status ?? "error",
      lastError: args.message,
      updatedAt: Date.now(),
    });

    return existing._id;
  },
});

export const getConnectionByUserAndPlatform = query({
  args: {
    userId: v.string(),
    platform: platformValidator,
  },
  handler: async (ctx, args) => {
    return (
      (await ctx.db
        .query("connectedAccounts")
        .withIndex("by_user_and_platform", (q) =>
          q.eq("userId", args.userId).eq("platform", args.platform),
        )
        .first()) ?? null
    );
  },
});

export const upsertConnectionTokensByUserAndPlatform = mutation({
  args: {
    userId: v.string(),
    platform: platformValidator,
    status: statusValidator,
    encryptedAccessToken: v.optional(v.string()),
    encryptedRefreshToken: v.optional(v.string()),
    tokenExpiresAt: v.optional(v.number()),
    lastError: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("connectedAccounts")
      .withIndex("by_user_and_platform", (q) =>
        q.eq("userId", args.userId).eq("platform", args.platform),
      )
      .first();

    if (!existing) {
      return null;
    }

    await ctx.db.patch(existing._id, {
      status: args.status,
      lastSyncedAt: Date.now(),
      updatedAt: Date.now(),
      ...(args.encryptedAccessToken !== undefined
        ? { encryptedAccessToken: args.encryptedAccessToken }
        : {}),
      ...(args.encryptedRefreshToken !== undefined
        ? { encryptedRefreshToken: args.encryptedRefreshToken }
        : {}),
      ...(args.tokenExpiresAt !== undefined
        ? { tokenExpiresAt: args.tokenExpiresAt }
        : {}),
      ...(args.lastError !== undefined ? { lastError: args.lastError } : {}),
    });

    return existing._id;
  },
});
