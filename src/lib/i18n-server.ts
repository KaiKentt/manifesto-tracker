import "server-only";
import { headers } from "next/headers";
import { cache } from "react";
import { dictionary } from "./dictionaries";
import { OG_LOCALE, isLocale, type Locale } from "./i18n";

// The proxy sets these request headers on every page request:
//   x-locale   "en" or "ms", from the URL prefix
//   x-pathname the address the visitor asked for, before the /ms rewrite
export const getLocale = cache(async (): Promise<Locale> => {
  const value = (await headers()).get("x-locale");
  return isLocale(value) ? value : "en";
});

export async function getDictionary() {
  return dictionary(await getLocale());
}

/** Open Graph fields every page shares. A page's own openGraph replaces the layout's, so pages spread this in. */
export async function baseOpenGraph() {
  const locale = await getLocale();
  const t = dictionary(locale);
  return {
    siteName: t.brand.full,
    locale: OG_LOCALE[locale],
    alternateLocale: [OG_LOCALE[locale === "en" ? "ms" : "en"]],
    images: [{ url: "/opengraph-image", width: 1200, height: 630, alt: t.meta.homeTitle }],
  };
}

export const getRequestPath = cache(async (): Promise<string> => {
  const h = await headers();
  return `${h.get("x-pathname") ?? "/"}${h.get("x-search") ?? ""}`;
});
