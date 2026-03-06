/**
 * E-Commerce Sync Helper
 * Supports: Shopify Admin API, WooCommerce REST API
 * Syncs product catalogs for automatic ad/content generation
 */
import { ENV } from "./_core/env";

export type EcommerceProduct = {
  externalId: string;
  title: string;
  description: string;
  price: string;
  currency: string;
  images: string[];
  url: string;
  variants?: Array<{ id: string; title: string; price: string; sku?: string }>;
  tags?: string[];
  category?: string;
  sku?: string;
  inventory?: number;
  status: "active" | "draft" | "archived";
};

export type StoreConnection = {
  platform: "shopify" | "woocommerce";
  storeUrl: string; // e.g., "mystore.myshopify.com" or "https://mystore.com"
  accessToken: string;
  consumerKey?: string; // WooCommerce
  consumerSecret?: string; // WooCommerce
};

export type SyncResult = {
  platform: string;
  success: boolean;
  productsImported: number;
  products: EcommerceProduct[];
  error?: string;
};

// ============================================================
// SHOPIFY INTEGRATION
// ============================================================

/**
 * Get Shopify OAuth URL for store connection
 */
export function getShopifyOAuthUrl(shop: string, redirectUri: string, state: string): string | null {
  if (!ENV.shopifyApiKey) return null;
  const scopes = "read_products,read_inventory,read_orders";
  return `https://${shop}/admin/oauth/authorize?client_id=${ENV.shopifyApiKey}&scope=${scopes}&redirect_uri=${encodeURIComponent(redirectUri)}&state=${state}`;
}

/**
 * Exchange Shopify auth code for access token
 */
export async function exchangeShopifyCode(shop: string, code: string): Promise<string | null> {
  if (!ENV.shopifyApiKey || !ENV.shopifyApiSecret) return null;

  const response = await fetch(`https://${shop}/admin/oauth/access_token`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      client_id: ENV.shopifyApiKey,
      client_secret: ENV.shopifyApiSecret,
      code,
    }),
  });

  if (!response.ok) return null;
  const data = await response.json() as { access_token: string };
  return data.access_token;
}

/**
 * Fetch all products from Shopify store
 */
