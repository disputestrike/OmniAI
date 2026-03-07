/**
 * Media (camera/microphone) permission checks and user-friendly error messages.
 * getUserMedia requires a secure context (HTTPS or localhost) and user gesture.
 */

export type MediaPermissionError = "not_secure" | "not_supported" | "denied" | "not_found" | "in_use" | "unknown";

export interface MediaPermissionResult {
  ok: boolean;
  error?: MediaPermissionError;
  message?: string;
}

/** Check if the environment supports requesting camera/mic (secure context + mediaDevices). */
export function checkMediaSupport(): MediaPermissionResult {
  if (typeof window === "undefined") {
    return { ok: false, error: "not_supported", message: "Not available in this environment." };
  }
  if (!window.isSecureContext) {
    return {
      ok: false,
      error: "not_secure",
      message:
        "Camera and microphone require a secure connection (HTTPS). Please use https:// or localhost.",
    };
  }
  if (!navigator.mediaDevices?.getUserMedia) {
    return {
      ok: false,
      error: "not_supported",
      message: "Your browser does not support camera or microphone access.",
    };
  }
  return { ok: true };
}

/** Get a user-friendly message for a getUserMedia DOMException. */
export function getMediaErrorMessage(err: unknown): string {
  if (err instanceof DOMException) {
    switch (err.name) {
      case "NotAllowedError":
      case "PermissionDeniedError":
        return "Permission denied. Please allow camera and microphone when your browser prompts you, or enable them in your browser's site settings for this page.";
      case "NotFoundError":
        return "No camera or microphone found. Connect a device and try again.";
      case "NotReadableError":
        return "Camera or microphone is in use by another app. Close other apps using it and try again.";
      case "OverconstrainedError":
        return "Your device doesn't support the requested settings. Try with different options.";
      case "SecurityError":
        return "Camera and microphone require a secure connection (HTTPS or localhost).";
      default:
        return err.message || "Could not access camera or microphone.";
    }
  }
  return "Could not access camera or microphone. Please check your browser permissions.";
}
