import Form from "next/form";
import Link from "@/components/NavigationLink";
import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getVotedIds, getViewer } from "@/lib/auth";
import { MILESTONE_SELECT, type Entity, type Milestone } from "@/lib/types";
import { languageAlternates, localePath } from "@/lib/i18n";
import { baseOpenGraph, getDictionary, getLocale } from "@/lib/i18n-server";
import { EntityCard } from "@/components/EntityCard";
import { MilestoneCard } from "@/components/MilestoneCard";
import { EmptyState } from "@/components/ui";

const PAGE_SIZE = 60;

const TABS = ["all", "alliance", "party", "politician"] as const;

type SearchParams = { q?: string | string[]; type?: string | string[]; page?: string | string[] };
type SearchPageProps = { searchParams: Promise<SearchParams> };
type ProfileType = (typeof TABS)[number];

// Strip characters that have meaning in PostgREST filter syntax.
function clean(q: string) {
  return q.replace(/[,()*%\\:"']/g, " ").replace(/\s+/g, " ").trim().slice(0, 60);
}

function readSearchOptions(params: SearchParams) {
  const q = typeof params.q === "string" ? clean(params.q) : "";
  const type = TABS.find((key) => key === params.type) ?? "all";
  const requestedPage = typeof params.page === "string" && /^\d+$/.test(params.page) ? Number(params.page) : 1;
  const page = Number.isSafeInteger(requestedPage) && requestedPage > 0 && requestedPage <= 10000 ? requestedPage : 1;
  return { q, type, page };
}

function searchHref(type: ProfileType, page = 1, q = "") {
  const query = new URLSearchParams({
    ...(q ? { q } : {}),
    ...(type !== "all" ? { type } : {}),
    ...(page > 1 ? { page: String(page) } : {}),
  }).toString();
  return query ? `/search?${query}` : "/search";
}

export async function generateMetadata({ searchParams }: SearchPageProps): Promise<Metadata> {
  const [{ q, type, page }, locale, t, og] = await Promise.all([searchParams.then(readSearchOptions), getLocale(), getDictionary(), baseOpenGraph()]);
  const title = t.search.titles[type] + (page > 1 ? t.search.page(page) : "");
  return {
    title,
    description: t.meta.searchDescription,
    ...(q ? { robots: { index: false, follow: true } } : { alternates: languageAlternates(locale, searchHref(type, page)) }),
    openGraph: { ...og, type: "website", title, description: t.meta.searchDescription, url: localePath(locale, searchHref(type, page)) },
  };
}

export default async function SearchPage({ searchParams }: SearchPageProps) {
  const [{ q, type, page }, locale, t] = await Promise.all([searchParams.then(readSearchOptions), getLocale(), getDictionary()]);

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
    q
      ? supabase.from("milestones").select(MILESTONE_SELECT).eq("is_sample", false).ilike("title", `%${q}%`).order("upvotes", { ascending: false }).limit(8)
      : null,
  ]);

  const total = count ?? 0;
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  if (page > totalPages) redirect(localePath(locale, searchHref(type, totalPages, q)));

  const entities = (entityRows ?? []) as Entity[];
  const milestones = ((milestoneRes?.data ?? []) as unknown as Milestone[]);
  const nameOf = new Map((allNames ?? []).map((e) => [e.id as string, (e.short_name ?? e.name) as string]));
  const voted = await getVotedIds("milestone", milestones.map((m) => m.id));

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-extrabold tracking-tight">{q ? t.search.results(q) : t.search.titles[type]}</h1>
        <Form action={localePath(locale, "/search")} role="search" className="mt-4 flex max-w-xl gap-2">
          {type !== "all" ? <input type="hidden" name="type" value={type} /> : null}
          <label htmlFor="search-q" className="sr-only">{t.search.placeholder}</label>
          <input id="search-q" name="q" defaultValue={q} placeholder={t.search.placeholder} className="input h-11" />
          <button className="btn-primary h-11">{t.search.button}</button>
        </Form>
        <div className="mt-4 flex flex-wrap gap-2">
          {TABS.map((key) => (
            <Link
              key={key}
              href={searchHref(key, 1, q)}
              className={`rounded-full px-3.5 py-1.5 text-sm font-semibold transition ${
                type === key ? "bg-ink text-white" : "border border-line bg-white text-slate-600 hover:text-ink"
              }`}
            >
              {t.search.tabs[key]}
            </Link>
          ))}
        </div>
      </div>

      {entities.length ? <p className="text-sm text-muted">{t.search.showing((page - 1) * PAGE_SIZE + 1, Math.min(page * PAGE_SIZE, total), total)}</p> : null}

      {entities.length ? (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {entities.map((e) => (
            <EntityCard key={e.id} entity={e} parentName={e.parent_id ? nameOf.get(e.parent_id) : null} locale={locale} />
          ))}
        </div>
      ) : (
        <EmptyState title={t.search.emptyTitle}>{t.search.emptyText}</EmptyState>
      )}

      {totalPages > 1 ? (
        <nav aria-label={t.search.pages} className="flex flex-wrap items-center justify-between gap-3">
          <span className="text-sm text-muted">{t.search.pageOf(page, totalPages)}</span>
          <div className="flex gap-2">
            {page > 1 ? <Link href={searchHref(type, page - 1, q)} className="btn-ghost" aria-label={t.search.previousLabel}>{t.search.previous}</Link> : null}
            {page < totalPages ? <Link href={searchHref(type, page + 1, q)} className="btn-primary" aria-label={t.search.nextLabel}>{t.search.next}</Link> : null}
          </div>
        </nav>
      ) : null}

      {milestones.length ? (
        <section>
          <h2 className="section-title">{t.search.mentioning(q)}</h2>
          <div className="mt-4 grid gap-3 lg:grid-cols-2">
            {milestones.map((m) => (
              <MilestoneCard key={m.id} milestone={m} voted={voted.has(m.id)} loggedIn={Boolean(viewer)} compact locale={locale} />
            ))}
          </div>
        </section>
      ) : null}
    </div>
  );
}
