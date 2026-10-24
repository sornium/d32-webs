import { prisma } from "./db.js";

export interface DiscordUserProfile {
  discordId: string;
  username: string;
  displayName: string;
  globalName?: string | null;
  avatarUrl: string | null;
  inServer?: boolean;
}

export interface DiscordMemberCache {
  username: string;
  displayName: string;
  globalName?: string;
  avatarUrl: string | null;
  inServer: boolean;
}

// In-memory simulation cache for fallback when external networks/tokens are absent
export const discordMemberCache: { [discordId: string]: DiscordMemberCache } = {
  "123456789": {
    username: "adam.k",
    displayName: "Adam K.",
    globalName: "Adam K.",
    avatarUrl: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=150",
    inServer: true,
  },
  "987654321": {
    username: "laylar",
    displayName: "Layla R.",
    globalName: "Layla",
    avatarUrl: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&q=80&w=150",
    inServer: true,
  },
  "111222333": {
    username: "marcust",
    displayName: "Marcus T.",
    globalName: "Marcus",
    avatarUrl: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=150",
    inServer: true,
  },
  "444555666": {
    username: "saran",
    displayName: "Sara N.",
    globalName: "Sara",
    avatarUrl: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?auto=format&fit=crop&q=80&w=150",
    inServer: false, // Left server - testing preservation
  },
  "777888999": {
    username: "oa",
    displayName: "Omar A.",
    globalName: "Omar",
    avatarUrl: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&q=80&w=150",
    inServer: false, // Left server - testing preservation
  }
};

/**
 * Fetches user profile info from Discord API or Lanyard API as fallback.
 */
export async function fetchDiscordProfile(discordId: string): Promise<DiscordUserProfile | null> {
  if (!discordId) return null;

  const botToken = process.env.DISCORD_BOT_TOKEN;
  const guildId = process.env.DISCORD_GUILD_ID;

  // 1. Try Guild Member Discord API first
  if (botToken && guildId) {
    try {
      const response = await fetch(
        `https://discord.com/api/v10/guilds/${guildId}/members/${discordId}`,
        {
          headers: { Authorization: `Bot ${botToken}` },
        }
      );

      if (response.ok) {
        const data: any = await response.json();
        const user = data.user;

        let avatarUrl: string | null = null;
        if (data.avatar) {
          avatarUrl = `https://cdn.discordapp.com/guilds/${guildId}/users/${discordId}/avatars/${data.avatar}.png`;
        } else if (user?.avatar) {
          avatarUrl = `https://cdn.discordapp.com/avatars/${discordId}/${user.avatar}.png`;
        }

        const username = user?.username || "";
        const displayName = data.nick || user?.global_name || username;
        const globalName = user?.global_name || null;

        return {
          discordId,
          username,
          displayName,
          globalName,
          avatarUrl,
          inServer: true,
        };
      }
    } catch (error) {
      console.warn(`[Discord Helper] Guild Member API error for ${discordId}:`, error);
    }
  }

  // 2. Try Direct Discord User API if Bot Token is available
  if (botToken) {
    try {
      const response = await fetch(`https://discord.com/api/v10/users/${discordId}`, {
        headers: { Authorization: `Bot ${botToken}` },
      });

      if (response.ok) {
        const user: any = await response.json();
        const username = user.username || "";
        const displayName = user.global_name || username;
        const globalName = user.global_name || null;
        const avatarUrl = user.avatar
          ? `https://cdn.discordapp.com/avatars/${discordId}/${user.avatar}.png`
          : null;

        return {
          discordId,
          username,
          displayName,
          globalName,
          avatarUrl,
          inServer: true,
        };
      }
    } catch (error) {
      console.warn(`[Discord Helper] User API error for ${discordId}:`, error);
    }
  }

  // 3. Fallback to Lanyard API if Discord API is unavailable or user left server
  try {
    const lanyardRes = await fetch(`https://api.lanyard.rest/v1/users/${discordId}`);
    if (lanyardRes.ok) {
      const lanyardData: any = await lanyardRes.json();
      if (lanyardData?.success && lanyardData?.data?.discord_user) {
        const u = lanyardData.data.discord_user;
        const username = u.username || "";
        const displayName = u.display_name || u.global_name || username;
        const globalName = u.global_name || null;
        const avatarUrl = u.avatar
          ? `https://cdn.discordapp.com/avatars/${discordId}/${u.avatar}.png`
          : null;

        return {
          discordId,
          username,
          displayName,
          globalName,
          avatarUrl,
          inServer: true,
        };
      }
    }
  } catch (error) {
    console.warn(`[Discord Helper] Lanyard API error for ${discordId}:`, error);
  }

  // 4. Fallback to simulation cache if configured
  if (discordMemberCache[discordId]) {
    const cached = discordMemberCache[discordId];
    return {
      discordId,
      username: cached.username,
      displayName: cached.displayName,
      globalName: cached.globalName,
      avatarUrl: cached.avatarUrl,
      inServer: cached.inServer,
    };
  }

  return null;
}

/**
 * Synchronizes a user's Discord profile across all their review records in Prisma.
 * Executes transactionally to guarantee data integrity.
 */
