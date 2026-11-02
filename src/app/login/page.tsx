import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { AuthForm } from "@/components/AuthForm";
import { getViewer } from "@/lib/auth";

export const metadata: Metadata = { title: "Log in" };

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ next?: string; error?: string }> }) {
  const { next = "/", error } = await searchParams;
  const safe = next.startsWith("/") && !next.startsWith("//") ? next : "/";
  if (await getViewer()) redirect(safe);
  return (
    <div className="py-6">
      <AuthForm mode="login" next={safe} notice={error === "confirm" ? "That confirmation link has expired. Log in or sign up again." : undefined} />
    </div>
  );
}
