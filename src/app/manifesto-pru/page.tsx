import type { Metadata } from "next";
import Link from "@/components/NavigationLink";
import { createClient } from "@/lib/supabase/server";
import type { Entity, Milestone } from "@/lib/types";
import { SITE } from "@/lib/config";
import { achievementSummary } from "@/lib/milestones";
import { languageAlternates, localePath } from "@/lib/i18n";
import { baseOpenGraph, getDictionary, getLocale } from "@/lib/i18n-server";
import { Avatar, StatusMix } from "@/components/ui";
import { JsonLd } from "@/components/JsonLd";
import { RiseWords, riseDelay } from "@/components/home/RiseWords";
import "../home.css";

export async function generateMetadata(): Promise<Metadata> {
  const [locale, t, og] = await Promise.all([getLocale(), getDictionary(), baseOpenGraph()]);
  return {
    title: t.meta.hubTitle,
    description: t.meta.hubDescription,
    alternates: languageAlternates(locale, "/manifesto-pru"),
    openGraph: { ...og, type: "website", title: t.meta.hubTitle, description: t.meta.hubDescription, url: localePath(locale, "/manifesto-pru") },
  };
}

type Row = Pick<Entity, "id" | "parent_id" | "type" | "slug" | "name" | "short_name" | "bloc">;

export default async function ManifestoPruPage() {
  const supabase = await createClient();
  const [locale, t, { data: entityRows }, { data: milestoneRows }] = await Promise.all([
    getLocale(),
    getDictionary(),
    supabase.from("entities").select("id, parent_id, type, slug, name, short_name, bloc").order("name"),
    supabase.from("milestones").select("entity_id, status").eq("is_sample", false),
  ]);
  const entities = (entityRows ?? []) as Row[];
  const milestones = (milestoneRows ?? []) as Pick<Milestone, "entity_id" | "status">[];

  // A coalition's record includes its member parties and their politicians.
  const childrenOf = (id: string) => entities.filter((e) => e.parent_id === id);
  const coalitions = entities
    .filter((e) => e.type === "alliance")
    .map((coalition) => {
      const parties = childrenOf(coalition.id);
      const scope = new Set([coalition.id, ...parties.map((p) => p.id), ...parties.flatMap((p) => childrenOf(p.id).map((c) => c.id)), ...childrenOf(coalition.id).map((c) => c.id)]);
      const items = milestones.filter((m) => scope.has(m.entity_id));
      return { coalition, parties: parties.filter((p) => p.type === "party"), items, summary: achievementSummary(items) };
    });
  const sides = [
    { key: "government", label: t.hub.governmentSide, list: coalitions.filter((c) => c.coalition.bloc === "government") },
    { key: "opposition", label: t.hub.oppositionSide, list: coalitions.filter((c) => c.coalition.bloc === "opposition") },
  ].filter((side) => side.list.length);

  const pageUrl = `${SITE.origin}${localePath(locale, "/manifesto-pru")}`;

  return (
    <>
      <JsonLd
        data={[
          {
            "@context": "https://schema.org",
            "@type": "BreadcrumbList",
            itemListElement: [
              { "@type": "ListItem", position: 1, name: t.entity.home, item: `${SITE.origin}${localePath(locale, "/")}` },
              { "@type": "ListItem", position: 2, name: t.nav.hub, item: pageUrl },
            ],
          },
          {
            "@context": "https://schema.org",
            "@type": "ItemList",
            name: t.hub.title,
            itemListElement: coalitions.map(({ coalition }, i) => ({
              "@type": "ListItem",
              position: i + 1,
              name: coalition.name,
              url: `${SITE.origin}${localePath(locale, `/e/${coalition.slug}`)}`,
            })),
          },
        ]}
      />

      <section aria-labelledby="hub-title" className="hero-navy text-white">
        <div className="mx-auto max-w-6xl px-4 pb-12 pt-12 sm:pt-14">
          <h1 id="hub-title" className="max-w-3xl text-[2.1rem] font-extrabold leading-[1.06] tracking-[-0.03em] sm:text-5xl">
            <RiseWords text={t.hub.title} />
          </h1>
          <p className="rise-in mt-5 max-w-3xl text-lg leading-relaxed text-white/75" style={riseDelay(0.5)}>
            {t.hub.lead}
          </p>
        </div>
      </section>

      <div className="mx-auto max-w-6xl space-y-12 px-4 py-12">
        {sides.map((side) => (
          <section key={side.key} aria-labelledby={`side-${side.key}`}>
            <h2 id={`side-${side.key}`} className="section-title">{side.label}</h2>
            <div className="mt-4 grid gap-5 md:grid-cols-2">
              {side.list.map(({ coalition, parties, items, summary }) => (
                <article key={coalition.id} className="card flex flex-col p-6">
                  <div className="flex items-center gap-3">
                    <Avatar name={coalition.name} slug={coalition.slug} short={coalition.short_name} size={44} />
                    <div className="min-w-0">
                      <h3 className="text-lg font-bold tracking-tight">
                        <Link href={`/e/${coalition.slug}`} className="hover:text-brand-700">
                          {coalition.name}
                          {coalition.short_name && coalition.short_name !== coalition.name ? ` (${coalition.short_name})` : ""}
                        </Link>
                      </h3>
                      <p className="text-sm text-muted">
                        {t.hub.tracked(items.length)}
                        {summary.rate !== null ? ` · ${t.status.achieved} ${summary.rate}%` : ""}
                      </p>
                    </div>
                  </div>
                  <div className="mt-4">
                    <StatusMix milestones={items} locale={locale} />
                  </div>
                  {parties.length ? (
                    <div className="mt-5">
                      <p className="text-xs font-semibold text-muted">{t.hub.members}</p>
                      <ul className="mt-2 flex flex-wrap gap-1.5">
                        {parties.map((p) => (
                          <li key={p.id}>
                            <Link href={`/e/${p.slug}`} className="chip">
                              {p.short_name ?? p.name}
                            </Link>
                          </li>
                        ))}
                      </ul>
                    </div>
                  ) : null}
                  <Link href={`/e/${coalition.slug}`} className="mt-5 text-sm font-semibold text-brand-700 hover:underline">
                    {t.hub.open(coalition.short_name ?? coalition.name)} →
                  </Link>
                </article>
              ))}
            </div>
          </section>
        ))}

        <section aria-labelledby="about-pru" className="grid gap-8 lg:grid-cols-[0.8fr_1.2fr]">
          <h2 id="about-pru" className="text-2xl font-extrabold tracking-tight">{t.hub.aboutTitle}</h2>
          <div className="space-y-4 text-[15px] leading-relaxed text-slate-700">
            {t.hub.about.map((paragraph) => (
              <p key={paragraph}>{paragraph}</p>
            ))}
          </div>
        </section>

        <section aria-labelledby="faq" className="grid gap-8 border-t border-line pt-12 lg:grid-cols-[0.8fr_1.2fr]">
          <h2 id="faq" className="text-2xl font-extrabold tracking-tight">{t.hub.faqTitle}</h2>
          <dl className="divide-y divide-line border-y border-line">
            {t.hub.faq.map(([question, answer]) => (
              <div key={question} className="py-5">
                <dt className="font-bold">{question}</dt>
                <dd className="mt-1.5 leading-relaxed text-slate-600">{answer}</dd>
              </div>
            ))}
          </dl>
        </section>
      </div>
    </>
  );
}