export async function syncUserProfileInDb(profile: DiscordUserProfile): Promise<void> {
  if (!profile.discordId) return;

  try {
    const formattedUsername = profile.username ? `@${profile.username.replace(/^@+/, "")}` : undefined;

    const updateData: Record<string, any> = {
      profileUpdatedAt: new Date(),
    };
    if (formattedUsername) updateData.username = formattedUsername;
    if (profile.displayName) updateData.displayName = profile.displayName;
    if (profile.globalName !== undefined) updateData.globalName = profile.globalName;
    if (profile.avatarUrl !== undefined) updateData.avatarUrl = profile.avatarUrl;

    await prisma.$transaction(async (tx) => {
      await tx.review.updateMany({
        where: { discordId: profile.discordId },
        data: updateData,
      });
    });
  } catch (error) {
    console.error(`[Discord Helper] Failed to sync profile in DB for ${profile.discordId}:`, error);
  }
}

/**
 * Enriches a review record with live/cached Discord profile information.
 * Automatically updates stored user fields when user profile changes.
 * Preserves last known profile data if Discord & Lanyard are unreachable (e.g. member left).
 */
export async function enrichReviewWithDiscord(review: any): Promise<any> {
  const reviewObj = review.toObject ? review.toObject() : { ...review };
  const discordId = reviewObj.discordId;

  if (!discordId) {
    return {
      ...reviewObj,
      profilePicture: reviewObj.avatarUrl || reviewObj.profilePicture || null,
    };
  }

  const freshProfile = await fetchDiscordProfile(discordId);

  if (freshProfile) {
    // Automatically update stored profile fields in DB across user's reviews
    await syncUserProfileInDb(freshProfile);

    const formattedUsername = freshProfile.username
      ? `@${freshProfile.username.replace(/^@+/, "")}`
      : reviewObj.username;

    return {
      ...reviewObj,
      username: formattedUsername,
      displayName: freshProfile.displayName || reviewObj.displayName || reviewObj.username,
      globalName: freshProfile.globalName || reviewObj.globalName,
      avatarUrl: freshProfile.avatarUrl,
      profilePicture: freshProfile.avatarUrl,
      profileUpdatedAt: new Date().toISOString(),
      isDiscordVerified: true,
    };
  }

  // Preservation logic: If profile info cannot be refreshed (e.g., left server & Lanyard unavailable),
  // preserve the last known stored username, displayName, avatarUrl, and globalName!
  return {
    ...reviewObj,
    username: reviewObj.username,
    displayName: reviewObj.displayName || reviewObj.username,
    globalName: reviewObj.globalName,
    avatarUrl: reviewObj.avatarUrl,
    profilePicture: reviewObj.avatarUrl,
    isDiscordVerified: true,
  };
}

/**
 * Transactional review/vouch creation used by both Discord bot and Website.
 * Ensures review and user profile fields are saved atomically using Prisma.
 */
export async function saveVouchOrReview(data: {
  discordId?: string;
  userId?: string;
  username?: string;
  displayName?: string;
  globalName?: string;
  avatarUrl?: string;
  rating: number;
  reviewText: string;
  productId?: string;
  productName?: string;
  images?: string[];
  isVerifiedPurchase?: boolean;
  isDiscordVerified?: boolean;
  source?: string;
  approvalStatus?: "Pending" | "Approved" | "Rejected";
}) {
  return await prisma.$transaction(async (tx) => {
    let finalUsername = data.username;
    let finalDisplayName = data.displayName;
    let finalGlobalName = data.globalName;
    let finalAvatarUrl = data.avatarUrl;

    if (data.discordId) {
      const fresh = await fetchDiscordProfile(data.discordId);
      if (fresh) {
        finalUsername = fresh.username ? `@${fresh.username.replace(/^@+/, "")}` : finalUsername;
        finalDisplayName = fresh.displayName || finalDisplayName;
        finalGlobalName = fresh.globalName || finalGlobalName;
        finalAvatarUrl = fresh.avatarUrl || finalAvatarUrl;

        // Also update all previous reviews by this user to keep profiles in sync
        await tx.review.updateMany({
          where: { discordId: data.discordId },
          data: {
            username: finalUsername,
            displayName: finalDisplayName,
            globalName: finalGlobalName,
            avatarUrl: finalAvatarUrl,
            profileUpdatedAt: new Date(),
          },
        });
      }
    }

    const created = await tx.review.create({
      data: {
        userId: data.userId || null,
        discordId: data.discordId || null,
        username: finalUsername || "Anonymous",
        displayName: finalDisplayName || finalUsername || "Anonymous",
        globalName: finalGlobalName || null,
        avatarUrl: finalAvatarUrl || null,
        profileUpdatedAt: new Date(),
        rating: Math.min(5, Math.max(1, data.rating)),
        reviewText: data.reviewText,
        productId: data.productId || null,
        productName: data.productName || "Prime License",
        images: data.images || [],
        isVerifiedPurchase: data.isVerifiedPurchase ?? true,
        isDiscordVerified: data.isDiscordVerified ?? (!!data.discordId),
        source: data.source || "DiscordBot",
        approvalStatus: data.approvalStatus || "Approved",
      },
    });

    return created;
  });
}
