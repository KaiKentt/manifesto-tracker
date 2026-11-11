import Link from "@/components/NavigationLink";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { getEntityBySlug } from "@/lib/entities";
import { getVotedIds, getViewer } from "@/lib/auth";
import { MILESTONE_SELECT, type Entity, type Milestone } from "@/lib/types";
import { SITE, STATUS_FILTERS, type StatusFilter } from "@/lib/config";
import { achievementSummary, publicUrl } from "@/lib/milestones";
import { dictionary, displayName } from "@/lib/dictionaries";
import { languageAlternates, localePath, type Locale } from "@/lib/i18n";
import { baseOpenGraph, getDictionary, getLocale } from "@/lib/i18n-server";
import { formatDate } from "@/components/ui";
import { MilestoneCard } from "@/components/MilestoneCard";
import { EntityCard } from "@/components/EntityCard";
import { UpvoteButton } from "@/components/UpvoteButton";
import { JsonLd } from "@/components/JsonLd";
import { Avatar, BackLink, BlocBadge, EmptyState, StatTile, StatusMix, TypeBadge } from "@/components/ui";

type Params = { params: Promise<{ slug: string }>; searchParams: Promise<{ status?: string }> };

function place(entity: Entity) {
  return [entity.constituency, entity.state].filter(Boolean).join(", ") || null;
}

function pageTitle(entity: Entity, locale: Locale) {
  const t = dictionary(locale).entity.metaTitle;
  const name = displayName(entity, locale);
  if (entity.type === "politician") return t.politician(name, place(entity));
  if (entity.type === "bloc") return t.bloc(name);
  return t.group(name, entity.short_name);
}

export async function generateMetadata({ params, searchParams }: Params): Promise<Metadata> {
  const [{ slug }, { status }, locale, t, og] = await Promise.all([params, searchParams, getLocale(), getDictionary(), baseOpenGraph()]);
  const data = await getEntityBySlug(slug);
  if (!data) return { title: t.entity.notFound, robots: { index: false } };
  const path = `/e/${encodeURIComponent(data.slug)}`;
  const title = pageTitle(data, locale);
  // English pages use the sourced profile summary; Malay pages a Malay summary built from the same facts.
  const description =
    (locale === "en" ? data.description?.trim() : null) || t.entity.metaDescription(displayName(data, locale), place(data));
  return {
    title,
    description,
    alternates: languageAlternates(locale, path),
    // Status filters are views of the same profile.
    ...(status ? { robots: { index: false, follow: true } } : {}),
    openGraph: {
      siteName: og.siteName,
      locale: og.locale,
      alternateLocale: og.alternateLocale,
      title,
      description,
      url: localePath(locale, path),
      type: data.type === "politician" ? "profile" : "website",
    },
  };
}

