-- ════════════════════════════════════════════════════════════════════
--  Manifesto Tracker Malaysia — database schema
--  Run once in Supabase → SQL Editor (or use supabase/setup.sql, which
--  bundles this file with seed.sql). Safe to re-run: it drops and
--  recreates the app's own objects only.
-- ════════════════════════════════════════════════════════════════════

-- ── Clean slate (app objects only) ──────────────────────────────────
drop table if exists public.votes cascade;
drop table if exists public.politician_requests cascade;
drop table if exists public.milestones cascade;
drop table if exists public.profiles cascade;
drop table if exists public.entities cascade;
drop function if exists public.handle_new_user() cascade;
drop function if exists public.set_updated_at() cascade;
drop function if exists public.apply_vote() cascade;
drop function if exists public.clear_votes() cascade;
drop function if exists public.can_edit_entity(uuid) cascade;
drop type if exists public.entity_type cascade;
drop type if exists public.bloc_side cascade;
drop type if exists public.milestone_status cascade;
drop type if exists public.source_type cascade;
drop type if exists public.user_role cascade;
drop type if exists public.request_status cascade;
drop type if exists public.vote_target cascade;

-- ── Types ────────────────────────────────────────────────────────────
create type public.entity_type      as enum ('bloc', 'alliance', 'party', 'politician');
create type public.bloc_side        as enum ('government', 'opposition', 'independent');
create type public.milestone_status as enum ('pledged', 'in_progress', 'achieved', 'delayed', 'broken');
create type public.source_type      as enum ('editorial', 'self_reported');
create type public.user_role        as enum ('rakyat', 'politician', 'admin');
create type public.request_status   as enum ('awaiting_payment', 'pending_review', 'approved', 'rejected');
create type public.vote_target      as enum ('milestone', 'entity');

-- ── Entities: blocs, coalitions (alliances), parties, politicians ───
create table public.entities (
  id            uuid primary key default gen_random_uuid(),
  type          public.entity_type not null,
  slug          text not null unique check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  name          text not null check (char_length(name) between 2 and 120),
  short_name    text,
  bloc          public.bloc_side not null default 'independent',
  parent_id     uuid references public.entities (id) on delete set null,
  position      text,
  constituency  text,
  state         text,
  description   text,
  website       text,
  -- set when a paying, approved politician claims this profile
  owner_id      uuid unique references auth.users (id) on delete set null,
  upvotes       integer not null default 0,
  is_sample     boolean not null default false,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);
create index entities_type_idx   on public.entities (type);
create index entities_bloc_idx   on public.entities (bloc);
create index entities_parent_idx on public.entities (parent_id);

-- ── Profiles: one per auth user ─────────────────────────────────────
create table public.profiles (
  id                      uuid primary key references auth.users (id) on delete cascade,
  display_name            text,
  role                    public.user_role not null default 'rakyat',
  -- mirrors Stripe: none | active | trialing | past_due | canceled | unpaid | incomplete
  subscription_status     text not null default 'none',
  stripe_customer_id      text unique,
  stripe_subscription_id  text,
  politician_entity_id    uuid references public.entities (id) on delete set null,
  created_at              timestamptz not null default now()
);

-- ── Milestones: pledges, policies, manifesto items ──────────────────
create table public.milestones (
  id            uuid primary key default gen_random_uuid(),
  entity_id     uuid not null references public.entities (id) on delete cascade,
  title         text not null check (char_length(title) between 3 and 200),
  description   text,
  category      text not null default 'Other',
  status        public.milestone_status not null default 'pledged',
  progress      integer not null default 0 check (progress between 0 and 100),
  target_date   date,
  evidence_url  text check (evidence_url is null or evidence_url ~* '^https?://'),
  -- default is self_reported: only the server (secret key) or seed can mark editorial
  source_type   public.source_type not null default 'self_reported',
  is_sample     boolean not null default false,
  upvotes       integer not null default 0,
  created_by    uuid default auth.uid() references auth.users (id) on delete set null,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);
