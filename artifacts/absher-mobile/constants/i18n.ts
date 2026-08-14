/**
 * Lightweight i18n dictionary adapter for ABSHER TRAVEL mobile.
 * Re-exports the shared `@workspace/i18n` dictionary.
 */
import { translate, type Lang, type TranslationKey as SharedTranslationKey } from '@workspace/i18n';

export type Language = Lang;

// The types are now derived from the shared workspace i18n.
// We allow any string to keep backwards compatibility with partially translated keys.
export type TranslationKey = SharedTranslationKey | (string & {});

/** Resolve a translation key for a language, falling back to Arabic then the key. */
export function t(lang: Language, key: TranslationKey): string {
  // @workspace/i18n translate handles fallback to Arabic and raw key natively
  return translate(lang, key as string);
}
