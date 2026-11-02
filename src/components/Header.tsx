import Link from "next/link";
import { getViewer } from "@/lib/auth";
import { signOut } from "@/actions/auth";
import { SITE } from "@/lib/config";

export async function Header() {
  const viewer = await getViewer();
  const role = viewer?.profile?.role;

  return (
    <header className="sticky top-0 z-30 border-b border-line bg-white/85 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-6xl items-center gap-4 px-4">
        <Link href="/" className="flex items-center gap-2 font-bold tracking-tight">
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-ink text-white">
            <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2" className="h-4 w-4" aria-hidden>
              <path d="M4 10.5 8 14.5 16 5.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </span>
          <span className="hidden sm:inline">{SITE.name}</span>
        </Link>

        <form action="/search" className="ml-2 hidden flex-1 sm:block sm:max-w-sm">
          <label htmlFor="q" className="sr-only">Search</label>
          <input id="q" name="q" placeholder="Search politicians, parties, coalitions…" className="input h-10 bg-slate-50" />
        </form>

        <nav className="ml-auto flex items-center gap-1 text-sm font-medium">
          <Link href="/search" aria-label="Search" className="rounded-lg p-2 text-slate-600 hover:bg-slate-100 sm:hidden">
            <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2" className="h-5 w-5" aria-hidden>
              <circle cx="9" cy="9" r="6" />
              <path d="m14 14 4 4" strokeLinecap="round" />
            </svg>
          </Link>
          <Link href="/search" className="hidden rounded-lg px-3 py-2 text-slate-600 hover:bg-slate-100 hover:text-ink md:block">
            Explore
          </Link>
          {viewer ? (
            <>
              <Link href="/dashboard" className="rounded-lg px-3 py-2 text-slate-600 hover:bg-slate-100 hover:text-ink">
                Dashboard
              </Link>
              {role === "admin" ? (
                <Link href="/admin" className="rounded-lg px-3 py-2 text-slate-600 hover:bg-slate-100 hover:text-ink">
                  Admin
                </Link>
              ) : null}
              {role === "rakyat" ? (
                <Link href="/upgrade" className="hidden rounded-lg px-3 py-2 text-brand-700 hover:bg-brand-50 lg:block">
                  For politicians
                </Link>
              ) : null}
              <form action={signOut}>
                <button className="rounded-lg px-3 py-2 text-slate-600 hover:bg-slate-100 hover:text-ink">Log out</button>
              </form>
            </>
          ) : (
            <>
              <Link href="/login" className="rounded-lg px-3 py-2 text-slate-600 hover:bg-slate-100 hover:text-ink">
                Log in
              </Link>
              <Link href="/signup" className="btn-primary px-3.5 py-2">
                Sign up
              </Link>
            </>
          )}
        </nav>
      </div>
    </header>
  );
}
