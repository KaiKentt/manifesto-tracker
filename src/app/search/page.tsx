import Form from "next/form";
import Link from "@/components/NavigationLink";
import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getVotedIds, getViewer } from "@/lib/auth";
import { MILESTONE_SELECT, type Entity, type EntityType, type Milestone } from "@/lib/types";
import { EntityCard } from "@/components/EntityCard";
import { MilestoneCard } from "@/components/MilestoneCard";
import { EmptyState } from "@/components/ui";

export const metadata: Metadata = { title: "Explore" };

const PAGE_SIZE = 60;

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

export default async function SearchPage({ searchParams }: { searchParams: Promise<{ q?: string; type?: string; page?: string }> }) {
  const params = await searchParams;
  const q = clean(params.q ?? "");
  const type = (TABS.find((t) => t.key === params.type)?.key ?? "all") as "all" | EntityType;

  const requestedPage = /^\d+$/.test(params.page ?? "") ? Number(params.page) : 1;
  const page = Number.isSafeInteger(requestedPage) && requestedPage > 0 && requestedPage <= 10000 ? requestedPage : 1;
  const searchHref = (key: string, targetPage = 1) => `/search?${new URLSearchParams({
    ...(q ? { q } : {}),
    ...(key !== "all" ? { type: key } : {}),
    ...(targetPage > 1 ? { page: String(targetPage) } : {}),
  })}`;

  const supabase = await createClient();
  let entityQuery = supabase.from("entities").select("*", { count: "exact" }).neq("type", "bloc").order("upvotes", { ascending: false }).order("name").order("id").range((page - 1) * PAGE_SIZE, page * PAGE_SIZE - 1);
  if (type !== "all") entityQuery = entityQuery.eq("type", type);
  if (q) {
    entityQuery = entityQuery.or(
      `name.ilike.%${q}%,short_name.ilike.%${q}%,position.ilike.%${q}%,constituency.ilike.%${q}%,state.ilike.%${q}%`,
    );
  }

  const [viewer, { data: entityRows, count }, { data: allNames }, milestoneRes] = await Promise.all([
    getViewer(),
    entityQuery,
    supabase.from("entities").select("id, name, short_name"),
    q ? supabase.from("milestones").select(MILESTONE_SELECT).ilike("title", `%${q}%`).order("upvotes", { ascending: false }).limit(8) : null,
  ]);

  const total = count ?? 0;
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  if (page > totalPages) redirect(searchHref(type, totalPages));

  const entities = (entityRows ?? []) as Entity[];
  const milestones = ((milestoneRes?.data ?? []) as unknown as Milestone[]);
  const nameOf = new Map((allNames ?? []).map((e) => [e.id as string, (e.short_name ?? e.name) as string]));
  const voted = await getVotedIds("milestone", milestones.map((m) => m.id));

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-extrabold tracking-tight">{q ? `Results for “${q}”` : "Explore"}</h1>
        <Form action="/search" className="mt-4 flex max-w-xl gap-2">
          {type !== "all" ? <input type="hidden" name="type" value={type} /> : null}
          <input name="q" defaultValue={q} placeholder="Name, party, constituency or state" className="input h-11" />
          <button className="btn-primary h-11">Search</button>
        </Form>
        <div className="mt-4 flex flex-wrap gap-2">
          {TABS.map((t) => (
            <Link
              key={t.key}
              href={searchHref(t.key)}
              className={`rounded-full px-3.5 py-1.5 text-sm font-semibold transition ${
                type === t.key ? "bg-ink text-white" : "border border-line bg-white text-slate-600 hover:text-ink"
              }`}
            >
              {t.label}
            </Link>
          ))}
        </div>
      </div>

      {entities.length ? <p className="text-sm text-muted">Showing {(page - 1) * PAGE_SIZE + 1}–{Math.min(page * PAGE_SIZE, total)} of {total} profiles</p> : null}

      {entities.length ? (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {entities.map((e) => (
            <EntityCard key={e.id} entity={e} parentName={e.parent_id ? nameOf.get(e.parent_id) : null} />
          ))}
        </div>
      ) : (
        <EmptyState title="No profiles match that search">Try a shorter name, a party abbreviation, or a constituency.</EmptyState>
      )}

      {totalPages > 1 ? (
        <nav aria-label="Profile pages" className="flex flex-wrap items-center justify-between gap-3">
          <span className="text-sm text-muted">Page {page} of {totalPages}</span>
          <div className="flex gap-2">
            {page > 1 ? <Link href={searchHref(type, page - 1)} className="btn-ghost" aria-label="Previous profile page">Previous</Link> : null}
            {page < totalPages ? <Link href={searchHref(type, page + 1)} className="btn-primary" aria-label="Next profile page">Next</Link> : null}
          </div>
        </nav>
      ) : null}

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
