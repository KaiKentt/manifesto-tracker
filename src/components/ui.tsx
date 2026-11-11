import Image from "next/image";
import Link from "@/components/NavigationLink";
import type { StatusFilter } from "@/lib/config";
import { dictionary, formatDateFor } from "@/lib/dictionaries";
import type { Locale } from "@/lib/i18n";
import type { Bloc, EntityType, Milestone } from "@/lib/types";
import { Portrait } from "./Portrait";
import { statusCounts } from "@/lib/milestones";
export { statusCounts } from "@/lib/milestones";
import { ENTITY_LOGOS } from "@/lib/entity-logos";

// Official logos and sourced portraits, with initials when no image is available.
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

export function Avatar({ name, slug, short, photoPath, size = 44 }: { name: string; slug: string; short?: string | null; photoPath?: string | null; size?: number }) {
  const logo = Object.hasOwn(ENTITY_LOGOS, slug) ? ENTITY_LOGOS[slug] : undefined;
  if (logo) {
    return (
      <span
        aria-hidden="true"
        className="inline-flex shrink-0 items-center justify-center overflow-hidden rounded-xl border border-line bg-white"
        style={{ width: size, height: size, padding: size < 28 ? 1 : 3 }}
      >
        <Image src={logo} alt="" width={size} height={size} sizes={`${size}px`} className="h-full w-full object-contain" />
      </span>
    );
  }

  const hash = [...slug].reduce((h, c) => (h * 31 + c.charCodeAt(0)) >>> 0, 7);
  const [bg, fg] = AVATAR_COLOURS[hash % AVATAR_COLOURS.length];
  const initials = short && short.length <= 4 && short !== name ? short.toUpperCase() : name
    .replace(/[^A-Za-z\s]/g, " ")
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0]!.toUpperCase())
    .join("");
  if (photoPath && /^\/portraits\/[a-z0-9-]+\.webp$/.test(photoPath)) {
    return <Portrait src={photoPath} name={name} size={size} initials={initials || "?"} background={bg} color={fg} />;
  }
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
const STATUS_STYLE: Record<StatusFilter, string> = {
  unknown: "bg-slate-100 text-slate-500",
  pledged: "bg-slate-100 text-slate-700",
  in_progress: "bg-sky-50 text-sky-700",
  achieved: "bg-emerald-50 text-emerald-700",
  delayed: "bg-amber-50 text-amber-800",
  broken: "bg-rose-50 text-rose-700",
};

export const STATUS_BAR: Record<StatusFilter, string> = {
  unknown: "bg-slate-200",
  pledged: "bg-slate-300",
  in_progress: "bg-sky-500",
  achieved: "bg-emerald-500",
  delayed: "bg-amber-400",
  broken: "bg-rose-500",
};

export function StatusBadge({ status: raw, locale = "en" }: { status: Milestone["status"]; locale?: Locale }) {
  const status = raw ?? "unknown";
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-semibold ${STATUS_STYLE[status]}`}>
      <span className={`h-1.5 w-1.5 rounded-full ${STATUS_BAR[status ?? "unknown"]}`} />
      {dictionary(locale).status[status]}
    </span>
  );
}

export function TypeBadge({ type, locale = "en" }: { type: EntityType; locale?: Locale }) {
  return (
    <span className="rounded-md bg-slate-100 px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wide text-slate-600">
      {dictionary(locale).type[type]}
    </span>
  );
}

export function BlocBadge({ bloc, locale = "en" }: { bloc: Bloc; locale?: Locale }) {
  const style =
    bloc === "government"
      ? "border-slate-300 text-slate-700"
      : bloc === "opposition"
        ? "border-slate-300 text-slate-700 border-dashed"
        : "border-line text-slate-500";
  return <span className={`rounded-md border px-2 py-0.5 text-[11px] font-semibold ${style}`}>{dictionary(locale).bloc[bloc]}</span>;
}

export function SourceBadge({ source, locale = "en" }: { source: Milestone["source_type"]; locale?: Locale }) {
  const t = dictionary(locale).source;
  return source === "editorial" ? (
    <span className="text-xs font-medium text-slate-500" title={t.editorialTitle}>
      {t.editorial}
    </span>
  ) : (
    <span className="text-xs font-medium text-brand-700" title={t.selfReportedTitle}>
      {t.selfReported}
    </span>
  );
}

export function SampleBadge({ locale = "en" }: { locale?: Locale }) {
  return (
    <span className="rounded-md bg-amber-100 px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wide text-amber-800">
      {dictionary(locale).sample}
    </span>
  );
}

// ── Progress ─────────────────────────────────────────────────────────
export function ProgressBar({ value, status, locale = "en" }: { value: number | null; status: Milestone["status"]; locale?: Locale }) {
  if (value === null) return <p className="text-xs text-muted">{dictionary(locale).progress.none}</p>;
  return (
    <div className="flex items-center gap-3">
      <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-slate-100">
        <div className={`h-full rounded-full ${STATUS_BAR[status ?? "unknown"]}`} style={{ width: `${value}%` }} />
      </div>
      <span className="w-9 text-right text-xs font-semibold tabular-nums text-slate-500">{value}%</span>
    </div>
  );
}

// ── Status mix: stacked bar + legend ─────────────────────────────────
export function StatusMix({ milestones, locale = "en" }: { milestones: Pick<Milestone, "status">[]; locale?: Locale }) {
  const labels = dictionary(locale).status;
  const counts = statusCounts(milestones);
  const total = milestones.length;
  const order: StatusFilter[] = ["achieved", "in_progress", "delayed", "pledged", "broken", "unknown"];
  if (!total) return <p className="text-sm text-muted">{dictionary(locale).mix.empty}</p>;
  return (
    <div>
      <div className="flex h-2.5 overflow-hidden rounded-full bg-slate-100">
        {order.map((s) =>
          counts[s] ? (
            <div key={s} className={STATUS_BAR[s]} style={{ width: `${(counts[s] / total) * 100}%` }} title={`${labels[s]}: ${counts[s]}`} />
          ) : null,
        )}
      </div>
      <ul className="mt-3 flex flex-wrap gap-x-4 gap-y-1.5">
        {order.filter((s) => s !== "unknown" || counts.unknown > 0).map((s) => (
          <li key={s} className="flex items-center gap-1.5 text-xs text-slate-600">
            <span className={`h-2 w-2 rounded-full ${STATUS_BAR[s]}`} />
            {labels[s]} <span className="font-semibold tabular-nums text-ink">{counts[s]}</span>
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

export function formatDate(value: string | null, locale: Locale = "en") {
  return formatDateFor(locale, value);
}
