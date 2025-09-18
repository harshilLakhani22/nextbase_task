// frontend/src/lib/utils.ts
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Convert worker/backend fields into an HTTP URL usable in the browser.
 * - Prefer `thumbnailUrl` if available.
 * - If not, try to parse `thumbnailPath` (filesystem path) to extract userId & filename:
 *     .../uploads/thumbnails/<userId>/<filename>.webp
 *   and return `${API_BASE}/uploads/thumbnails/<userId>/<filename>.webp`
 *
 * Returns null if conversion isn't possible.
 */
export function makeThumbnailUrl(
  thumbnailUrl?: string | null,
  thumbnailPath?: string | null
): string | null {
  const apiBase = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";

  // 1) If explicit thumbnailUrl present, normalize and return
  if (thumbnailUrl) {
    const t = thumbnailUrl.trim();
    if (t.startsWith("http://") || t.startsWith("https://")) return t;
    if (t.startsWith("/")) return apiBase + t;
    return apiBase + (t.startsWith("/") ? t : `/${t}`);
  }

  // 2) If only thumbnailPath (filesystem) provided, parse it.
  if (thumbnailPath) {
    const p = thumbnailPath.trim();

    // Try to find '/uploads/thumbnails/' segment (most reliable)
    const marker = "/uploads/thumbnails/";
    const idx = p.indexOf(marker);
    if (idx !== -1) {
      const rel = p.slice(idx + "/uploads".length); // start at "/thumbnails/..."
      // rel now begins with '/thumbnails/...'
      // But we want: '/uploads/thumbnails/<userId>/<file>'
      // Create correct relative path:
      const relative = `/uploads${rel}`; // ensures /uploads/thumbnails/...
      return apiBase + relative;
    }

    // Fallback: find 'thumbnails' folder and take next two path segments (userId and filename)
    const segments = p.split(/[\\/]+/); // split on / or \\
    const thumbIdx = segments.findIndex((s) => s === "thumbnails");
    if (thumbIdx !== -1 && segments.length > thumbIdx + 2) {
      const userId = segments[thumbIdx + 1];
      const filename = segments.slice(thumbIdx + 2).join("/");
      if (userId && filename) {
        return `${apiBase}/uploads/thumbnails/${userId}/${filename}`;
      }
    }

    // Last resort: try to extract filename and, if it's a uuid-like name, try to guess userId from parent directory
    const filename = segments[segments.length - 1];
    const parent = segments[segments.length - 2];
    if (filename && parent) {
      // parent may be userId
      return `${apiBase}/uploads/thumbnails/${parent}/${filename}`;
    }

    return null;
  }

  return null;
}