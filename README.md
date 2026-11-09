# Manifesto Tracker Malaysia

A public ledger for tracking political promises in Malaysia. Browse Government and Opposition milestones, explore coalitions, parties and politicians, and upvote the records you want to follow. Politicians can subscribe to the Wakil plan, request identity verification, and publish updates on an approved profile.

Editorial records and politician self-reported records carry separate labels. This is a prototype with sample milestones; the seed data is not a verified assessment of political performance.

## Features

- Government and Opposition dashboard with milestone progress and upvotes.
- Public profiles for blocs, coalitions, parties and politicians, with linked child entities.
- Search by name, position, constituency and state, plus milestone title matches.
- Five milestone states: pledged, in progress, achieved, delayed and broken.
- Supabase email/password authentication and a personal upvotes dashboard.
- Politician upgrade requests, existing-profile claims and administrator review.
- Profile editing and milestone publishing for approved politicians with active subscriptions.
- Stripe subscription checkout, customer billing portal and webhook synchronization.
- Demo upgrades without payment for development.
- Database Row Level Security (RLS), column-level grants and vote-count triggers.

## Branding

The supplied Manifesto Tracker logo and favicon are used in navigation and browser icons. All 14 coalition and party profiles currently included in the app use locally hosted SPR logos. See [branding assets and sources](docs/branding.md) for the artwork inventory and maintenance instructions.

## Technology

| Layer | Implementation |
| --- | --- |
| Application | Next.js 16 App Router, React 19, TypeScript |
| Styling | Tailwind CSS 4; Plus Jakarta Sans from Google Fonts |
| Database and authentication | Supabase Postgres and Auth |
| Billing | Stripe Checkout, Billing and customer portal |
| Hosting | Setup helpers target Vercel; Node.js hosting is also possible |

Dependency versions are defined in `package.json` and pinned in `package-lock.json`. Node.js **20.9 or newer** and npm are required.

## Quick start

```bash
git clone https://github.com/Kaikentt/manifesto-tracker.git
cd manifesto-tracker
npm ci
```

Copy the environment template:

```bash
# macOS / Linux / WSL
cp .env.example .env.local
```

```powershell
# Windows PowerShell
Copy-Item .env.example .env.local
```

Fill in the Supabase values, initialize a development database as described below, then start the app:

```bash
npm run dev
```

