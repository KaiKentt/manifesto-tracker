import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

// 1. Language: /ms/… serves the same pages in Bahasa Malaysia. The prefix is removed
//    internally and passed on as the x-locale request header; English has no prefix.
// 2. Refreshes the Supabase session cookie on every page request so that
//    Server Components always see a valid, logged-in user.
export async function proxy(request: NextRequest) {
  const { pathname, search } = request.nextUrl;

  // /en/… is the same as the unprefixed English page: send one canonical address.
  if (pathname === "/en" || pathname.startsWith("/en/")) {
    const url = request.nextUrl.clone();
    url.pathname = pathname.slice(3) || "/";
    return NextResponse.redirect(url, 308);
  }

  const isMalay = pathname === "/ms" || pathname.startsWith("/ms/");
  const internalPath = isMalay ? pathname.slice(3) || "/" : pathname;

  // Rebuilt whenever Supabase updates cookies, so the rewrite and headers are never lost.
  const forward = () => {
    const headers = new Headers(request.headers);
    headers.set("x-locale", isMalay ? "ms" : "en");
    headers.set("x-pathname", pathname);
    headers.set("x-search", search);
    if (!isMalay) return NextResponse.next({ request: { headers } });
    const url = request.nextUrl.clone();
    url.pathname = internalPath;
    return NextResponse.rewrite(url, { request: { headers } });
  };

  let response = forward();

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
  if (!url || !key) return response; // not configured yet: let the setup screen render

  const supabase = createServerClient(url, key, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet, headers) {
        cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
        response = forward();
        cookiesToSet.forEach(({ name, value, options }) => response.cookies.set(name, value, options));
        Object.entries(headers ?? {}).forEach(([k, v]) => response.headers.set(k, v));
      },
    },
  });

  // Do not run code between createServerClient and getClaims().
  await supabase.auth.getClaims();
  return response;
}

export const config = {
  matcher: [
    // Skip static files, crawler metadata, social images and the Stripe webhook.
    "/((?!_next/static|_next/image|favicon.ico|robots\\.txt$|sitemap\\.xml$|api/stripe/webhook|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|woff2?)$).*)",
  ],
};
