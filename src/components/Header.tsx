import Image from "next/image";
import Link from "@/components/NavigationLink";
import { getViewer } from "@/lib/auth";
import { signOut } from "@/actions/auth";
import { SITE } from "@/lib/config";

export async function Header() {
  const viewer = await getViewer();
  const role = viewer?.profile?.role;

  return (
    <header className="sticky top-0 z-30 border-b border-line bg-white/85 backdrop-blur">
      <div className="mx-auto flex min-h-16 max-w-6xl items-center gap-3 px-4 py-1 sm:gap-4 sm:py-0">
        <Link prefetch={true} href="/tracker" aria-label={SITE.name} className="flex shrink-0 items-center">
          <Image
            src="/branding/manifesto-tracker-mark.webp"
            alt=""
            width={128}
            height={128}
            sizes="40px"
            loading="eager"
            className="h-10 w-10 object-contain sm:hidden"
          />
          <Image
            src="/branding/manifesto-tracker-logo.webp"
            alt=""
            width={720}
            height={188}
            sizes="192px"
            loading="eager"
            className="hidden h-auto w-48 sm:block"
          />
        </Link>

        <nav aria-label="Main navigation" className="ml-auto flex min-w-0 flex-wrap items-center justify-end gap-1 text-sm font-medium">
          <Link prefetch={true} href="/search" className="rounded-lg px-2 py-2 sm:px-3 text-slate-600 hover:bg-slate-100 hover:text-ink">
            Explore
          </Link>
          {viewer ? (
            <>
              <Link prefetch={true} href="/dashboard" className="rounded-lg px-2 py-2 sm:px-3 text-slate-600 hover:bg-slate-100 hover:text-ink">
                Dashboard
              </Link>
              {role === "admin" ? (
                <Link prefetch={true} href="/admin" className="rounded-lg px-2 py-2 sm:px-3 text-slate-600 hover:bg-slate-100 hover:text-ink">
                  Admin
                </Link>
              ) : null}
              {role === "rakyat" ? (
                <Link prefetch={true} href="/upgrade" className="hidden rounded-lg px-2 py-2 sm:px-3 text-brand-700 hover:bg-brand-50 lg:block">
                  For politicians
                </Link>
              ) : null}
              <form action={signOut}>
                <button className="rounded-lg px-2 py-2 sm:px-3 text-slate-600 hover:bg-slate-100 hover:text-ink">Log out</button>
              </form>
            </>
          ) : (
            <>
              <Link prefetch={true} href="/login" className="rounded-lg px-2 py-2 sm:px-3 text-slate-600 hover:bg-slate-100 hover:text-ink">
                Log in
              </Link>
              <Link prefetch={true} href="/signup" className="btn-primary px-2.5 py-2 sm:px-3.5">
                Sign up
              </Link>
            </>
          )}
        </nav>
      </div>
    </header>
  );
}
