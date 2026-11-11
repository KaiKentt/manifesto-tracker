"use client";

import { localePath, stripLocale, type Locale } from "@/lib/i18n";

// Switches between English (/…) and Bahasa Malaysia (/ms/…) for the page being read.
// A full page load, so the whole layout (html lang, navigation) changes language too.
export function LanguageToggle({
  locale,
  hrefs,
  label,
}: {
  locale: Locale;
  hrefs: Record<Locale, string>;
  label: string;
}) {
  function go(target: Locale, event: React.MouseEvent<HTMLAnchorElement>) {
    if (target === locale || event.metaKey || event.ctrlKey || event.shiftKey || event.button !== 0) return;
    event.preventDefault();
    const { pathname, search, hash } = window.location;
    window.location.assign(localePath(target, stripLocale(pathname) + search) + hash);
  }

  const option = (target: Locale, text: string, title: string) => (
    <a
      href={hrefs[target]}
      hrefLang={target === "ms" ? "ms-MY" : "en-MY"}
      lang={target}
      title={title}
      aria-current={target === locale ? "true" : undefined}
      onClick={(event) => go(target, event)}
      className={`rounded-md px-2 py-1 text-xs font-bold transition ${
        target === locale ? "bg-ink text-white" : "text-slate-600 hover:bg-slate-100 hover:text-ink"
      }`}
    >
      {text}
    </a>
  );

  return (
    <div role="group" aria-label={label} className="flex shrink-0 items-center gap-0.5 rounded-lg border border-line bg-white p-0.5">
      {option("en", "EN", "Read in English")}
      {option("ms", "BM", "Baca dalam Bahasa Melayu")}
    </div>
  );
}
