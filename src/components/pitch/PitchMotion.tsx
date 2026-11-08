"use client";

import { useEffect } from "react";

// One observer for the whole landing page:
// - reveals [data-reveal] elements as they scroll into view (skipped for reduced motion),
// - marks the nav link of the section being read.
// Content is fully visible without this script; it only hides what is still below the fold.
export function PitchMotion() {
  useEffect(() => {
    const root = document.querySelector<HTMLElement>(".pitch");
    if (!root || !("IntersectionObserver" in window)) return;
    const observers: IntersectionObserver[] = [];

    // Section the reader is in → aria-current on its nav link.
    const links = new Map<string, HTMLElement>();
    root.querySelectorAll<HTMLAnchorElement>('nav[aria-label="Pitch sections"] a[href^="#"]').forEach((a) => {
      links.set(a.getAttribute("href")!.slice(1), a);
    });
    const spy = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (!e.isIntersecting) continue;
          links.forEach((a, id) => (id === e.target.id ? a.setAttribute("aria-current", "true") : a.removeAttribute("aria-current")));
        }
      },
      { rootMargin: "-45% 0px -50% 0px" },
    );
    links.forEach((_, id) => {
      const section = document.getElementById(id);
      if (section) spy.observe(section);
    });
    observers.push(spy);

    if (!matchMedia("(prefers-reduced-motion: reduce)").matches) {
      const items = [...root.querySelectorAll<HTMLElement>("[data-reveal]")];
      const fold = window.innerHeight * 0.92;
      for (const el of items) if (el.getBoundingClientRect().top < fold) el.dataset.in = "";
      root.dataset.motion = "";
      const reveal = new IntersectionObserver(
        (entries) => {
          for (const e of entries) {
            if (!e.isIntersecting) continue;
            (e.target as HTMLElement).dataset.in = "";
            reveal.unobserve(e.target);
          }
        },
        { rootMargin: "0px 0px -8% 0px", threshold: 0.12 },
      );
      items.filter((el) => el.dataset.in === undefined).forEach((el) => reveal.observe(el));
      observers.push(reveal);
    }

    return () => observers.forEach((o) => o.disconnect());
  }, []);
  return null;
}
