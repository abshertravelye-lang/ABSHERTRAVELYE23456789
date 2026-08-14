import { useEffect, useState, type ImgHTMLAttributes } from "react";
import { fetchObjectBlobUrl } from "@/lib/objectMedia";

/**
 * Resolve a (possibly protected) storage URL into a directly-renderable URL.
 * Protected /objects/ paths are fetched as a blob with the Authorization
 * header; everything else is passed through unchanged.
 */
export function useObjectUrl(src?: string | null): string {
  const [resolved, setResolved] = useState<string>("");
  useEffect(() => {
    if (!src) { setResolved(""); return; }
    if (!src.includes("/objects/")) { setResolved(src); return; }
    let revoked = false;
    let objectUrl: string | null = null;
    (async () => {
      try {
        objectUrl = await fetchObjectBlobUrl(src);
        if (!revoked) setResolved(objectUrl);
      } catch {
        if (!revoked) setResolved("");
      }
    })();
    return () => { revoked = true; if (objectUrl) URL.revokeObjectURL(objectUrl); };
  }, [src]);
  return resolved;
}

/**
 * Renders a protected storage object (/objects/...) by fetching it as a blob
 * WITH the Authorization header, so no session token ever appears in a URL.
 * Non-protected URLs are rendered directly.
 */
export function AuthImage({
  src,
  ...rest
}: { src?: string | null } & Omit<ImgHTMLAttributes<HTMLImageElement>, "src">) {
  const [resolved, setResolved] = useState<string>("");

  useEffect(() => {
    if (!src) { setResolved(""); return; }
    if (!src.includes("/objects/")) { setResolved(src); return; }

    let revoked = false;
    let objectUrl: string | null = null;
    (async () => {
      try {
        objectUrl = await fetchObjectBlobUrl(src);
        if (!revoked) setResolved(objectUrl);
      } catch {
        if (!revoked) setResolved("");
      }
    })();
    return () => {
      revoked = true;
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [src]);

  // eslint-disable-next-line jsx-a11y/alt-text
  return <img src={resolved} {...rest} />;
}
