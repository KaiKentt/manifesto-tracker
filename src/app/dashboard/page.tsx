import Link from "@/components/NavigationLink";
import type { Metadata } from "next";
import { hasActiveSubscription, getVotedIds, requireViewer } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { MILESTONE_SELECT, type Entity, type Milestone, type PoliticianRequest } from "@/lib/types";
import { deleteMilestone } from "@/actions/dashboard";
import { MilestoneCard } from "@/components/MilestoneCard";
import { EntityCard } from "@/components/EntityCard";
import { MilestoneForm, ProfileForm } from "@/components/DashboardForms";
import { EmptyState, StatusBadge, formatDate } from "@/components/ui";

export const metadata: Metadata = { title: "Dashboard", robots: { index: false, follow: false } };

const REQUEST_LABEL: Record<PoliticianRequest["status"], string> = {
  awaiting_payment: "Waiting for payment confirmation",
  pending_review: "Payment received — identity check in progress",
  approved: "Approved",
  rejected: "Not approved",
};

export default async function DashboardPage({ searchParams }: { searchParams: Promise<{ upgraded?: string; billing?: string }> }) {
  const { upgraded, billing } = await searchParams;
  const viewer = await requireViewer("/dashboard");
  const profile = viewer.profile;
  const supabase = await createClient();
  const name = profile?.display_name ?? viewer.email ?? "there";

  // ── Rakyat view ────────────────────────────────────────────────────
  if (!profile || profile.role === "rakyat") {
    const { data: votes } = await supabase.from("votes").select("target_type, target_id").order("created_at", { ascending: false }).limit(100);
    const mIds = (votes ?? []).filter((v) => v.target_type === "milestone").map((v) => v.target_id as string);
    const eIds = (votes ?? []).filter((v) => v.target_type === "entity").map((v) => v.target_id as string);
    const [{ data: ms }, { data: es }] = await Promise.all([
      mIds.length ? supabase.from("milestones").select(MILESTONE_SELECT).in("id", mIds) : { data: [] },
      eIds.length ? supabase.from("entities").select("*").in("id", eIds) : { data: [] },
    ]);
    const milestones = (ms ?? []) as unknown as Milestone[];
    const entities = (es ?? []) as Entity[];

    return (
      <div className="space-y-8">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight">Hi, {name}</h1>
          <p className="mt-1 text-sm text-muted">Everything you have upvoted, in one place.</p>
        </div>
        {entities.length ? (
          <section>
            <h2 className="section-title">Profiles you back</h2>
            <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {entities.map((e) => <EntityCard key={e.id} entity={e} />)}
            </div>
          </section>
        ) : null}
        <section>
          <h2 className="section-title">Milestones you upvoted</h2>
          {milestones.length ? (
            <div className="mt-4 grid gap-3 lg:grid-cols-2">
              {milestones.map((m) => <MilestoneCard key={m.id} milestone={m} voted loggedIn compact />)}
            </div>
          ) : (
            <div className="mt-4">
              <EmptyState title="Nothing here yet">
                Upvote milestones on the <Link href="/" className="font-semibold text-brand-700">tracker</Link> to follow them here.
              </EmptyState>
            </div>
          )}
        </section>
        <section className="card flex flex-col items-start justify-between gap-4 p-6 sm:flex-row sm:items-center">
          <div>
            <h2 className="font-bold">Are you a politician?</h2>
            <p className="text-sm text-muted">Upgrade to publish and update milestones on your own verified profile.</p>
          </div>
          <Link href="/upgrade" className="btn-brand">Upgrade to politician</Link>
        </section>
      </div>
    );
  }

  // ── Politician / admin view ────────────────────────────────────────
  const active = hasActiveSubscription(profile);
  const [{ data: requests }, entityRes] = await Promise.all([
    supabase.from("politician_requests").select("*").order("created_at", { ascending: false }).limit(1),
    profile.politician_entity_id ? supabase.from("entities").select("*").eq("id", profile.politician_entity_id).maybeSingle() : null,
  ]);
  const request = (requests?.[0] ?? null) as PoliticianRequest | null;
  const entity = (entityRes?.data ?? null) as Entity | null;
  const { data: ms } = entity
    ? await supabase.from("milestones").select(MILESTONE_SELECT).eq("entity_id", entity.id).order("updated_at", { ascending: false })
    : { data: [] };
  const milestones = (ms ?? []) as unknown as Milestone[];
  const voted = await getVotedIds("milestone", milestones.map((m) => m.id));
  const canPublish = Boolean(entity && active);

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight">Politician dashboard</h1>
          <p className="mt-1 text-sm text-muted">Signed in as {name}</p>
        </div>
        {profile.stripe_customer_id ? (
          <form action="/api/stripe/portal" method="post">
            <button className="btn-ghost">Manage billing</button>
          </form>
        ) : null}
      </div>

      {upgraded ? (
        <p className="rounded-xl bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
          Thank you — your upgrade is in. {entity ? "" : "Our team will verify your identity next; this page updates when you are approved."}
        </p>
      ) : null}
      {billing === "unavailable" ? (
        <p className="rounded-xl bg-amber-50 px-4 py-3 text-sm text-amber-900">Billing is not available for this account (demo mode or no Stripe customer).</p>
      ) : null}

      <div className="grid gap-4 sm:grid-cols-3">
        <div className="card p-5">
          <p className="text-xs font-semibold uppercase tracking-wider text-muted">Subscription</p>
          <p className={`mt-1 font-bold ${active ? "text-emerald-700" : "text-rose-700"}`}>{active ? "Active" : `Inactive (${profile.subscription_status})`}</p>
          {!active ? <p className="mt-1 text-xs text-muted">Publishing is locked until you renew. Your public record stays.</p> : null}
        </div>
        <div className="card p-5">
          <p className="text-xs font-semibold uppercase tracking-wider text-muted">Verification</p>
          <p className="mt-1 font-bold">{entity ? "Verified" : request ? REQUEST_LABEL[request.status] : "No request yet"}</p>
          {request?.status === "rejected" && request.admin_note ? <p className="mt-1 text-xs text-muted">Note: {request.admin_note}</p> : null}
        </div>
        <div className="card p-5">
          <p className="text-xs font-semibold uppercase tracking-wider text-muted">Public page</p>
          {entity ? (
            <Link href={`/e/${entity.slug}`} className="mt-1 block font-bold text-brand-700 hover:underline">View {entity.name} →</Link>
          ) : (
            <p className="mt-1 font-bold text-slate-500">Goes live after approval</p>
          )}
        </div>
      </div>

      {entity ? (
        <>
          <section className="card p-6">
            <h2 className="section-title">Your profile</h2>
            <p className="mt-1 text-sm text-muted">Name and party changes go through the editorial team to prevent impersonation.</p>
            <div className="mt-5">
              <ProfileForm entity={entity} disabled={!canPublish} />
            </div>
          </section>

          <section className="card p-6">
            <h2 className="section-title">Add a milestone</h2>
            <p className="mt-1 text-sm text-muted">Shown publicly with a <strong className="text-brand-700">self-reported</strong> label. Add an evidence link to build trust.</p>
            <div className="mt-5">
              <MilestoneForm entityId={entity.id} disabled={!canPublish} />
            </div>
          </section>

          <section>
            <h2 className="section-title">Your milestones ({milestones.length})</h2>
            <div className="mt-4 space-y-3">
              {milestones.map((m) =>
                m.source_type === "self_reported" ? (
                  <details key={m.id} className="card group p-5">
                    <summary className="flex cursor-pointer list-none flex-wrap items-center gap-3">
                      <StatusBadge status={m.status} />
                      <span className="flex-1 font-semibold">{m.title}</span>
                      <span className="text-xs text-muted">{m.progress === null ? "Progress unknown" : `${m.progress}%`} · {m.upvotes} upvotes · updated {formatDate(m.updated_at.slice(0, 10))}</span>
                      <span className="text-xs font-semibold text-brand-700 group-open:hidden">Edit</span>
                    </summary>
                    <div className="mt-5 border-t border-line pt-5">
                      <MilestoneForm entityId={entity.id} milestone={m} disabled={!canPublish} />
                      <form action={deleteMilestone} className="mt-3">
                        <input type="hidden" name="id" value={m.id} />
                        <button disabled={!canPublish} className="text-sm font-semibold text-rose-700 hover:underline disabled:opacity-50">
                          Delete this milestone
                        </button>
                      </form>
                    </div>
                  </details>
                ) : (
                  <MilestoneCard key={m.id} milestone={m} voted={voted.has(m.id)} loggedIn showEntity={false} compact />
                ),
              )}
              {!milestones.length ? <EmptyState title="No milestones yet">Publish your first one above.</EmptyState> : null}
            </div>
          </section>
        </>
      ) : (
        <EmptyState title="Your profile is being verified">
          Once an admin approves your request, your public page goes live and the profile and milestone editors appear here.
        </EmptyState>
      )}
    </div>
  );
}
