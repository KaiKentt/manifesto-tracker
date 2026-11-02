import Link from "next/link";
import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { getVotedIds, getViewer } from "@/lib/auth";
import { MILESTONE_SELECT, type Entity, type EntityType, type Milestone } from "@/lib/types";
import { EntityCard } from "@/components/EntityCard";
import { MilestoneCard } from "@/components/MilestoneCard";
import { EmptyState } from "@/components/ui";

export const metadata: Metadata = { title: "Explore" };

const TABS: { key: "all" | EntityType; label: string }[] = [
  { key: "all", label: "All" },
  { key: "alliance", label: "Coalitions" },
  { key: "party", label: "Parties" },
  { key: "politician", label: "Politicians" },
];

// Strip characters that have meaning in PostgREST filter syntax.
function clean(q: string) {
  return q.replace(/[,()*%\\:"']/g, " ").replace(/\s+/g, " ").trim().slice(0, 60);
}

export default async function SearchPage({ searchParams }: { searchParams: Promise<{ q?: string; type?: string }> }) {
  const params = await searchParams;
  const q = clean(params.q ?? "");
  const type = (TABS.find((t) => t.key === params.type)?.key ?? "all") as "all" | EntityType;

  const supabase = await createClient();
  let entityQuery = supabase.from("entities").select("*").neq("type", "bloc").order("upvotes", { ascending: false }).order("name").limit(60);
  if (type !== "all") entityQuery = entityQuery.eq("type", type);
  if (q) {
    entityQuery = entityQuery.or(
      `name.ilike.%${q}%,short_name.ilike.%${q}%,position.ilike.%${q}%,constituency.ilike.%${q}%,state.ilike.%${q}%`,
    );
  }

  const [viewer, { data: entityRows }, { data: allNames }, milestoneRes] = await Promise.all([
    getViewer(),
    entityQuery,
    supabase.from("entities").select("id, name, short_name"),
    q ? supabase.from("milestones").select(MILESTONE_SELECT).ilike("title", `%${q}%`).order("upvotes", { ascending: false }).limit(8) : null,
  ]);

  const entities = (entityRows ?? []) as Entity[];
  const milestones = ((milestoneRes?.data ?? []) as unknown as Milestone[]);
  const nameOf = new Map((allNames ?? []).map((e) => [e.id as string, (e.short_name ?? e.name) as string]));
  const voted = await getVotedIds("milestone", milestones.map((m) => m.id));

  const tabHref = (key: string) => `/search?${new URLSearchParams({ ...(q ? { q } : {}), ...(key !== "all" ? { type: key } : {}) })}`;

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-extrabold tracking-tight">{q ? `Results for “${q}”` : "Explore"}</h1>
        <form action="/search" className="mt-4 flex max-w-xl gap-2">
          {type !== "all" ? <input type="hidden" name="type" value={type} /> : null}
          <input name="q" defaultValue={q} placeholder="Name, party, constituency or state" className="input h-11" />
          <button className="btn-primary h-11">Search</button>
        </form>
        <div className="mt-4 flex flex-wrap gap-2">
          {TABS.map((t) => (
            <Link
              key={t.key}
              href={tabHref(t.key)}
              className={`rounded-full px-3.5 py-1.5 text-sm font-semibold transition ${
                type === t.key ? "bg-ink text-white" : "border border-line bg-white text-slate-600 hover:text-ink"
              }`}
            >
              {t.label}
            </Link>
          ))}
        </div>
      </div>

      {entities.length ? (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {entities.map((e) => (
            <EntityCard key={e.id} entity={e} parentName={e.parent_id ? nameOf.get(e.parent_id) : null} />
          ))}
        </div>
      ) : (
        <EmptyState title="No profiles match that search">Try a shorter name, a party abbreviation, or a constituency.</EmptyState>
      )}

      {milestones.length ? (
        <section>
          <h2 className="section-title">Milestones mentioning “{q}”</h2>
          <div className="mt-4 grid gap-3 lg:grid-cols-2">
            {milestones.map((m) => (
              <MilestoneCard key={m.id} milestone={m} voted={voted.has(m.id)} loggedIn={Boolean(viewer)} compact />
            ))}
          </div>
        </section>
      ) : null}
    </div>
  );
}
