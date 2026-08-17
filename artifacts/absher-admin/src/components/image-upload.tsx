/**
 * Reusable image-upload widget for admin panels.
 *
 * Accepts JPG, JPEG, PNG, WEBP. Validates MIME type client-side before
 * uploading, shows a spinner while uploading, previews the result, and lets
 * the admin replace or remove the image.
 *
 * Usage:
 *   <ImageUpload value={form.imageUrl} onChange={v => set("imageUrl", v)} />
 */
import { useRef, useState } from "react";
import { UploadCloud, X } from "lucide-react";
import { toast } from "sonner";
import { ADMIN_ACCESS_TOKEN_KEY } from "@/hooks/use-admin-auth";
import { useTranslation } from "@/hooks/use-translation";

const ACCEPTED_MIME = ["image/jpeg", "image/jpg", "image/png", "image/webp"];
const ACCEPTED_EXT = ".jpg,.jpeg,.png,.webp";
const MAX_BYTES = 20 * 1024 * 1024; // 20 MB (server limit)

/** Upload a file to the API and return the objectPath / imageUrl. */
export async function uploadImageFile(file: File): Promise<string | null> {
  // The API server is mounted at the root `/api/...` path (not under the
  // artifact's base path) — same convention as use-admin-auth's apiBase().
  const fd = new FormData();
  fd.append("file", file);
  const token = localStorage.getItem(ADMIN_ACCESS_TOKEN_KEY);
  try {
    const res = await fetch(`/api/storage/uploads/images`, {
      method: "POST",
      body: fd,
      headers: token ? { Authorization: `Bearer ${token}` } : undefined,
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error((err as any)?.error || res.statusText);
    }
    const json = await res.json();
    return (json as any).imageUrl ?? (json as any).objectPath ?? (json as any).url ?? null;
  } catch (e: any) {
    console.error("Image upload failed:", e);
    throw e;
  }
}

/** Resolve any image path (objectPath or absolute URL) to a displayable src. */
export function resolveImageSrc(value: string | null | undefined): string | undefined {
  if (!value) return undefined;
  if (value.startsWith("http")) return value;
  // API paths are served from the root, not under the artifact base path.
  if (value.startsWith("/api/")) return value;
  // Legacy private object paths (documents, etc.)
  if (value.startsWith("/objects/")) return `/api/storage${value}`;
  return value;
}

interface ImageUploadProps {
  value: string;
  onChange: (v: string) => void;
  /** Aspect ratio CSS (default "auto") e.g. "16/9", "4/3", "1/1" */
  aspectRatio?: string;
  /** Placeholder text when empty */
  placeholder?: string;
}

export function ImageUpload({ value, onChange, aspectRatio = "auto", placeholder }: ImageUploadProps) {
  const { language } = useTranslation();
  const ar = language === "ar";
  const [uploading, setUploading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFile = async (file: File) => {
    if (!ACCEPTED_MIME.includes(file.type.toLowerCase())) {
      toast.error(ar ? "نوع الملف غير مدعوم. يُسمح فقط بـ JPG أو PNG أو WEBP" : "Unsupported file type. Only JPG, PNG or WEBP allowed.");
      return;
    }
    if (file.size > MAX_BYTES) {
      toast.error(ar ? "حجم الملف كبير جداً (الحد 20 ميغابايت)" : "File too large (max 20 MB).");
      return;
    }
    setUploading(true);
    try {
      const url = await uploadImageFile(file);
      if (url) {
        onChange(url);
        toast.success(ar ? "تم رفع الصورة بنجاح" : "Image uploaded successfully");
      } else {
        toast.error(ar ? "فشل رفع الصورة" : "Image upload failed");
      }
    } catch (e: any) {
      toast.error(e?.message || (ar ? "فشل رفع الصورة" : "Image upload failed"));
    } finally {
      setUploading(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  };

  const resolved = resolveImageSrc(value);

  if (resolved) {
    return (
      <div className="border-2 border-slate-200 rounded-xl overflow-hidden">
        <div style={{ aspectRatio }} className="bg-slate-100">
          <img
            src={resolved}
            alt=""
            className="w-full h-full object-cover"
            onError={(e) => {
              (e.currentTarget as HTMLImageElement).style.opacity = "0.3";
            }}
          />
        </div>
        <div className="flex gap-2 p-2 bg-slate-50">
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            disabled={uploading}
            className="flex-1 text-xs text-[#0d2351] hover:underline font-medium disabled:opacity-50"
          >
            {uploading ? (ar ? "جاري الرفع..." : "Uploading...") : (ar ? "استبدال الصورة" : "Replace image")}
          </button>
          <button
            type="button"
            onClick={() => onChange("")}
            className="flex-1 text-xs text-red-500 hover:underline"
          >
            {ar ? "حذف" : "Remove"}
          </button>
        </div>
        <input
          ref={inputRef}
          type="file"
          className="hidden"
          accept={ACCEPTED_EXT}
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (f) handleFile(f);
          }}
          disabled={uploading}
        />
      </div>
    );
  }

  return (
    <label
      className="flex flex-col items-center justify-center gap-2 border-2 border-dashed rounded-xl px-4 py-8 text-sm text-muted-foreground cursor-pointer hover:border-[#0d2351]/50 hover:bg-[#0d2351]/5 transition-colors"
      style={{ aspectRatio }}
    >
      <input
        type="file"
        className="hidden"
        accept={ACCEPTED_EXT}
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (f) handleFile(f);
        }}
        disabled={uploading}
      />
      {uploading ? (
        <>
          <div className="w-5 h-5 border-2 border-[#0d2351]/20 border-t-[#0d2351] rounded-full animate-spin" />
          <span>{ar ? "جاري الرفع..." : "Uploading..."}</span>
        </>
      ) : (
        <>
          <UploadCloud className="w-7 h-7 text-[#0d2351]/50" />
          <span>{placeholder || (ar ? "اضغط لرفع صورة" : "Click to upload image")}</span>
          <span className="text-xs text-slate-400">{ar ? "JPG، PNG، WEBP — حتى 20 ميغابايت" : "JPG, PNG, WEBP — up to 20 MB"}</span>
        </>
      )}
    </label>
  );
}
