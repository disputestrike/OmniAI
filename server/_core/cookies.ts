import type { CookieOptions, Request } from "express";

const LOCAL_HOSTS = new Set(["localhost", "127.0.0.1", "::1"]);

function isIpAddress(host: string) {
  // Basic IPv4 check and IPv6 presence detection.
  if (/^\d{1,3}(\.\d{1,3}){3}$/.test(host)) return true;
  return host.includes(":");
}

function isSecureRequest(req: Request) {
  if (req.protocol === "https") return true;

  const forwardedProto = req.headers["x-forwarded-proto"];
  if (!forwardedProto) return false;

  const protoList = Array.isArray(forwardedProto)
    ? forwardedProto
    : forwardedProto.split(",");

  return protoList.some(proto => proto.trim().toLowerCase() === "https");
}

export function getSessionCookieOptions(
  req: Request
): Pick<CookieOptions, "domain" | "httpOnly" | "path" | "sameSite" | "secure"> {
  // const hostname = req.hostname;
  // const shouldSetDomain =
  //   hostname &&
  //   !LOCAL_HOSTS.has(hostname) &&
  //   !isIpAddress(hostname) &&
  //   hostname !== "127.0.0.1" &&
  //   hostname !== "::1";

  // const domain =
  //   shouldSetDomain && !hostname.startsWith(".")
  //     ? `.${hostname}`
  //     : shouldSetDomain
  //       ? hostname
  //       : undefined;

  const host = req.get("host") || "";
  const isRailway = /\.railway\.app$|\.up\.railway\.app$/i.test(host);
  const secure = isSecureRequest(req) || isRailway;

  // When PUBLIC_URL (or BASE_URL) is set, set cookie domain to that host so the cookie is sent when the user visits the public URL (avoids proxy Host mismatch).
  let domain: string | undefined;
  const publicUrl = (process.env.PUBLIC_URL || process.env.BASE_URL || "").trim();
  if (publicUrl) {
    try {
      const u = new URL(publicUrl);
      if (u.hostname && !LOCAL_HOSTS.has(u.hostname) && !isIpAddress(u.hostname)) domain = u.hostname;
    } catch {
      // ignore
    }
  }

  return {
    httpOnly: true,
    path: "/",
    sameSite: "lax",
    secure,
    ...(domain && { domain }),
  };
}
