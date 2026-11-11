import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { AuthForm } from "@/components/AuthForm";
import { getViewer } from "@/lib/auth";
import { safeRedirectPath } from "@/lib/redirects";

export const metadata: Metadata = { title: "Log in", robots: { index: false, follow: false } };

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ next?: string; error?: string }> }) {
  const { next = "/tracker", error } = await searchParams;
  const safe = safeRedirectPath(next);
  const notice = error === "google"
    ? "Google sign-in could not be completed. Please try again or use your email."
    : error === "confirm" ? "That confirmation link has expired. Log in or sign up again." : undefined;
  if (await getViewer()) redirect(safe);
  return (
    <div className="py-6">
      <AuthForm mode="login" next={safe} notice={notice} />
    </div>
  );
}
