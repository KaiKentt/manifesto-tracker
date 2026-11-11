import type { Metadata, Viewport } from "next";
import localFont from "next/font/local";
import { Suspense } from "react";
import Link from "@/components/NavigationLink";
import "./globals.css";
import { Header } from "@/components/Header";
import { AppShell } from "@/components/AppShell";
import { LocaleProvider } from "@/components/LocaleProvider";
import { SITE, isSupabaseConfigured } from "@/lib/config";
import { HTML_LANG, OG_LOCALE } from "@/lib/i18n";
import { getDictionary, getLocale } from "@/lib/i18n-server";

// Self-hosted (no request to Google Fonts), so text renders sooner and never shifts.
const jakarta = localFont({
  src: "./fonts/PlusJakartaSans-latin-variable.woff2",
  weight: "200 800",
  style: "normal",
  display: "swap",
  variable: "--font-jakarta",
  fallback: ["ui-sans-serif", "system-ui", "-apple-system", "Segoe UI", "Roboto", "Helvetica Neue", "Arial", "sans-serif"],
});

export async function generateMetadata(): Promise<Metadata> {
  const [locale, t] = await Promise.all([getLocale(), getDictionary()]);
  return {
    metadataBase: new URL(SITE.origin),
    title: { default: t.meta.homeTitle, template: `%s | ${t.brand.full}` },
    description: t.meta.defaultDescription,
    applicationName: t.brand.full,
    openGraph: {
      type: "website",
      siteName: t.brand.full,
      locale: OG_LOCALE[locale],
      alternateLocale: [OG_LOCALE[locale === "en" ? "ms" : "en"]],
    },
    twitter: { card: "summary_large_image" },
    verification: { google: "YoHXYCZsD5VRbAeDNCTiQdsIVcltfKLRLWfN4esu_rw" },
  };
}

export const viewport: Viewport = { themeColor: "#ffffff" };

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const configured = isSupabaseConfigured();
  const [locale, t] = await Promise.all([getLocale(), getDictionary()]);
  return (
    <html lang={HTML_LANG[locale]} className={jakarta.variable}>
      <body className="flex min-h-screen flex-col">
        <LocaleProvider locale={locale}>
          <AppShell
            configured={configured}
            header={
              configured ? (
                <Suspense fallback={<header aria-label="Loading navigation" className="sticky top-0 z-30 h-16 border-b border-line bg-white" />}>
                  <Header />
                </Suspense>
              ) : null
            }
            setup={<SetupNotice />}
            footer={
              <footer className="border-t border-line bg-white">
                <div className="mx-auto flex max-w-6xl flex-col gap-3 px-4 py-6 text-xs text-muted sm:flex-row sm:items-center sm:justify-between">
                  <div className="space-y-1">
                    <p className="font-semibold text-slate-600">{t.brand.full}</p>
                    <p>
                      {t.footer.about(SITE.name)} <strong className="text-slate-600">{t.footer.editorial}</strong>
                      {t.footer.editorialRest}
                      <strong className="text-brand-700">{t.footer.selfReported}</strong>
                      {t.footer.selfReportedRest}
                    </p>
                  </div>
                  <nav aria-label={t.footer.explore} className="flex shrink-0 gap-4">
                    <Link href="/manifesto-pru" className="hover:text-ink">{t.footer.hub}</Link>
                    <Link href="/search" className="hover:text-ink">{t.footer.explore}</Link>
                  </nav>
                </div>
              </footer>
            }
          >
            {children}
          </AppShell>
        </LocaleProvider>
      </body>
    </html>
  );
}

function SetupNotice() {
  return (
    <div className="card mx-auto max-w-xl p-8">
      <h1 className="text-xl font-bold">Almost there — connect the database</h1>
      <p className="mt-2 text-sm text-muted">
        The app is deployed, but the Supabase environment variables are missing. Add these in Vercel → Project → Settings →
        Environment Variables (or in <code>.env.local</code> when running locally), then redeploy:
      </p>
      <ul className="mt-4 space-y-1 font-mono text-xs">
        <li>NEXT_PUBLIC_SUPABASE_URL</li>
        <li>NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY</li>
        <li>SUPABASE_SECRET_KEY</li>
        <li>NEXT_PUBLIC_SITE_URL</li>
      </ul>
      <p className="mt-4 text-sm text-muted">The README in the repository walks through each step.</p>
    </div>
  );
}
