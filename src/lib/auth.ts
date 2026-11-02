import { redirect } from "next/navigation";
import { createClient } from "./supabase/server";
import type { Profile } from "./types";

export interface Viewer {
  userId: string;
  email: string | null;
  profile: Profile | null;
}

// The logged-in user and their profile, or null for visitors.
export async function getViewer(): Promise<Viewer | null> {
  const supabase = await createClient();
  const { data } = await supabase.auth.getUser();
  const user = data.user;
  if (!user) return null;
  const { data: profile } = await supabase.from("profiles").select("*").eq("id", user.id).maybeSingle();
  return { userId: user.id, email: user.email ?? null, profile: (profile as Profile) ?? null };
}

export async function requireViewer(next: string): Promise<Viewer> {
  const viewer = await getViewer();
  if (!viewer) redirect(`/login?next=${encodeURIComponent(next)}`);
  return viewer;
}

export async function requireAdmin(): Promise<Viewer> {
  const viewer = await requireViewer("/admin");
  if (viewer.profile?.role !== "admin") redirect("/");
  return viewer;
}

export function hasActiveSubscription(profile: Profile | null) {
  return profile?.subscription_status === "active" || profile?.subscription_status === "trialing";
}

// Which of these targets has the viewer upvoted?
export async function getVotedIds(type: "milestone" | "entity", ids: string[]): Promise<Set<string>> {
  if (!ids.length) return new Set();
  const supabase = await createClient();
  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) return new Set();
  const { data } = await supabase.from("votes").select("target_id").eq("target_type", type).in("target_id", ids);
  return new Set((data ?? []).map((v) => v.target_id as string));
}
