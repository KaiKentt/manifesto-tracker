import { STATUSES, type MilestoneStatus, type StatusFilter } from "./config";

export function parseProgress(value: FormDataEntryValue | null): number | null {
  if (typeof value !== "string" || !value.trim()) return null;
  const number = Number(value);
  return Number.isFinite(number) ? Math.round(Math.max(0, Math.min(100, number))) : null;
}

export function parseStatus(value: FormDataEntryValue | null): MilestoneStatus | null {
  return typeof value === "string" && (STATUSES as readonly string[]).includes(value) ? value as MilestoneStatus : null;
}

export function statusCounts(milestones: { status: MilestoneStatus | null }[]) {
  const counts: Record<StatusFilter, number> = { pledged: 0, in_progress: 0, achieved: 0, delayed: 0, broken: 0, unknown: 0 };
  milestones.forEach((m) => counts[m.status ?? "unknown"]++);
  return counts;
}

export function achievementSummary(milestones: { status: MilestoneStatus | null }[]) {
  const counts = statusCounts(milestones);
  const recorded = milestones.length - counts.unknown;
  return { counts, recorded, rate: recorded ? Math.round(counts.achieved / recorded * 100) : null };
}

export function publicUrl(value: string | null | undefined) {
  if (!value) return null;
  try { const url = new URL(value); return ["https:", "http:"].includes(url.protocol) ? url.href : null; }
  catch { return null; }
}
