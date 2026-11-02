"use client";

import { useActionState } from "react";
import { startUpgrade } from "@/actions/upgrade";
import type { FormState } from "@/lib/forms";
import { SubmitButton } from "./SubmitButton";
import { FormMessage } from "./ui";

type Option = { id: string; label: string };

export function UpgradeForm({
  parties,
  claimable,
  defaultClaim,
  demo,
  priceLabel,
}: {
  parties: Option[];
  claimable: Option[];
  defaultClaim?: string;
  demo: boolean;
  priceLabel: string;
}) {
  const [state, action] = useActionState<FormState, FormData>(startUpgrade, {});
  const v = state.values ?? {};
  return (
    <form action={action} className="space-y-5">
      <div className="grid gap-5 sm:grid-cols-2">
        <div className="sm:col-span-2">
          <label htmlFor="claim_entity_id" className="label">Claim an existing profile (optional)</label>
          <select id="claim_entity_id" name="claim_entity_id" defaultValue={v.claim_entity_id ?? defaultClaim ?? ""} className="input">
            <option value="">No — create a new profile for me</option>
            {claimable.map((o) => (
              <option key={o.id} value={o.id}>{o.label}</option>
            ))}
          </select>
          <p className="mt-1 text-xs text-muted">Our team checks your identity before linking you to an existing profile.</p>
        </div>
        <div className="sm:col-span-2">
          <label htmlFor="full_name" className="label">Full name (as on official records)</label>
          <input id="full_name" name="full_name" required minLength={3} defaultValue={v.full_name} className="input" />
        </div>
        <div>
          <label htmlFor="party_id" className="label">Party</label>
          <select id="party_id" name="party_id" className="input" defaultValue={v.party_id ?? ""}>
            <option value="">Independent / not listed</option>
            {parties.map((o) => (
              <option key={o.id} value={o.id}>{o.label}</option>
            ))}
          </select>
        </div>
        <div>
          <label htmlFor="position" className="label">Position</label>
          <input id="position" name="position" defaultValue={v.position} className="input" placeholder="e.g. Member of Parliament" />
        </div>
        <div>
          <label htmlFor="constituency" className="label">Constituency</label>
          <input id="constituency" name="constituency" defaultValue={v.constituency} className="input" placeholder="e.g. P.000 Example" />
        </div>
        <div className="sm:col-span-2">
          <label htmlFor="bio" className="label">Short background</label>
          <textarea id="bio" name="bio" rows={4} defaultValue={v.bio} className="input" placeholder="Education, career, roles held…" />
        </div>
      </div>

      <label className="flex items-start gap-3 rounded-xl bg-slate-50 p-4 text-sm text-slate-700">
        <input type="checkbox" name="agree" defaultChecked={v.agree === "on"} className="mt-0.5 h-4 w-4 accent-[#7c3aed]" />
        <span>
          I confirm I am the person named above or their authorised office, and I understand that my posts are shown as
          <strong> self-reported</strong>, that the public record stays visible if I cancel, and that the editorial team may add
          independent milestones to my profile.
        </span>
      </label>

      <FormMessage state={state} />
      <SubmitButton className="btn-brand w-full py-3" pendingText={demo ? "Activating…" : "Opening secure checkout…"}>
        {demo ? "Activate (demo mode — no payment)" : `Continue to payment · ${priceLabel}/month`}
      </SubmitButton>
    </form>
  );
}
