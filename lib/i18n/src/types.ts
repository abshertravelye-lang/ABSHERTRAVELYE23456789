/** Supported languages. */
export type Lang = "ar" | "en";

/** A single translatable entry: one string per supported language. */
export type Entry = Record<Lang, string>;

/**
 * A domain dictionary maps flat dotted keys (e.g. `"login.submit"`) to an
 * {@link Entry}. Domains are merged into one flat map at build time, so keys
 * must be globally unique across domains (they are namespaced by convention,
 * e.g. `common.*`, `auth.*`, `visas.*`).
 */
export type Domain = Record<string, Entry>;
