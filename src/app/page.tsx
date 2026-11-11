import type { Metadata } from "next";
import Form from "next/form";
import Link from "@/components/NavigationLink";
import { createClient } from "@/lib/supabase/server";
import { getVotedIds, getViewer } from "@/lib/auth";
import { MILESTONE_SELECT, type Entity, type Milestone } from "@/lib/types";
import { SITE } from "@/lib/config";
import { achievementSummary } from "@/lib/milestones";
import { displayName } from "@/lib/dictionaries";
import { languageAlternates, localePath } from "@/lib/i18n";
import { baseOpenGraph, getDictionary, getLocale } from "@/lib/i18n-server";
import { MilestoneCard } from "@/components/MilestoneCard";
import { EntityCard } from "@/components/EntityCard";
import { UpvoteButton } from "@/components/UpvoteButton";
import { Avatar, StatTile, StatusMix } from "@/components/ui";
import { FeaturedRecord, pickFeatured } from "@/components/home/FeaturedRecord";
import { RiseWords, riseDelay } from "@/components/home/RiseWords";
import { JsonLd } from "@/components/JsonLd";
import "./home.css";

export async function generateMetadata(): Promise<Metadata> {
  const [locale, t, og] = await Promise.all([getLocale(), getDictionary(), baseOpenGraph()]);
  return {
    title: { absolute: t.meta.homeTitle },
    description: t.meta.homeDescription,
    alternates: languageAlternates(locale, "/"),
    openGraph: { ...og, type: "website", title: t.meta.homeTitle, description: t.meta.homeDescription, url: localePath(locale, "/") },
  };
}