export async function syncShopifyProducts(connection: StoreConnection): Promise<SyncResult> {
  try {
    const products: EcommerceProduct[] = [];
    let pageInfo: string | null = null;
    let hasMore = true;

    while (hasMore) {
      const url: string = pageInfo
        ? `https://${connection.storeUrl}/admin/api/2024-01/products.json?limit=250&page_info=${pageInfo}`
        : `https://${connection.storeUrl}/admin/api/2024-01/products.json?limit=250&status=active`;

      const response: Response = await fetch(url, {
        headers: {
          "X-Shopify-Access-Token": connection.accessToken,
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        const error = await response.text();
        return { platform: "shopify", success: false, productsImported: 0, products: [], error };
      }

      const data = await response.json() as {
        products: Array<{
          id: number;
          title: string;
          body_html: string;
          handle: string;
          status: string;
          tags: string;
          product_type: string;
          images: Array<{ src: string }>;
          variants: Array<{ id: number; title: string; price: string; sku: string; inventory_quantity: number }>;
        }>;
      };

      for (const p of data.products) {
        products.push({
          externalId: String(p.id),
          title: p.title,
          description: p.body_html?.replace(/<[^>]*>/g, "") || "",
          price: p.variants[0]?.price || "0",
          currency: "USD",
          images: p.images.map(i => i.src),
          url: `https://${connection.storeUrl}/products/${p.handle}`,
          variants: p.variants.map(v => ({
            id: String(v.id),
            title: v.title,
            price: v.price,
            sku: v.sku,
          })),
          tags: p.tags ? p.tags.split(",").map(t => t.trim()) : [],
          category: p.product_type,
          sku: p.variants[0]?.sku,
          inventory: p.variants.reduce((sum, v) => sum + (v.inventory_quantity || 0), 0),
          status: p.status === "active" ? "active" : p.status === "draft" ? "draft" : "archived",
        });
      }

      // Check for pagination
      const linkHeader: string | null = response.headers.get("link");
      if (linkHeader?.includes('rel="next"')) {
        const match: RegExpMatchArray | null = linkHeader.match(/page_info=([^>&]*)/);
        pageInfo = match?.[1] || null;
      } else {
        hasMore = false;
      }
    }

    return {
      platform: "shopify",
      success: true,
      productsImported: products.length,
      products,
    };
  } catch (e: any) {
    return { platform: "shopify", success: false, productsImported: 0, products: [], error: e.message };
  }
}

// ============================================================
// WOOCOMMERCE INTEGRATION
// ============================================================

/**
 * Fetch all products from WooCommerce store
 */
export async function syncWooCommerceProducts(connection: StoreConnection): Promise<SyncResult> {
  try {
    if (!connection.consumerKey || !connection.consumerSecret) {
      return { platform: "woocommerce", success: false, productsImported: 0, products: [], error: "WooCommerce consumer key and secret required" };
    }

    const products: EcommerceProduct[] = [];
    let page = 1;
    let hasMore = true;

    while (hasMore) {
      const baseUrl = connection.storeUrl.replace(/\/$/, "");
      const auth = Buffer.from(`${connection.consumerKey}:${connection.consumerSecret}`).toString("base64");

      const response = await fetch(
        `${baseUrl}/wp-json/wc/v3/products?per_page=100&page=${page}&status=publish`,
        {
          headers: {
            "Authorization": `Basic ${auth}`,
            "Content-Type": "application/json",
          },
        }
      );

      if (!response.ok) {
        const error = await response.text();
        return { platform: "woocommerce", success: false, productsImported: 0, products: [], error };
      }

      const data = await response.json() as Array<{
        id: number;
        name: string;
        description: string;
        short_description: string;
        price: string;
        permalink: string;
        status: string;
        sku: string;
        stock_quantity: number | null;
        categories: Array<{ name: string }>;
        tags: Array<{ name: string }>;
        images: Array<{ src: string }>;
        variations: Array<{ id: number; attributes: Array<{ option: string }>; regular_price: string; sku: string }>;
      }>;

      if (data.length === 0) {
        hasMore = false;
        break;
      }

      for (const p of data) {
        products.push({
          externalId: String(p.id),
          title: p.name,
          description: (p.description || p.short_description || "").replace(/<[^>]*>/g, ""),
          price: p.price || "0",
          currency: "USD",
          images: p.images.map(i => i.src),
          url: p.permalink,
          tags: p.tags.map(t => t.name),
          category: p.categories[0]?.name,
          sku: p.sku,
          inventory: p.stock_quantity ?? undefined,
          status: p.status === "publish" ? "active" : "draft",
        });
      }

      const totalPages = parseInt(response.headers.get("x-wp-totalpages") || "1");
      hasMore = page < totalPages;
      page++;
    }

    return {
      platform: "woocommerce",
      success: true,
      productsImported: products.length,
      products,
    };
  } catch (e: any) {
    return { platform: "woocommerce", success: false, productsImported: 0, products: [], error: e.message };
  }
}

/**
 * Sync products from any connected store
 */
export async function syncProducts(connection: StoreConnection): Promise<SyncResult> {
  switch (connection.platform) {
    case "shopify":
      return syncShopifyProducts(connection);
    case "woocommerce":
      return syncWooCommerceProducts(connection);
    default:
      return { platform: connection.platform, success: false, productsImported: 0, products: [], error: "Unsupported platform" };
  }
}

/**
 * Get e-commerce platform status
 */
export function getEcommercePlatformStatus() {
  return {
    shopify: { configured: !!(ENV.shopifyApiKey && ENV.shopifyApiSecret), name: "Shopify" },
    woocommerce: { configured: true, name: "WooCommerce (API Key Auth)" },
  };
}
