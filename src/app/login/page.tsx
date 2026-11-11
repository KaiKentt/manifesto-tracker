import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { AuthForm } from "@/components/AuthForm";
import { getViewer } from "@/lib/auth";
import { safeRedirectPath } from "@/lib/redirects";
import { localePath } from "@/lib/i18n";
import { getDictionary, getLocale } from "@/lib/i18n-server";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getDictionary();
  return { title: t.auth.loginTitle, robots: { index: false, follow: false } };
}

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ next?: string; error?: string }> }) {
  const [{ next, error }, locale, t] = await Promise.all([searchParams, getLocale(), getDictionary()]);
  const safe = safeRedirectPath(next ?? localePath(locale, "/"));
  const notice = error === "google" ? t.auth.googleError : error === "confirm" ? t.auth.confirmError : undefined;
  if (await getViewer()) redirect(safe);
  return (
    <div className="py-6">
      <AuthForm mode="login" next={safe} notice={notice} />
    </div>
  );
}
