import { ImageResponse } from "next/og";
import { createClient } from "@supabase/supabase-js";
import { achievementSummary } from "@/lib/milestones";
import { dictionary } from "@/lib/dictionaries";
import type { Entity, Milestone } from "@/lib/types";
import { GOLD, OG_SIZE, OgFrame, ogAssets } from "@/lib/og";

export const alt = "Profile summary on Manifesto Tracker by Akar";
export const size = OG_SIZE;
export const contentType = "image/png";

// Public data only, read with the publishable key (Row Level Security applies).
async function load(slug: string) {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
  if (!url || !key) return null;
  const supabase = createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false } });
  const { data: entity } = await supabase.from("entities").select("*").eq("slug", slug).maybeSingle();
  if (!entity) return null;
  const e = entity as Entity;
  let scope = [e.id];
  if (e.type === "bloc") {
    const { data } = await supabase.from("entities").select("id").eq("bloc", e.bloc);
    scope = (data ?? []).map((r) => r.id as string);
  } else if (e.type !== "politician") {
    const { data: children } = await supabase.from("entities").select("id").eq("parent_id", e.id);
    const childIds = (children ?? []).map((r) => r.id as string);
    const { data: grand } = childIds.length ? await supabase.from("entities").select("id").in("parent_id", childIds) : { data: [] };
    scope = [e.id, ...childIds, ...(grand ?? []).map((r) => r.id as string)];
  }
  const { data: rows } = await supabase.from("milestones").select("status").in("entity_id", scope).eq("is_sample", false);
  return { entity: e, milestones: (rows ?? []) as Pick<Milestone, "status">[] };
}

export default async function Image({ params }: { params: Promise<{ slug: string }> }) {
  const [{ slug }, { fonts, logo }] = await Promise.all([params, ogAssets()]);
  const data = await load(slug);
  const en = dictionary("en");
  const ms = dictionary("ms");

  if (!data) {
    return new ImageResponse(
      (
        <OgFrame logo={logo}>
          <div style={{ display: "flex", fontSize: 72, fontWeight: 800 }}>Manifesto Malaysia & PRU tracker</div>
        </OgFrame>
      ),
      { ...size, fonts },
    );
  }

  const { entity, milestones } = data;
  const { counts, rate } = achievementSummary(milestones);
  const subtitle = [`${en.type[entity.type]} · ${ms.type[entity.type]}`, entity.type === "politician" ? entity.constituency : entity.short_name]
    .filter(Boolean)
    .join("  |  ");
  const stats = [
    { value: String(milestones.length), label: "Records · Rekod" },
    { value: rate === null ? "—" : `${rate}%`, label: "Achieved · Tercapai" },
    { value: String(counts.in_progress), label: "In progress · Sedang berjalan" },
  ];
  const nameSize = entity.name.length > 34 ? 56 : entity.name.length > 22 ? 66 : 76;

  return new ImageResponse(
    (
      <OgFrame logo={logo}>
        <div style={{ display: "flex", fontSize: 28, color: GOLD, fontWeight: 800 }}>{subtitle}</div>
        <div style={{ display: "flex", marginTop: 14, fontSize: nameSize, fontWeight: 800, lineHeight: 1.05, letterSpacing: -1.5 }}>{entity.name}</div>
        <div style={{ display: "flex", marginTop: 40, gap: 56 }}>
          {stats.map((s) => (
            <div key={s.label} style={{ display: "flex", flexDirection: "column" }}>
              <div style={{ display: "flex", fontSize: 56, fontWeight: 800 }}>{s.value}</div>
              <div style={{ display: "flex", fontSize: 24, color: "rgba(255,255,255,0.72)" }}>{s.label}</div>
            </div>
          ))}
        </div>
      </OgFrame>
    ),
    { ...size, fonts },
  );
}
