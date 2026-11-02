import Link from "next/link";
import { BLOC_LABEL, STATUS_LABEL, TYPE_LABEL, type MilestoneStatus } from "@/lib/config";
import type { Bloc, EntityType, Milestone } from "@/lib/types";

// ── Avatar: initials on a soft colour derived from the slug ─────────
const AVATAR_COLOURS = [
  ["#eef2ff", "#4338ca"],
  ["#ecfeff", "#0e7490"],
  ["#fef3c7", "#b45309"],
  ["#fce7f3", "#be185d"],
  ["#f5f3ff", "#6d28d9"],
  ["#ecfdf5", "#047857"],
  ["#f1f5f9", "#334155"],
  ["#fff7ed", "#c2410c"],
];

export function Avatar({ name, slug, short, size = 44 }: { name: string; slug: string; short?: string | null; size?: number }) {
  const hash = [...slug].reduce((h, c) => (h * 31 + c.charCodeAt(0)) >>> 0, 7);
  const [bg, fg] = AVATAR_COLOURS[hash % AVATAR_COLOURS.length];
  const initials = short && short.length <= 4 && short !== name ? short.toUpperCase() : name
    .replace(/[^A-Za-z\s]/g, " ")
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0]!.toUpperCase())
    .join("");
  return (
    <span
      aria-hidden
      className="inline-flex shrink-0 items-center justify-center rounded-xl font-bold"
      style={{ width: size, height: size, background: bg, color: fg, fontSize: size * (initials.length > 2 ? 0.28 : 0.36) }}
    >
      {initials || "?"}
    </span>
  );
}

// ── Badges ───────────────────────────────────────────────────────────
const STATUS_STYLE: Record<MilestoneStatus, string> = {
  pledged: "bg-slate-100 text-slate-700",
  in_progress: "bg-sky-50 text-sky-700",
  achieved: "bg-emerald-50 text-emerald-700",
  delayed: "bg-amber-50 text-amber-800",
  broken: "bg-rose-50 text-rose-700",
};

export const STATUS_BAR: Record<MilestoneStatus, string> = {
  pledged: "bg-slate-300",
  in_progress: "bg-sky-500",
  achieved: "bg-emerald-500",
  delayed: "bg-amber-400",
  broken: "bg-rose-500",
};

export function StatusBadge({ status }: { status: MilestoneStatus }) {
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-semibold ${STATUS_STYLE[status]}`}>
      <span className={`h-1.5 w-1.5 rounded-full ${STATUS_BAR[status]}`} />
      {STATUS_LABEL[status]}
    </span>
  );
}

export function TypeBadge({ type }: { type: EntityType }) {
  return (
    <span className="rounded-md bg-slate-100 px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wide text-slate-600">
      {TYPE_LABEL[type]}
    </span>
  );
}

export function BlocBadge({ bloc }: { bloc: Bloc }) {
  const style =
    bloc === "government"
      ? "border-slate-300 text-slate-700"
      : bloc === "opposition"
        ? "border-slate-300 text-slate-700 border-dashed"
        : "border-line text-slate-500";
  return <span className={`rounded-md border px-2 py-0.5 text-[11px] font-semibold ${style}`}>{BLOC_LABEL[bloc]}</span>;
}

export function SourceBadge({ source }: { source: Milestone["source_type"] }) {
  return source === "editorial" ? (
    <span className="text-xs font-medium text-slate-500" title="Curated by the Manifesto Tracker editorial team">
      Editorial
    </span>
  ) : (
    <span className="text-xs font-medium text-brand-700" title="Posted by the politician; not independently verified">
      Self-reported
    </span>
  );
}

export function SampleBadge() {
  return (
    <span className="rounded-md bg-amber-100 px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wide text-amber-800">
      Sample
    </span>
  );
}

// ── Progress ─────────────────────────────────────────────────────────
export function ProgressBar({ value, status }: { value: number; status: MilestoneStatus }) {
  return (
    <div className="flex items-center gap-3">
      <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-slate-100">
        <div className={`h-full rounded-full ${STATUS_BAR[status]}`} style={{ width: `${value}%` }} />
      </div>
      <span className="w-9 text-right text-xs font-semibold tabular-nums text-slate-500">{value}%</span>
    </div>
  );
}

// ── Status mix: stacked bar + legend ─────────────────────────────────
export function statusCounts(milestones: Pick<Milestone, "status">[]) {
  const counts: Record<MilestoneStatus, number> = { pledged: 0, in_progress: 0, achieved: 0, delayed: 0, broken: 0 };
  milestones.forEach((m) => counts[m.status]++);
  return counts;
}

export function StatusMix({ milestones }: { milestones: Pick<Milestone, "status">[] }) {
  const counts = statusCounts(milestones);
  const total = milestones.length;
  const order: MilestoneStatus[] = ["achieved", "in_progress", "delayed", "pledged", "broken"];
  if (!total) return <p className="text-sm text-muted">No milestones tracked yet.</p>;
  return (
    <div>
      <div className="flex h-2.5 overflow-hidden rounded-full bg-slate-100">
        {order.map((s) =>
          counts[s] ? (
            <div key={s} className={STATUS_BAR[s]} style={{ width: `${(counts[s] / total) * 100}%` }} title={`${STATUS_LABEL[s]}: ${counts[s]}`} />
          ) : null,
        )}
      </div>
      <ul className="mt-3 flex flex-wrap gap-x-4 gap-y-1.5">
        {order.map((s) => (
          <li key={s} className="flex items-center gap-1.5 text-xs text-slate-600">
            <span className={`h-2 w-2 rounded-full ${STATUS_BAR[s]}`} />
            {STATUS_LABEL[s]} <span className="font-semibold tabular-nums text-ink">{counts[s]}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

export function StatTile({ label, value, hint }: { label: string; value: string | number; hint?: string }) {
  return (
    <div>
      <div className="text-2xl font-bold tabular-nums tracking-tight text-ink">{value}</div>
      <div className="text-xs font-medium text-muted">{label}</div>
      {hint ? <div className="text-[11px] text-slate-400">{hint}</div> : null}
    </div>
  );
}

export function EmptyState({ title, children }: { title: string; children?: React.ReactNode }) {
  return (
    <div className="card flex flex-col items-center gap-2 px-6 py-10 text-center">
      <p className="font-semibold">{title}</p>
      {children ? <div className="max-w-md text-sm text-muted">{children}</div> : null}
    </div>
  );
}

export function FormMessage({ state }: { state: { error?: string; message?: string } }) {
  if (state.error) return <p role="alert" className="rounded-xl bg-rose-50 px-3.5 py-2.5 text-sm text-rose-700">{state.error}</p>;
  if (state.message) return <p role="status" className="rounded-xl bg-emerald-50 px-3.5 py-2.5 text-sm text-emerald-700">{state.message}</p>;
  return null;
}

export function BackLink({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <Link href={href} className="text-sm font-medium text-muted hover:text-ink">
      ← {children}
    </Link>
  );
}

export function formatDate(value: string | null) {
  if (!value) return null;
  return new Date(value + (value.length === 10 ? "T00:00:00" : "")).toLocaleDateString("en-MY", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}
