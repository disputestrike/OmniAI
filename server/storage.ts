/**
 * Storage abstraction — priority order:
 *  1. Cloudflare R2  (R2_ACCOUNT_ID + R2_ACCESS_KEY_ID + R2_SECRET_ACCESS_KEY + R2_BUCKET)
 *  2. Forge proxy    (BUILT_IN_FORGE_STORAGE_URL + BUILT_IN_FORGE_API_KEY)  [legacy]
 *  3. Local FS       (UPLOAD_DIR, default ./uploads) — files served at /api/uploads/*
 */
import fs from "fs/promises";
import path from "path";
import { S3Client, PutObjectCommand, DeleteObjectCommand, GetObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { ENV } from "./_core/env";

// ─── Key normalisation ────────────────────────────────────────────
function normalizeKey(relKey: string): string {
  return relKey.replace(/^\/+/, "").replace(/\.\./g, "");
}

// ─── 1. Cloudflare R2 ─────────────────────────────────────────────
type R2Config = {
  accountId: string;
  accessKeyId: string;
  secretAccessKey: string;
  bucket: string;
  publicUrl: string; // "" means use pre-signed URLs
};

function getR2Config(): R2Config | null {
  const { r2AccountId, r2AccessKeyId, r2SecretAccessKey, r2Bucket } = ENV;
  if (!r2AccountId || !r2AccessKeyId || !r2SecretAccessKey || !r2Bucket) return null;
  return {
    accountId: r2AccountId,
    accessKeyId: r2AccessKeyId,
    secretAccessKey: r2SecretAccessKey,
    bucket: r2Bucket,
    publicUrl: ENV.r2PublicUrl.replace(/\/+$/, ""),
  };
}

let _r2: S3Client | null = null;
function r2Client(cfg: R2Config): S3Client {
  if (!_r2) {
    _r2 = new S3Client({
      region: "auto",
      endpoint: `https://${cfg.accountId}.r2.cloudflarestorage.com`,
      credentials: { accessKeyId: cfg.accessKeyId, secretAccessKey: cfg.secretAccessKey },
    });
  }
  return _r2;
}

async function r2Url(client: S3Client, bucket: string, key: string, publicUrl: string): Promise<string> {
  if (publicUrl) return `${publicUrl}/${key}`;
  // Pre-signed URL valid for 7 days
  return getSignedUrl(client, new GetObjectCommand({ Bucket: bucket, Key: key }), { expiresIn: 604800 });
}

async function storagePutR2(relKey: string, data: Buffer | Uint8Array | string, contentType: string, cfg: R2Config): Promise<{ key: string; url: string }> {
  const key = normalizeKey(relKey);
  const client = r2Client(cfg);
  const body = typeof data === "string" ? Buffer.from(data, "utf8") : Buffer.from(data);
  await client.send(new PutObjectCommand({
    Bucket: cfg.bucket,
    Key: key,
    Body: body,
    ContentType: contentType,
  }));
  const url = await r2Url(client, cfg.bucket, key, cfg.publicUrl);
  return { key, url };
}

async function storageGetR2(relKey: string, cfg: R2Config): Promise<{ key: string; url: string }> {
  const key = normalizeKey(relKey);
  const client = r2Client(cfg);
  const url = await r2Url(client, cfg.bucket, key, cfg.publicUrl);
  return { key, url };
}

async function storageDeleteR2(relKey: string, cfg: R2Config): Promise<void> {
  const key = normalizeKey(relKey);
  const client = r2Client(cfg);
  await client.send(new DeleteObjectCommand({ Bucket: cfg.bucket, Key: key }));
}

// ─── 2. Forge storage proxy (legacy) ─────────────────────────────
type ForgeConfig = { baseUrl: string; apiKey: string };

function getForgeConfig(): ForgeConfig | null {
  const baseUrl = ENV.forgeStorageUrl?.trim();
  const apiKey = ENV.forgeApiKey?.trim();
  if (baseUrl && apiKey) return { baseUrl: baseUrl.replace(/\/+$/, ""), apiKey };
  return null;
}

function buildForgeUploadUrl(baseUrl: string, relKey: string): URL {
  const url = new URL("v1/storage/upload", baseUrl.endsWith("/") ? baseUrl : `${baseUrl}/`);
  url.searchParams.set("path", normalizeKey(relKey));
  return url;
}

async function buildForgeDownloadUrl(baseUrl: string, relKey: string, apiKey: string): Promise<string> {
  const u = new URL("v1/storage/downloadUrl", baseUrl.endsWith("/") ? baseUrl : `${baseUrl}/`);
  u.searchParams.set("path", normalizeKey(relKey));
  const response = await fetch(u, { headers: { Authorization: `Bearer ${apiKey}` } });
  const json = (await response.json()) as { url?: string };
  return json.url ?? "";
}

function toFormData(data: Buffer | Uint8Array | string, contentType: string, fileName: string): FormData {
  const blob = typeof data === "string"
    ? new Blob([data], { type: contentType })
    : new Blob([data as BlobPart], { type: contentType });
  const form = new FormData();
  form.append("file", blob, fileName || "file");
  return form;
}

async function storagePutForge(relKey: string, data: Buffer | Uint8Array | string, contentType: string, cfg: ForgeConfig): Promise<{ key: string; url: string }> {
  const key = normalizeKey(relKey);
  const uploadUrl = buildForgeUploadUrl(cfg.baseUrl, key);
  const formData = toFormData(data, contentType, key.split("/").pop() ?? key);
  const response = await fetch(uploadUrl, {
    method: "POST",
    headers: { Authorization: `Bearer ${cfg.apiKey}` },
    body: formData,
  });
  if (!response.ok) {
    const message = await response.text().catch(() => response.statusText);
    throw new Error(`Storage upload failed (${response.status}): ${message}`);
  }
  const url = ((await response.json()) as { url?: string }).url ?? "";
  return { key, url };
}

// ─── 3. Local filesystem ──────────────────────────────────────────
async function storagePutLocal(relKey: string, data: Buffer | Uint8Array | string, _contentType: string): Promise<{ key: string; url: string }> {
  const dir = ENV.uploadDir || "./uploads";
  const key = normalizeKey(relKey);
  const fullPath = path.join(dir, key);
  await fs.mkdir(path.dirname(fullPath), { recursive: true });
  const buf = typeof data === "string" ? Buffer.from(data, "utf8") : Buffer.from(data);
  await fs.writeFile(fullPath, buf);
  const base = ENV.publicBaseUrl?.trim().replace(/\/+$/, "") || "";
  const url = base ? `${base}/api/uploads/${key}` : `/api/uploads/${key}`;
  return { key, url };
}

// ─── Public API ───────────────────────────────────────────────────
export async function storagePut(
  relKey: string,
  data: Buffer | Uint8Array | string,
  contentType = "application/octet-stream"
): Promise<{ key: string; url: string }> {
  const r2 = getR2Config();
  if (r2) return storagePutR2(relKey, data, contentType, r2);

  const forge = getForgeConfig();
  if (forge) return storagePutForge(relKey, data, contentType, forge);

  return storagePutLocal(relKey, data, contentType);
}

export async function storageGet(relKey: string): Promise<{ key: string; url: string }> {
  const r2 = getR2Config();
  if (r2) return storageGetR2(relKey, r2);

  const forge = getForgeConfig();
  const key = normalizeKey(relKey);
  if (forge) {
    const url = await buildForgeDownloadUrl(forge.baseUrl, key, forge.apiKey);
    return { key, url };
  }

  const base = ENV.publicBaseUrl?.trim().replace(/\/+$/, "") || "";
  return { key, url: base ? `${base}/api/uploads/${key}` : `/api/uploads/${key}` };
}

export async function storageDelete(relKey: string): Promise<void> {
  const r2 = getR2Config();
  if (r2) return storageDeleteR2(relKey, r2);

  const forge = getForgeConfig();
  const key = normalizeKey(relKey);

  if (forge) {
    const deleteUrl = new URL("v1/storage/delete", forge.baseUrl.endsWith("/") ? forge.baseUrl : `${forge.baseUrl}/`);
    deleteUrl.searchParams.set("path", key);
    const response = await fetch(deleteUrl, { method: "DELETE", headers: { Authorization: `Bearer ${forge.apiKey}` } });
    if (!response.ok && response.status !== 404) {
      const message = await response.text().catch(() => response.statusText);
      throw new Error(`Storage delete failed (${response.status}): ${message}`);
    }
    return;
  }

  // Local
  const dir = ENV.uploadDir || "./uploads";
  await fs.unlink(path.join(dir, key)).catch((err: NodeJS.ErrnoException) => {
    if (err.code !== "ENOENT") throw err;
  });
}
