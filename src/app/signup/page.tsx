import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { AuthForm } from "@/components/AuthForm";
import { getViewer } from "@/lib/auth";
import { safeRedirectPath } from "@/lib/redirects";
import { localePath } from "@/lib/i18n";
import { getDictionary, getLocale } from "@/lib/i18n-server";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getDictionary();
  return { title: t.auth.signupTitle, robots: { index: false, follow: false } };
}

export default async function SignupPage({ searchParams }: { searchParams: Promise<{ next?: string }> }) {
  const [{ next }, locale] = await Promise.all([searchParams, getLocale()]);
  const safe = safeRedirectPath(next ?? localePath(locale, "/"));
  if (await getViewer()) redirect(safe);
  return (
    <div className="py-6">
      <AuthForm mode="signup" next={safe} />
    </div>
  );
}