export default async function HomePage() {
  const supabase = await createClient();
  const [locale, t] = await Promise.all([getLocale(), getDictionary()]);
  const [viewer, { data: entityRows }, { data: milestoneRows }, { data: profileRows }] = await Promise.all([
    getViewer(),
    supabase.from("entities").select("*").in("type", ["bloc", "alliance"]).order("name"),
    // Sample placeholders stay in the database but never appear on public pages.
    supabase.from("milestones").select(MILESTONE_SELECT).eq("is_sample", false).order("updated_at", { ascending: false }).limit(500),
    supabase.from("entities").select("id").neq("type", "bloc"),
  ]);

  const entities = (entityRows ?? []) as Entity[];
  const milestones = (milestoneRows ?? []) as unknown as Milestone[];
  const blocs = ["government", "opposition"].map((b) => entities.find((e) => e.type === "bloc" && e.bloc === b)).filter(Boolean) as Entity[];
  const alliances = entities.filter((e) => e.type === "alliance");

  const featured = pickFeatured(milestones);
  const { data: featuredEntity } = featured
    ? await supabase.from("entities").select("*").eq("id", featured.entity_id).maybeSingle()
    : { data: null };

  const byUpvotes = [...milestones].sort((a, b) => b.upvotes - a.upvotes || b.updated_at.localeCompare(a.updated_at));
  const top = byUpvotes.slice(0, 6);
  const recent = milestones.slice(0, 6);

  const shown = [...new Set([...top, ...recent, ...milestones].map((m) => m.id))];
  const [votedMilestones, votedEntities] = await Promise.all([
    getVotedIds("milestone", shown),
    getVotedIds("entity", entities.map((e) => e.id)),
  ]);
  const loggedIn = Boolean(viewer);
  const card = (m: Milestone) => (
    <MilestoneCard key={m.id} milestone={m} voted={votedMilestones.has(m.id)} loggedIn={loggedIn} compact locale={locale} />
  );

  return (
    <>
      <JsonLd
        data={[
          {
            "@context": "https://schema.org",
            "@type": "WebSite",
            "@id": `${SITE.origin}/#website`,
            name: t.brand.full,
            alternateName: ["Manifesto Akar", "Manifesto Akar Asia", SITE.name],
            url: `${SITE.origin}/`,
            inLanguage: ["en-MY", "ms-MY"],
            publisher: { "@id": `${SITE.origin}/#organization` },
            potentialAction: {
              "@type": "SearchAction",
              target: { "@type": "EntryPoint", urlTemplate: `${SITE.origin}${localePath(locale, "/search")}?q={search_term_string}` },
              "query-input": "required name=search_term_string",
            },
          },
          {
            "@context": "https://schema.org",
            "@type": "Organization",
            "@id": `${SITE.origin}/#organization`,
            name: t.brand.full,
            alternateName: "Manifesto Akar",
            url: `${SITE.origin}/`,
            logo: `${SITE.origin}/branding/manifesto-tracker-mark.webp`,
            description: t.meta.homeDescription,
            areaServed: { "@type": "Country", name: "Malaysia" },
          },
        ]}
      />

      {/* Hero */}
      <section aria-labelledby="home-title" className="hero-navy overflow-hidden text-white">
        <div className="mx-auto grid max-w-6xl grid-cols-1 gap-12 px-4 pb-16 pt-12 sm:pt-16 lg:grid-cols-[1.08fr_0.92fr] lg:items-center lg:gap-16 lg:pb-20">
          <div className="min-w-0">
            <h1 id="home-title" className="text-[2.4rem] font-extrabold leading-[1.04] tracking-[-0.03em] sm:text-5xl lg:text-[3.6rem]">
              <RiseWords text={t.home.title} />
            </h1>
            <p className="rise-in mt-5 max-w-xl text-lg leading-relaxed text-white/75" style={riseDelay(0.55)}>
              {t.home.lead}
            </p>
            <Form action={localePath(locale, "/search")} role="search" className="rise-in mt-8 flex max-w-xl gap-2" style={riseDelay(0.7)}>
              <label htmlFor="home-search" className="sr-only">{t.home.searchLabel}</label>
              <input
                id="home-search"
                name="q"
                placeholder={t.home.searchPlaceholder}
                className="input h-12 border-white/10 text-base focus:border-[#f9bb00] focus:ring-[#f9bb00]/30"
              />
              <button className="btn h-12 shrink-0 bg-[#f9bb00] px-5 text-[#002a4d] hover:bg-[#ffc829]">{t.home.search}</button>
            </Form>
            <div className="rise-in mt-5 flex flex-wrap gap-2" style={riseDelay(0.8)}>
              {alliances.map((a) => (
                <Link
                  key={a.id}
                  href={`/e/${a.slug}`}
                  className="inline-flex items-center gap-1.5 rounded-full border border-white/15 bg-white/[0.07] py-1 pl-1 pr-3 text-xs font-semibold text-white hover:bg-white/15"
                >
                  <Avatar name={a.name} slug={a.slug} short={a.short_name} size={22} />
                  {a.short_name ?? a.name}
                </Link>
              ))}
            </div>
            <p className="rise-in mt-6 text-sm text-white/60" style={riseDelay(0.9)}>
              {t.home.counts(milestones.length, (profileRows ?? []).length)}
            </p>
          </div>
          {featured && featuredEntity ? <FeaturedRecord milestone={featured} entity={featuredEntity as Entity} locale={locale} /> : null}
        </div>
      </section>

      <div className="mx-auto max-w-6xl space-y-12 px-4 py-12">
        {/* Government vs Opposition */}
        <section aria-labelledby="gov-opp">
          <h2 id="gov-opp" className="section-title">{t.home.govOpp}</h2>
          <div className="mt-4 grid gap-5 md:grid-cols-2">
            {blocs.map((bloc) => {
              const items = milestones.filter((m) => m.entity?.bloc === bloc.bloc);
              const { counts, rate, recorded } = achievementSummary(items);
              const best = [...items].sort((a, b) => b.upvotes - a.upvotes || (b.progress ?? -1) - (a.progress ?? -1)).slice(0, 3);
              return (
                <div key={bloc.id} className="card flex flex-col p-6">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p className="text-xs font-semibold text-muted">{t.bloc[bloc.bloc]}</p>
                      <Link href={`/e/${bloc.slug}`} className="text-xl font-bold tracking-tight hover:text-brand-700">
                        {displayName(bloc, locale)}
                      </Link>
                    </div>
                    <UpvoteButton targetType="entity" targetId={bloc.id} count={bloc.upvotes} voted={votedEntities.has(bloc.id)} loggedIn={loggedIn} />
                  </div>
                  {bloc.description ? (
                    <p lang={locale === "en" ? undefined : "en"} className="mt-2 line-clamp-2 text-sm text-muted">{bloc.description}</p>
                  ) : null}

                  <div className="mt-5 grid grid-cols-3 gap-4 border-y border-line py-4">
                    <StatTile label={t.home.tracked} value={items.length} />
                    <StatTile label={t.home.achieved} value={rate === null ? "—" : `${rate}%`} hint={t.entity.ofRecorded(counts.achieved, recorded)} />
                    <StatTile label={t.home.inProgress} value={counts.in_progress} />
                  </div>
                  <div className="mt-4">
                    <StatusMix milestones={items} locale={locale} />
                  </div>

                  <div className="mt-5 space-y-3">{best.map(card)}</div>
                  <Link href={`/e/${bloc.slug}`} className="mt-4 text-sm font-semibold text-brand-700 hover:underline">
                    {t.home.seeAll(items.length)} →
                  </Link>
                </div>
              );
            })}
          </div>
        </section>

        {/* Most upvoted + recent */}
        {top[0]?.upvotes ? (
          <section className="grid gap-8 lg:grid-cols-2">
            <div>
              <h2 className="section-title">{t.home.mostUpvoted}</h2>
              <div className="mt-4 space-y-3">{top.map(card)}</div>
            </div>
            <div>
              <h2 className="section-title">{t.home.recent}</h2>
              <div className="mt-4 space-y-3">{recent.map(card)}</div>
            </div>
          </section>
        ) : (
          <section>
            <h2 className="section-title">{t.home.recent}</h2>
            <div className="mt-4 grid gap-3 lg:grid-cols-2">{recent.map(card)}</div>
          </section>
        )}

        {/* Coalitions */}
        <section aria-labelledby="coalitions">
          <div className="flex flex-wrap items-end justify-between gap-2">
            <h2 id="coalitions" className="section-title">{t.home.coalitions}</h2>
            <Link href="/search?type=party" className="text-sm font-semibold text-brand-700 hover:underline">
              {t.home.browse} →
            </Link>
          </div>
          <p className="mt-2 max-w-2xl text-sm text-muted">{t.home.coalitionsLead}</p>
          <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {alliances.map((a) => (
              <EntityCard key={a.id} entity={a} locale={locale} />
            ))}
          </div>
        </section>
      </div>

      {/* How it works, trust, elected representatives */}
      <section aria-labelledby="how" className="border-t border-line bg-white">
        <div className="mx-auto max-w-6xl space-y-10 px-4 py-14">
          <div>
            <h2 id="how" className="text-2xl font-extrabold tracking-tight">{t.home.howTitle}</h2>
            <ol className="mt-6 grid gap-8 md:grid-cols-3">
              {t.home.how.map(([title, body], i) => (
                <li key={title} className="flex gap-4">
                  <span className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#002a4d] text-sm font-bold text-white">
                    {i + 1}
                  </span>
                  <div>
                    <h3 className="font-bold">{title}</h3>
                    <p className="mt-1 leading-relaxed text-slate-600">{body}</p>
                  </div>
                </li>
              ))}
            </ol>
          </div>

          <div className="flex gap-4 rounded-2xl bg-[#002a4d] px-6 py-5 text-white">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" className="mt-0.5 h-6 w-6 shrink-0 text-[#f9bb00]" aria-hidden>
              <path d="M12 3 4.5 6v5.5c0 4.6 3.1 8.2 7.5 9.5 4.4-1.3 7.5-4.9 7.5-9.5V6L12 3Z" />
              <path d="m8.8 12.2 2.2 2.2 4.3-4.6" />
            </svg>
            <p className="leading-relaxed text-white/85">
              <strong className="font-bold text-white">{t.home.trustTitle}</strong>
              {t.home.trust}
            </p>
          </div>

          {!viewer || viewer.profile?.role === "rakyat" ? (
            <div className="card flex flex-col items-start gap-4 bg-ink p-8 text-white sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h2 className="text-xl font-bold">{t.home.repTitle}</h2>
                <p className="mt-1 text-sm text-slate-300">{t.home.repText}</p>
              </div>
              <Link href={viewer ? "/upgrade" : `/signup?next=${localePath(locale, "/upgrade")}`} className="btn bg-white text-ink hover:bg-slate-100">
                {t.home.repButton}
              </Link>
            </div>
          ) : null}
        </div>
      </section>
    </>
  );
}
