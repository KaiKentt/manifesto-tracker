import Form from "next/form";
import Link from "@/components/NavigationLink";
import { createClient } from "@/lib/supabase/server";
import { getVotedIds, getViewer } from "@/lib/auth";
import { MILESTONE_SELECT, type Entity, type Milestone } from "@/lib/types";
import { SITE } from "@/lib/config";
import { MilestoneCard } from "@/components/MilestoneCard";
import { EntityCard } from "@/components/EntityCard";
import { UpvoteButton } from "@/components/UpvoteButton";
import { Avatar, StatTile, StatusMix, statusCounts } from "@/components/ui";

export default async function HomePage() {
  const supabase = await createClient();
  const [viewer, { data: entityRows }, { data: milestoneRows }] = await Promise.all([
    getViewer(),
    supabase.from("entities").select("*").in("type", ["bloc", "alliance"]).order("name"),
    supabase.from("milestones").select(MILESTONE_SELECT).order("updated_at", { ascending: false }).limit(500),
  ]);

  const entities = (entityRows ?? []) as Entity[];
  const milestones = (milestoneRows ?? []) as unknown as Milestone[];
  const blocs = ["government", "opposition"].map((b) => entities.find((e) => e.type === "bloc" && e.bloc === b)).filter(Boolean) as Entity[];
  const alliances = entities.filter((e) => e.type === "alliance");

  const byUpvotes = [...milestones].sort((a, b) => b.upvotes - a.upvotes || b.updated_at.localeCompare(a.updated_at));
  const top = byUpvotes.slice(0, 6);
  const recent = milestones.slice(0, 6);

  const shown = [...new Set([...top, ...recent, ...milestones].map((m) => m.id))];
  const [votedMilestones, votedEntities] = await Promise.all([
    getVotedIds("milestone", shown),
    getVotedIds("entity", entities.map((e) => e.id)),
  ]);
  const loggedIn = Boolean(viewer);
  const hasSamples = milestones.some((m) => m.is_sample);

  return (
    <div className="space-y-12">
      {/* Hero */}
      <section className="pt-2">
        <p className="text-sm font-semibold text-brand-700">{SITE.country}</p>
        <h1 className="mt-1 max-w-2xl text-3xl font-extrabold tracking-tight sm:text-4xl">{SITE.tagline}</h1>
        <p className="mt-3 max-w-2xl text-muted">
          Follow the pledges of the government and the opposition, then dig into any coalition, party or politician. Upvote the
          promises that matter to you.
        </p>
        <Form action="/search" className="mt-6 flex max-w-xl gap-2">
          <input name="q" placeholder="Try “PKR”, “Perikatan”, or a politician’s name" className="input h-12 text-base" />
          <button className="btn-primary h-12 px-5">Search</button>
        </Form>
        <div className="mt-4 flex flex-wrap gap-2">
          {alliances.map((a) => (
            <Link key={a.id} href={`/e/${a.slug}`} className="chip gap-1.5">
              <Avatar name={a.name} slug={a.slug} short={a.short_name} size={22} />
              {a.short_name ?? a.name}
            </Link>
          ))}
        </div>
      </section>

      {hasSamples ? (
        <p className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
          <strong>Prototype data.</strong> Milestones marked <em>Sample</em> are placeholders, with the same number and mix on each side.
          Replace them with sourced manifesto items before launch.
        </p>
      ) : null}

      {/* Government vs Opposition */}
      <section>
        <h2 className="section-title">Government and Opposition</h2>
        <div className="mt-4 grid gap-5 md:grid-cols-2">
          {blocs.map((bloc) => {
            const items = milestones.filter((m) => m.entity?.bloc === bloc.bloc);
            const counts = statusCounts(items);
            const rate = items.length ? Math.round((counts.achieved / items.length) * 100) : 0;
            const best = [...items].sort((a, b) => b.upvotes - a.upvotes || b.progress - a.progress).slice(0, 3);
            return (
              <div key={bloc.id} className="card flex flex-col p-6">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wider text-muted">{bloc.short_name}</p>
                    <Link href={`/e/${bloc.slug}`} className="text-xl font-bold tracking-tight hover:text-brand-700">
                      {bloc.name}
                    </Link>
                  </div>
                  <UpvoteButton targetType="entity" targetId={bloc.id} count={bloc.upvotes} voted={votedEntities.has(bloc.id)} loggedIn={loggedIn} />
                </div>
                {bloc.description ? <p className="mt-2 line-clamp-2 text-sm text-muted">{bloc.description}</p> : null}

                <div className="mt-5 grid grid-cols-3 gap-4 border-y border-line py-4">
                  <StatTile label="Milestones tracked" value={items.length} />
                  <StatTile label="Achieved" value={`${rate}%`} hint={`${counts.achieved} of ${items.length}`} />
                  <StatTile label="In progress" value={counts.in_progress} />
                </div>
                <div className="mt-4">
                  <StatusMix milestones={items} />
                </div>

                <div className="mt-5 space-y-3">
                  {best.map((m) => (
                    <MilestoneCard key={m.id} milestone={m} voted={votedMilestones.has(m.id)} loggedIn={loggedIn} compact />
                  ))}
                </div>
                <Link href={`/e/${bloc.slug}`} className="mt-4 text-sm font-semibold text-brand-700 hover:underline">
                  See all {items.length} milestones →
                </Link>
              </div>
            );
          })}
        </div>
      </section>

      {/* Most upvoted + recent */}
      {top[0]?.upvotes ? (
        <section className="grid gap-8 lg:grid-cols-2">
          <div>
            <h2 className="section-title">Most upvoted by the rakyat</h2>
            <div className="mt-4 space-y-3">
              {top.map((m) => (
                <MilestoneCard key={m.id} milestone={m} voted={votedMilestones.has(m.id)} loggedIn={loggedIn} compact />
              ))}
            </div>
          </div>
          <div>
            <h2 className="section-title">Recently updated</h2>
            <div className="mt-4 space-y-3">
              {recent.map((m) => (
                <MilestoneCard key={m.id} milestone={m} voted={votedMilestones.has(m.id)} loggedIn={loggedIn} compact />
              ))}
            </div>
          </div>
        </section>
      ) : (
        <section>
          <h2 className="section-title">Recently updated</h2>
          <div className="mt-4 grid gap-3 lg:grid-cols-2">
            {recent.map((m) => (
              <MilestoneCard key={m.id} milestone={m} voted={votedMilestones.has(m.id)} loggedIn={loggedIn} compact />
            ))}
          </div>
        </section>
      )}

      {/* Coalitions */}
      <section>
        <div className="flex items-end justify-between">
          <h2 className="section-title">Coalitions</h2>
          <Link href="/search?type=party" className="text-sm font-semibold text-brand-700 hover:underline">
            Browse parties and politicians →
          </Link>
        </div>
        <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {alliances.map((a) => (
            <EntityCard key={a.id} entity={a} />
          ))}
        </div>
      </section>

      {!viewer || viewer.profile?.role === "rakyat" ? (
        <section className="card flex flex-col items-start gap-4 bg-ink p-8 text-white sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-xl font-bold">Are you an elected representative?</h2>
            <p className="mt-1 text-sm text-slate-300">Claim your profile and keep the rakyat updated on your own milestones.</p>
          </div>
          <Link href={viewer ? "/upgrade" : "/signup?next=/upgrade"} className="btn bg-white text-ink hover:bg-slate-100">
            Become a verified politician
          </Link>
        </section>
      ) : null}
    </div>
  );
}
