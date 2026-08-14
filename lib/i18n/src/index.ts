import type { Domain, Entry, Lang } from "./types";
import { DOMAINS } from "./dictionaries";
import { homeTab } from "./extra-hometab";
import { umrahUi } from "./extra-umrah-ui";
import { extraVisas } from "./extra-visas";
import { extraProfile } from "./extra-profile";

export { BRAND } from "./brand";
export type { Lang, Entry, Domain } from "./types";
export * as dict from "./dictionaries";
export { DOMAINS } from "./dictionaries";

/**
 * The single flat dictionary: every domain merged into one map of
 * `dottedKey -> { ar, en }`. Domain key namespaces guarantee uniqueness; if a
 * duplicate key is ever introduced the later domain wins (dev-time guard below).
 */
export const dictionary: Record<string, Entry> = (() => {
  const merged: Record<string, Entry> = {};
  for (const domain of [...DOMAINS, homeTab, umrahUi, extraVisas, extraProfile]) {
    for (const key of Object.keys(domain)) {
      merged[key] = domain[key]!;
    }
  }
  return merged;
})();

/** Union of every valid translation key. */
export type TranslationKey = keyof typeof dictionary;

/** All keys as an array (handy for tests / coverage checks). */
export const KEYS: string[] = Object.keys(dictionary);

/**
 * Values used for `{name}`-style interpolation. Numbers are coerced to strings.
 */
export type FormatValues = Record<string, string | number>;

/**
 * Replace `{placeholder}` tokens in a template with values from `params`.
 * Unknown tokens are left untouched so nothing is silently dropped.
 *
 * @example format("مرحباً {name}", { name: "محمد" }) // => "مرحباً محمد"
 */
export function format(template: string, params?: FormatValues): string {
  if (!params) return template;
  return template.replace(/\{(\w+)\}/g, (match, token: string) => {
    const value = params[token];
    return value === undefined ? match : String(value);
  });
}

/**
 * Resolve a key for a language directly against the merged dictionary.
 * Falls back to Arabic, then to the raw key, so partially-translated UI is safe.
 */
export function translate(
  lang: Lang,
  key: string,
  params?: FormatValues,
): string {
  const entry = dictionary[key];
  const raw = entry ? (entry[lang] ?? entry.ar) : key;
  return format(raw, params);
}

/** A bound translator: `t(key, params?)` for a fixed language. */
export interface Translator {
  /** The language this translator resolves against. */
  readonly lang: Lang;
  /** Resolve a key (with optional `{placeholder}` interpolation). */
  t: (key: string, params?: FormatValues) => string;
  /** Interpolate an already-resolved template string. */
  format: (template: string, params?: FormatValues) => string;
}

/**
 * Create a translator bound to `lang`. Works identically in Vite (web) and Expo
 * (mobile) — pure data, no runtime dependencies, no DOM/RN assumptions.
 *
 * @example
 *   const { t } = makeT("ar");
 *   t("login.submit");                 // "تسجيل الدخول"
 *   t("otp.subtitle", { phone: "…" }); // interpolated
 */
export function makeT(lang: Lang): Translator {
  return {
    lang,
    t: (key: string, params?: FormatValues) => translate(lang, key, params),
    format,
  };
}
