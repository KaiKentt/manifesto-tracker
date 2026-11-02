import type { Metadata } from "next";
import Link from "next/link";
import "./globals.css";
import { Header } from "@/components/Header";
import { SITE, isSupabaseConfigured } from "@/lib/config";

export const metadata: Metadata = {
  title: { default: `${SITE.name} — ${SITE.country}`, template: `%s · ${SITE.name}` },
  description: "Track the manifesto pledges of Malaysia's government, opposition, coalitions, parties and politicians.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  const configured = isSupabaseConfigured();
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap"
        />
      </head>
      <body className="flex min-h-screen flex-col">
        {configured ? <Header /> : null}
        <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-8">{configured ? children : <SetupNotice />}</main>
        <footer className="border-t border-line bg-white">
          <div className="mx-auto flex max-w-6xl flex-col gap-2 px-4 py-6 text-xs text-muted sm:flex-row sm:items-center sm:justify-between">
            <p>
              {SITE.name} is independent and non-partisan. <strong className="text-slate-600">Editorial</strong> records are curated with
              sources; <strong className="text-brand-700">self-reported</strong> records come from politicians and are not verified.
            </p>
            <Link href="/search" className="hover:text-ink">Explore all profiles</Link>
          </div>
        </footer>
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
