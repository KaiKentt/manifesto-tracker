"use client";

import { useActionState } from "react";
import { createMilestone, updateMilestone, updateOwnProfile } from "@/actions/dashboard";
import type { FormState } from "@/lib/forms";
import { CATEGORIES, STATUSES, STATUS_LABEL } from "@/lib/config";
import type { Entity, Milestone } from "@/lib/types";
import { SubmitButton } from "./SubmitButton";
import { FormMessage } from "./ui";

export function ProfileForm({ entity, disabled }: { entity: Entity; disabled: boolean }) {
  const [state, action] = useActionState<FormState, FormData>(updateOwnProfile, {});
  const v = state.values ?? {};
  return (
    <form action={action} className="space-y-4">
      <input type="hidden" name="entity_id" value={entity.id} />
      <fieldset disabled={disabled} className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="label" htmlFor="position">Position</label>
          <input id="position" name="position" defaultValue={v.position ?? entity.position ?? ""} className="input" />
        </div>
        <div>
          <label className="label" htmlFor="constituency">Constituency</label>
          <input id="constituency" name="constituency" defaultValue={v.constituency ?? entity.constituency ?? ""} className="input" />
        </div>
        <div>
          <label className="label" htmlFor="state">State</label>
          <input id="state" name="state" defaultValue={v.state ?? entity.state ?? ""} className="input" />
        </div>
        <div>
          <label className="label" htmlFor="website">Website</label>
          <input id="website" name="website" type="url" defaultValue={v.website ?? entity.website ?? ""} className="input" placeholder="https://" />
        </div>
        <div className="sm:col-span-2">
          <label className="label" htmlFor="description">Background</label>
          <textarea id="description" name="description" rows={4} defaultValue={v.description ?? entity.description ?? ""} className="input" />
        </div>
      </fieldset>
      <FormMessage state={state} />
      <SubmitButton disabled={disabled}>Save profile</SubmitButton>
    </form>
  );
}

export function MilestoneForm({ entityId, milestone, disabled }: { entityId: string; milestone?: Milestone; disabled: boolean }) {
  const [state, action] = useActionState<FormState, FormData>(milestone ? updateMilestone : createMilestone, {});
  const m = milestone;
  const v = state.values ?? {};
  return (
    <form action={action} className="space-y-4">
      <input type="hidden" name="entity_id" value={entityId} />
      {m ? <input type="hidden" name="id" value={m.id} /> : null}
      <fieldset disabled={disabled} className="grid gap-4 sm:grid-cols-6">
        <div className="sm:col-span-6">
          <label className="label">Title</label>
          <input name="title" required minLength={3} maxLength={200} defaultValue={v.title ?? m?.title ?? ""} className="input" placeholder="What did you promise?" />
        </div>
        <div className="sm:col-span-6">
          <label className="label">Details</label>
          <textarea name="description" rows={3} defaultValue={v.description ?? m?.description ?? ""} className="input" placeholder="What has been done so far, and what is next?" />
        </div>
        <div className="sm:col-span-2">
          <label className="label">Category</label>
          <select name="category" defaultValue={v.category ?? m?.category ?? "Other"} className="input">
            {CATEGORIES.map((c) => (
              <option key={c}>{c}</option>
            ))}
          </select>
        </div>
        <div className="sm:col-span-2">
          <label className="label">Status</label>
          <select name="status" defaultValue={v.status ?? m?.status ?? "pledged"} className="input">
            {STATUSES.map((s) => (
              <option key={s} value={s}>{STATUS_LABEL[s]}</option>
            ))}
          </select>
        </div>
        <div className="sm:col-span-2">
          <label className="label">Progress (%)</label>
          <input name="progress" type="number" min={0} max={100} defaultValue={v.progress ?? m?.progress ?? 0} className="input" />
        </div>
        <div className="sm:col-span-2">
          <label className="label">Target date</label>
          <input name="target_date" type="date" defaultValue={v.target_date ?? m?.target_date ?? ""} className="input" />
        </div>
        <div className="sm:col-span-4">
          <label className="label">Evidence link</label>
          <input name="evidence_url" type="url" defaultValue={v.evidence_url ?? m?.evidence_url ?? ""} className="input" placeholder="https:// news report, Hansard, gazette…" />
        </div>
      </fieldset>
      <FormMessage state={state} />
      <SubmitButton disabled={disabled} className={m ? "btn-primary" : "btn-brand"}>
        {m ? "Save changes" : "Publish milestone"}
      </SubmitButton>
    </form>
  );
}
