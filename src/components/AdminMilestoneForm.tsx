"use client";

import { useActionState } from "react";
import { addEditorialMilestone } from "@/actions/admin";
import type { FormState } from "@/lib/forms";
import { CATEGORIES, STATUSES, STATUS_LABEL } from "@/lib/config";
import { SubmitButton } from "./SubmitButton";
import { FormMessage } from "./ui";

export function AdminMilestoneForm({ entities }: { entities: { id: string; label: string }[] }) {
  const [state, action] = useActionState<FormState, FormData>(addEditorialMilestone, {});
  const v = state.values ?? {};
  return (
    <form action={action} className="grid gap-4 sm:grid-cols-6">
      <div className="sm:col-span-6">
        <label className="label">Entity</label>
        <select name="entity_id" required className="input" defaultValue={v.entity_id ?? ""}>
          <option value="" disabled>Choose a bloc, coalition, party or politician</option>
          {entities.map((e) => (
            <option key={e.id} value={e.id}>{e.label}</option>
          ))}
        </select>
      </div>
      <div className="sm:col-span-6">
        <label className="label">Title</label>
        <input name="title" defaultValue={v.title} required minLength={3} maxLength={200} className="input" placeholder="The pledge, in the manifesto's own terms" />
      </div>
      <div className="sm:col-span-6">
        <label className="label">Details</label>
        <textarea name="description" rows={3} defaultValue={v.description} className="input" placeholder="What was promised, where (manifesto page), and the current state" />
      </div>
      <div className="sm:col-span-2">
        <label className="label">Category</label>
        <select name="category" className="input" defaultValue={v.category ?? "Other"}>
          {CATEGORIES.map((c) => <option key={c}>{c}</option>)}
        </select>
      </div>
      <div className="sm:col-span-2">
        <label className="label">Status</label>
        <select name="status" className="input" defaultValue={v.status ?? "pledged"}>
          {STATUSES.map((s) => <option key={s} value={s}>{STATUS_LABEL[s]}</option>)}
        </select>
      </div>
      <div className="sm:col-span-2">
        <label className="label">Progress (%)</label>
        <input name="progress" type="number" min={0} max={100} defaultValue={v.progress ?? 0} className="input" />
      </div>
      <div className="sm:col-span-2">
        <label className="label">Target date</label>
        <input name="target_date" type="date" defaultValue={v.target_date} className="input" />
      </div>
      <div className="sm:col-span-4">
        <label className="label">Source / evidence link</label>
        <input name="evidence_url" type="url" required defaultValue={v.evidence_url} className="input" placeholder="https:// manifesto PDF, Hansard, gazette, news report" />
      </div>
      <div className="sm:col-span-6 space-y-3">
        <FormMessage state={state} />
        <SubmitButton>Add editorial milestone</SubmitButton>
      </div>
    </form>
  );
}
