import Link from "@/components/NavigationLink";
import type { Metadata } from "next";
import { requireAdmin } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { TYPE_LABEL } from "@/lib/config";
import type { Entity, PoliticianRequest } from "@/lib/types";
import { approveRequest, rejectRequest } from "@/actions/admin";
import { AdminMilestoneForm } from "@/components/AdminMilestoneForm";
import { SubmitButton } from "@/components/SubmitButton";
import { EmptyState, StatTile, formatDate } from "@/components/ui";

export const metadata: Metadata = { title: "Admin" };

export default async function AdminPage() {
  await requireAdmin();
  const admin = createAdminClient();

  const [{ data: reqRows }, { data: entityRows }, profiles, milestones, politicians] = await Promise.all([
    admin.from("politician_requests").select("*").order("created_at", { ascending: false }).limit(50),
    admin.from("entities").select("id, name, short_name, type, slug").order("type").order("name"),
    admin.from("profiles").select("id", { count: "exact", head: true }),
    admin.from("milestones").select("id", { count: "exact", head: true }),
    admin.from("profiles").select("id", { count: "exact", head: true }).eq("role", "politician").in("subscription_status", ["active", "trialing"]),
  ]);
  const requests = (reqRows ?? []) as PoliticianRequest[];
  const entities = (entityRows ?? []) as Pick<Entity, "id" | "name" | "short_name" | "type" | "slug">[];
  const byId = new Map(entities.map((e) => [e.id, e]));

  const userIds = [...new Set(requests.map((r) => r.user_id))];
  const { data: names } = userIds.length ? await admin.from("profiles").select("id, display_name").in("id", userIds) : { data: [] };
  const nameOf = new Map((names ?? []).map((n) => [n.id as string, n.display_name as string | null]));

  const pending = requests.filter((r) => r.status === "pending_review");
  const others = requests.filter((r) => r.status !== "pending_review");

  return (
    <div className="space-y-10">
      <div>
        <h1 className="text-2xl font-extrabold tracking-tight">Admin</h1>
        <p className="mt-1 text-sm text-muted">Verify politicians and curate editorial milestones.</p>
      </div>

      <div className="card grid grid-cols-2 gap-6 p-6 sm:grid-cols-4">
        <StatTile label="Accounts" value={profiles.count ?? 0} />
        <StatTile label="Paying politicians" value={politicians.count ?? 0} />
        <StatTile label="Pending verification" value={pending.length} />
        <StatTile label="Milestones" value={milestones.count ?? 0} />
      </div>

      <section>
        <h2 className="section-title">Verification queue</h2>
        <p className="mt-1 text-sm text-muted">Check identity against official sources (Parliament or state assembly listings, party confirmation) before approving.</p>
        <div className="mt-4 space-y-3">
          {pending.map((r) => {
            const party = r.party_id ? byId.get(r.party_id) : null;
            const claim = r.claim_entity_id ? byId.get(r.claim_entity_id) : null;
            return (
              <div key={r.id} className="card p-5">
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div className="min-w-0">
                    <p className="font-bold">{r.full_name}</p>
                    <p className="text-sm text-muted">
                      {[r.position, r.constituency, party ? party.short_name ?? party.name : "Independent"].filter(Boolean).join(" · ")}
                    </p>
                    <p className="mt-1 text-xs text-muted">
                      Account: {nameOf.get(r.user_id) ?? r.user_id} · submitted {formatDate(r.created_at.slice(0, 10))}
                    </p>
                    {claim ? (
                      <p className="mt-2 text-sm">
                        Wants to claim{" "}
                        <Link href={`/e/${claim.slug}`} className="font-semibold text-brand-700 hover:underline">{claim.name}</Link>
                      </p>
                    ) : (
                      <p className="mt-2 text-sm">Creates a new politician profile</p>
                    )}
                    {r.bio ? <p className="mt-2 max-w-2xl text-sm text-slate-600">{r.bio}</p> : null}
                  </div>
                  <div className="flex flex-col gap-2 sm:items-end">
                    <form action={approveRequest}>
                      <input type="hidden" name="id" value={r.id} />
                      <SubmitButton className="btn-brand" pendingText="Approving…">Approve</SubmitButton>
                    </form>
                    <form action={rejectRequest} className="flex gap-2">
                      <input type="hidden" name="id" value={r.id} />
                      <input name="note" placeholder="Reason (shown to user)" className="input h-9 w-48 py-1.5 text-xs" />
                      <SubmitButton className="btn-ghost h-9 px-3 py-1.5 text-xs" pendingText="…">Reject</SubmitButton>
                    </form>
                  </div>
                </div>
              </div>
            );
          })}
          {!pending.length ? <EmptyState title="No requests waiting">Paid upgrade requests appear here for review.</EmptyState> : null}
        </div>
        {others.length ? (
          <details className="mt-4">
            <summary className="cursor-pointer text-sm font-semibold text-muted">Recent decisions and unpaid requests ({others.length})</summary>
            <ul className="mt-3 divide-y divide-line rounded-2xl border border-line bg-white text-sm">
              {others.map((r) => (
                <li key={r.id} className="flex flex-wrap justify-between gap-2 px-4 py-2.5">
                  <span className="font-medium">{r.full_name}</span>
                  <span className="text-muted">{r.status.replace("_", " ")} · {formatDate(r.updated_at.slice(0, 10))}</span>
                </li>
              ))}
            </ul>
          </details>
        ) : null}
      </section>

      <section className="card p-6">
        <h2 className="section-title">Add an editorial milestone</h2>
        <p className="mt-1 text-sm text-muted">Editorial records need a public source. They cannot be edited or deleted by politicians.</p>
        <div className="mt-5">
          <AdminMilestoneForm
            entities={entities.map((e) => ({ id: e.id, label: `${TYPE_LABEL[e.type]} · ${e.short_name && e.short_name !== e.name ? `${e.name} (${e.short_name})` : e.name}` }))}
          />
        </div>
      </section>
    </div>
  );
}