Open [localhost:3000](http://localhost:3000). Without the public Supabase settings, the app displays a setup notice. `DEMO_MODE=true` skips upgrade payments but still requires a working Supabase project and server secret key.

## Database initialization

1. Create a Supabase project and obtain its project URL, publishable key and server secret key.
2. Open the project's SQL Editor.
3. On a **new or disposable development database**, execute `supabase/setup.sql` in full.
4. Configure Auth URLs and create your first user as described below.

**Running `schema.sql` or `setup.sql` drops and recreates the application's tables and deletes existing app records.** These are bootstrap/reset scripts, not incremental migrations. Do not rerun them against a populated deployment without a backup and a deliberate reset plan. Resetting also removes app profiles for existing Auth users; the new-user trigger only creates profiles on future signups.

| File | Purpose |
| --- | --- |
| `supabase/schema.sql` | Tables, enums, indexes, triggers, grants and RLS policies |
| `supabase/seed.sql` | Initial political entities and sample milestones |
| `supabase/setup.sql` | Generated schema and seed bundle for the SQL Editor |
| `supabase/make-admin.sql` | Assign admin access to an existing signed-up account |

After editing schema or seed files, regenerate the bundle:

```bash
npm run db:bundle
```

This only writes a local SQL file; it does not connect to the database. Use reviewed migrations for subsequent changes to a populated deployment.

## Authentication and administrator setup

In Supabase Authentication URL Configuration, set the Site URL to the app's actual address and allow the appropriate callbacks:

```text
http://localhost:3000/auth/callback
https://YOUR-DOMAIN/auth/callback
```

Use `http://localhost:3000` for the local `NEXT_PUBLIC_SITE_URL`; use the deployed URL in production. Preview deployments need an allowed callback and an appropriate site URL when testing authentication.

To create an administrator:

1. Sign up through `/signup` and complete email confirmation when enabled.
2. Replace `you@example.com` in `supabase/make-admin.sql` with that account's email.
3. Execute the edited SQL in the Supabase SQL Editor.
4. Sign in and visit `/admin` to review politician requests and add editorial milestones.

Keep email confirmation enabled for public deployments.

### Google sign-in

Both `/login` and `/signup` offer **Continue with Google**. Supabase creates an account on the first successful Google sign-in and signs the user in on subsequent visits. New accounts receive the default rakyat role through the existing database trigger.

Enable the provider before using the button:

1. In Google Auth Platform, configure the app branding and audience, then create a **Web application** OAuth client.
2. Add your application origin, such as `https://manifesto-tracker-zeta.vercel.app`, to its authorized JavaScript origins.
3. Add the Supabase callback `https://YOUR-PROJECT-REF.supabase.co/auth/v1/callback` to its authorized redirect URIs. For the current project, the reference is `zixwmvofvqlmsaovmnwk`.
4. In Supabase **Authentication → Sign In / Providers → Google**, enter the client ID and client secret and enable Google.
5. Ensure the app's `/auth/callback` URL is allowed in Supabase URL Configuration and `NEXT_PUBLIC_SITE_URL` matches the deployed origin.
6. If the Google app audience is in testing mode, add the intended test users. Configure the audience for public use when ready.

Store the Google client secret in the Supabase provider settings. The application uses the existing publishable Supabase key to start OAuth. Successful sign-in returns to the requested internal page. Cancellation or an unsuccessful callback displays a retry message on the login page.

Setup reference: [Supabase Google sign-in guide](https://supabase.com/docs/guides/auth/social-sign-in/auth-google).

## Environment variables

Use `.env.local` locally and your host's environment settings for deployed values. Commit only `.env.example`, which contains placeholders.

| Variable | Exposure | Purpose |
| --- | --- | --- |
| `NEXT_PUBLIC_SUPABASE_URL` | Browser and server | Supabase project URL; required for the core app |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | Browser and server | Public key; access is enforced by RLS |
| `SUPABASE_SECRET_KEY` | Server only | Privileged database operations for admin, upgrades and billing |
| `NEXT_PUBLIC_SITE_URL` | Used by server helpers | Absolute origin for authentication and billing redirects |
| `STRIPE_SECRET_KEY` | Server only | Stripe API key for paid upgrades and the portal |
| `STRIPE_PRICE_ID` | Server only | Recurring Wakil plan price identifier |
| `STRIPE_WEBHOOK_SECRET` | Server only | Verifies incoming Stripe webhook signatures |
| `DEMO_MODE` | Server only | Exact value `true` bypasses upgrade payment; use `false` for paid production |

If `NEXT_PUBLIC_SITE_URL` is unset, the helper uses `VERCEL_PROJECT_PRODUCTION_URL`, then `VERCEL_URL`, then `http://localhost:3000`. Vercel supplies its own variables. Public Supabase variables must be available when building the client bundle.

Never expose the Supabase secret key, Stripe secret key or webhook secret through `NEXT_PUBLIC_` variables or committed files.

## Roles and publishing workflow

| Role | Capabilities |
| --- | --- |
| Visitor | Browse, search and inspect public profiles and milestones |
| Rakyat | Upvote, view a personal dashboard and submit upgrade requests |
| Politician | With an approved profile and active/trialing subscription, edit owned profile fields and manage owned self-reported milestones |
| Admin | Approve/reject verification requests and create editorial milestones |

1. An authenticated user submits `/upgrade`; the request starts as `awaiting_payment`.
2. Stripe Checkout collects a subscription, or demo mode activates the account without payment.
3. Activation assigns politician access and moves the request to `pending_review`.
4. An admin approves the request, linking an unowned claimed entity or creating a politician entity.
5. A linked profile and active/trialing subscription unlock publishing in `/dashboard`.

Payment and identity approval are separate steps. Checkout alone does not approve a public profile. A lapsed subscription locks editing while retaining the public record. Rejecting an identity request does not automatically cancel or refund a Stripe subscription; billing decisions require a separate operational process.

## Stripe configuration

Start with Stripe test credentials and `DEMO_MODE=false` to exercise checkout.

1. Create a recurring product/price for the Wakil plan and set `STRIPE_PRICE_ID`.
2. Set `STRIPE_SECRET_KEY`.
3. Configure `https://YOUR-DOMAIN/api/stripe/webhook` and set its signing secret as `STRIPE_WEBHOOK_SECRET`.
4. Subscribe the endpoint to these implemented events:

```text
checkout.session.completed
customer.subscription.created
customer.subscription.updated
customer.subscription.deleted
```

5. Configure Stripe's customer portal for the Manage billing action.
6. Redeploy after changing hosted environment variables.
7. Test checkout, webhook delivery, admin approval and cancellation before switching to live credentials.

With the Stripe CLI installed, forward local events:

```bash
stripe listen --forward-to localhost:3000/api/stripe/webhook
```

Use the listener's signing secret locally. The displayed plan defaults to **RM 49/month** in `src/lib/config.ts`; charging is controlled by the Stripe price. Keep the display and Stripe configuration aligned.

## Commands

| Command | Purpose |
| --- | --- |
| `npm ci` | Install locked dependencies |
| `npm run dev` | Start the development server |
| `npm run typecheck` | Check TypeScript without emitting application code |
| `npm run build` | Create a production build |
| `npm start` | Serve an existing production build |
| `npm run db:bundle` | Regenerate the SQL bootstrap bundle |

No automated unit/integration test suite or lint script is included. Type checking and building do not verify live authentication, database policies or payments.

## Deployment

### Vercel

`vercel.json` places the application functions in Singapore (`sin1`), alongside the current Supabase database. Update this setting if the database moves to another region.

1. Import `Kaikentt/manifesto-tracker` and use the Next.js framework configuration.
2. Set environment variables for each intended environment.
3. Connect the initialized Supabase project.
4. Deploy, then update Supabase Site URL and allowed callbacks to the deployed address.
5. Configure the deployed Stripe webhook, disable demo mode for paid use, and test the full workflow.

Use separate development and production database projects and payment modes where appropriate. Ensure preview deployments use the intended database.

### Node.js hosting

Provide the build/runtime environment variables, then run:

```bash
npm ci
npm run build
npm start
```

Configure HTTPS, the public origin, authentication callbacks and Stripe webhook for the chosen host.

### Optional interactive setup helpers

```bash
bash scripts/setup.sh
```

```powershell
powershell -ExecutionPolicy Bypass -File scripts\setup.ps1
```

These helpers require Node.js, Git and GitHub CLI (`gh`). They prompt for credentials, write `.env.local`, install dependencies, build, guide SQL initialization, create a private repository, configure Vercel and deploy. Vercel CLI runs through `npx`.

For this existing repository, use manual setup and deployment. Review the helpers before running: repository creation assumes a fresh project, and the database step uses destructive bootstrap SQL.

## Routes

| Route | Purpose |
| --- | --- |
| `/` | Government and Opposition milestone dashboard |
| `/search?q=...&type=...` | Entity search and matching milestone titles |
| `/e/[slug]` | Public profile; optional `status` milestone filter |
| `/signup`, `/login` | Account creation and sign-in |
| `/auth/callback` | Email confirmation callback |
| `/upgrade` | Politician subscription and verification request |
| `/dashboard` | Personal votes or politician profile/milestone management |
| `/admin` | Verification queue and editorial publishing |
| `/api/stripe/portal` | POST endpoint for the billing portal |
| `/api/stripe/webhook` | POST endpoint for signed payment events |

## Project structure

```text
src/
  app/                 Pages, layouts, auth callback and Stripe routes
  actions/             Auth, voting, upgrade, admin and dashboard server actions
  components/          Forms, cards, navigation and shared UI
  lib/
    supabase/          Session-aware and privileged database clients
    auth.ts            Viewer, role and subscription helpers
    config.ts          Brand, plan labels, categories and environment helpers
    politician.ts      Activation, subscription synchronization and slug helpers
    stripe.ts          Server-side Stripe client
    types.ts           Shared entity and milestone types
  proxy.ts             Supabase session refresh
supabase/              Schema, seed, generated bundle and admin SQL
scripts/               Interactive setup helpers and SQL bundler
.env.example           Placeholder configuration
```

## Data and access model

- `entities`: blocs, coalitions, parties and politicians, with parent links and optional ownership.
- `milestones`: status, progress, category, target date, evidence URL and record provenance.
- `profiles`: user role, subscription status, Stripe identifiers and politician entity link.
- `votes`: one row per user, target type and target ID; triggers maintain public counters.
- `politician_requests`: applicant details, requested claim, review state and admin note.

RLS allows public reads of entities and milestones and restricts private account records to their owner. Column grants prevent ordinary users from setting their own role or subscription state. Politician writes require ownership and an active/trialing subscription. Editorial records use the privileged server client. These mechanisms do not constitute a completed security audit.

## Seed data and customization

The supplied seed contains named Malaysian political entities and 12 sample milestones, six per side. Treat descriptions and political alignments as unverified seed content. Review every entity before public use and replace sample milestones with documented records and evidence links. Preserve clear sample markers and provenance labels.

Branding, plan labels, categories and status labels are centralized in `src/lib/config.ts`.

## Verification before launch

Run `npm run typecheck` and `npm run build`, then verify against a configured development project:

- Browse, search, inspect relationships and filter milestone status.
- Sign up, confirm email, sign in/out and verify callback destinations.
- Add/remove upvotes and confirm per-account limits and counters.
- Submit a demo or Stripe test upgrade; approve it as an admin.
- Publish/edit/delete self-reported milestones and verify ownership restrictions.
- Add an editorial milestone and confirm a politician cannot modify it.
- Process subscription changes and confirm expired access locks editing.
- Confirm ordinary users cannot read another user's private records or change roles.

## Troubleshooting

| Symptom | Check |
| --- | --- |
| Setup notice appears | Public Supabase variables, build environment and redeployment |
| Missing tables or empty lists | Correct project and successful initial schema/seed execution |
| Confirmation returns to wrong host | Site URL environment setting and Supabase callback allowlist |
| Admin/upgrade action fails | Server Supabase secret and signed-in account role/profile |
| Checkout succeeds but editing is locked | Webhook delivery/signature, subscription status and admin approval |
| Billing portal unavailable | Stripe credentials, portal activation and saved customer ID |
| Price label differs from checkout | Plan configuration versus the actual Stripe price |
| Dependency installation fails | Node version, registry access and availability of locked versions |

## Contributing and licensing

Keep changes focused, document new configuration, and run type checking plus a production build. Regenerate the SQL bundle after schema or seed changes. Never commit credentials or local environment files.

No license file was included in the supplied archive. The repository owner should establish reuse and distribution permissions before third-party adoption.

## Sourced politician imports

CAB-0001 adds Anwar Ibrahim and Ahmad Zahid Hamidi, their Parliament portraits and four dated, sourced milestones. See [the evidence and import guide](docs/imports/CAB-0001/README.md). Unknown status and completion are stored as null; no progress percentage is invented. Editorial profiles remain unclaimed. For existing installations, apply the additive migration in `supabase/migrations` rather than rerunning the clean-install database bundle.

## Landing page and tracker routes

- `/` serves the supplied investor landing page (`src/app/page.tsx`). It has its own navigation and footer, model-based charts, animations and founder portraits.
- `/tracker` serves the original public tracker dashboard (`src/app/tracker/page.tsx`). Every “Open the tracker” button opens this route on the same host.
- `/pitch` redirects to `/` so existing pitch-page bookmarks remain usable.
- `/search`, `/e/[slug]`, `/login`, `/signup`, `/dashboard` and `/admin` keep their existing addresses. Tracker navigation and default sign-in destinations use `/tracker`; explicit safe return paths are preserved.

`src/components/AppShell.tsx` gives the landing page its full-page layout and retains the standard app layout elsewhere. `src/app/pitch/pitch.css` contains the scoped landing-page styles. Financial figures remain in `src/lib/pitch-data.ts`; regenerate them from the workbook with `scripts/generate-pitch-data.py` (requires Python `openpyxl`). No new runtime packages are needed.

Check with `npm run typecheck`, `npm run build`, `node scripts/check-auth-redirects.cjs` and the existing milestone-data checks. Verify the landing-page CTA, direct tracker visit, profile navigation, login return paths and a mobile viewport. No Supabase schema or provider configuration changes are required for these route changes.

CAB-0002, CAB-0003 and CAB-0004 add six Parliament portraits and 11 sourced milestones for Fadillah Yusof, Anthony Loke Siew Fook, Mohamad Sabu, Nga Kor Ming, Mohamad Hasan and Alexander Nanta Linggi. See the corresponding directories under `docs/imports/` for guarded imports, evidence and intentionally blank fields. Anthony Loke retains his existing profile identity and address.

CAB-0005 through CAB-0008 add eight current Cabinet profiles, eight Parliament portraits and nine sourced milestones. Their evidence registers and repeatable imports are in the corresponding directories under `docs/imports/`. Appointed senators keep elected-constituency fields blank. PDP is added under GPS with its registered SPR symbol.

CAB-0009 through CAB-0012 add another eight Cabinet profiles, eight official portraits and 11 sourced milestones. PRS is added under GPS with its SPR symbol. Three progress bars use explicitly dated counts and documented calculations; sector ratios remain separate from completion scores. Professional senators have no inferred party affiliation.

CAB-0013 through CAB-0016 add the final eight Cabinet profiles, eight Parliament portraits and 14 sourced milestones for this initial pass. PBRS is added under BN with its registered SPR symbol. Together CAB-0001 through CAB-0016 contain 32 Cabinet profiles and 49 sourced milestones. Further research can extend these records; unknown outcomes and unsupported percentages remain blank. Each batch keeps a source manifest, guarded content import, before snapshot and recovery guidance.

MP-0001 through MP-0020 add 57 new profiles, enrich the three existing Hadi Awang, Ahmad Samsuri and Hamzah Zainudin identities, and add 60 attributed Parliament portraits and 33 sourced milestones. The range covers 59 MPs and the Dewan Rakyat Speaker. Evidence-only activity and delivery records have no invented earlier promise. The Speaker keeps constituency and party fields blank. Verified coalition membership and independent government support are not converted into guessed individual-party membership. One 35% construction bar is explicitly dated May 2026; all other newly imported percentages remain blank. See [the MP import overview](docs/imports/MP-0001-through-MP-0020.md) and each selected batch directory for identities, evidence, gaps and guarded SQL.

Explore uses 60 profiles per page, shows the matching total and provides Previous/Next links. Name and type filters are preserved across pages and reset pagination when changed; deterministic tie-breaking prevents equal-ranked names from causing duplicate rows. Out-of-range page requests recover a valid matching-results page.

MP-0021 through MP-0040 add 60 public MP profiles, 60 attributed Parliament portraits, the MIC party parent and official emblem, and 32 sourced milestones. The initial source pass selects at most two milestones per person; 36 people retain explicit milestone research gaps. Unknown outcomes and all new completion percentages remain blank. Previous Cabinet/MP records, votes, ownership and Auth are preserved. See [the MP-0021–MP-0040 overview](docs/imports/MP-0021-through-MP-0040.md) and each batch’s manifest and guarded SQL for sources, dates, target precision and gaps.

MP-0041 through MP-0060 add 60 public MP profiles, 60 attributed Parliament portraits, seven party parents with real SPR emblems, and 33 sourced milestones. This initial pass selects up to two records per person; 32 people retain explicit milestone research gaps. Two historical count-based progress bars have published dates and documented calculations; other new percentages remain blank. Current federal/state affiliations, coalition changes and parliamentary independents are sourced separately. Existing records, votes, ownership and Auth are preserved. See [the MP-0041–MP-0060 overview](docs/imports/MP-0041-through-MP-0060.md) and the batch manifests and guarded SQL for evidence, dates and gaps.
