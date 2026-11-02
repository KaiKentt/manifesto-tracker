import Link from "next/link";
import type { Metadata } from "next";
import { requireViewer } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { PLAN, isDemoMode } from "@/lib/config";
import { UpgradeForm } from "@/components/UpgradeForm";

export const metadata: Metadata = { title: "For politicians" };

export default async function UpgradePage({ searchParams }: { searchParams: Promise<{ claim?: string; canceled?: string }> }) {
  const { claim, canceled } = await searchParams;
  const viewer = await requireViewer(`/upgrade${claim ? `?claim=${claim}` : ""}`);
  const supabase = await createClient();

  if (viewer.profile?.role === "politician" || viewer.profile?.role === "admin") {
    return (
      <div className="card mx-auto max-w-lg p-8 text-center">
        <h1 className="text-xl font-bold">You already have politician access</h1>
        <p className="mt-2 text-sm text-muted">Manage your profile, milestones and subscription from your dashboard.</p>
        <Link href="/dashboard" className="btn-primary mt-6">Go to dashboard</Link>
      </div>
    );
  }

  const [{ data: parties }, { data: claimable }] = await Promise.all([
    supabase.from("entities").select("id, name, short_name").eq("type", "party").order("name"),
    supabase.from("entities").select("id, name, position").eq("type", "politician").is("owner_id", null).order("name"),
  ]);

  return (
    <div className="grid gap-8 lg:grid-cols-[1fr_360px]">
      <div className="card p-6 sm:p-8">
        <p className="text-sm font-semibold text-brand-700">For politicians</p>
        <h1 className="mt-1 text-2xl font-extrabold tracking-tight">Become a verified politician</h1>
        <p className="mt-2 text-sm text-muted">
          Tell us who you are. After payment, our editorial team verifies your identity, then your public page goes live and
          you can publish milestones.
        </p>
        {canceled ? <p className="mt-4 rounded-xl bg-amber-50 px-3.5 py-2.5 text-sm text-amber-900">Checkout was cancelled — nothing was charged.</p> : null}
        <div className="mt-6">
          <UpgradeForm
            parties={(parties ?? []).map((p) => ({ id: p.id, label: p.short_name ? `${p.name} (${p.short_name})` : p.name }))}
            claimable={(claimable ?? []).map((p) => ({ id: p.id, label: p.position ? `${p.name} — ${p.position}` : p.name }))}
            defaultClaim={claim}
            demo={isDemoMode()}
            priceLabel={PLAN.priceLabel}
          />
        </div>
      </div>

      <aside className="card h-fit p-6">
        <p className="text-sm font-semibold text-muted">{PLAN.name} plan</p>
        <p className="mt-1">
          <span className="text-3xl font-extrabold tracking-tight">{PLAN.priceLabel}</span>
          <span className="text-sm text-muted"> / {PLAN.interval}</span>
        </p>
        <ul className="mt-5 space-y-2.5 text-sm">
          {PLAN.perks.map((perk) => (
            <li key={perk} className="flex gap-2">
              <svg viewBox="0 0 20 20" fill="currentColor" className="mt-0.5 h-4 w-4 shrink-0 text-brand-600" aria-hidden>
                <path fillRule="evenodd" d="M16.7 5.3a1 1 0 0 1 0 1.4l-8 8a1 1 0 0 1-1.4 0l-4-4a1 1 0 1 1 1.4-1.4L8 12.6l7.3-7.3a1 1 0 0 1 1.4 0Z" clipRule="evenodd" />
              </svg>
              {perk}
            </li>
          ))}
        </ul>
        <p className="mt-6 text-xs text-muted">
          Payments are processed by Stripe. Card details never touch our servers. {isDemoMode() ? "Demo mode is on: no payment is taken." : ""}
        </p>
      </aside>
    </div>
  );
}
