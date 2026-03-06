/**
 * Social Media Posting API Helper
 * Supports: Instagram (Meta Graph API), Facebook, Twitter/X, LinkedIn, TikTok
 * Each platform requires OAuth tokens stored in the database
 */
import { ENV } from "./_core/env";

export type SocialPlatform = "instagram" | "facebook" | "twitter" | "linkedin" | "tiktok";

export type SocialAccount = {
  platform: SocialPlatform;
  accessToken: string;
  refreshToken?: string;
  accountId: string; // platform-specific account/page ID
  accountName?: string;
  expiresAt?: number;
};

export type PostContent = {
  text: string;
  imageUrl?: string;
  videoUrl?: string;
  link?: string;
  hashtags?: string[];
};

export type PostResult = {
  platform: SocialPlatform;
  success: boolean;
  postId?: string;
  postUrl?: string;
  error?: string;
};

// ============================================================
// OAUTH URL GENERATORS (for connecting accounts)
// ============================================================

export function getMetaOAuthUrl(redirectUri: string, state: string): string | null {
  if (!ENV.metaAppId) return null;
  const scopes = "pages_show_list,pages_read_engagement,pages_manage_posts,instagram_basic,instagram_content_publish";
  return `https://www.facebook.com/v19.0/dialog/oauth?client_id=${ENV.metaAppId}&redirect_uri=${encodeURIComponent(redirectUri)}&scope=${scopes}&state=${state}&response_type=code`;
}

export function getTwitterOAuthUrl(redirectUri: string, state: string): string | null {
  if (!ENV.twitterApiKey) return null;
  const scopes = "tweet.read tweet.write users.read offline.access";
  return `https://twitter.com/i/oauth2/authorize?response_type=code&client_id=${ENV.twitterApiKey}&redirect_uri=${encodeURIComponent(redirectUri)}&scope=${encodeURIComponent(scopes)}&state=${state}&code_challenge=challenge&code_challenge_method=plain`;
}

export function getLinkedInOAuthUrl(redirectUri: string, state: string): string | null {
  if (!ENV.linkedinClientId) return null;
  const scopes = "openid profile w_member_social";
  return `https://www.linkedin.com/oauth/v2/authorization?response_type=code&client_id=${ENV.linkedinClientId}&redirect_uri=${encodeURIComponent(redirectUri)}&scope=${encodeURIComponent(scopes)}&state=${state}`;
}

export function getTikTokOAuthUrl(redirectUri: string, state: string): string | null {
  if (!ENV.tiktokClientKey) return null;
  const scopes = "user.info.basic,video.publish,video.upload";
  return `https://www.tiktok.com/v2/auth/authorize/?client_key=${ENV.tiktokClientKey}&scope=${scopes}&response_type=code&redirect_uri=${encodeURIComponent(redirectUri)}&state=${state}`;
}

// ============================================================
// TOKEN EXCHANGE (after OAuth callback)
// ============================================================

export async function exchangeMetaCode(code: string, redirectUri: string): Promise<{ accessToken: string; expiresIn: number } | null> {
  if (!ENV.metaAppId || !ENV.metaAppSecret) return null;
  const response = await fetch(
    `https://graph.facebook.com/v19.0/oauth/access_token?client_id=${ENV.metaAppId}&redirect_uri=${encodeURIComponent(redirectUri)}&client_secret=${ENV.metaAppSecret}&code=${code}`
  );
  if (!response.ok) return null;
  const data = await response.json() as { access_token: string; expires_in: number };
  return { accessToken: data.access_token, expiresIn: data.expires_in };
}

