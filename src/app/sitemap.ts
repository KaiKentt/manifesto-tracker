import { createClient } from "@supabase/supabase-js";
import type { MetadataRoute } from "next";
import { SITE } from "@/lib/config";
import { localePath } from "@/lib/i18n";

export const revalidate = 3600;

const MAX_URLS = 50_000;
const BATCH_SIZE = 500;

// Every public page in English and Bahasa Malaysia, each listing the other as its alternate.
function both(path: string, lastModified?: string): MetadataRoute.Sitemap {
  const en = `${SITE.origin}${localePath("en", path)}`;
  const ms = `${SITE.origin}${localePath("ms", path)}`;
  const alternates = { languages: { "en-MY": en, "ms-MY": ms } };
  return [
    { url: en, alternates, ...(lastModified ? { lastModified } : {}) },
    { url: ms, alternates, ...(lastModified ? { lastModified } : {}) },
  ];
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
  if (!url || !key) return ["/", "/manifesto-pru", "/search"].flatMap((path) => both(path));

  const supabase = createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
  });

  const { data: latest } = await supabase
    .from("milestones")
    .select("updated_at")
    .eq("is_sample", false)
    .order("updated_at", { ascending: false })
    .limit(1);
  const updated = latest?.[0]?.updated_at as string | undefined;
  const pages = [...both("/", updated), ...both("/manifesto-pru", updated), ...both("/search")];

  let lastSlug = "";
  while (pages.length < MAX_URLS) {
    const limit = Math.min(BATCH_SIZE, (MAX_URLS - pages.length) / 2);
    const { data, error } = await supabase
      .from("entities")
      .select("slug, updated_at")
      .not("description", "is", null)
      .neq("description", "")
      .gt("slug", lastSlug)
      .order("slug")
      .limit(limit);

    if (error) throw new Error(`Could not load public profiles for the sitemap: ${error.message}`);
    for (const { slug, updated_at } of data) {
      pages.push(...both(`/e/${encodeURIComponent(slug)}`, updated_at));
    }
    if (data.length < limit) break;
    lastSlug = data[data.length - 1].slug;
  }

  return pages;
}
