import Link from "@/components/NavigationLink";
import { Avatar, StatusBadge, formatDate } from "@/components/ui";
import { dictionary } from "@/lib/dictionaries";
import type { Locale } from "@/lib/i18n";
import { publicUrl } from "@/lib/milestones";
import type { Entity, Milestone } from "@/lib/types";

function host(url: string | null | undefined) {
  const safe = publicUrl(url);
  return safe ? new URL(safe).hostname.replace(/^www\./, "") : null;
}

/**
 * Chooses the record shown on the homepage: an achieved, editorially sourced record with evidence.
 * Alternates between the government and the opposition each day, so neither side is always featured.
 */
export function pickFeatured(milestones: Milestone[], now = Date.now()) {
  const day = Math.floor(now / 86_400_000);
  const eligible = milestones
    .filter((m) => !m.is_sample && m.status === "achieved" && m.source_type === "editorial" && publicUrl(m.evidence_url))
    .sort((a, b) => a.id.localeCompare(b.id));
  const sides = day % 2 === 0 ? ["government", "opposition"] : ["opposition", "government"];
  for (const side of sides) {
    const pool = eligible.filter((m) => m.entity?.bloc === side);
    if (pool.length) return pool[Math.floor(day / 2) % pool.length];
  }
  return eligible[0] ?? null;
}

export function FeaturedRecord({ milestone: m, entity, locale }: { milestone: Milestone; entity: Entity; locale: Locale }) {
  const t = dictionary(locale).home;
  const date = (value: string | null | undefined) => formatDate(value ?? null, locale);
  const contentLang = locale === "en" ? undefined : "en";
  const promised = Boolean(m.promise_date || publicUrl(m.promise_url));
  const place = [entity.position, entity.constituency].filter(Boolean).join(" · ");

  const rows = [
    promised ? { dot: "bg-slate-300", title: t.promised, when: date(m.promise_date), url: publicUrl(m.promise_url), source: host(m.promise_url) } : null,
    { dot: "bg-emerald-500", title: t.evidence, when: date(m.evidence_date), url: publicUrl(m.evidence_url), source: host(m.evidence_url) },
    m.progress_checked_at ? { dot: "bg-sky-500", title: t.reviewed, when: date(m.progress_checked_at), url: null, source: null } : null,
  ].filter(Boolean) as { dot: string; title: string; when: string | null; url: string | null; source: string | null }[];

  return (
    <figure className="rise-in relative mx-auto w-full min-w-0 max-w-md lg:max-w-none" style={{ "--delay": "0.35s" } as React.CSSProperties}>
      <div aria-hidden className="absolute inset-x-6 -bottom-3 top-3 rounded-2xl bg-white/10" />
      <div aria-hidden className="absolute inset-x-12 -bottom-6 top-6 rounded-2xl bg-white/5" />
      <div className="card relative p-5 text-ink shadow-[0_30px_70px_-25px_rgba(0,0,0,0.55)] sm:p-6">
        <p className="mb-4 text-xs font-semibold text-slate-500">{t.featured}</p>
        <div className="flex items-center gap-3">
          <Avatar name={entity.name} slug={entity.slug} short={entity.short_name} photoPath={entity.photo_path} size={44} />
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold">{entity.name}</p>
            {place ? <p lang={contentLang} className="truncate text-xs text-muted">{place}</p> : null}
          </div>
        </div>

        <p lang={contentLang} className="mt-4 text-lg font-bold leading-snug">{m.title}</p>
        <div className="mt-3 flex items-center gap-2">
          <span className="fr-stack grid">
            {promised ? (
              <span className="fr-first" aria-hidden>
                <StatusBadge status="pledged" locale={locale} />
              </span>
            ) : null}
            <span className={`fr-final ${promised ? "fr-steps" : ""}`}>
              <StatusBadge status={m.status} locale={locale} />
            </span>
          </span>
          <span lang={contentLang} className="text-xs text-muted">{m.category}</span>
        </div>

        <ol className="mt-5 space-y-3.5 border-t border-line pt-4 text-sm">
          {rows.map((row) => (
            <li key={row.title} className="fr-row flex gap-3">
              <span className={`mt-1.5 h-2 w-2 shrink-0 rounded-full ${row.dot}`} aria-hidden />
              <div className="min-w-0 flex-1">
                <div className="flex items-baseline justify-between gap-3">
                  <span className="font-semibold">{row.title}</span>
                  {row.when ? <span className="shrink-0 text-xs tabular-nums text-muted">{row.when}</span> : null}
                </div>
                {row.url && row.source ? (
                  <a href={row.url} target="_blank" rel="noopener noreferrer nofollow" className="text-xs text-brand-700 hover:underline">
                    {t.sourceFrom(row.source)} ↗
                  </a>
                ) : null}
              </div>
            </li>
          ))}
        </ol>

        <Link href={`/e/${entity.slug}`} className="mt-5 inline-block text-sm font-semibold text-brand-700 hover:underline">
          {t.openRecord(entity.short_name ?? entity.name)} →
        </Link>
      </div>
    </figure>
  );
}
