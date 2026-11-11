import Link from "@/components/NavigationLink";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { getEntityBySlug } from "@/lib/entities";
import { getVotedIds, getViewer } from "@/lib/auth";
import { MILESTONE_SELECT, type Entity, type Milestone } from "@/lib/types";
import { STATUS_FILTERS, STATUS_LABEL, TYPE_LABEL, type StatusFilter } from "@/lib/config";
import { achievementSummary, publicUrl } from "@/lib/milestones";
import { formatDate } from "@/components/ui";
import { MilestoneCard } from "@/components/MilestoneCard";
import { EntityCard } from "@/components/EntityCard";
import { UpvoteButton } from "@/components/UpvoteButton";
import { Avatar, BackLink, BlocBadge, EmptyState, StatTile, StatusMix, TypeBadge } from "@/components/ui";

type Params = { params: Promise<{ slug: string }>; searchParams: Promise<{ status?: string }> };

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { slug } = await params;
  const data = await getEntityBySlug(slug);
  if (!data) return { title: "Profile not found", robots: { index: false } };
  const type = TYPE_LABEL[data.type];
  return {
    title: `${data.name} — ${type} Profile and Milestones`,
    description: data.description?.trim() || `Explore the public profile and tracked milestones for ${data.name} in Malaysia.`,
    alternates: { canonical: `/e/${encodeURIComponent(data.slug)}` },
  };
}

