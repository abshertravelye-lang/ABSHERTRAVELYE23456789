/**
 * AppImage — a web image component with:
 * - Lazy loading (native browser lazy)
 * - Automatic fallback on error (no broken images / white boxes)
 * - Resolves internal /api/storage/... paths relative to BASE_URL
 *
 * Usage:
 *   <AppImage src={imageUrl} fallback="https://..." alt="..." className="..." />
 */
import { useState, type ImgHTMLAttributes } from "react";

const DEFAULT_FALLBACK =
  "https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?w=800&auto=format&fit=crop";

export function resolveImageSrc(src?: string | null): string | undefined {
  if (!src) return undefined;
  if (src.startsWith("http")) return src;
  const base = import.meta.env.BASE_URL?.replace(/\/$/, "") ?? "";
  if (src.startsWith("/api/")) return `${base}${src}`;
  if (src.startsWith("/objects/")) return `${base}/api/storage${src}`;
  return src;
}

interface AppImageProps extends Omit<ImgHTMLAttributes<HTMLImageElement>, "src"> {
  src?: string | null;
  fallback?: string;
}

export function AppImage({ src, fallback = DEFAULT_FALLBACK, alt = "", loading = "lazy", ...rest }: AppImageProps) {
  const [errored, setErrored] = useState(false);
  const resolved = resolveImageSrc(src);
  const finalSrc = errored || !resolved ? fallback : resolved;

  return (
    <img
      src={finalSrc}
      alt={alt}
      loading={loading}
      onError={() => {
        if (!errored) setErrored(true);
      }}
      {...rest}
    />
  );
}
