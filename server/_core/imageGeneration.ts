/**
 * Image generation helper using internal ImageService
 *
 * Example usage:
 *   const { url: imageUrl } = await generateImage({
 *     prompt: "A serene landscape with mountains"
 *   });
 *
 * For editing:
 *   const { url: imageUrl } = await generateImage({
 *     prompt: "Add a rainbow to this landscape",
 *     originalImages: [{
 *       url: "https://example.com/original.jpg",
 *       mimeType: "image/jpeg"
 *     }]
 *   });
 */
import { storagePut } from "server/storage";
import { ENV } from "./env";

export type GenerateImageOptions = {
  prompt: string;
  originalImages?: Array<{
    url?: string;
    b64Json?: string;
    mimeType?: string;
  }>;
};

export type GenerateImageResponse = {
  url?: string;
};

export async function editImage(
  options: Required<Pick<GenerateImageOptions, "prompt" | "originalImages">>
): Promise<GenerateImageResponse> {
  if (!ENV.forgeApiUrl?.trim() || !ENV.forgeApiKey?.trim()) {
    throw new Error(
      "Image generation is not configured. Set BUILT_IN_FORGE_API_URL and BUILT_IN_FORGE_API_KEY for image service."
    );
  }

  const base = ENV.forgeApiUrl.replace(/\/$/, "");
  const fullUrl = `${base}/images/edits`;

  const imageInput = options.originalImages[0];
  let imageBuffer: Buffer;
  const mimeType = imageInput.mimeType || "image/png";

  if (imageInput.url) {
    const imgResponse = await fetch(imageInput.url);
    if (!imgResponse.ok) {
      throw new Error(`Failed to fetch original image (${imgResponse.status} ${imgResponse.statusText})`);
    }
    imageBuffer = Buffer.from(await imgResponse.arrayBuffer());
  } else if (imageInput.b64Json) {
    imageBuffer = Buffer.from(imageInput.b64Json, "base64");
  } else {
    throw new Error("No image data provided in originalImages");
  }

  const formData = new FormData();
  formData.append("model", "gpt-image-1");
  formData.append("prompt", options.prompt);
  formData.append("n", "1");
  formData.append("size", "1024x1024");
  formData.append("image", new Blob([imageBuffer], { type: mimeType }), "image.png");

  const response = await fetch(fullUrl, {
    method: "POST",
    headers: { authorization: `Bearer ${ENV.forgeApiKey}` },
    body: formData,
  });

  if (!response.ok) {
    const detail = await response.text().catch(() => "");
    throw new Error(
      `Image edit request failed (${response.status} ${response.statusText})${detail ? `: ${detail}` : ""}`
    );
  }

  const result = (await response.json()) as {
    data: Array<{ b64_json?: string; url?: string }>;
  };
  const item = result.data?.[0];
  if (item?.b64_json) {
    const buffer = Buffer.from(item.b64_json, "base64");
    const { url } = await storagePut(`generated/${Date.now()}.png`, buffer, "image/png");
    return { url };
  }
  if (item?.url) {
    return { url: item.url };
  }
  throw new Error("Image edit response contained no image data");
}

export async function generateImage(
  options: GenerateImageOptions
): Promise<GenerateImageResponse> {
  if (!ENV.forgeApiUrl?.trim() || !ENV.forgeApiKey?.trim()) {
    throw new Error(
      "Image generation is not configured. Set BUILT_IN_FORGE_API_URL and BUILT_IN_FORGE_API_KEY for image service, or use another provider."
    );
  }

  const base = ENV.forgeApiUrl.replace(/\/$/, "");
  const fullUrl = `${base}/images/generations`;

  const response = await fetch(fullUrl, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      authorization: `Bearer ${ENV.forgeApiKey}`,
    },
    body: JSON.stringify({
      model: "dall-e-3",
      prompt: options.prompt,
      n: 1,
      size: "1024x1024",
      response_format: "b64_json",
    }),
  });

  if (!response.ok) {
    const detail = await response.text().catch(() => "");
    throw new Error(
      `Image generation request failed (${response.status} ${response.statusText})${detail ? `: ${detail}` : ""}`
    );
  }

  const result = (await response.json()) as {
    data: Array<{ b64_json?: string; url?: string }>;
  };
  const item = result.data?.[0];
  if (item?.b64_json) {
    const buffer = Buffer.from(item.b64_json, "base64");
    const { url } = await storagePut(`generated/${Date.now()}.png`, buffer, "image/png");
    return { url };
  }
  if (item?.url) {
    return { url: item.url };
  }
  throw new Error("Image generation response contained no image data");
}
