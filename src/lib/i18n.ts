// Languages and localised paths. English lives at the root (/e/pas),
// Bahasa Malaysia under /ms (/ms/e/pas), so search engines index both.

export const LOCALES = ["en", "ms"] as const;
export type Locale = (typeof LOCALES)[number];
export const DEFAULT_LOCALE: Locale = "en";

export const HTML_LANG: Record<Locale, string> = { en: "en-MY", ms: "ms-MY" };
export const OG_LOCALE: Record<Locale, string> = { en: "en_MY", ms: "ms_MY" };
export const LOCALE_NAME: Record<Locale, string> = { en: "English", ms: "Bahasa Melayu" };

// Paths that never get a language prefix.
const UNPREFIXED = ["/api", "/auth", "/pitch", "/_next"];

export function isLocale(value: unknown): value is Locale {
  return value === "en" || value === "ms";
}

/** "/ms/e/pas?x=1" → "/e/pas?x=1"; "/ms" → "/". */
export function stripLocale(path: string): string {
  if (path === "/ms" || path.startsWith("/ms/") || path.startsWith("/ms?") || path.startsWith("/ms#")) {
    const rest = path.slice(3);
    return rest.startsWith("/") ? rest : `/${rest}`;
  }
  return path;
}

/** Adds the /ms prefix to an internal path for Bahasa Malaysia. */
export function localePath(locale: Locale, path: string): string {
  if (!path.startsWith("/") || path.startsWith("//")) return path;
  const base = stripLocale(path);
  if (locale === "en" || UNPREFIXED.some((p) => base === p || base.startsWith(`${p}/`) || base.startsWith(`${p}?`))) return base;
  if (base === "/") return "/ms";
  if (base.startsWith("/?") || base.startsWith("/#")) return `/ms${base.slice(1)}`;
  return `/ms${base}`;
}

/** Canonical and hreflang alternates for a page, relative to metadataBase. */
export function languageAlternates(locale: Locale, path: string) {
  const base = stripLocale(path);
  return {
    canonical: localePath(locale, base),
    languages: {
      "en-MY": localePath("en", base),
      "ms-MY": localePath("ms", base),
      "x-default": localePath("en", base),
    },
  };
}
