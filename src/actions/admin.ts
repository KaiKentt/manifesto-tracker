"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { slugify } from "@/lib/politician";
import { CATEGORIES, STATUSES, type MilestoneStatus } from "@/lib/config";
import { fail, type FormState } from "@/lib/forms";

// Every action re-checks that the caller is an admin before using the
// secret-key client, which bypasses Row Level Security.

async function uniqueSlug(admin: ReturnType<typeof createAdminClient>, base: string) {
  let slug = slugify(base);
  for (let i = 2; i < 50; i++) {
    const { data } = await admin.from("entities").select("id").eq("slug", slug).maybeSingle();
    if (!data) return slug;
    slug = `${slugify(base)}-${i}`;
  }
  return `${slugify(base)}-${Date.now()}`;
}

export async function approveRequest(formData: FormData) {
  await requireAdmin();
  const admin = createAdminClient();
  const requestId = String(formData.get("id") ?? "");

  const { data: req } = await admin.from("politician_requests").select("*").eq("id", requestId).single();
  if (!req || req.status !== "pending_review") return;

  let entityId: string | null = null;

  if (req.claim_entity_id) {
    // Claim an existing editorial profile, only if nobody owns it yet.
    const { data: claimed } = await admin
      .from("entities")
      .update({ owner_id: req.user_id })
      .eq("id", req.claim_entity_id)
      .is("owner_id", null)
      .select("id");
    entityId = claimed?.[0]?.id ?? null;
  }

  if (!entityId) {
    const { data: party } = req.party_id
      ? await admin.from("entities").select("id, bloc").eq("id", req.party_id).maybeSingle()
      : { data: null };
    const { data: created, error } = await admin
      .from("entities")
      .insert({
        type: "politician",
        slug: await uniqueSlug(admin, req.full_name),
        name: req.full_name,
        bloc: party?.bloc ?? "independent",
        parent_id: party?.id ?? null,
        position: req.position,
        constituency: req.constituency,
        description: req.bio,
        owner_id: req.user_id,
      })
      .select("id")
      .single();
    if (error) throw error;
    entityId = created.id;
  }

  await admin.from("profiles").update({ politician_entity_id: entityId }).eq("id", req.user_id);
  await admin.from("politician_requests").update({ status: "approved", admin_note: null }).eq("id", requestId);
  revalidatePath("/admin");
  revalidatePath("/");
}

export async function rejectRequest(formData: FormData) {
  await requireAdmin();
  const admin = createAdminClient();
  const requestId = String(formData.get("id") ?? "");
  const note = String(formData.get("note") ?? "").trim().slice(0, 500) || null;
  await admin.from("politician_requests").update({ status: "rejected", admin_note: note }).eq("id", requestId);
  revalidatePath("/admin");
}

export async function addEditorialMilestone(_prev: FormState, formData: FormData): Promise<FormState> {
  await requireAdmin();
  const admin = createAdminClient();
  const title = String(formData.get("title") ?? "").trim().slice(0, 200);
  const entityId = String(formData.get("entity_id") ?? "");
  if (title.length < 3 || !entityId) return fail("Pick an entity and give the milestone a title.", formData);

  const status = String(formData.get("status") ?? "pledged") as MilestoneStatus;
  const category = String(formData.get("category") ?? "Other");
  const evidence = String(formData.get("evidence_url") ?? "").trim();
  const progress = Math.max(0, Math.min(100, Number(formData.get("progress") ?? 0) || 0));

  const { error } = await admin.from("milestones").insert({
    entity_id: entityId,
    title,
    description: String(formData.get("description") ?? "").trim().slice(0, 2000) || null,
    category: (CATEGORIES as readonly string[]).includes(category) ? category : "Other",
    status: (STATUSES as readonly string[]).includes(status) ? status : "pledged",
    progress: status === "achieved" ? 100 : progress,
    target_date: String(formData.get("target_date") ?? "") || null,
    evidence_url: /^https?:\/\//i.test(evidence) ? evidence : null,
    source_type: "editorial",
  });
  if (error) return fail(error.message, formData);
  revalidatePath("/", "layout");
  return { message: "Editorial milestone added." };
}
