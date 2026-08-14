import { useQuery } from "@tanstack/react-query";
import { customFetch } from "@workspace/api-client-react";
import { useTranslation } from "@/hooks/use-translation";

interface PublicSettings {
  android_app_url: string;
  ios_app_url: string;
  app_landing_url: string;
  support_url: string;
}

function usePublicSettings() {
  return useQuery<PublicSettings>({
    queryKey: ["settings", "public"],
    queryFn: async () => {
      const base = import.meta.env.BASE_URL?.replace(/\/$/, "") ?? "";
      return customFetch<PublicSettings>(`${base}/api/settings/public`);
    },
    staleTime: 5 * 60 * 1000,
  });
}

/* ── Store icons ── */
function GooglePlayIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden="true">
      <path fill="#00D0FF" d="M3.6 1.8c-.3.3-.5.8-.5 1.4v17.6c0 .6.2 1.1.5 1.4l.1.1L13.5 12v-.2L3.7 1.7l-.1.1z" />
      <path fill="#00F076" d="M17 15.3 13.5 12v-.2L17 8.7l.1.1 4 2.3c1.1.6 1.1 1.7 0 2.4l-4 2.3-.1-.5z" transform="translate(0 0)" />
      <path fill="#FFCE00" d="m17.1 15.2-3.6-3.4L3.6 22.2c.4.4 1 .4 1.7 0l11.8-7z" />
      <path fill="#FF3A44" d="M17.1 8.8 5.3 1.8c-.7-.4-1.3-.4-1.7 0l9.9 10 3.6-3z" />
    </svg>
  );
}

function AppleIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="currentColor" aria-hidden="true">
      <path d="M16.365 1.43c0 1.14-.417 2.2-1.11 2.99-.84.95-2.22 1.68-3.36 1.59-.14-1.11.42-2.28 1.08-3.01.75-.83 2.06-1.46 3.16-1.57.02.06.02.12.02.18l.21-.17zM20.06 17.05c-.55 1.27-.82 1.84-1.53 2.97-.99 1.57-2.39 3.53-4.13 3.55-1.54.01-1.94-.99-4.03-.98-2.09.01-2.53.99-4.07.98-1.74-.02-3.06-1.79-4.05-3.36C-.63 15.87-.9 10.68 1.19 7.99c1.15-1.5 2.96-2.45 4.66-2.45 1.73 0 2.82 1 4.25 1 1.39 0 2.24-1 4.24-1 1.52 0 3.13.82 4.28 2.24-3.76 2.06-3.15 7.42.24 9.27z" />
    </svg>
  );
}

interface StoreButtonProps {
  href: string;
  compact: boolean;
  icon: React.ReactNode;
  topLabel: string;
  bottomLabel: string;
}

function StoreButton({ href, compact, icon, topLabel, bottomLabel }: StoreButtonProps) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noreferrer"
      className={`inline-flex items-center gap-3 rounded-xl bg-slate-900 text-white border border-white/10 hover:bg-slate-800 transition-colors ${
        compact ? "px-4 py-2" : "px-6 py-3"
      }`}
    >
      <span className={compact ? "h-6 w-6 shrink-0" : "h-8 w-8 shrink-0"}>{icon}</span>
      <span className="flex flex-col leading-tight text-left rtl:text-right">
        <span className={compact ? "text-[10px] text-slate-300" : "text-xs text-slate-300"}>{topLabel}</span>
        <span className={compact ? "text-sm font-bold" : "text-base font-bold"}>{bottomLabel}</span>
      </span>
    </a>
  );
}

export function AppDownloadLinks({ variant = "section" }: { variant?: "footer" | "section" }) {
  const { language } = useTranslation();
  const ar = language === "ar";
  const { data } = usePublicSettings();

  const android = data?.android_app_url?.trim() ?? "";
  const ios = data?.ios_app_url?.trim() ?? "";

  if (!android && !ios) return null;

  const compact = variant === "footer";
  const caption = ar ? "حمّل التطبيق الآن" : "Download the app now";

  const iconGP = <GooglePlayIcon className="h-full w-full" />;
  const iconApple = <AppleIcon className="h-full w-full" />;

  if (compact) {
    return (
      <div className="space-y-3">
        <p className="text-sm text-slate-300">{caption}</p>
        <div className="flex flex-wrap gap-3">
          {android && (
            <StoreButton
              href={android}
              compact
              icon={iconGP}
              topLabel={ar ? "متوفر على" : "GET IT ON"}
              bottomLabel="Google Play"
            />
          )}
          {ios && (
            <StoreButton
              href={ios}
              compact
              icon={iconApple}
              topLabel={ar ? "حمّله من" : "Download on the"}
              bottomLabel="App Store"
            />
          )}
        </div>
      </div>
    );
  }

  return (
    <section className="py-20 bg-slate-50 border-t border-slate-100">
      <div className="container px-4 mx-auto flex flex-col items-center text-center gap-6">
      <div className="space-y-2">
        <h2 className="text-2xl md:text-3xl font-extrabold text-primary tracking-tight">
          {ar ? "حمّل تطبيق ABSHER TRAVEL" : "Download the ABSHER TRAVEL App"}
        </h2>
        <p className="text-slate-500 text-base md:text-lg">{caption}</p>
      </div>
      <div className="flex flex-wrap justify-center gap-4">
        {android && (
          <StoreButton
            href={android}
            compact={false}
            icon={iconGP}
            topLabel={ar ? "متوفر على" : "GET IT ON"}
            bottomLabel="Google Play"
          />
        )}
        {ios && (
          <StoreButton
            href={ios}
            compact={false}
            icon={iconApple}
            topLabel={ar ? "حمّله من" : "Download on the"}
            bottomLabel="App Store"
          />
        )}
      </div>
      </div>
    </section>
  );
}