export async function exchangeTwitterCode(code: string, redirectUri: string): Promise<{ accessToken: string; refreshToken: string } | null> {
  if (!ENV.twitterApiKey || !ENV.twitterApiSecret) return null;
  const response = await fetch("https://api.twitter.com/2/oauth2/token", {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      "Authorization": `Basic ${Buffer.from(`${ENV.twitterApiKey}:${ENV.twitterApiSecret}`).toString("base64")}`,
    },
    body: new URLSearchParams({
      code,
      grant_type: "authorization_code",
      redirect_uri: redirectUri,
      code_verifier: "challenge",
    }),
  });
  if (!response.ok) return null;
  const data = await response.json() as { access_token: string; refresh_token: string };
  return { accessToken: data.access_token, refreshToken: data.refresh_token };
}

export async function exchangeLinkedInCode(code: string, redirectUri: string): Promise<{ accessToken: string } | null> {
  if (!ENV.linkedinClientId || !ENV.linkedinClientSecret) return null;
  const response = await fetch("https://www.linkedin.com/oauth/v2/accessToken", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "authorization_code",
      code,
      redirect_uri: redirectUri,
      client_id: ENV.linkedinClientId,
      client_secret: ENV.linkedinClientSecret,
    }),
  });
  if (!response.ok) return null;
  const data = await response.json() as { access_token: string };
  return { accessToken: data.access_token };
}

// ============================================================
// POSTING FUNCTIONS
// ============================================================

/**
 * Post to Instagram via Meta Graph API
 * Requires: page access token with instagram_content_publish permission
 */
export async function postToInstagram(account: SocialAccount, content: PostContent): Promise<PostResult> {
  try {
    // Step 1: Create media container
    const containerParams: any = {
      access_token: account.accessToken,
      caption: content.text + (content.hashtags?.length ? "\n\n" + content.hashtags.map(h => `#${h}`).join(" ") : ""),
    };

    if (content.videoUrl) {
      containerParams.media_type = "REELS";
      containerParams.video_url = content.videoUrl;
    } else if (content.imageUrl) {
      containerParams.image_url = content.imageUrl;
    } else {
      return { platform: "instagram", success: false, error: "Instagram requires an image or video" };
    }

    const containerResponse = await fetch(
      `https://graph.facebook.com/v19.0/${account.accountId}/media`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(containerParams),
      }
    );

    if (!containerResponse.ok) {
      const err = await containerResponse.text();
      return { platform: "instagram", success: false, error: err };
    }

    const container = await containerResponse.json() as { id: string };

    // Step 2: Publish the container
    const publishResponse = await fetch(
      `https://graph.facebook.com/v19.0/${account.accountId}/media_publish`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          creation_id: container.id,
          access_token: account.accessToken,
        }),
      }
    );

    if (!publishResponse.ok) {
      const err = await publishResponse.text();
      return { platform: "instagram", success: false, error: err };
    }

    const published = await publishResponse.json() as { id: string };
    return {
      platform: "instagram",
      success: true,
      postId: published.id,
      postUrl: `https://www.instagram.com/p/${published.id}/`,
    };
  } catch (e: any) {
    return { platform: "instagram", success: false, error: e.message };
  }
}

/**
 * Post to Facebook Page via Graph API
 */
export async function postToFacebook(account: SocialAccount, content: PostContent): Promise<PostResult> {
  try {
    const body: any = {
      message: content.text,
      access_token: account.accessToken,
    };

    if (content.link) body.link = content.link;

    let endpoint = `https://graph.facebook.com/v19.0/${account.accountId}/feed`;

    if (content.imageUrl) {
      endpoint = `https://graph.facebook.com/v19.0/${account.accountId}/photos`;
      body.url = content.imageUrl;
    }

    if (content.videoUrl) {
      endpoint = `https://graph.facebook.com/v19.0/${account.accountId}/videos`;
      body.file_url = content.videoUrl;
      body.description = content.text;
      delete body.message;
    }

    const response = await fetch(endpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const err = await response.text();
      return { platform: "facebook", success: false, error: err };
    }

    const result = await response.json() as { id: string; post_id?: string };
    return {
      platform: "facebook",
      success: true,
      postId: result.post_id || result.id,
    };
  } catch (e: any) {
    return { platform: "facebook", success: false, error: e.message };
  }
}

