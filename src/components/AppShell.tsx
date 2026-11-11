"use client";

import { usePathname } from "next/navigation";
import { stripLocale } from "@/lib/i18n";

// Routes that bring their own full-page layout (no app header, main wrapper or footer).
const STANDALONE = ["/pitch"];
// Routes with full-width sections: header and footer stay, the page sets its own widths.
const WIDE = ["/", "/manifesto-pru"];

export function AppShell({
  configured,
  header,
  footer,
  setup,
  children,
}: {
  configured: boolean;
  header: React.ReactNode;
  footer: React.ReactNode;
  setup: React.ReactNode;
  children: React.ReactNode;
}) {
  const pathname = stripLocale(usePathname() ?? "/");
  const standalone = STANDALONE.some((p) => pathname === p || pathname.startsWith(`${p}/`));
  if (standalone) return <>{children}</>;
  const wide = configured && WIDE.includes(pathname);

  return (
    <>
      {configured ? header : null}
      <main className={wide ? "w-full flex-1" : "mx-auto w-full max-w-6xl flex-1 px-4 py-8"}>{configured ? children : setup}</main>
      {footer}
    </>
  );
}
