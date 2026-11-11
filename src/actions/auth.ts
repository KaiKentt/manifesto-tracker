"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { siteUrl } from "@/lib/config";
import { safeRedirectPath } from "@/lib/redirects";
import { fail, type FormState } from "@/lib/forms";
import { getDictionary, getLocale } from "@/lib/i18n-server";
import { localePath } from "@/lib/i18n";

export type { FormState };

function safeNext(value: FormDataEntryValue | null) {
  return safeRedirectPath(typeof value === "string" ? value : null);
}

export async function signIn(_prev: FormState, formData: FormData): Promise<FormState> {
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");
  const t = (await getDictionary()).auth;
  if (!email || !password) return fail(t.enterBoth, formData);

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) return fail(error.message, formData);

  revalidatePath("/", "layout");
  redirect(safeNext(formData.get("next")));
}

export async function signUp(_prev: FormState, formData: FormData): Promise<FormState> {
  const displayName = String(formData.get("display_name") ?? "").trim();
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");
  const t = (await getDictionary()).auth;
  if (!email || password.length < 8) return fail(t.invalidSignup, formData);

  const supabase = await createClient();
  const next = safeNext(formData.get("next"));
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: { display_name: displayName || undefined },
      emailRedirectTo: `${siteUrl()}/auth/callback?next=${encodeURIComponent(next)}`,
    },
  });
  if (error) return fail(error.message, formData);

  // Email confirmation on (Supabase default): no session yet.
  if (!data.session) return { message: t.checkInbox };

  revalidatePath("/", "layout");
  redirect(next);
}

export async function signInWithGoogle(_prev: FormState, formData: FormData): Promise<FormState> {
  // Check the provider before redirecting so incomplete setup stays on this form.
  const t = (await getDictionary()).auth;
  try {
    const response = await fetch(`${process.env.NEXT_PUBLIC_SUPABASE_URL}/auth/v1/settings`, {
      headers: { apikey: process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY! },
      cache: "no-store",
      signal: AbortSignal.timeout(5000),
    });
    if (!response.ok) throw new Error("Could not check authentication settings");
    const settings = await response.json();
    if (!settings.external?.google) {
      return { error: t.googleSetup };
    }
  } catch {
    return { error: t.googleUnavailable };
  }

  const callback = new URL("/auth/callback", siteUrl());
  callback.searchParams.set("next", safeNext(formData.get("next")));
  callback.searchParams.set("provider", "google");

  const supabase = await createClient();
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: "google",
    options: {
      redirectTo: callback.toString(),
      queryParams: { prompt: "select_account" },
    },
  });

  if (error || !data.url) {
    return { error: t.googleUnavailable };
  }

  redirect(data.url);
}

export async function signOut() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  revalidatePath("/", "layout");
  redirect(localePath(await getLocale(), "/"));
}
