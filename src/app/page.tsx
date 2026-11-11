import type { Metadata } from "next";
import Image from "next/image";
import Link from "@/components/NavigationLink";
import { Avatar, ProgressBar, SampleBadge, SourceBadge, StatusBadge, StatusMix, TypeBadge } from "@/components/ui";
import { RevenueChart } from "@/components/pitch/RevenueChart";
import { CountUp } from "@/components/pitch/CountUp";
import { PitchMotion } from "@/components/pitch/PitchMotion";
import { monthLabel, monthRange, pct, rm } from "@/components/pitch/format";
import { PITCH_MODEL as P } from "@/lib/pitch-data";
import { SITE } from "@/lib/config";
import type { Milestone } from "@/lib/types";
import { Fragment, type CSSProperties } from "react";
import "./pitch/pitch.css";

export const metadata: Metadata = {
  title: { absolute: "Manifesto Malaysia & PRU | Manifesto Tracker by Akar" },
  description:
    "Explore Malaysian election manifestos and track PRU pledges with Manifesto Tracker by Akar. Browse parties, coalitions and politicians, with progress and sources.",
  alternates: { canonical: "/" },
  verification: { google: "YoHXYCZsD5VRbAeDNCTiQdsIVcltfKLRLWfN4esu_rw" },
};

const websiteJsonLd = JSON.stringify({
  "@context": "https://schema.org",
  "@type": "WebSite",
  name: SITE.name,
  alternateName: "Manifesto Tracker by Akar",
  url: `${SITE.origin}/`,
}).replace(/</g, "\\u003c");

const at = (month: number) => P.months[month - 1];
const M6 = at(6);
const M12 = at(12);
const M18 = at(18);
const M24 = at(24);
const LAST_FUNDED = monthLabel(P.fundedMonths);
const POSITIVE = monthLabel(P.firstNonNegativeEbitdaMonth);
const PLUS_YEAR = P.prices.citizenPlus * 12;
const POLITICIAN_YEAR = P.prices.politician * 12;

/** Stagger index for reveal and hero animations. */
const d = (i: number) => ({ "--d": i }) as CSSProperties;
const delay = (seconds: number) => ({ "--delay": `${seconds}s` }) as CSSProperties;

const SECTIONS = [
  ["problem", "Problem"],
  ["product", "Product"],
  ["model", "Business model"],
  ["market", "Market"],
  ["plan", "Plan"],
  ["numbers", "Numbers"],
  ["team", "Team"],
] as const;

export default function LandingPage() {
  return (
    <div className="pitch flex min-h-screen flex-col bg-white text-ink">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: websiteJsonLd }} />
      <a href="#top" className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-50 focus:rounded-lg focus:bg-white focus:px-3 focus:py-2">
        Skip to content
      </a>
      <PitchNav />
      <main id="top" className="flex-1">
        <Hero />
        <Problem />
        <Product />
        <WhyNow />
        <Difference />
        <BusinessModel />
        <Market />
        <GoToMarket />
        <Plan />
        <Numbers />
        <Team />
        <Ask />
      </main>
      <PitchFooter />
      <PitchMotion />
    </div>
  );
}

// ── Shared pieces ────────────────────────────────────────────────────
function OpenTracker({ size = "md", tone = "navy" }: { size?: "md" | "lg"; tone?: "navy" | "gold" }) {
  const sizing = size === "lg" ? "h-12 px-6 text-[15px]" : "h-10 px-4";
  const colour =
    tone === "gold"
      ? "bg-(--gold) text-(--navy) hover:bg-[#ffc829]"
      : "bg-(--navy) text-white hover:bg-[#003a69]";
  return (
    <Link href="/tracker" prefetch={true} className={`btn ${sizing} ${colour}`}>
      Open the tracker
    </Link>
  );
}

function SectionHead({ title, lead, id }: { title: string; lead?: string; id: string }) {
  return (
    <div className="max-w-3xl" data-reveal="">
      <h2 id={`${id}-title`} className="text-3xl font-extrabold leading-[1.1] tracking-[-0.02em] text-ink sm:text-[2.6rem]">
        {title}
      </h2>
      {lead ? <p className="mt-4 text-lg leading-relaxed text-slate-600">{lead}</p> : null}
    </div>
  );
}

function Section({
  id,
  tone = "white",
  children,
}: {
  id: string;
  tone?: "white" | "canvas";
  children: React.ReactNode;
}) {
  return (
    <section id={id} aria-labelledby={`${id}-title`} className={tone === "canvas" ? "bg-canvas" : "bg-white"}>
      <div className="mx-auto max-w-6xl px-4 py-20 sm:py-24">{children}</div>
    </section>
  );
}

// ── Navigation ───────────────────────────────────────────────────────
function PitchNav() {
  return (
    <header className="sticky top-0 z-40 border-b border-line bg-white/90 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-6xl items-center gap-6 px-4">
        <Link href="/" prefetch={true} aria-label="Manifesto Tracker home" className="flex shrink-0 items-center">
          <Image src="/branding/manifesto-tracker-mark.webp" alt="" width={128} height={128} sizes="40px" loading="eager" className="h-10 w-10 object-contain sm:hidden" />
          <Image src="/branding/manifesto-tracker-logo.webp" alt="" width={720} height={188} sizes="184px" loading="eager" className="hidden h-auto w-46 sm:block" />
        </Link>
        <nav aria-label="Pitch sections" className="hidden flex-1 items-center justify-center gap-1 text-sm font-medium lg:flex">
          {SECTIONS.map(([id, label]) => (
            <a key={id} href={`#${id}`} className="rounded-lg px-3 py-2 text-slate-600 hover:bg-slate-100 hover:text-ink">
              {label}
            </a>
          ))}
        </nav>
        <div className="ml-auto lg:ml-0">
          <OpenTracker />
        </div>
      </div>
    </header>
  );
}