export default async function EntityPage({ params, searchParams }: Params) {
  const { slug } = await params;
  const { status } = await searchParams;
  const filter = (STATUS_FILTERS as readonly string[]).includes(status ?? "") ? (status as StatusFilter) : null;

  const supabase = await createClient();
  const viewerPromise = getViewer();
  const [entity, locale, t] = await Promise.all([getEntityBySlug(slug), getLocale(), getDictionary()]);
  if (!entity) notFound();
  const contentLang = locale === "en" ? undefined : "en";

  // Which entities' milestones roll up into this page?
  //  bloc → everything on that side; coalition/party → itself and its members.
  let scopeIds: string[] = [entity.id];
  const [{ data: childRows }, parentRes, blocRes, votedEntities, viewer] = await Promise.all([
    supabase.from("entities").select("*").eq("parent_id", entity.id).order("type").order("name"),
    entity.parent_id ? supabase.from("entities").select("*").eq("id", entity.parent_id).maybeSingle() : null,
    entity.type === "bloc" ? supabase.from("entities").select("id").eq("bloc", entity.bloc) : null,
    getVotedIds("entity", [entity.id]),
    viewerPromise,
  ]);
  const children = (childRows ?? []) as Entity[];
  const memberGroups = [
    { type: "bloc", label: t.entity.groups.bloc },
    { type: "alliance", label: t.entity.groups.alliance },
    { type: "party", label: entity.type === "alliance" ? t.entity.groups.memberParties : t.entity.groups.party },
    { type: "politician", label: t.entity.groups.politician },
  ]
    .map((group) => ({ ...group, members: children.filter((child) => child.type === group.type) }))
    .filter((group) => group.members.length > 0);
  if (entity.type === "bloc") {
    scopeIds = (blocRes?.data ?? []).map((e) => e.id as string);
  } else if (entity.type !== "politician") {
    const childIds = children.map((c) => c.id);
    const { data: grand } = childIds.length
      ? await supabase.from("entities").select("id").in("parent_id", childIds)
      : { data: [] as { id: string }[] };
    scopeIds = [entity.id, ...childIds, ...(grand ?? []).map((g) => g.id as string)];
  }

  const { data: milestoneRows } = await supabase
    .from("milestones")
    .select(MILESTONE_SELECT)
    .in("entity_id", scopeIds)
    .eq("is_sample", false)
    .order("upvotes", { ascending: false })
    .order("updated_at", { ascending: false });
  const parent = (parentRes?.data ?? null) as Entity | null;
  const all = (milestoneRows ?? []) as unknown as Milestone[];
  const list = filter ? all.filter((m) => (m.status ?? "unknown") === filter) : all;
  const { counts, rate, recorded } = achievementSummary(all);

  const votedMilestones = await getVotedIds("milestone", all.map((m) => m.id));
  const loggedIn = Boolean(viewer);
  const isOwner = viewer?.userId && viewer.userId === entity.owner_id;
  const name = displayName(entity, locale);
  const facts = [entity.position, entity.constituency ? t.entity.constituency(entity.constituency) : null, entity.state].filter(Boolean);

  const url = `${SITE.origin}${localePath(locale, `/e/${entity.slug}`)}`;
  const homeUrl = `${SITE.origin}${localePath(locale, "/")}`;
  // Official pages that identify this profile (its website and Parliament profile), not news coverage.
  const sameAs = [entity.website, ...(entity.profile_sources ?? []).map((s) => s.url).filter((u) => /^https:\/\/(www\.)?parlimen\.gov\.my\//.test(u))]
    .map((u) => publicUrl(u))
    .filter(Boolean);
  const structured = [
    {
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      itemListElement: [
        { "@type": "ListItem", position: 1, name: t.entity.home, item: homeUrl },
        ...(parent
          ? [{ "@type": "ListItem", position: 2, name: displayName(parent, locale), item: `${SITE.origin}${localePath(locale, `/e/${parent.slug}`)}` }]
          : []),
        { "@type": "ListItem", position: parent ? 3 : 2, name, item: url },
      ],
    },
    entity.type === "politician"
      ? {
          "@context": "https://schema.org",
          "@type": "Person",
          name: entity.name,
          url,
          ...(entity.position ? { jobTitle: entity.position } : {}),
          ...(entity.description ? { description: entity.description } : {}),
          ...(entity.photo_path ? { image: `${SITE.origin}${entity.photo_path}` } : {}),
          ...(parent ? { affiliation: { "@type": "Organization", name: parent.name, url: `${SITE.origin}/e/${parent.slug}` } } : {}),
          ...(entity.state ? { workLocation: { "@type": "Place", name: [entity.constituency, entity.state, "Malaysia"].filter(Boolean).join(", ") } } : {}),
          ...(sameAs.length ? { sameAs } : {}),
        }
      : {
          "@context": "https://schema.org",
          "@type": "Organization",
          name: entity.name,
          ...(entity.short_name && entity.short_name !== entity.name ? { alternateName: entity.short_name } : {}),
          url,
          ...(entity.description ? { description: entity.description } : {}),
          ...(parent ? { parentOrganization: { "@type": "Organization", name: parent.name, url: `${SITE.origin}/e/${parent.slug}` } } : {}),
          ...(sameAs.length ? { sameAs } : {}),
          areaServed: { "@type": "Country", name: "Malaysia" },
        },
  ];

  return (
    <div className="space-y-8">
      <JsonLd data={structured} />
      <BackLink href={parent ? `/e/${parent.slug}` : "/"}>{parent ? displayName(parent, locale) : t.entity.home}</BackLink>

      {/* Header */}
      <section className="card p-6 sm:p-8">
        <div className="flex flex-col gap-5 sm:flex-row sm:items-start">
          <Avatar name={entity.name} slug={entity.slug} short={entity.short_name} photoPath={entity.photo_path} size={88} />
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <TypeBadge type={entity.type} locale={locale} />
              <BlocBadge bloc={entity.bloc} locale={locale} />
              {entity.type === "politician" ? (
                entity.owner_id ? (
                  <span className="rounded-md bg-brand-50 px-2 py-0.5 text-[11px] font-semibold text-brand-700">{t.entity.claimed}</span>
                ) : (
                  <span className="rounded-md bg-slate-100 px-2 py-0.5 text-[11px] font-semibold text-slate-600">{t.entity.editorialProfile}</span>
                )
              ) : null}
            </div>
            <h1 className="mt-2 text-2xl font-extrabold tracking-tight sm:text-3xl">
              {name}
              {entity.short_name && entity.short_name !== entity.name ? <span className="ml-2 text-muted">({entity.short_name})</span> : null}
            </h1>
            {facts.length ? <p className="mt-1 text-sm font-medium text-slate-600">{facts.join(" · ")}</p> : null}
            {parent ? (
              <p className="mt-1 text-sm text-muted">
                {t.entity.partOf}{" "}
                <Link href={`/e/${parent.slug}`} className="font-semibold text-ink hover:text-brand-700">
                  {displayName(parent, locale)}
                </Link>
              </p>
            ) : null}
            {entity.description ? (
              <p lang={contentLang} className="mt-4 max-w-3xl text-[15px] leading-relaxed text-slate-700">{entity.description}</p>
            ) : null}
            {entity.profile_sources?.length ? (
              <div className="mt-4 text-xs text-muted">
                <p>{t.entity.sources}{entity.profile_checked_at ? t.entity.checked(formatDate(entity.profile_checked_at, locale)!) : ""}</p>
                <ul className="mt-1 flex flex-wrap gap-x-4 gap-y-1">
                  {entity.profile_sources.filter((s) => publicUrl(s.url)).map((s) => (
                    <li key={s.url}><a href={publicUrl(s.url)!} target="_blank" rel="noopener noreferrer" className="text-brand-700 hover:underline">{s.label} ↗</a></li>
                  ))}
                </ul>
                {entity.photo_credit && publicUrl(entity.photo_source_url) ? <p className="mt-2">{t.entity.photo}: <a href={publicUrl(entity.photo_source_url)!} target="_blank" rel="noopener noreferrer" className="hover:underline">{entity.photo_credit} ↗</a></p> : null}
              </div>
            ) : null}
            {entity.website ? (
              <a href={entity.website} target="_blank" rel="noopener noreferrer nofollow" className="mt-3 inline-block text-sm font-medium text-brand-700 hover:underline">
                {t.entity.website} ↗
              </a>
            ) : null}
          </div>
          <div className="flex flex-col items-start gap-2 sm:items-end">
            <UpvoteButton targetType="entity" targetId={entity.id} count={entity.upvotes} voted={votedEntities.has(entity.id)} loggedIn={loggedIn} />
            {isOwner ? (
              <Link href="/dashboard" className="btn-ghost px-3 py-1.5 text-xs">{t.entity.edit}</Link>
            ) : null}
          </div>
        </div>

        <div className="mt-6 grid grid-cols-2 gap-4 border-t border-line pt-5 sm:grid-cols-4">
          <StatTile label={t.entity.milestones} value={all.length} />
          <StatTile label={t.entity.achieved} value={rate === null ? "—" : `${rate}%`} hint={t.entity.ofRecorded(counts.achieved, recorded)} />
          <StatTile label={t.entity.inProgress} value={counts.in_progress} />
          <StatTile label={t.entity.delayedBroken} value={counts.delayed + counts.broken} />
        </div>
        <div className="mt-5">
          <StatusMix milestones={all} locale={locale} />
          <p className="mt-3 text-xs text-muted">{t.entity.basis}</p>
        </div>
      </section>

      {entity.type === "politician" && !entity.owner_id ? (
        <div className="card flex flex-col items-start justify-between gap-3 border-dashed p-5 sm:flex-row sm:items-center">
          <p className="text-sm text-slate-700">
            <strong>{t.entity.claimQuestion(entity.name)}</strong>
            {t.entity.claimText}
          </p>
          <Link href={`/upgrade?claim=${entity.id}`} className="btn-brand px-3.5 py-2">{t.entity.claimButton}</Link>
        </div>
      ) : null}

      {/* Members */}
      {memberGroups.map((group) => (
        <section key={group.type}>
          <h2 className="section-title">{group.label}</h2>
          <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {group.members.map((member) => (
              <EntityCard key={member.id} entity={member} locale={locale} />
            ))}
          </div>
        </section>
      ))}

      {/* Milestones */}
      <section>
        <div className="flex flex-wrap items-end justify-between gap-3">
          <h2 className="section-title">{t.entity.milestones}</h2>
          <div className="flex flex-wrap gap-1.5">
            <Link href={`/e/${entity.slug}`} className={`chip ${!filter ? "border-ink bg-ink text-white hover:text-white" : ""}`}>
              {t.entity.all} {all.length}
            </Link>
            {STATUS_FILTERS.filter((s) => s !== "unknown" || counts.unknown > 0).map((s) => (
              <Link key={s} href={`/e/${entity.slug}?status=${s}`} className={`chip ${filter === s ? "border-ink bg-ink text-white hover:text-white" : ""}`}>
                {t.status[s]} {counts[s]}
              </Link>
            ))}
          </div>
        </div>
        <div className="mt-4 grid gap-3 lg:grid-cols-2">
          {list.map((m) => (
            <MilestoneCard key={m.id} milestone={m} voted={votedMilestones.has(m.id)} loggedIn={loggedIn} showEntity={m.entity_id !== entity.id} locale={locale} />
          ))}
        </div>
        {!list.length ? (
          <EmptyState title={filter ? t.entity.emptyFiltered(t.status[filter]) : t.entity.emptyAll}>
            {entity.type === "politician" && !entity.owner_id ? t.entity.emptyUnclaimed : t.entity.emptyEditorial}
          </EmptyState>
        ) : null}
      </section>
    </div>
  );
}