create index milestones_entity_idx  on public.milestones (entity_id);
create index milestones_upvotes_idx on public.milestones (upvotes desc);
create index milestones_updated_idx on public.milestones (updated_at desc);

-- ── Votes: one upvote per user per item ─────────────────────────────
create table public.votes (
  user_id     uuid not null default auth.uid() references auth.users (id) on delete cascade,
  target_type public.vote_target not null,
  target_id   uuid not null,
  created_at  timestamptz not null default now(),
  primary key (user_id, target_type, target_id)
);
create index votes_target_idx on public.votes (target_type, target_id);

-- ── Politician upgrade / verification requests ──────────────────────
create table public.politician_requests (
  id               uuid primary key default gen_random_uuid(),
  user_id          uuid not null default auth.uid() references auth.users (id) on delete cascade,
  full_name        text not null check (char_length(full_name) between 3 and 120),
  party_id         uuid references public.entities (id) on delete set null,
  position         text,
  constituency     text,
  bio              text,
  claim_entity_id  uuid references public.entities (id) on delete set null,
  status           public.request_status not null default 'awaiting_payment',
  admin_note       text,
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now()
);
create index politician_requests_user_idx   on public.politician_requests (user_id);
create index politician_requests_status_idx on public.politician_requests (status);

-- ════════════════════════════════════════════════════════════════════
--  Functions and triggers
-- ════════════════════════════════════════════════════════════════════

-- updated_at bookkeeping
create function public.set_updated_at()
returns trigger language plpgsql set search_path = '' as $$
begin
  new.updated_at := now();
  return new;
end $$;

create trigger entities_updated_at before update on public.entities
  for each row execute function public.set_updated_at();
create trigger milestones_updated_at before update on public.milestones
  for each row execute function public.set_updated_at();
create trigger politician_requests_updated_at before update on public.politician_requests
  for each row execute function public.set_updated_at();

-- New auth user → rakyat profile
create function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = '' as $$
begin
  insert into public.profiles (id, display_name)
  values (
    new.id,
    coalesce(nullif(new.raw_user_meta_data ->> 'display_name', ''), split_part(new.email, '@', 1))
  );
  return new;
end $$;

create trigger on_auth_user_created after insert on auth.users
  for each row execute function public.handle_new_user();

-- Keep upvote counters in sync; reject votes on items that don't exist
create function public.apply_vote()
returns trigger language plpgsql security definer set search_path = '' as $$
declare
  delta    integer;
  v_type   public.vote_target;
  v_target uuid;
  hits     integer;
begin
  if tg_op = 'INSERT' then
    delta := 1;  v_type := new.target_type; v_target := new.target_id;
  else
    delta := -1; v_type := old.target_type; v_target := old.target_id;
  end if;

  if v_type = 'milestone' then
    update public.milestones set upvotes = greatest(upvotes + delta, 0) where id = v_target;
  else
    update public.entities set upvotes = greatest(upvotes + delta, 0) where id = v_target;
  end if;
  get diagnostics hits = row_count;

  if tg_op = 'INSERT' and hits = 0 then
    raise exception 'Vote target % % not found', v_type, v_target;
  end if;
  return null;
end $$;

create trigger votes_counter after insert or delete on public.votes
  for each row execute function public.apply_vote();

-- Remove votes that point at a deleted milestone or entity
create function public.clear_votes()
returns trigger language plpgsql security definer set search_path = '' as $$
begin
  delete from public.votes
  where target_id = old.id
    and target_type = (case when tg_table_name = 'milestones' then 'milestone' else 'entity' end)::public.vote_target;
  return old;
end $$;

create trigger milestones_clear_votes after delete on public.milestones
  for each row execute function public.clear_votes();
create trigger entities_clear_votes after delete on public.entities
  for each row execute function public.clear_votes();