// ── Hero ─────────────────────────────────────────────────────────────
function Hero() {
  return (
    <section aria-labelledby="hero-title" className="on-navy relative overflow-hidden bg-(--navy) text-white">
      <div className="mx-auto grid max-w-6xl gap-14 px-4 pb-20 pt-14 sm:pt-20 lg:grid-cols-[1.08fr_0.92fr] lg:items-center lg:gap-16 lg:pb-28 lg:pt-24">
        <div>
          <h1 id="hero-title" className="text-[2.55rem] font-extrabold leading-[1.02] tracking-[-0.035em] sm:text-6xl lg:text-[4.1rem]">
            <RiseWords text="Track Malaysia’s election manifestos." />
          </h1>
          <p className="hero-in mt-6 max-w-xl text-lg leading-relaxed text-white/75" style={delay(0.55)}>
            Manifesto Tracker by Akar follows Malaysia’s election pledges, including promises made during the Pilihan Raya Umum
            (PRU). Explore parties, coalitions and politicians to see recorded progress and its sources.
          </p>
          <div className="hero-in mt-9 flex flex-wrap gap-3" style={delay(0.7)}>
            <OpenTracker size="lg" tone="gold" />
            <a href="#numbers" className="btn h-12 border border-white/25 px-6 text-[15px] text-white hover:bg-white/10">
              See the numbers
            </a>
          </div>
          <p className="hero-in mt-6 max-w-md text-sm text-white/55" style={delay(0.85)}>
            This preview shows a sample pledge. Open the tracker to browse public records and their sources.
          </p>
        </div>
        <PledgeDemo />
      </div>
    </section>
  );
}

function PledgeDemo() {
  return (
    <figure className="hero-in relative mx-auto w-full max-w-md lg:max-w-none" style={delay(0.35)}>
      <div aria-hidden className="absolute inset-x-6 -bottom-3 top-3 rounded-2xl bg-white/10" />
      <div aria-hidden className="absolute inset-x-12 -bottom-6 top-6 rounded-2xl bg-white/[0.05]" />
      <div className="card relative p-5 text-ink shadow-[0_30px_70px_-25px_rgba(0,0,0,0.55)] sm:p-6">
        <div className="flex items-center gap-3">
          <Avatar name="Sample Member of Parliament" slug="sample-mp" short="MP" size={40} />
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold">Sample Member of Parliament</p>
            <p className="text-xs text-muted">P.000 Sample constituency</p>
          </div>
          <span className="ml-auto">
            <SampleBadge />
          </span>
        </div>

        <p className="mt-5 text-lg font-bold leading-snug">Build three community clinics in the constituency</p>
        <div className="mt-3 flex items-center gap-2">
          <span className="pd-stack grid">
            <span className="pd-s1" aria-hidden>
              <StatusBadge status="pledged" />
            </span>
            <span className="pd-s2" aria-hidden>
              <StatusBadge status="in_progress" />
            </span>
            <span className="pd-s3">
              <StatusBadge status="achieved" />
            </span>
          </span>
          <span className="text-xs text-muted">Health</span>
        </div>

        <div className="mt-4 flex items-center gap-3">
          <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-slate-100">
            <div className="pd-bar h-full rounded-full" />
          </div>
          <span className="pd-stack grid w-9 text-right text-xs font-semibold tabular-nums text-slate-500">
            <span className="pd-s1" aria-hidden>0%</span>
            <span className="pd-s2" aria-hidden>45%</span>
            <span className="pd-s3">100%</span>
          </span>
        </div>

        <ol className="mt-5 space-y-3.5 border-t border-line pt-4 text-sm" aria-label="Record for this pledge">
          <TimelineRow dot="bg-slate-300" title="Promised in the manifesto" when="Nov 2022" note="Source: manifesto, page 14" />
          <TimelineRow className="pd-r2" dot="bg-sky-500" title="Construction started" when="Mar 2024" note="Evidence: state health department notice" />
          <TimelineRow className="pd-r3" dot="bg-emerald-500" title="All three clinics open" when="Aug 2025" note="Reviewed by the editorial team" />
        </ol>
      </div>
      <figcaption className="sr-only">
        A sample pledge record: promised in November 2022, construction started in March 2024, all three clinics open in August 2025.
      </figcaption>
    </figure>
  );
}

/** Headline whose words rise into place one after another (static for reduced motion). */
function RiseWords({ text }: { text: string }) {
  const words = text.split(" ");
  return (
    <>
      {words.map((word, i) => (
        <Fragment key={i}>
          <span className="hw-mask">
            <span className="hw" style={{ "--i": i } as CSSProperties}>
              {word}
            </span>
          </span>
          {i < words.length - 1 ? " " : null}
        </Fragment>
      ))}
    </>
  );
}

function TimelineRow({ dot, title, when, note, className = "" }: { dot: string; title: string; when: string; note: string; className?: string }) {
  return (
    <li className={`flex gap-3 ${className}`}>
      <span className={`mt-1.5 h-2 w-2 shrink-0 rounded-full ${dot}`} aria-hidden />
      <div className="min-w-0 flex-1">
        <div className="flex items-baseline justify-between gap-3">
          <span className="font-semibold">{title}</span>
          <span className="shrink-0 text-xs tabular-nums text-muted">{when}</span>
        </div>
        <p className="text-xs text-muted">{note}</p>
      </div>
    </li>
  );
}

