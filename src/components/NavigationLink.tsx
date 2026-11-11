"use client";

import Link from "next/link";
import { useState, type ComponentProps } from "react";
import { localePath } from "@/lib/i18n";
import { useLocale } from "./LocaleProvider";

// Prefetch a full dynamic page when someone points, focuses or touches its link.
// Ordinary viewport prefetching keeps using Next.js's lightweight loading shell.
// Internal links keep the reader's language: /e/pas becomes /ms/e/pas in Bahasa Malaysia.
export default function NavigationLink({
  href,
  prefetch,
  onMouseEnter,
  onFocus,
  onTouchStart,
  ...props
}: ComponentProps<typeof Link>) {
  const [intent, setIntent] = useState(false);
  const locale = useLocale();

  return (
    <Link
      {...props}
      href={typeof href === "string" ? localePath(locale, href) : href}
      prefetch={prefetch ?? (intent ? true : null)}
      onMouseEnter={(event) => {
        setIntent(true);
        onMouseEnter?.(event);
      }}
      onFocus={(event) => {
        setIntent(true);
        onFocus?.(event);
      }}
      onTouchStart={(event) => {
        setIntent(true);
        onTouchStart?.(event);
      }}
    />
  );
}
