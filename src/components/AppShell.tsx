"use client";

import { usePathname } from "next/navigation";

// Routes that bring their own full-page layout (no app header, main wrapper or footer).
const STANDALONE = ["/pitch"];

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
  const pathname = usePathname() ?? "/";
  const standalone = pathname === "/" || STANDALONE.some((p) => pathname === p || pathname.startsWith(`${p}/`));
  if (standalone) return <>{children}</>;

  return (
    <>
      {configured ? header : null}
      <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-8">{configured ? children : setup}</main>
      {footer}
    </>
  );
}
