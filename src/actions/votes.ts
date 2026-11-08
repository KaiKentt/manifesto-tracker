"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getCurrentUser } from "@/lib/auth";

export type VoteResult = { ok: true; voted: boolean; count: number } | { ok: false; reason: "login" | "error"; message?: string };

// Toggle the viewer's upvote on a milestone or an entity.
// Row Level Security guarantees a user can only add or remove their own vote;
// a database trigger keeps the counter in sync.
export async function toggleVote(targetType: "milestone" | "entity", targetId: string): Promise<VoteResult> {
  const supabase = await createClient();
  const user = await getCurrentUser();
  if (!user) return { ok: false, reason: "login" };

  const { data: existing } = await supabase
    .from("votes")
    .select("target_id")
    .eq("target_type", targetType)
    .eq("target_id", targetId)
    .maybeSingle();

  const { error } = existing
    ? await supabase.from("votes").delete().eq("target_type", targetType).eq("target_id", targetId)
    : await supabase.from("votes").insert({ target_type: targetType, target_id: targetId });
  if (error) return { ok: false, reason: "error", message: error.message };

  const table = targetType === "milestone" ? "milestones" : "entities";
  const { data: row } = await supabase.from(table).select("upvotes").eq("id", targetId).maybeSingle();

  revalidatePath("/tracker", "page");
  revalidatePath("/e/[slug]", "page");
  revalidatePath("/search", "page");
  revalidatePath("/dashboard", "page");
  return { ok: true, voted: !existing, count: row?.upvotes ?? 0 };
}
