/**
 * Helpers to display images from the API.
 *
 * Public assets (offers, programs, destinations, flags) are plain URLs.
 *
 * Private object paths (/objects/...) are served by the access-controlled route
 * /api/storage/objects/*. A session token is NEVER placed in a URL. Instead, RN
 * <Image> fetches them with an Authorization HEADER via `getImageSource()`,
 * which returns an ImageSourcePropType `{ uri, headers }`. The token is kept in
 * sync by AuthContext via `setImageAuthToken()`.
 */
import type { ImageSourcePropType } from 'react-native';

let currentAuthToken: string | null = null;

/** Called by AuthContext whenever the access token changes (login/refresh/logout). */
export function setImageAuthToken(token: string | null): void {
  currentAuthToken = token;
}

function absoluteUrl(path: string): string | undefined {
  if (path.startsWith('http')) return path;
  const domain = process.env.EXPO_PUBLIC_DOMAIN;
  if (!domain) return undefined;
  if (path.startsWith('/objects/')) return `https://${domain}/api/storage${path}`;
  return `https://${domain}${path.startsWith('/') ? path : '/' + path}`;
}

/**
 * Returns an RN Image source. For private object paths, includes the
 * Authorization header so the protected route authorizes the request without a
 * token in the URL. Returns undefined when the path/domain is unavailable.
 */
export function getImageSource(path: string | null | undefined): ImageSourcePropType | undefined {
  if (!path) return undefined;
  const uri = absoluteUrl(path);
  if (!uri) return undefined;
  if (path.startsWith('/objects/') && currentAuthToken) {
    return { uri, headers: { Authorization: `Bearer ${currentAuthToken}` } };
  }
  return { uri };
}

/**
 * Legacy string helper for PUBLIC images only. Do NOT use for private object
 * paths — those cannot be authorized via a bare URL; use getImageSource().
 */
export function getImageUrl(path: string | null | undefined): string | undefined {
  if (!path) return undefined;
  return absoluteUrl(path);
}

export function useImageUrl(path: string | null | undefined): string | undefined {
  return getImageUrl(path);
}
