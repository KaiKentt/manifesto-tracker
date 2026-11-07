import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { safeRedirectPath } from "@/lib/redirects";

// Supabase returns here after Google sign-in or email confirmation.
export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const next = safeRedirectPath(searchParams.get("next"));

  if (code && !searchParams.has("error")) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) return NextResponse.redirect(`${origin}${next}`);
  }
  const login = new URL("/login", origin);
  login.searchParams.set("error", searchParams.get("provider") === "google" ? "google" : "confirm");
  login.searchParams.set("next", next);
  return NextResponse.redirect(login);
}