// ── Problem ──────────────────────────────────────────────────────────
function Problem() {
  const pains = [
    ["Hard to find", "There is no single, easy view of an elected official’s promises and delivery record."],
    ["Scattered evidence", "Manifestos, ministry updates, legislative records and news live in different places."],
    ["Hard to compare", "Citizens struggle to tell claimed progress apart from independently substantiated results."],
  ];
  return (
    <Section id="problem">
      <div className="grid gap-12 lg:grid-cols-[0.95fr_1.05fr] lg:gap-20">
        <SectionHead
          id="problem"
          title="Manifestos are public, but fragmented and stagnant."
          lead="Citizens face an information problem that weakens informed voting and accountability."
        />
        <dl className="divide-y divide-(--hair) border-y border-(--hair)">
          {pains.map(([title, body], i) => (
            <div key={title} data-reveal="" style={d(i + 1)} className="grid gap-1 py-6 sm:grid-cols-[11rem_1fr] sm:gap-6">
              <dt className="font-bold text-ink">{title}</dt>
              <dd className="leading-relaxed text-slate-600">{body}</dd>
            </div>
          ))}
        </dl>
      </div>
      <p className="mt-12 max-w-3xl text-sm text-muted">
        This work supports SDG 16 (peace, justice and strong institutions), in particular transparent institutions (16.6) and public
        access to information (16.10).
      </p>
    </Section>
  );
}

// ── Product ──────────────────────────────────────────────────────────
const SAMPLE_MIX: Pick<Milestone, "status">[] = [
  ...Array(5).fill({ status: "achieved" }),
  ...Array(7).fill({ status: "in_progress" }),
  ...Array(2).fill({ status: "delayed" }),
  ...Array(6).fill({ status: "pledged" }),
  { status: "broken" },
];

function Product() {
  const steps = [
    ["Discover", "Search a promise, politician, party or coalition."],
    ["Follow", "See milestones, deadlines and who is responsible."],
    ["Verify", "Read the sources, review the history and tell claims apart from evidence."],
  ];
  return (
    <Section id="product" tone="canvas">
      <SectionHead
        id="product"
        title="A live record of political commitments"
        lead="One searchable, evidence-backed view of what was promised, who owns it and what happened next."
      />
      <div className="mt-12 grid gap-10 lg:grid-cols-[1.3fr_0.7fr] lg:items-start lg:gap-14">
        <ProductMock />
        <div>
          <dl className="space-y-7">
            {steps.map(([title, body], i) => (
              <div key={title} data-reveal="" style={d(i + 2)} className="border-l-2 border-(--blue) pl-4">
                <dt className="font-bold text-ink">{title}</dt>
                <dd className="mt-1 leading-relaxed text-slate-600">{body}</dd>
              </div>
            ))}
          </dl>
          <p className="mt-8 text-sm leading-relaxed text-slate-600">
            Every record says where it came from. <strong className="font-semibold text-slate-700">Editorial</strong> records are curated
            with sources; <strong className="font-semibold text-brand-700">self-reported</strong> updates come from politicians and are
            labelled as unverified.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <OpenTracker />
            <Link href="/search" className="btn-ghost h-10">
              Explore profiles
            </Link>
          </div>
        </div>
      </div>
    </Section>
  );
}

function ProductMock() {
  return (
    <figure data-reveal="" className="overflow-hidden rounded-2xl border border-line bg-white shadow-[0_24px_60px_-30px_rgba(0,42,77,0.35)]">
      <div className="flex items-center gap-3 border-b border-line bg-slate-50 px-4 py-2.5">
        <Link href="/tracker" prefetch={true} aria-label="Open tracker homepage" className="min-w-0 flex-1 truncate rounded-lg border border-line bg-white px-3 py-1 text-xs text-muted hover:text-brand-700">
          Tracker homepage ↗
        </Link>
      </div>
      <div className="space-y-3 bg-canvas p-3 sm:p-5" aria-hidden>
        <div className="card p-4 sm:p-5">
          <div className="flex items-center gap-3">
            <Avatar name="Sample Coalition" slug="sample-coalition" short="SC" size={44} />
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <p className="font-bold">Sample Coalition</p>
                <TypeBadge type="alliance" />
              </div>
              <p className="text-xs text-muted">21 pledges tracked from the 2022 manifesto</p>
            </div>
          </div>
          <div className="mix-fill mt-4" data-reveal="bare">
            <StatusMix milestones={SAMPLE_MIX} />
          </div>
        </div>
        <MockMilestone
          status="in_progress"
          category="Education"
          title="Free breakfast in every primary school"
          progress={60}
          order={0}
          source="editorial"
          meta={["Target 31 Dec 2027", "Evidence"]}
          votes={128}
        />
        <MockMilestone
          status="achieved"
          category="Community"
          title="Open a constituency service centre"
          progress={100}
          order={1}
          source="self_reported"
          meta={["Evidence"]}
          votes={41}
        />
      </div>
      <figcaption className="sr-only">
        The tracker shows a coalition’s pledges by status, and each pledge with its progress, source label and evidence links.
      </figcaption>
    </figure>
  );
}

function MockMilestone({
  status,
  category,
  title,
  progress,
  order,
  source,
  meta,
  votes,
}: {
  status: NonNullable<Milestone["status"]>;
  category: string;
  title: string;
  progress: number;
  order: number;
  source: Milestone["source_type"];
  meta: string[];
  votes: number;
}) {
  return (
    <div className="card flex gap-4 p-4">
      <div className="min-w-0 flex-1">
        <div className="mb-2 flex flex-wrap items-center gap-2">
          <StatusBadge status={status} />
          <span className="text-xs text-muted">{category}</span>
          <SampleBadge />
        </div>
        <p className="text-sm font-semibold leading-snug">{title}</p>
        <div className="bar-fill mt-3" data-reveal="bare" style={d(order)}>
          <ProgressBar value={progress} status={status} />
        </div>
        <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted">
          <SourceBadge source={source} />
          {meta.map((item) =>
            item === "Evidence" ? (
              <span key={item} className="font-medium text-brand-700">
                Evidence ↗
              </span>
            ) : (
              <span key={item}>{item}</span>
            ),
          )}
        </div>
      </div>
      <span className="inline-flex h-fit shrink-0 items-center gap-1.5 rounded-xl border border-line bg-white px-2.5 py-1 text-xs font-semibold tabular-nums text-slate-700">
        <svg viewBox="0 0 20 20" fill="currentColor" className="h-3.5 w-3.5">
          <path d="M10 3.5 3.5 11h4v5.5h5V11h4L10 3.5Z" />
        </svg>
        {votes}
      </span>
    </div>
  );
}

