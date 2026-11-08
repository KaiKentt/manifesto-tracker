"use client";

import { useEffect, useRef, useState } from "react";
import { group, monthLabel } from "./format";

type Format = "rm" | "int" | "millions" | "thousands" | "month";

function format(n: number, kind: Format, decimals: number) {
  switch (kind) {
    case "rm":
      return `RM${group(n)}`;
    case "millions":
      return `RM${(n / 1e6).toFixed(decimals)}M`;
    case "thousands":
      return `RM${(n / 1e3).toFixed(decimals)}K`;
    case "month":
      return monthLabel(Math.max(1, Math.round(n)));
    default:
      return group(n);
  }
}

/**
 * Renders the final value on the server and for reduced motion.
 * Off-screen at load, it counts up from `from` the first time it scrolls into view.
 * The final value reserves the width, so nothing around it shifts while counting.
 */
export function CountUp({
  to,
  from = 0,
  kind = "int",
  decimals = 0,
  suffix = "",
  duration = 1400,
}: {
  to: number;
  from?: number;
  kind?: Format;
  decimals?: number;
  suffix?: string;
  duration?: number;
}) {
  const ref = useRef<HTMLSpanElement>(null);
  const [value, setValue] = useState(to);

  useEffect(() => {
    const el = ref.current;
    if (!el || !("IntersectionObserver" in window) || matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const r = el.getBoundingClientRect();
    if (r.top < window.innerHeight && r.bottom > 0) return; // already on screen: keep the final value
    setValue(from);
    let raf = 0;
    const io = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting) return;
        io.disconnect();
        const start = performance.now();
        const tick = (now: number) => {
          const p = Math.min(1, (now - start) / duration);
          const eased = 1 - Math.pow(1 - p, 3);
          setValue(from + (to - from) * eased);
          if (p < 1) raf = requestAnimationFrame(tick);
        };
        raf = requestAnimationFrame(tick);
      },
      { threshold: 0.6 },
    );
    io.observe(el);
    return () => {
      io.disconnect();
      cancelAnimationFrame(raf);
    };
  }, [to, from, duration]);

  const final = format(to, kind, decimals) + suffix;
  return (
    <span
      ref={ref}
      className="relative inline-block whitespace-nowrap"
      data-count-to={to}
      data-count-from={from}
      data-count-kind={kind}
      data-count-decimals={decimals}
      data-count-suffix={suffix}
    >
      <span className="invisible">{final}</span>
      <span aria-hidden className="absolute inset-0">
        {format(value, kind, decimals) + suffix}
      </span>
      <span className="sr-only">{final}</span>
    </span>
  );
}
