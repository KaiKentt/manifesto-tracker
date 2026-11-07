import { cache } from "react";
import { createClient } from "./supabase/server";
import type { Entity } from "./types";

// Share the profile lookup between page content and metadata in one render.
export const getEntityBySlug = cache(async (slug: string): Promise<Entity | null> => {
  const supabase = await createClient();
  const { data } = await supabase.from("entities").select("*").eq("slug", slug).maybeSingle();
  return data as Entity | null;
});
