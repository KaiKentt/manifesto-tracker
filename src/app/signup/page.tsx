import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { AuthForm } from "@/components/AuthForm";
import { getViewer } from "@/lib/auth";
import { safeRedirectPath } from "@/lib/redirects";

export const metadata: Metadata = { title: "Sign up" };

export default async function SignupPage({ searchParams }: { searchParams: Promise<{ next?: string }> }) {
  const { next = "/" } = await searchParams;
  const safe = safeRedirectPath(next);
  if (await getViewer()) redirect(safe);
  return (
    <div className="py-6">
      <AuthForm mode="signup" next={safe} />
    </div>
  );
}