export default async function EntityPage({ params, searchParams }: Params) {
  const { slug } = await params;
  const { status } = await searchParams;
  const filter = (STATUS_FILTERS as readonly string[]).includes(status ?? "") ? (status as StatusFilter) : null;

  const supabase = await createClient();
  const viewerPromise = getViewer();
  const entity = await getEntityBySlug(slug);
  if (!entity) notFound();

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
    { type: "bloc", label: "Blocs" },
    { type: "alliance", label: "Coalitions" },
    { type: "party", label: entity.type === "alliance" ? "Member parties" : "Parties" },
    { type: "politician", label: "Politicians" },
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
    .order("upvotes", { ascending: false })
    .order("updated_at", { ascending: false });
  const parent = (parentRes?.data ?? null) as Entity | null;
  const all = (milestoneRows ?? []) as unknown as Milestone[];
  const list = filter ? all.filter((m) => (m.status ?? "unknown") === filter) : all;
  const { counts, rate, recorded } = achievementSummary(all);

  const votedMilestones = await getVotedIds("milestone", all.map((m) => m.id));
  const loggedIn = Boolean(viewer);
  const isOwner = viewer?.userId && viewer.userId === entity.owner_id;
  const facts = [
    entity.position,
    entity.constituency ? `Constituency: ${entity.constituency}` : null,
    entity.state,
  ].filter(Boolean);

  return (
    <div className="space-y-8">
      <BackLink href={parent ? `/e/${parent.slug}` : "/tracker"}>{parent ? parent.name : "Tracker"}</BackLink>

      {/* Header */}
      <section className="card p-6 sm:p-8">
        <div className="flex flex-col gap-5 sm:flex-row sm:items-start">
          <Avatar name={entity.name} slug={entity.slug} short={entity.short_name} photoPath={entity.photo_path} size={88} />
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <TypeBadge type={entity.type} />
              <BlocBadge bloc={entity.bloc} />
              {entity.type === "politician" ? (
                entity.owner_id ? (
                  <span className="rounded-md bg-brand-50 px-2 py-0.5 text-[11px] font-semibold text-brand-700">Claimed by politician</span>
                ) : (
                  <span className="rounded-md bg-slate-100 px-2 py-0.5 text-[11px] font-semibold text-slate-600">Editorial profile</span>
                )
              ) : null}
            </div>
            <h1 className="mt-2 text-2xl font-extrabold tracking-tight sm:text-3xl">
              {entity.name}
              {entity.short_name && entity.short_name !== entity.name ? <span className="ml-2 text-muted">({entity.short_name})</span> : null}
            </h1>
            {facts.length ? <p className="mt-1 text-sm font-medium text-slate-600">{facts.join(" · ")}</p> : null}
            {parent ? (
              <p className="mt-1 text-sm text-muted">
                Part of{" "}
                <Link href={`/e/${parent.slug}`} className="font-semibold text-ink hover:text-brand-700">
                  {parent.name}
                </Link>
              </p>
            ) : null}
            {entity.description ? <p className="mt-4 max-w-3xl text-[15px] leading-relaxed text-slate-700">{entity.description}</p> : null}
            {entity.profile_sources?.length ? (
              <div className="mt-4 text-xs text-muted">
                <p>Profile sources{entity.profile_checked_at ? ` · checked ${formatDate(entity.profile_checked_at)}` : ""}</p>
                <ul className="mt-1 flex flex-wrap gap-x-4 gap-y-1">
                  {entity.profile_sources.filter((s) => publicUrl(s.url)).map((s) => (
                    <li key={s.url}><a href={publicUrl(s.url)!} target="_blank" rel="noopener noreferrer" className="text-brand-700 hover:underline">{s.label} ↗</a></li>
                  ))}
                </ul>
                {entity.photo_credit && publicUrl(entity.photo_source_url) ? <p className="mt-2">Photo: <a href={publicUrl(entity.photo_source_url)!} target="_blank" rel="noopener noreferrer" className="hover:underline">{entity.photo_credit} ↗</a></p> : null}
              </div>
            ) : null}
            {entity.website ? (
              <a href={entity.website} target="_blank" rel="noopener noreferrer nofollow" className="mt-3 inline-block text-sm font-medium text-brand-700 hover:underline">
                Official website ↗
              </a>
            ) : null}
          </div>
          <div className="flex flex-col items-start gap-2 sm:items-end">
            <UpvoteButton targetType="entity" targetId={entity.id} count={entity.upvotes} voted={votedEntities.has(entity.id)} loggedIn={loggedIn} />
            {isOwner ? (
              <Link href="/dashboard" className="btn-ghost px-3 py-1.5 text-xs">Edit in dashboard</Link>
            ) : null}
          </div>
        </div>

        <div className="mt-6 grid grid-cols-2 gap-4 border-t border-line pt-5 sm:grid-cols-4">
          <StatTile label="Milestones" value={all.length} />
          <StatTile label="Achieved" value={rate === null ? "—" : `${rate}%`} hint={`${counts.achieved} of ${recorded} with recorded status`} />
          <StatTile label="In progress" value={counts.in_progress} />
          <StatTile label="Delayed or broken" value={counts.delayed + counts.broken} />
        </div>
        <div className="mt-5">
          <StatusMix milestones={all} />
          <p className="mt-3 text-xs text-muted">Based on tracked milestones only, not an overall performance rating. Unknown statuses are excluded from the achieved rate.</p>
        </div>
      </section>

      {entity.type === "politician" && !entity.owner_id ? (
        <div className="card flex flex-col items-start justify-between gap-3 border-dashed p-5 sm:flex-row sm:items-center">
          <p className="text-sm text-slate-700">
            <strong>Are you {entity.name}?</strong> Claim this profile to publish and update your own milestones.
          </p>
          <Link href={`/upgrade?claim=${entity.id}`} className="btn-brand px-3.5 py-2">Claim this profile</Link>
        </div>
      ) : null}

      {/* Members */}
      {memberGroups.map((group) => (
        <section key={group.type}>
          <h2 className="section-title">{group.label}</h2>
          <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {group.members.map((member) => (
              <EntityCard key={member.id} entity={member} />
            ))}
          </div>
        </section>
      ))}

      {/* Milestones */}
      <section>
        <div className="flex flex-wrap items-end justify-between gap-3">
          <h2 className="section-title">Milestones</h2>
          <div className="flex flex-wrap gap-1.5">
            <Link href={`/e/${entity.slug}`} className={`chip ${!filter ? "border-ink bg-ink text-white hover:text-white" : ""}`}>
              All {all.length}
            </Link>
            {STATUS_FILTERS.filter((s) => s !== "unknown" || counts.unknown > 0).map((s) => (
              <Link key={s} href={`/e/${entity.slug}?status=${s}`} className={`chip ${filter === s ? "border-ink bg-ink text-white hover:text-white" : ""}`}>
                {STATUS_LABEL[s]} {counts[s]}
              </Link>
            ))}
          </div>
        </div>
        <div className="mt-4 grid gap-3 lg:grid-cols-2">
          {list.map((m) => (
            <MilestoneCard key={m.id} milestone={m} voted={votedMilestones.has(m.id)} loggedIn={loggedIn} showEntity={m.entity_id !== entity.id} />
          ))}
        </div>
        {!list.length ? (
          <EmptyState title={filter ? `No ${STATUS_LABEL[filter].toLowerCase()} milestones` : "No milestones yet"}>
            {entity.type === "politician" && !entity.owner_id
              ? "Milestones appear here once the editorial team adds them or the politician claims this profile."
              : "The editorial team adds sourced milestones here as manifestos are reviewed."}
          </EmptyState>
        ) : null}
      </section>
    </div>
  );
}
