/**
 * Access-controlled storage object helpers (customer web app).
 *
 * Private object paths (/objects/...) are served by /api/storage/objects/*,
 * which requires either an Authorization header or a short-lived, path-scoped
 * signed URL. A session token is NEVER placed in a URL.
 *
 *   • Rendering images  → fetch as a blob WITH the Authorization header
 *     (see the <AuthImage> component) and render the object-URL.
 *   • Uploads           → send the Authorization header so the server can
 *     record ownership in object_uploads.
 *   • <a download>      → request a signed URL from /api/storage/sign.
 */

const TOKEN_KEY = "absher_access_token";
const REFRESH_TOKEN_KEY = "absher_refresh_token";
const USER_KEY = "absher_user";

function apiBase(): string {
  return import.meta.env.BASE_URL?.replace(/\/$/, "") ?? "";
}

export function authHeader(): Record<string, string> {
  const token = localStorage.getItem(TOKEN_KEY);
  return token ? { Authorization: `Bearer ${token}` } : {};
}

/**
 * Refresh the access token using the stored refresh token.
 * Mirrors the auth-refresh handler registered in use-auth.tsx so raw fetches
 * (e.g. multipart uploads, which the generated customFetch retry can't replay)
 * transparently recover from an expired 15-min access token.
 * Returns the new access token, or null when refresh is not possible.
 */
let _refreshInFlight: Promise<string | null> | null = null;
async function refreshAccessToken(): Promise<string | null> {
  if (_refreshInFlight) return _refreshInFlight;
  _refreshInFlight = (async () => {
    const refreshToken = localStorage.getItem(REFRESH_TOKEN_KEY);
    if (!refreshToken) return null;
    try {
      const res = await fetch(`${apiBase()}/api/auth/refresh`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ refreshToken }),
      });
      if (!res.ok) {
        localStorage.removeItem(TOKEN_KEY);
        localStorage.removeItem(REFRESH_TOKEN_KEY);
        localStorage.removeItem(USER_KEY);
        return null;
      }
      const data = await res.json();
      localStorage.setItem(TOKEN_KEY, data.accessToken);
      localStorage.setItem(REFRESH_TOKEN_KEY, data.refreshToken);
      return data.accessToken as string;
    } catch {
      return null;
    } finally {
      _refreshInFlight = null;
    }
  })();
  return _refreshInFlight;
}

/**
 * Upload a file to secure storage with the Authorization header, transparently
 * refreshing an expired access token on 401 and retrying once (the multipart
 * body is rebuilt for the retry). Returns the stored object path, or null.
 */
export async function uploadFileAuthenticated(file: File): Promise<{ objectPath: string } | null> {
  const doUpload = async (): Promise<Response> => {
    const formData = new FormData();
    formData.append("file", file);
    return fetch(`${apiBase()}/api/storage/uploads`, {
      method: "POST",
      headers: authHeader(),
      body: formData,
    });
  };

  let res = await doUpload();
  if (res.status === 401) {
    const newToken = await refreshAccessToken();
    if (newToken) res = await doUpload();
  }
  if (!res.ok) return null;
  return res.json();
}

/**
 * Upload a file with real progress reporting (XMLHttpRequest — fetch cannot
 * report upload progress). Refreshes an expired token on 401 and retries once.
 * Returns the stored object path, or throws with a readable message.
 */
export function uploadFileWithProgress(
  file: File,
  onProgress: (percent: number) => void,
): Promise<{ objectPath: string }> {
  const attempt = (): Promise<{ status: number; body: string }> =>
    new Promise((resolve, reject) => {
      const xhr = new XMLHttpRequest();
      xhr.open("POST", `${apiBase()}/api/storage/uploads`);
      const token = localStorage.getItem(TOKEN_KEY);
      if (token) xhr.setRequestHeader("Authorization", `Bearer ${token}`);
      xhr.upload.onprogress = (e) => {
        if (e.lengthComputable) onProgress(Math.round((e.loaded / e.total) * 100));
      };
      xhr.onload = () => resolve({ status: xhr.status, body: xhr.responseText });
      xhr.onerror = () => reject(new Error("network"));
      const fd = new FormData();
      fd.append("file", file);
      xhr.send(fd);
    });

  return (async () => {
    let res = await attempt();
    if (res.status === 401) {
      const newToken = await refreshAccessToken();
      if (newToken) res = await attempt();
    }
    if (res.status < 200 || res.status >= 300) {
      let msg = `upload failed: ${res.status}`;
      try { msg = JSON.parse(res.body)?.error ?? msg; } catch { /* keep default */ }
      throw new Error(msg);
    }
    return JSON.parse(res.body) as { objectPath: string };
  })();
}

/** Normalize a stored value to a canonical "/objects/..." path, else return as-is. */
export function toObjectPath(url: string): string {
  if (url.startsWith("/objects/")) return url;
  const idx = url.indexOf("/objects/");
  if (idx !== -1) {
    let p = url.slice(idx);
    const q = p.indexOf("?");
    if (q !== -1) p = p.slice(0, q);
    return p;
  }
  return url;
}

/** Fetch a protected object as a blob object-URL using the Authorization header. */
export async function fetchObjectBlobUrl(url: string): Promise<string> {
  const path = toObjectPath(url);
  const res = await fetch(`${apiBase()}/api/storage${path}`, { headers: authHeader() });
  if (!res.ok) throw new Error(`fetch failed: ${res.status}`);
  return URL.createObjectURL(await res.blob());
}

/** Request a short-lived signed URL for a protected object (for <a download>). */
export async function getSignedObjectUrl(url: string, download = false): Promise<string> {
  const path = toObjectPath(url);
  const params = new URLSearchParams({ path });
  if (download) params.set("download", "1");
  const res = await fetch(`${apiBase()}/api/storage/sign?${params.toString()}`, { headers: authHeader() });
  if (!res.ok) throw new Error(`sign failed: ${res.status}`);
  return (await res.json()).url as string;
}
