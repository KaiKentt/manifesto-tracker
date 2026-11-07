-- CAB-0001 prerequisites. Additive; existing content, votes and ownership stay intact.
alter table public.entities
  add column photo_path text check (photo_path is null or photo_path ~ '^/portraits/[a-z0-9-]+[.]webp$'),
  add column photo_source_url text check (photo_source_url is null or photo_source_url ~ '^https://'),
  add column photo_credit text,
  add column profile_sources jsonb not null default '[]'::jsonb check (jsonb_typeof(profile_sources) = 'array'),
  add column profile_checked_at date;

-- Unknown means NULL, never a fabricated zero or a failed promise.
alter table public.milestones
  alter column status drop not null,
  alter column status drop default,
  alter column progress drop not null,
  alter column progress drop default,
  add column import_key text unique,
  add column promise_url text check (promise_url is null or promise_url ~ '^https://'),
  add column promise_date date,
  add column evidence_date date,
  add column progress_checked_at date,
  add column progress_note text;

-- Existing public SELECT policies cover these public editorial fields.
-- Existing authenticated column-level write grants intentionally exclude them.
comment on column public.milestones.progress is 'Published completion percentage only; NULL when not established. Status does not imply a percentage.';
comment on column public.milestones.import_key is 'Stable editorial import identity; reruns preserve UUIDs and votes.';
