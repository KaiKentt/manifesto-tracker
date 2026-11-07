import Link from "@/components/NavigationLink";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { getEntityBySlug } from "@/lib/entities";
import { getVotedIds, getViewer } from "@/lib/auth";
import { MILESTONE_SELECT, type Entity, type Milestone } from "@/lib/types";
import { STATUSES, STATUS_LABEL, TYPE_LABEL, type MilestoneStatus } from "@/lib/config";
import { MilestoneCard } from "@/components/MilestoneCard";
import { EntityCard } from "@/components/EntityCard";
import { UpvoteButton } from "@/components/UpvoteButton";
import { Avatar, BackLink, BlocBadge, EmptyState, StatTile, StatusMix, TypeBadge, statusCounts } from "@/components/ui";

type Params = { params: Promise<{ slug: string }>; searchParams: Promise<{ status?: string }> };

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { slug } = await params;
  const data = await getEntityBySlug(slug);
  if (!data) return { title: "Not found" };
  return { title: `${data.name} — milestones`, description: data.description ?? `${TYPE_LABEL[data.type as Entity["type"]]} profile and tracked milestones.` };
}

export default async function EntityPage({ params, searchParams }: Params) {
  const { slug } = await params;
  const { status } = await searchParams;
  const filter = (STATUSES as readonly string[]).includes(status ?? "") ? (status as MilestoneStatus) : null;

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
  const list = filter ? all.filter((m) => m.status === filter) : all;
  const counts = statusCounts(all);
  const rate = all.length ? Math.round((counts.achieved / all.length) * 100) : 0;

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
      <BackLink href={parent ? `/e/${parent.slug}` : "/"}>{parent ? parent.name : "Home"}</BackLink>

      {/* Header */}
      <section className="card p-6 sm:p-8">
        <div className="flex flex-col gap-5 sm:flex-row sm:items-start">
          <Avatar name={entity.name} slug={entity.slug} short={entity.short_name} size={72} />
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
          <StatTile label="Achieved" value={`${rate}%`} hint={`${counts.achieved} of ${all.length}`} />
          <StatTile label="In progress" value={counts.in_progress} />
          <StatTile label="Delayed or broken" value={counts.delayed + counts.broken} />
        </div>
        <div className="mt-5">
          <StatusMix milestones={all} />
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
      {children.length ? (
        <section>
          <h2 className="section-title">
            {entity.type === "bloc" ? "Coalitions" : entity.type === "alliance" ? "Member parties" : "Politicians"}
          </h2>
          <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {children.map((c) => (
              <EntityCard key={c.id} entity={c} />
            ))}
          </div>
        </section>
      ) : null}

      {/* Milestones */}
      <section>
        <div className="flex flex-wrap items-end justify-between gap-3">
          <h2 className="section-title">Milestones</h2>
          <div className="flex flex-wrap gap-1.5">
            <Link href={`/e/${entity.slug}`} className={`chip ${!filter ? "border-ink bg-ink text-white hover:text-white" : ""}`}>
              All {all.length}
            </Link>
            {STATUSES.map((s) => (
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
