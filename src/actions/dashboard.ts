"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { CATEGORIES } from "@/lib/config";
import { parseProgress, parseStatus } from "@/lib/milestones";
import { fail, type FormState } from "@/lib/forms";

// All writes here run as the logged-in politician. Row Level Security only
// lets them through when the politician owns the profile and their
// subscription is active, so these actions need no extra checks to be safe.

function str(formData: FormData, key: string, max = 500) {
  const value = String(formData.get(key) ?? "").trim().slice(0, max);
  return value || null;
}

function milestoneFields(formData: FormData) {
  const title = str(formData, "title", 200);
  const status = parseStatus(formData.get("status"));
  const category = String(formData.get("category") ?? "Other");
  const progress = parseProgress(formData.get("progress"));
  const evidence = str(formData, "evidence_url", 500);
  return {
    title,
    description: str(formData, "description", 2000),
    category: (CATEGORIES as readonly string[]).includes(category) ? category : "Other",
    status,
    progress,
    target_date: str(formData, "target_date", 10),
    evidence_url: evidence && /^https?:\/\//i.test(evidence) ? evidence : null,
  };
}

async function entitySlug(entityId: string) {
  const supabase = await createClient();
  const { data } = await supabase.from("entities").select("slug").eq("id", entityId).maybeSingle();
  return data?.slug as string | undefined;
}

function refresh(slug?: string) {
  revalidatePath("/dashboard");
  revalidatePath("/");
  if (slug) revalidatePath(`/e/${slug}`);
}

export async function updateOwnProfile(_prev: FormState, formData: FormData): Promise<FormState> {
  const entityId = String(formData.get("entity_id") ?? "");
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("entities")
    .update({
      description: str(formData, "description", 2000),
      position: str(formData, "position", 120),
      constituency: str(formData, "constituency", 120),
      state: str(formData, "state", 60),
      website: str(formData, "website", 300),
    })
    .eq("id", entityId)
    .select("slug");
  if (error) return fail(error.message, formData);
  if (!data?.length) return fail("You can only edit your own profile while your subscription is active.", formData);
  refresh(data[0].slug);
  return { message: "Profile saved." };
}

export async function createMilestone(_prev: FormState, formData: FormData): Promise<FormState> {
  const entityId = String(formData.get("entity_id") ?? "");
  const fields = milestoneFields(formData);
  if (!fields.title || fields.title.length < 3) return fail("Give the milestone a title (3+ characters).", formData);

  const supabase = await createClient();
  const { error } = await supabase.from("milestones").insert({ entity_id: entityId, ...fields });
  if (error) {
    return fail(error.message.includes("row-level security")
        ? "Publishing is locked. Check that your profile is approved and your subscription is active."
        : error.message, formData);
  }
  refresh(await entitySlug(entityId));
  return { message: "Milestone published." };
}

export async function updateMilestone(_prev: FormState, formData: FormData): Promise<FormState> {
  const id = String(formData.get("id") ?? "");
  const fields = milestoneFields(formData);
  if (!fields.title || fields.title.length < 3) return fail("Give the milestone a title (3+ characters).", formData);

  const supabase = await createClient();
  const { data, error } = await supabase.from("milestones").update(fields).eq("id", id).select("entity_id");
  if (error) return fail(error.message, formData);
  if (!data?.length) return fail("You can only edit your own self-reported milestones.", formData);
  refresh(await entitySlug(data[0].entity_id));
  return { message: "Saved." };
}

export async function deleteMilestone(formData: FormData) {
  const id = String(formData.get("id") ?? "");
  const supabase = await createClient();
  const { data } = await supabase.from("milestones").delete().eq("id", id).select("entity_id");
  refresh(data?.[0] ? await entitySlug(data[0].entity_id) : undefined);
}