-- Can the current user publish on this entity?
-- Yes when they own it, are a politician and their subscription is active.
create function public.can_edit_entity(eid uuid)
returns boolean language sql stable security definer set search_path = '' as $$
  select exists (
    select 1
    from public.entities e
    join public.profiles p on p.id = auth.uid()
    where e.id = eid
      and e.owner_id = auth.uid()
      and p.role in ('politician', 'admin')
      and p.subscription_status in ('active', 'trialing')
  );
$$;

-- ════════════════════════════════════════════════════════════════════
--  Privileges + Row Level Security
--  Supabase grants everything to anon/authenticated by default, so we
--  revoke it and grant back only what each role needs.
--  The server's secret key (service_role) bypasses RLS and is used only
--  in server code: the Stripe webhook and admin actions.
-- ════════════════════════════════════════════════════════════════════

alter table public.entities            enable row level security;
alter table public.profiles            enable row level security;
alter table public.milestones          enable row level security;
alter table public.votes               enable row level security;
alter table public.politician_requests enable row level security;

revoke all on public.entities, public.profiles, public.milestones, public.votes, public.politician_requests
  from anon, authenticated;

-- Entities: public read; owner edits a few profile fields
grant select on public.entities to anon, authenticated;
grant update (description, position, constituency, state, website) on public.entities to authenticated;

create policy "entities are public" on public.entities
  for select to anon, authenticated using (true);
create policy "owner edits own entity" on public.entities
  for update to authenticated
  using (public.can_edit_entity(id))
  with check (public.can_edit_entity(id));

-- Profiles: users see and rename themselves only
grant select on public.profiles to authenticated;
grant update (display_name) on public.profiles to authenticated;

create policy "read own profile" on public.profiles
  for select to authenticated using (id = (select auth.uid()));
create policy "update own profile" on public.profiles
  for update to authenticated
  using (id = (select auth.uid())) with check (id = (select auth.uid()));

-- Milestones: public read; politicians write on their own entity
grant select on public.milestones to anon, authenticated;
grant insert (entity_id, title, description, category, status, progress, target_date, evidence_url)
  on public.milestones to authenticated;
grant update (title, description, category, status, progress, target_date, evidence_url)
  on public.milestones to authenticated;
grant delete on public.milestones to authenticated;

create policy "milestones are public" on public.milestones
  for select to anon, authenticated using (true);
create policy "politician adds own milestone" on public.milestones
  for insert to authenticated with check (public.can_edit_entity(entity_id));
create policy "politician edits own milestone" on public.milestones
  for update to authenticated
  using (public.can_edit_entity(entity_id) and source_type = 'self_reported')
  with check (public.can_edit_entity(entity_id));
create policy "politician deletes own milestone" on public.milestones
  for delete to authenticated
  using (public.can_edit_entity(entity_id) and source_type = 'self_reported');

-- Votes: each user manages their own
grant select, delete on public.votes to authenticated;
grant insert (target_type, target_id) on public.votes to authenticated;

create policy "read own votes" on public.votes
  for select to authenticated using (user_id = (select auth.uid()));
create policy "cast own vote" on public.votes
  for insert to authenticated with check (user_id = (select auth.uid()));
create policy "remove own vote" on public.votes
  for delete to authenticated using (user_id = (select auth.uid()));

-- Politician requests: users create and see their own
grant select on public.politician_requests to authenticated;
grant insert (full_name, party_id, position, constituency, bio, claim_entity_id)
  on public.politician_requests to authenticated;

create policy "read own requests" on public.politician_requests
  for select to authenticated using (user_id = (select auth.uid()));
create policy "create own request" on public.politician_requests
  for insert to authenticated
  with check (user_id = (select auth.uid()) and status = 'awaiting_payment');

-- Functions used by policies must be callable
grant execute on function public.can_edit_entity(uuid) to anon, authenticated;