// ── Why now ──────────────────────────────────────────────────────────
function WhyNow() {
  const reasons = [
    [
      "Election urgency",
      "Malaysia’s next general election is due within the current parliamentary term. The historical benchmark has to exist before campaigning intensifies.",
    ],
    [
      "Digital readiness",
      "98.3% of individuals used the internet in 2025, so a mobile-first civic product can reach almost everyone.",
    ],
    [
      "Affordable processing",
      "Document extraction, tagging and alerts are now practical to build with AI-assisted workflows, with editorial review on every record.",
    ],
  ];
  return (
    <Section id="why-now">
      <SectionHead
        id="why-now"
        title="The next election cycle rewards readiness"
        lead="There is a window to set a verified baseline before new promises dominate the conversation."
      />
      <div className="mt-12 grid gap-10 md:grid-cols-3 md:gap-8">
        {reasons.map(([title, body], i) => (
          <div key={title}>
            <span aria-hidden data-reveal="line" style={d(i)} className="block h-0.5 bg-ink" />
            <div data-reveal="" style={d(i + 1)} className="pt-5">
              <h3 className="font-bold">{title}</h3>
              <p className="mt-2 leading-relaxed text-slate-600">{body}</p>
            </div>
          </div>
        ))}
      </div>
      <p className="mt-10 text-xs text-muted">
        Sources: DOSM, ICT Use and Access by Individuals and Households Survey 2025; Parliament of Malaysia timeline. The AI benefit is a
        product thesis.
      </p>
    </Section>
  );
}

