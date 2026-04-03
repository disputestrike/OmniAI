/**
 * Storage: works without OpenAI/Forge.
 * - If BUILT_IN_FORGE_API_URL + BUILT_IN_FORGE_API_KEY are set: use storage proxy (legacy).
 * - Otherwise: use local filesystem (UPLOAD_DIR). Files served at GET /api/uploads/*
 *   Set PUBLIC_BASE_URL on Railway for full URLs (e.g. https://yourapp.railway.app).
 */
import fs from "fs/promises";
import path from "path";
import { ENV } from "./_core/env";

type StorageConfig = { baseUrl: string; apiKey: string };

function getStorageConfig(): StorageConfig | null {
  // Only use the Forge storage proxy if a dedicated storage URL is configured.
  // BUILT_IN_FORGE_API_URL is now used for image generation (OpenAI) and must
  // not be mistaken for a Forge storage endpoint.
  const baseUrl = ENV.forgeStorageUrl?.trim();
  const apiKey = ENV.forgeApiKey?.trim();
  if (baseUrl && apiKey) return { baseUrl: baseUrl.replace(/\/+$/, ""), apiKey };
  return null;
}

function normalizeKey(relKey: string): string {
  return relKey.replace(/^\/+/, "").replace(/\.\./g, "");
}

/** Local filesystem storage when Forge is not configured. */
async function storagePutLocal(
  relKey: string,
  data: Buffer | Uint8Array | string,
  _contentType = "application/octet-stream"
): Promise<{ key: string; url: string }> {
  const dir = ENV.uploadDir || "./uploads";
  const key = normalizeKey(relKey);
  const fullPath = path.join(dir, key);
  const dirPath = path.dirname(fullPath);
  await fs.mkdir(dirPath, { recursive: true });
  const buf = typeof data === "string" ? Buffer.from(data, "utf8") : Buffer.from(data);
  await fs.writeFile(fullPath, buf);
  const base = ENV.publicBaseUrl?.trim().replace(/\/+$/, "") || "";
  const url = base ? `${base}/api/uploads/${key}` : `/api/uploads/${key}`;
  return { key, url };
}

function buildUploadUrl(baseUrl: string, relKey: string): URL {
  const url = new URL("v1/storage/upload", baseUrl.endsWith("/") ? baseUrl : `${baseUrl}/`);
  url.searchParams.set("path", normalizeKey(relKey));
  return url;
}

async function buildDownloadUrl(
  baseUrl: string,
  relKey: string,
  apiKey: string
): Promise<string> {
  const downloadApiUrl = new URL(
    "v1/storage/downloadUrl",
    baseUrl.endsWith("/") ? baseUrl : `${baseUrl}/`
  );
  downloadApiUrl.searchParams.set("path", normalizeKey(relKey));
  const response = await fetch(downloadApiUrl, {
    method: "GET",
    headers: { Authorization: `Bearer ${apiKey}` },
  });
  const json = (await response.json()) as { url?: string };
  return json.url ?? "";
}

function toFormData(
  data: Buffer | Uint8Array | string,
  contentType: string,
  fileName: string
): FormData {
  const blob =
    typeof data === "string"
      ? new Blob([data], { type: contentType })
      : new Blob([data as BlobPart], { type: contentType });
  const form = new FormData();
  form.append("file", blob, fileName || "file");
  return form;
}

export async function storagePut(
  relKey: string,
  data: Buffer | Uint8Array | string,
  contentType = "application/octet-stream"
): Promise<{ key: string; url: string }> {
  const config = getStorageConfig();
  if (!config) {
    return storagePutLocal(relKey, data, contentType);
  }

  const key = normalizeKey(relKey);
  const uploadUrl = buildUploadUrl(config.baseUrl, key);
  const formData = toFormData(data, contentType, key.split("/").pop() ?? key);
  const response = await fetch(uploadUrl, {
    method: "POST",
    headers: { Authorization: `Bearer ${config.apiKey}` },
    body: formData,
  });

  if (!response.ok) {
    const message = await response.text().catch(() => response.statusText);
    throw new Error(
      `Storage upload failed (${response.status} ${response.statusText}): ${message}`
    );
  }
  const url = ((await response.json()) as { url?: string }).url ?? "";
  return { key, url };
}

export async function storageGet(relKey: string): Promise<{ key: string; url: string }> {
  const config = getStorageConfig();
  const key = normalizeKey(relKey);
  if (!config) {
    const base = ENV.publicBaseUrl?.trim().replace(/\/+$/, "") || "";
    const url = base ? `${base}/api/uploads/${key}` : `/api/uploads/${key}`;
    return { key, url };
  }
  const url = await buildDownloadUrl(config.baseUrl, key, config.apiKey);
  return { key, url };
}