/**
 * Post to Twitter/X via API v2
 */
export async function postToTwitter(account: SocialAccount, content: PostContent): Promise<PostResult> {
  try {
    const tweetText = content.text.slice(0, 280) +
      (content.hashtags?.length ? " " + content.hashtags.slice(0, 5).map(h => `#${h}`).join(" ") : "");

    const response = await fetch("https://api.twitter.com/2/tweets", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${account.accessToken}`,
      },
      body: JSON.stringify({ text: tweetText }),
    });

    if (!response.ok) {
      const err = await response.text();
      return { platform: "twitter", success: false, error: err };
    }

    const result = await response.json() as { data: { id: string } };
    return {
      platform: "twitter",
      success: true,
      postId: result.data.id,
      postUrl: `https://twitter.com/i/web/status/${result.data.id}`,
    };
  } catch (e: any) {
    return { platform: "twitter", success: false, error: e.message };
  }
}

/**
 * Post to LinkedIn via API
 */
export async function postToLinkedIn(account: SocialAccount, content: PostContent): Promise<PostResult> {
  try {
    const body: any = {
      author: `urn:li:person:${account.accountId}`,
      lifecycleState: "PUBLISHED",
      specificContent: {
        "com.linkedin.ugc.ShareContent": {
          shareCommentary: { text: content.text },
          shareMediaCategory: content.imageUrl ? "IMAGE" : content.link ? "ARTICLE" : "NONE",
        },
      },
      visibility: { "com.linkedin.ugc.MemberNetworkVisibility": "PUBLIC" },
    };

    if (content.link) {
      body.specificContent["com.linkedin.ugc.ShareContent"].media = [{
        status: "READY",
        originalUrl: content.link,
      }];
    }

    const response = await fetch("https://api.linkedin.com/v2/ugcPosts", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${account.accessToken}`,
        "X-Restli-Protocol-Version": "2.0.0",
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const err = await response.text();
      return { platform: "linkedin", success: false, error: err };
    }

    const result = await response.json() as { id: string };
    return { platform: "linkedin", success: true, postId: result.id };
  } catch (e: any) {
    return { platform: "linkedin", success: false, error: e.message };
  }
}

/**
 * Post to multiple platforms at once
 */
export async function postToMultiplePlatforms(
  accounts: SocialAccount[],
  content: PostContent
): Promise<PostResult[]> {
  const results: PostResult[] = [];

  for (const account of accounts) {
    let result: PostResult;
    switch (account.platform) {
      case "instagram":
        result = await postToInstagram(account, content);
        break;
      case "facebook":
        result = await postToFacebook(account, content);
        break;
      case "twitter":
        result = await postToTwitter(account, content);
        break;
      case "linkedin":
        result = await postToLinkedIn(account, content);
        break;
      default:
        result = { platform: account.platform, success: false, error: "Platform not yet supported" };
    }
    results.push(result);
  }

  return results;
}

/**
 * Get available social platforms and their connection status
 */
export function getSocialPlatformStatus() {
  return {
    instagram: { configured: !!(ENV.metaAppId && ENV.metaAppSecret), name: "Instagram", requiresOAuth: true },
    facebook: { configured: !!(ENV.metaAppId && ENV.metaAppSecret), name: "Facebook", requiresOAuth: true },
    twitter: { configured: !!(ENV.twitterApiKey && ENV.twitterApiSecret), name: "Twitter/X", requiresOAuth: true },
    linkedin: { configured: !!(ENV.linkedinClientId && ENV.linkedinClientSecret), name: "LinkedIn", requiresOAuth: true },
    tiktok: { configured: !!(ENV.tiktokClientKey && ENV.tiktokClientSecret), name: "TikTok", requiresOAuth: true },
  };
}
