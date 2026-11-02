import Link from "next/link";
import type { Milestone } from "@/lib/types";
import { UpvoteButton } from "./UpvoteButton";
import { ProgressBar, SampleBadge, SourceBadge, StatusBadge, formatDate } from "./ui";

export function MilestoneCard({
  milestone: m,
  voted,
  loggedIn,
  showEntity = true,
  compact = false,
}: {
  milestone: Milestone;
  voted: boolean;
  loggedIn: boolean;
  showEntity?: boolean;
  compact?: boolean;
}) {
  return (
    <article className={`card flex gap-4 ${compact ? "p-4" : "p-5"}`}>
      <div className="min-w-0 flex-1">
        <div className="mb-2 flex flex-wrap items-center gap-2">
          <StatusBadge status={m.status} />
          <span className="text-xs text-muted">{m.category}</span>
          {m.is_sample ? <SampleBadge /> : null}
        </div>
        <h3 className={`font-semibold leading-snug text-ink ${compact ? "text-sm" : "text-[15px]"}`}>
          {m.title.replace(/^\[Sample\]\s*/, "")}
        </h3>
        {!compact && m.description ? <p className="mt-1.5 line-clamp-2 text-sm text-muted">{m.description}</p> : null}
        <div className="mt-3">
          <ProgressBar value={m.progress} status={m.status} />
        </div>
        <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted">
          {showEntity && m.entity ? (
            <Link href={`/e/${m.entity.slug}`} className="font-semibold text-ink hover:text-brand-700">
              {m.entity.short_name ?? m.entity.name}
            </Link>
          ) : null}
          <SourceBadge source={m.source_type} />
          {m.target_date ? <span>Target {formatDate(m.target_date)}</span> : null}
          {m.evidence_url ? (
            <a href={m.evidence_url} target="_blank" rel="noopener noreferrer nofollow" className="font-medium text-brand-700 hover:underline">
              Evidence ↗
            </a>
          ) : null}
          {!compact ? <span>Updated {formatDate(m.updated_at.slice(0, 10))}</span> : null}
        </div>
      </div>
      <div>
        <UpvoteButton targetType="milestone" targetId={m.id} count={m.upvotes} voted={voted} loggedIn={loggedIn} size={compact ? "sm" : "md"} />
      </div>
    </article>
  );
}
