import { createClient } from "@supabase/supabase-js";
import type { MetadataRoute } from "next";
import { SITE } from "@/lib/config";

export const revalidate = 3600;

const MAX_URLS = 50_000;
const BATCH_SIZE = 500;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const pages = ["/", "/tracker", "/search"].map((path) => ({ url: `${SITE.origin}${path}` }));
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
  if (!url || !key) return pages;

  const supabase = createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
  });

  let lastSlug = "";
  while (pages.length < MAX_URLS) {
    const limit = Math.min(BATCH_SIZE, MAX_URLS - pages.length);
    const { data, error } = await supabase
      .from("entities")
      .select("slug")
      .not("description", "is", null)
      .neq("description", "")
      .gt("slug", lastSlug)
      .order("slug")
      .limit(limit);

    if (error) throw new Error(`Could not load public profiles for the sitemap: ${error.message}`);
    for (const { slug } of data) {
      pages.push({ url: `${SITE.origin}/e/${encodeURIComponent(slug)}` });
    }
    if (data.length < limit) break;
    lastSlug = data[data.length - 1].slug;
  }

  return pages;
}