// ── Difference ───────────────────────────────────────────────────────
function Difference() {
  const rows = [
    ["News and search", "Coverage is fragmented across articles", "Pledge-level records with sources"],
    ["Election scorecards", "Periodic and often one-off reports", "Continuous updates across terms"],
    ["Civic open-data platforms", "Strong public data, but not always centred on pledges", "A workflow from promise to milestone"],
    ["Politicians’ own channels", "Direct updates, but self-reported", "Claims shown alongside independent review"],
  ];
  return (
    <Section id="difference" tone="canvas">
      <SectionHead
        id="difference"
        title="Structured, transparent, one source of truth"
        lead="Alternatives inform citizens. Manifesto Tracker structures the promises, their owners and the evidence over time."
      />
      <div data-reveal="" style={d(1)} className="card mt-12 overflow-hidden">
        <table className="w-full text-left text-[15px]">
          <thead className="hidden bg-slate-50 text-sm text-slate-500 md:table-header-group">
            <tr>
              <th scope="col" className="px-6 py-3.5 font-semibold">Alternative</th>
              <th scope="col" className="px-6 py-3.5 font-semibold">Where it falls short</th>
              <th scope="col" className="px-6 py-3.5 font-semibold text-(--navy)">What Manifesto Tracker does</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-line">
            {rows.map(([alt, limit, ours]) => (
              <tr key={alt} className="block px-5 py-5 md:table-row md:p-0">
                <th scope="row" className="block font-bold md:table-cell md:px-6 md:py-5">
                  {alt}
                </th>
                <td className="mt-1 block text-slate-600 md:table-cell md:px-6 md:py-5">
                  <span className="sr-only md:hidden">Falls short: </span>
                  {limit}
                </td>
                <td className="mt-3 block md:table-cell md:bg-(--mist)/60 md:px-6 md:py-5">
                  <span className="flex items-start gap-2 font-semibold text-(--navy)">
                    <Check className="mt-1 h-4 w-4 shrink-0 text-(--leaf)" />
                    {ours}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Section>
  );
}

function Check({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden>
      <path d="M3 8.5 6.5 12 13 4.5" />
    </svg>
  );
}

// ── Business model ───────────────────────────────────────────────────
function BusinessModel() {
  const groups = [
    {
      audience: "For citizens",
      plans: [
        { name: "Citizen Free", price: "RM0", per: "", body: "Search, profiles and evidence, supported by ads." },
        { name: "Citizen Plus", price: `RM${P.prices.citizenPlus}`, per: "a month", body: "Ad-free, with watchlists and alerts." },
      ],
    },
    {
      audience: "For politicians and parties",
      plans: [
        { name: "Politician Verified", price: `RM${P.prices.politician}`, per: "a month", body: "Claimed profile, update submissions and analytics." },
        { name: "Party or coalition", price: `RM${P.prices.party}`, per: "a month", body: "Multi-member workspace with admin controls." },
      ],
    },
  ];
  return (
    <Section id="model">
      <SectionHead
        id="model"
        title="Free public access. Paid convenience and workflow."
        lead="Launch pricing, to be validated in beta interviews. The public record stays free for everyone."
      />
      <div className="mt-12 overflow-hidden rounded-2xl border border-line">
        <div className="grid lg:grid-cols-2">
          {groups.map((g, gi) => (
            <div key={g.audience} className={gi ? "border-t border-line lg:border-l lg:border-t-0" : ""}>
              <p className="border-b border-line bg-slate-50 px-6 py-3 text-sm font-semibold text-slate-600">{g.audience}</p>
              <div className="grid sm:grid-cols-2">
                {g.plans.map((plan, pi) => (
                  <div key={plan.name} data-reveal="" style={d(gi * 2 + pi + 1)} className={`p-6 ${pi ? "border-t border-line sm:border-l sm:border-t-0" : ""}`}>
                    <h3 className="font-bold">{plan.name}</h3>
                    <p className="mt-3 flex items-baseline gap-1.5">
                      <span className="text-3xl font-extrabold tracking-tight">{plan.price}</span>
                      {plan.per ? <span className="text-sm text-muted">{plan.per}</span> : null}
                    </p>
                    <p className="mt-3 text-sm leading-relaxed text-slate-600">{plan.body}</p>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
        <div className="on-navy flex gap-4 bg-(--navy) px-6 py-5 text-white">
          <ShieldIcon className="mt-0.5 h-6 w-6 shrink-0 text-(--gold)" />
          <p className="leading-relaxed text-white/85">
            <strong className="font-bold text-white">Trust rule.</strong> Subscribers can submit updates but can never buy a “completed”
            status. Advertising is never politically targeted.
          </p>
        </div>
      </div>
    </Section>
  );
}

function ShieldIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden>
      <path d="M12 3 4.5 6v5.5c0 4.6 3.1 8.2 7.5 9.5 4.4-1.3 7.5-4.9 7.5-9.5V6L12 3Z" />
      <path d="m8.8 12.2 2.2 2.2 4.3-4.6" />
    </svg>
  );
}

// ── Market ───────────────────────────────────────────────────────────
function Market() {
  const [tam, sam, som] = P.market;
  const rows = [
    {
      ...tam,
      name: "Total addressable market",
      short: "TAM",
      amount: <CountUp to={tam.value} kind="millions" decimals={1} />,
      swatch: "bg-(--blue)/12 ring-1 ring-(--blue)/30",
    },
    {
      ...sam,
      name: "Serviceable market",
      short: "SAM",
      amount: <CountUp to={sam.value} kind="millions" decimals={2} />,
      swatch: "bg-(--blue)/45",
    },
    {
      ...som,
      name: `Obtainable by ${monthLabel(24)}`,
      short: "SOM",
      amount: <CountUp to={som.value} kind="thousands" decimals={1} />,
      swatch: "bg-(--gold)",
    },
  ];
  // Squares drawn to area: side ∝ √value, all anchored to the same corner.
  const side = (v: number) => Math.sqrt(v / tam.value) * 100;
  return (
    <Section id="market" tone="canvas">
      <SectionHead
        id="market"
        title="A national market, won one constituency at a time"
        lead="Annual revenue at our launch prices. The squares are drawn to scale by area."
      />
      <div className="mt-12 grid gap-10 lg:grid-cols-[0.8fr_1.2fr] lg:items-center lg:gap-16">
        <div className="relative mx-auto aspect-square w-full max-w-[16rem] sm:max-w-[22rem]" aria-hidden>
          <div data-reveal="grow" style={d(0)} className="absolute bottom-0 left-0 h-full w-full rounded-lg bg-(--blue)/12 ring-1 ring-(--blue)/30" />
          <div data-reveal="grow" style={{ ...d(1), width: `${side(sam.value)}%`, height: `${side(sam.value)}%` }} className="absolute bottom-0 left-0 rounded-md bg-(--blue)/45" />
          <div data-reveal="grow" style={{ ...d(2), width: `${side(som.value)}%`, height: `${side(som.value)}%` }} className="absolute bottom-0 left-0 rounded-sm bg-(--gold)" />
          <span data-reveal="" style={d(4)} className="absolute right-4 top-3 text-sm font-semibold text-(--navy)">TAM</span>
          <span data-reveal="" style={{ ...d(6), left: `calc(${side(sam.value)}% - 3rem)`, bottom: `calc(${side(sam.value)}% - 1.75rem)` }} className="absolute text-sm font-semibold text-(--navy)">
            SAM
          </span>
          <span data-reveal="" style={{ ...d(8), left: `calc(${side(som.value)}% + 0.5rem)`, bottom: 0 }} className="absolute text-sm font-semibold text-(--navy)">
            SOM
          </span>
        </div>

        <dl className="divide-y divide-line border-y border-line">
          {rows.map((r, i) => (
            <div key={r.key} data-reveal="" style={d(i + 1)} className="grid gap-2 py-6 sm:grid-cols-[10rem_1fr] sm:gap-8">
              <dt>
                <span className="flex items-center gap-2 text-sm font-semibold text-slate-600">
                  <span className={`h-3 w-3 rounded-sm ${r.swatch}`} aria-hidden />
                  {r.short}
                </span>
                <span className="mt-1 block text-3xl font-extrabold tracking-tight text-ink">{r.amount}</span>
              </dt>
              <dd className="text-[15px] leading-relaxed text-slate-600">
                <span className="block font-semibold text-ink">{r.name}</span>
                {r.users.toLocaleString("en-US")} citizen accounts × {pct(r.plusRate, 0)} on Plus × RM{PLUS_YEAR} a year, plus{" "}
                {r.politicians.toLocaleString("en-US")} paid politicians × RM{POLITICIAN_YEAR.toLocaleString("en-US")} a year
                {r.ads ? `, plus ${rm(r.ads)} of advertising` : ""}.
              </dd>
            </div>
          ))}
        </dl>
      </div>
      <p className="mt-8 text-xs text-muted">These are economic scenarios from the financial model, not measured market demand.</p>
    </Section>
  );
}

// ── Go-to-market ─────────────────────────────────────────────────────
function GoToMarket() {
  const steps = [
    ["Seed supply", "Recruit 10 politicians across political affiliations and verify 30 to 50 pledges."],
    ["Increase demand", "Universities, student organisations, civic groups and hyperlocal content creators."],
    ["Grow loops", "Shareable pledge cards, news citations, reminders and coalition comparisons."],
    ["Monetise later", "Convert engaged citizens to Plus, and verified politician teams to workspaces."],
  ];
  return (
    <Section id="go-to-market">
      <SectionHead
        id="go-to-market"
        title="Win one constituency, then earn the distribution"
        lead="Start with concentrated proof that the record is useful, then let it travel."
      />
      <ol className="mt-12 grid gap-8 sm:grid-cols-2 lg:grid-cols-4 lg:gap-6">
        {steps.map(([title, body], i) => (
          <li key={title} className="relative" data-reveal="" style={d(i)}>
            <div className="flex items-center gap-3">
              <span className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-(--navy) text-sm font-bold text-white">
                {i + 1}
              </span>
              <span aria-hidden data-reveal="line" style={d(i + 1)} className={`h-px flex-1 bg-slate-300 ${i === steps.length - 1 ? "hidden" : "hidden lg:block"}`} />
            </div>
            <h3 className="mt-4 font-bold">{title}</h3>
            <p className="mt-2 leading-relaxed text-slate-600">{body}</p>
          </li>
        ))}
      </ol>
    </Section>
  );
}

// ── Plan: our own pledges ────────────────────────────────────────────
function Plan() {
  const stages: { status: "achieved" | "pledged"; when: string; name: string; targets: string[] }[] = [
    {
      status: "achieved",
      when: "Nov 2026",
      name: "Working prototype",
      targets: ["Web app live with search, profiles, milestones and upvotes", "Politician sign-up and editorial review flows"],
    },
    {
      status: "pledged",
      when: monthRange(1, 3),
      name: "Validate",
      targets: ["20 user interviews", "30 sourced pledges", "10 citizen and 10 politician beta users"],
    },
    {
      status: "pledged",
      when: monthRange(4, 6),
      name: "Public beta",
      targets: ["Bilingual beta", "Review workflow", `${M6.citizens.toLocaleString("en-US")} citizen accounts`],
    },
    {
      status: "pledged",
      when: monthRange(7, 12),
      name: "Establish use",
      targets: [
        `${M12.citizens.toLocaleString("en-US")} citizen accounts`,
        `${M12.workspaces} politician workspaces, ${M12.paidPoliticians} of them paid`,
        "Retention proof",
      ],
    },
    {
      status: "pledged",
      when: monthRange(13, 18),
      name: "Commercialise",
      targets: [`${M18.citizens.toLocaleString("en-US")} citizen accounts`, `${M18.paidPoliticians} paid politicians`, "Legal readiness"],
    },
    {
      status: "pledged",
      when: monthRange(19, 24),
      name: "Expand",
      targets: [
        `${M24.citizens.toLocaleString("en-US")} citizen accounts`,
        `${M24.paidPoliticians} paid politicians and ${M24.plus.toLocaleString("en-US")} Plus subscribers`,
        `${rm(P.years.annualizedRevenue[1])} annualised revenue`,
      ],
    },
  ];
  return (
    <Section id="plan" tone="canvas">
      <div className="grid gap-12 lg:grid-cols-[0.85fr_1.15fr] lg:gap-16">
        <div className="lg:sticky lg:top-24 lg:self-start">
          <SectionHead
            id="plan"
            title="We track our own pledges the same way"
            lead="Milestones first, revenue second. Our 24-month plan, shown with the tracker’s own status labels. Targets come from the financial model."
          />
          <p className="mt-6 text-sm leading-relaxed text-muted">
            Achievement depends on recruitment, verification speed and conversion. Each status changes only when there is evidence.
          </p>
        </div>
        <ol className="relative space-y-4">
          {stages.map((s) => (
            <li key={s.name} data-reveal="" className="card p-5">
              <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
                <StatusBadge status={s.status} />
                <span className="text-sm tabular-nums text-muted">{s.when}</span>
              </div>
              <h3 className="mt-3 text-lg font-bold">{s.name}</h3>
              <ul className="mt-2 space-y-1 text-[15px] text-slate-600">
                {s.targets.map((t) => (
                  <li key={t} className="flex gap-2">
                    <span className="mt-2.5 h-1 w-1 shrink-0 rounded-full bg-slate-400" aria-hidden />
                    {t}
                  </li>
                ))}
              </ul>
              {s.status === "achieved" ? (
                <Link href="/tracker" className="mt-3 inline-block text-sm font-semibold text-(--blue) hover:underline">
                  Evidence: the live tracker
                </Link>
              ) : null}
            </li>
          ))}
        </ol>
      </div>
    </Section>
  );
}

// ── Numbers (from the Excel model) ───────────────────────────────────
function Numbers() {
  const y = P.years;
  const keyFigures = [
    { label: "Pre-seed raise", value: <CountUp to={P.raise} kind="rm" /> },
    { label: `Funded runway, to ${LAST_FUNDED}`, value: <CountUp to={P.fundedMonths} suffix=" months" duration={1000} /> },
    {
      label: `EBITDA turns positive, month ${P.firstNonNegativeEbitdaMonth}`,
      value: <CountUp to={P.firstNonNegativeEbitdaMonth} from={1} kind="month" duration={1800} />,
    },
    { label: `Annualised revenue, ${monthLabel(24)}`, value: <CountUp to={y.annualizedRevenue[1]} kind="rm" /> },
  ];
  const table: { label: string; values: string[]; sub?: boolean; strong?: boolean }[] = [
    { label: "Revenue", values: y.revenue.map(rm), strong: true },
    { label: "Citizen Plus", values: y.plusRevenue.map(rm), sub: true },
    { label: "Politician plans", values: y.politicianRevenue.map(rm), sub: true },
    { label: "Advertising", values: y.adRevenue.map(rm), sub: true },
    { label: "Cash operating costs", values: y.cashCosts.map(rm) },
    { label: "EBITDA", values: y.ebitda.map(rm), strong: true },
    { label: "Gross margin", values: y.grossMargin.map((g) => pct(g)) },
    { label: "Cash at year end, before extra funding", values: [rm(M12.cash), rm(M24.cash)] },
    { label: "Citizen accounts", values: y.citizens.map((v) => v.toLocaleString("en-US")) },
    { label: "Citizen Plus subscribers", values: y.plus.map((v) => v.toLocaleString("en-US")) },
    { label: "Paid politician accounts", values: y.paidPoliticians.map(String) },
    { label: "Annualised revenue in December", values: y.annualizedRevenue.map(rm) },
  ];

  return (
    <Section id="numbers">
      <SectionHead
        id="numbers"
        title="The plan in numbers"
        lead={`From our final financial model, base case, ${monthLabel(1)} to ${monthLabel(24)}. Paid plans start in ${monthLabel(7)}. Amounts in ringgit.`}
      />

      <dl className="mt-12 grid grid-cols-2 gap-px overflow-hidden rounded-2xl border border-line bg-line lg:grid-cols-4">
        {keyFigures.map((k) => (
          <div key={k.label} className="bg-white p-5 sm:p-6">
            <dt className="text-sm text-muted">{k.label}</dt>
            <dd className="mt-2 text-2xl font-extrabold tracking-tight text-ink sm:text-[1.75rem]">{k.value}</dd>
          </div>
        ))}
      </dl>

      <figure data-reveal="" className="card mt-8 p-5 sm:p-7">
        <figcaption>
          <h3 className="text-lg font-bold">Monthly revenue against cash operating costs</h3>
          <p className="mt-1 text-sm text-muted">
            Revenue meets costs in {POSITIVE}, when EBITDA turns positive. Ringgit per month.
          </p>
        </figcaption>
        <div className="mt-6">
          <RevenueChart months={P.months} positiveMonth={P.firstNonNegativeEbitdaMonth} fundedMonths={P.fundedMonths} />
        </div>
        <details className="group mt-5 border-t border-line pt-4">
          <summary className="cursor-pointer text-sm font-semibold text-(--blue) hover:underline">Show the monthly figures</summary>
          <div className="mt-4 max-h-96 overflow-auto rounded-xl border border-line">
            <table className="w-full min-w-[34rem] text-right text-sm tabular-nums">
              <thead className="sticky top-0 bg-slate-50 text-slate-500">
                <tr>
                  {["Month", "Revenue", "Cash costs", "EBITDA", "Cash balance"].map((h, i) => (
                    <th key={h} scope="col" className={`px-4 py-2.5 font-semibold ${i ? "" : "text-left"}`}>
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {P.months.map((d) => (
                  <tr key={d.month}>
                    <th scope="row" className="px-4 py-2 text-left font-medium text-ink">
                      {monthLabel(d.month)}
                    </th>
                    <td className="px-4 py-2">{rm(d.revenue)}</td>
                    <td className="px-4 py-2">{rm(d.costs)}</td>
                    <td className="px-4 py-2">{rm(d.ebitda)}</td>
                    <td className="px-4 py-2">{rm(d.cash)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </details>
      </figure>

      <div className="mt-8 grid gap-8 lg:grid-cols-[1.25fr_0.75fr] lg:items-start">
        <div data-reveal="" className="card overflow-x-auto">
          <table className="w-full text-sm sm:text-[15px]">
            <caption className="px-4 pb-1 pt-5 text-left sm:px-7">
              <span className="text-lg font-bold">Year by year</span>
            </caption>
            <thead className="text-sm text-slate-500">
              <tr className="border-b border-line">
                <th scope="col" className="py-3 pl-4 pr-2 text-left font-semibold sm:pl-7">
                  <span className="sr-only">Measure</span>
                </th>
                <th scope="col" className="px-2 py-3 text-right font-semibold sm:px-3">2027</th>
                <th scope="col" className="py-3 pl-2 pr-4 text-right font-semibold sm:pr-7">2028</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {table.map((row) => (
                <tr key={row.label}>
                  <th
                    scope="row"
                    className={`py-2.5 pr-2 text-left ${row.sub ? "pl-7 font-normal text-slate-500 sm:pl-11" : row.strong ? "pl-4 font-bold sm:pl-7" : "pl-4 font-medium text-slate-700 sm:pl-7"}`}
                  >
                    {row.label}
                  </th>
                  {row.values.map((v, i) => (
                    <td
                      key={i}
                      className={`whitespace-nowrap py-2.5 text-right tabular-nums ${i ? "pl-2 pr-4 sm:pr-7" : "px-2 sm:px-3"} ${row.sub ? "text-slate-500" : row.strong ? "font-bold" : "text-slate-700"}`}
                    >
                      {v}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div data-reveal="" style={d(1)} className="rounded-2xl border border-(--gold-ink)/40 bg-[#FFF8E1] p-6 sm:p-7 lg:sticky lg:top-24">
          <h3 className="font-bold text-ink">What the raise covers, and what comes after</h3>
          <p className="mt-2 leading-relaxed text-slate-700">
            {rm(P.raise)} carries the plan to {LAST_FUNDED}, ending year 1 with {rm(M12.cash)} in cash, just under our {rm(P.reserve)}{" "}
            reserve. Losses keep narrowing through 2028 until EBITDA turns positive in {POSITIVE}, so the model shows a further{" "}
            {rm(P.extraFundingFor24Months)} is needed during 2028 to hold the reserve.
          </p>
        </div>
      </div>
    </Section>
  );
}

// ── Team ─────────────────────────────────────────────────────────────
function Team() {
  const founders = [
    {
      name: "Umul Ilham Edwin",
      photo: "/team/umul-ilham-edwin.webp",
      width: 442,
      height: 502,
      role: "Oversees people and strategy",
      degree: "Bachelor’s in Maritime and Logistics (Hons)",
      interests: "Logistics, maritime, technology and policy",
    },
    {
      name: "Khairul Anam",
      photo: "/team/khairul-anam.webp",
      width: 404,
      height: 493,
      role: "Oversees tech operations",
      degree: "Bachelor’s in Computer Science (Software Engineering)",
      interests: "Technology, economics and politics",
    },
  ];
  return (
    <Section id="team" tone="canvas">
      <SectionHead id="team" title="Founding team" lead="A graduate and a final-year student, building the product and the editorial process together." />
      <ul className="mt-12 grid gap-6 md:grid-cols-2">
        {founders.map((f, i) => (
          <li key={f.name} data-reveal="" style={d(i + 1)} className="card flex flex-col overflow-hidden sm:flex-row">
            <div className="relative flex h-64 shrink-0 items-end justify-center bg-(--mist) sm:h-auto sm:w-48">
              <Image src={f.photo} alt={`Portrait of ${f.name}`} width={f.width} height={f.height} sizes="192px" className="h-60 w-auto object-contain object-bottom sm:h-56" />
            </div>
            <div className="p-6">
              <h3 className="text-xl font-bold">{f.name}</h3>
              <p className="mt-1 font-medium text-(--blue)">{f.role}</p>
              <dl className="mt-4 space-y-2 text-sm">
                <div>
                  <dt className="text-muted">Education</dt>
                  <dd className="text-slate-700">{f.degree}</dd>
                </div>
                <div>
                  <dt className="text-muted">Interests</dt>
                  <dd className="text-slate-700">{f.interests}</dd>
                </div>
              </dl>
            </div>
          </li>
        ))}
      </ul>
    </Section>
  );
}

// ── The ask ──────────────────────────────────────────────────────────
function Ask() {
  const reach = [
    { value: <CountUp to={M12.citizens} />, label: "citizen accounts" },
    { value: <CountUp to={M12.plus} />, label: "Citizen Plus subscribers" },
    { value: <CountUp to={M12.workspaces} />, label: `politician workspaces, ${M12.paidPoliticians} paid` },
    { value: <CountUp to={P.years.subscriptionArr[0]} kind="rm" />, label: "subscription ARR" },
  ];
  const gates = ["30 verified pledges", "Beta usage", "50 politician workspaces", "Retention and conversion"];
  return (
    <section id="ask" aria-labelledby="ask-title" className="on-navy bg-(--navy) text-white">
      <div className="mx-auto max-w-6xl px-4 py-20 sm:py-28">
        <div className="grid gap-14 lg:grid-cols-[1fr_1fr] lg:gap-20">
          <div>
            <h2 id="ask-title" className="text-4xl font-extrabold leading-[1.05] tracking-[-0.03em] sm:text-6xl">
              Raising <CountUp to={P.raise} kind="rm" duration={1600} />
            </h2>
            <p className="mt-5 max-w-lg text-lg leading-relaxed text-white/75">
              A pre-seed round to validate trust, usage and paid political workspaces. In the base case it funds {P.fundedMonths} months,
              to {LAST_FUNDED}.
            </p>
            <div className="mt-9 flex flex-wrap gap-3">
              <OpenTracker size="lg" tone="gold" />
              <a href="#numbers" className="btn h-12 border border-white/25 px-6 text-[15px] text-white hover:bg-white/10">
                Review the numbers
              </a>
            </div>
          </div>

          <div className="space-y-10">
            <div>
              <h3 className="font-semibold text-white/70">Planned by {LAST_FUNDED}</h3>
              <dl className="mt-4 grid grid-cols-2 gap-x-6 gap-y-5">
                {reach.map((r, i) => (
                  <div key={r.label} data-reveal="" style={d(i)} className="flex flex-col-reverse border-t border-white/15 pt-3">
                    <dt className="mt-0.5 text-sm text-white/65">{r.label}</dt>
                    <dd className="text-2xl font-extrabold tracking-tight">{r.value}</dd>
                  </div>
                ))}
              </dl>
            </div>
            <div>
              <h3 className="font-semibold text-white/70">Capital released against gates</h3>
              <ol className="mt-4 space-y-3">
                {gates.map((g, i) => (
                  <li key={g} data-reveal="" style={d(i + 2)} className="flex items-center gap-3">
                    <span className="inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-(--gold)/60 text-sm font-bold text-(--gold)">
                      {i + 1}
                    </span>
                    <span className="font-medium">{g}</span>
                  </li>
                ))}
              </ol>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

// ── Footer ───────────────────────────────────────────────────────────
function PitchFooter() {
  return (
    <footer className="border-t border-line bg-white">
      <div className="mx-auto flex max-w-6xl flex-col gap-6 px-4 py-10 sm:flex-row sm:items-center sm:justify-between">
        <div className="max-w-xl">
          <Image src="/branding/manifesto-tracker-logo.webp" alt="Manifesto Tracker" width={720} height={188} sizes="160px" className="h-auto w-40" />
          <p className="mt-3 text-xs leading-relaxed text-muted">
            Manifesto Tracker is independent and non-partisan. Pledges and politicians shown on this page are samples. Financial figures
            come from the Manifesto startup financial model, base case.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <Link href="/search" className="btn-ghost h-10">
            Explore profiles
          </Link>
          <OpenTracker />
        </div>
      </div>
    </footer>
  );
}
