import Link from "@/components/NavigationLink";
import type { Entity } from "@/lib/types";
import { dictionary, displayName } from "@/lib/dictionaries";
import type { Locale } from "@/lib/i18n";
import { Avatar, BlocBadge, TypeBadge } from "./ui";

export function EntityCard({ entity: e, parentName, locale = "en" }: { entity: Entity; parentName?: string | null; locale?: Locale }) {
  const t = dictionary(locale).entity;
  const subtitle =
    e.type === "politician"
      ? [e.position, e.constituency].filter(Boolean).join(" · ")
      : e.short_name && e.short_name !== e.name
        ? e.short_name
        : null;
  return (
    <Link href={`/e/${e.slug}`} className="card group flex min-w-0 items-center gap-3.5 p-4 transition hover:border-slate-300 hover:shadow-md">
      <Avatar name={e.name} slug={e.slug} short={e.short_name} photoPath={e.photo_path} />
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <span className="truncate font-semibold text-ink group-hover:text-brand-700">{displayName(e, locale)}</span>
          {e.owner_id ? (
            <span title={t.verified} className="text-brand-600">
              <svg viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4" aria-label={t.verified}>
                <path fillRule="evenodd" d="M10 1.5 12.4 3l2.8-.2.9 2.7 2.2 1.7-.9 2.7.9 2.7-2.2 1.7-.9 2.7-2.8-.2L10 18.5 7.6 17l-2.8.2-.9-2.7-2.2-1.7.9-2.7-.9-2.7 2.2-1.7.9-2.7 2.8.2L10 1.5Zm3.7 6.2a.75.75 0 0 0-1.1-1l-3.6 4-1.6-1.6a.75.75 0 1 0-1.1 1.1l2.2 2.1c.3.3.8.3 1.1 0l4.1-4.6Z" clipRule="evenodd" />
              </svg>
            </span>
          ) : null}
        </div>
        {subtitle ? <p className="truncate text-sm text-muted">{subtitle}</p> : null}
        <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
          <TypeBadge type={e.type} locale={locale} />
          <BlocBadge bloc={e.bloc} locale={locale} />
          {parentName ? <span className="text-xs text-muted">{parentName}</span> : null}
        </div>
      </div>
      <div className="text-right">
        <div className="text-sm font-bold tabular-nums">{e.upvotes}</div>
        <div className="text-[11px] text-muted">{t.upvotes}</div>
      </div>
    </Link>
  );
}
