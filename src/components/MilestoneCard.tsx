import Link from "@/components/NavigationLink";
import { publicUrl } from "@/lib/milestones";
import { dictionary } from "@/lib/dictionaries";
import type { Locale } from "@/lib/i18n";
import type { Milestone } from "@/lib/types";
import { UpvoteButton } from "./UpvoteButton";
import { ProgressBar, SampleBadge, SourceBadge, StatusBadge, formatDate } from "./ui";

export function MilestoneCard({
  milestone: m,
  voted,
  loggedIn,
  showEntity = true,
  compact = false,
  locale = "en",
}: {
  milestone: Milestone;
  voted: boolean;
  loggedIn: boolean;
  showEntity?: boolean;
  compact?: boolean;
  locale?: Locale;
}) {
  const t = dictionary(locale).milestone;
  const date = (value: string | null | undefined) => formatDate(value ?? null, locale);
  // Records are written in English; mark them so screen readers pronounce them correctly on Malay pages.
  const contentLang = locale === "en" ? undefined : "en";
  return (
    <article className={`card flex gap-4 ${compact ? "p-4" : "p-5"}`}>
      <div className="min-w-0 flex-1">
        <div className="mb-2 flex flex-wrap items-center gap-2">
          <StatusBadge status={m.status} locale={locale} />
          <span className="text-xs text-muted" lang={contentLang}>{m.category}</span>
          {m.is_sample ? <SampleBadge locale={locale} /> : null}
        </div>
        <h3 lang={contentLang} className={`font-semibold leading-snug text-ink ${compact ? "text-sm" : "text-[15px]"}`}>
          {m.title.replace(/^\[Sample\]\s*/, "")}
        </h3>
        {!compact && m.description ? <p lang={contentLang} className="mt-1.5 text-sm text-muted">{m.description}</p> : null}
        <div className="mt-3">
          <ProgressBar value={m.progress} status={m.status} locale={locale} />
        </div>
        {!compact && m.progress_note ? <p lang={contentLang} className="mt-2 text-sm leading-relaxed text-slate-600">{m.progress_note}</p> : null}
        <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted">
          {showEntity && m.entity ? (
            <Link href={`/e/${m.entity.slug}`} className="font-semibold text-ink hover:text-brand-700">
              {m.entity.short_name ?? m.entity.name}
            </Link>
          ) : null}
          <SourceBadge source={m.source_type} locale={locale} />
          {m.target_date ? <span>{t.target(date(m.target_date)!)}</span> : null}
          {publicUrl(m.promise_url) ? <a href={publicUrl(m.promise_url)!} target="_blank" rel="noopener noreferrer nofollow" className="font-medium text-brand-700 hover:underline">{t.promise}{m.promise_date ? ` · ${date(m.promise_date)}` : ""} ↗</a> : null}
          {publicUrl(m.evidence_url) ? (
            <a href={publicUrl(m.evidence_url)!} target="_blank" rel="noopener noreferrer nofollow" className="font-medium text-brand-700 hover:underline">
              {m.promise_url ? t.progressEvidence : t.evidence}{m.evidence_date ? ` · ${date(m.evidence_date)}` : ""} ↗
            </a>
          ) : null}
          {m.progress_checked_at ? <span>{t.reviewed(date(m.progress_checked_at)!)}</span> : null}
          {!compact && !m.progress_checked_at ? <span>{t.updated(date(m.updated_at.slice(0, 10))!)}</span> : null}
        </div>
      </div>
      <div>
        <UpvoteButton targetType="milestone" targetId={m.id} count={m.upvotes} voted={voted} loggedIn={loggedIn} size={compact ? "sm" : "md"} />
      </div>
    </article>
  );
}
