import { redirect } from "next/navigation";
import { cache } from "react";
import { createClient } from "./supabase/server";
import type { Profile } from "./types";

export interface Viewer {
  userId: string;
  email: string | null;
  profile: Profile | null;
}

// React cache is scoped to one server render, including metadata and the header.
// Authentication and private profiles are checked afresh on the next request.
export const getCurrentUser = cache(async () => {
  const supabase = await createClient();
  const { data } = await supabase.auth.getUser();
  return data.user;
});

export const getViewer = cache(async (): Promise<Viewer | null> => {
  const [supabase, user] = await Promise.all([createClient(), getCurrentUser()]);
  if (!user) return null;
  const { data: profile } = await supabase.from("profiles").select("*").eq("id", user.id).maybeSingle();
  return { userId: user.id, email: user.email ?? null, profile: (profile as Profile) ?? null };
});

export async function requireViewer(next: string): Promise<Viewer> {
  const viewer = await getViewer();
  if (!viewer) redirect(`/login?next=${encodeURIComponent(next)}`);
  return viewer;
}

export async function requireAdmin(): Promise<Viewer> {
  const viewer = await requireViewer("/admin");
  if (viewer.profile?.role !== "admin") redirect("/tracker");
  return viewer;
}

export function hasActiveSubscription(profile: Profile | null) {
  return profile?.subscription_status === "active" || profile?.subscription_status === "trialing";
}

// Which of these targets has the viewer upvoted?
export async function getVotedIds(type: "milestone" | "entity", ids: string[]): Promise<Set<string>> {
  if (!ids.length) return new Set();
  const user = await getCurrentUser();
  if (!user) return new Set();
  const supabase = await createClient();
  const { data } = await supabase.from("votes").select("target_id").eq("target_type", type).in("target_id", ids);
  return new Set((data ?? []).map((v) => v.target_id as string));
}
