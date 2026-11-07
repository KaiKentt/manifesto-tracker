"use client";

import Link from "next/link";
import { useState, type ComponentProps } from "react";

// Prefetch a full dynamic page when someone points, focuses or touches its link.
// Ordinary viewport prefetching keeps using Next.js's lightweight loading shell.
export default function NavigationLink({
  prefetch,
  onMouseEnter,
  onFocus,
  onTouchStart,
  ...props
}: ComponentProps<typeof Link>) {
  const [intent, setIntent] = useState(false);

  return (
    <Link
      {...props}
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
