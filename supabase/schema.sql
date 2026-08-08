-- ─────────────────────────────────────────────────────────────────
-- ClassroomLens Pro — sessions table + Row Level Security
--
-- Run this once in your Supabase project:
--   Dashboard → SQL Editor → New query → paste this whole file → Run
-- ─────────────────────────────────────────────────────────────────

create table if not exists public.sessions (
  id                 uuid primary key default gen_random_uuid(),
  user_id            uuid not null references auth.users(id) on delete cascade,
  created_at         timestamptz not null default now(),
  teacher            text,
  observer           text,
  school             text,
  grade              text,
  subject            text,
  observation_date   date,
  framework          text not null,
  transcript         text,
  analysis           jsonb not null
);

create index if not exists sessions_user_id_created_at_idx
  on public.sessions (user_id, created_at desc);

alter table public.sessions enable row level security;

-- Creating a table via the SQL Editor does NOT automatically expose it to
-- PostgREST (the Table Editor UI does this for you, but raw SQL doesn't).
-- Without this grant, the table is invisible to the API for every role,
-- even though it exists in the database — RLS below still restricts which
-- rows each authenticated user can actually see.
grant select, insert, update, delete on public.sessions to authenticated;

-- Each user can only ever see, create, edit, or delete their own rows.
create policy "Users can view their own sessions"
  on public.sessions for select
  using (auth.uid() = user_id);

create policy "Users can insert their own sessions"
  on public.sessions for insert
  with check (auth.uid() = user_id);

create policy "Users can update their own sessions"
  on public.sessions for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "Users can delete their own sessions"
  on public.sessions for delete
  using (auth.uid() = user_id);

-- ─────────────────────────────────────────────────────────────────
-- ClassroomLens Pro — Organizations (School Plan upgrade)
--
-- Adds: profiles (public mirror of auth.users for names/emails),
-- schools, memberships (role-based), invite-by-code join flow, and
-- principal read access into their teachers' sessions.
--
-- Run this once in your Supabase project (SQL Editor → New query →
-- paste this whole block → Run). Safe to re-run — everything is
-- guarded with IF NOT EXISTS / OR REPLACE / DROP POLICY IF EXISTS.
-- ─────────────────────────────────────────────────────────────────

-- ---- profiles ------------------------------------------------------
-- PostgREST can't query the auth schema directly, so we mirror the
-- handful of fields the app needs (email, name) into a public table
-- kept in sync via a trigger on auth.users.
create table if not exists public.profiles (
  id         uuid primary key references auth.users(id) on delete cascade,
  email      text,
  full_name  text,
  created_at timestamptz not null default now()
);
alter table public.profiles enable row level security;
grant select on public.profiles to authenticated;

create or replace function public.handle_new_user()
returns trigger
language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, email, full_name)
  values (new.id, new.email, coalesce(new.raw_user_meta_data->>'full_name', ''))
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- One-time backfill for accounts created before this migration existed.
-- Safe to re-run.
insert into public.profiles (id, email, full_name)
select id, email, coalesce(raw_user_meta_data->>'full_name', '')
from auth.users
on conflict (id) do nothing;

-- ---- schools ---------------------------------------------------------
create table if not exists public.schools (
  id          uuid primary key default gen_random_uuid(),
  name        text not null,
  invite_code text not null unique default upper(substr(md5(random()::text), 1, 8)),
  created_by  uuid references auth.users(id),
  created_at  timestamptz not null default now()
);
alter table public.schools enable row level security;
grant select, update on public.schools to authenticated;

-- ---- memberships -------------------------------------------------------
-- One row per user; a user belongs to at most one school (MVP scope).
create table if not exists public.memberships (
  id         uuid primary key default gen_random_uuid(),
  school_id  uuid not null references public.schools(id) on delete cascade,
  user_id    uuid not null unique references public.profiles(id) on delete cascade,
  role       text not null check (role in ('principal', 'teacher')),
  created_at timestamptz not null default now()
);
alter table public.memberships enable row level security;
grant select on public.memberships to authenticated;

-- ---- helper functions (avoid recursive RLS by using SECURITY DEFINER) --
create or replace function public.is_member_of(p_school_id uuid)
returns boolean
language sql security definer stable set search_path = public as $$
  select exists (
    select 1 from public.memberships
    where school_id = p_school_id and user_id = auth.uid()
  );
$$;
grant execute on function public.is_member_of(uuid) to authenticated;

create or replace function public.is_principal_of(p_school_id uuid)
returns boolean
language sql security definer stable set search_path = public as $$
  select exists (
    select 1 from public.memberships
    where school_id = p_school_id and user_id = auth.uid() and role = 'principal'
  );
$$;
grant execute on function public.is_principal_of(uuid) to authenticated;

create or replace function public.shares_school_with(p_user_id uuid)
returns boolean
language sql security definer stable set search_path = public as $$
  select exists (
    select 1 from public.memberships m1
    join public.memberships m2 on m1.school_id = m2.school_id
    where m1.user_id = auth.uid() and m2.user_id = p_user_id
  );
$$;
grant execute on function public.shares_school_with(uuid) to authenticated;

-- ---- RLS policies ------------------------------------------------------
drop policy if exists "Members can view their school" on public.schools;
create policy "Members can view their school"
  on public.schools for select
  using (public.is_member_of(id));

drop policy if exists "Principals can update their school" on public.schools;
create policy "Principals can update their school"
  on public.schools for update
  using (public.is_principal_of(id));

drop policy if exists "Members can view own row" on public.memberships;
create policy "Members can view own row"
  on public.memberships for select
  using (user_id = auth.uid() or public.is_principal_of(school_id));

drop policy if exists "Shared-school profiles are visible" on public.profiles;
create policy "Shared-school profiles are visible"
  on public.profiles for select
  using (id = auth.uid() or public.shares_school_with(id));

-- Additive: teachers still see only their own sessions (existing policy);
-- this grants principals read-only visibility into their school's sessions.
alter table public.sessions add column if not exists school_id uuid references public.schools(id) on delete set null;
create index if not exists sessions_school_id_idx on public.sessions (school_id);

drop policy if exists "Principals can view their school's sessions" on public.sessions;
create policy "Principals can view their school's sessions"
  on public.sessions for select
  using (school_id is not null and public.is_principal_of(school_id));

-- ---- RPCs (school creation / invite-code join are security-definer so --
-- ---- the invite_code itself never has to be broadly SELECT-able) ------
create or replace function public.create_school(p_name text)
returns table(school_id uuid)
language plpgsql security definer set search_path = public as $$
declare v_school_id uuid;
begin
  if exists (select 1 from public.memberships where user_id = auth.uid()) then
    raise exception 'You already belong to a school';
  end if;
  insert into public.schools (name, created_by) values (p_name, auth.uid()) returning id into v_school_id;
  insert into public.memberships (school_id, user_id, role) values (v_school_id, auth.uid(), 'principal');
  return query select v_school_id;
end;
$$;
grant execute on function public.create_school(text) to authenticated;

create or replace function public.preview_school_by_code(p_code text)
returns table(school_name text)
language sql security definer set search_path = public as $$
  select name from public.schools where invite_code = p_code;
$$;
grant execute on function public.preview_school_by_code(text) to authenticated;

create or replace function public.join_school_by_code(p_code text)
returns table(school_id uuid, school_name text)
language plpgsql security definer set search_path = public as $$
declare v_school_id uuid; v_school_name text;
begin
  select id, name into v_school_id, v_school_name from public.schools where invite_code = p_code;
  if v_school_id is null then
    raise exception 'Invalid invite code';
  end if;
  if exists (select 1 from public.memberships where user_id = auth.uid()) then
    raise exception 'You already belong to a school';
  end if;
  insert into public.memberships (school_id, user_id, role) values (v_school_id, auth.uid(), 'teacher');
  return query select v_school_id, v_school_name;
end;
$$;
grant execute on function public.join_school_by_code(text) to authenticated;

create or replace function public.regenerate_invite_code(p_school_id uuid)
returns table(invite_code text)
language plpgsql security definer set search_path = public as $$
declare v_code text;
begin
  if not public.is_principal_of(p_school_id) then
    raise exception 'Not authorized';
  end if;
  v_code := upper(substr(md5(random()::text || clock_timestamp()::text), 1, 8));
  update public.schools set invite_code = v_code where id = p_school_id;
  return query select v_code;
end;
$$;
grant execute on function public.regenerate_invite_code(uuid) to authenticated;

create or replace function public.remove_member(p_user_id uuid)
returns void
language plpgsql security definer set search_path = public as $$
declare v_school_id uuid;
begin
  select school_id into v_school_id from public.memberships where user_id = p_user_id;
  if v_school_id is null or not public.is_principal_of(v_school_id) then
    raise exception 'Not authorized';
  end if;
  if p_user_id = auth.uid() then
    raise exception 'Principals cannot remove themselves';
  end if;
  delete from public.memberships where user_id = p_user_id;
end;
$$;
grant execute on function public.remove_member(uuid) to authenticated;

-- ─────────────────────────────────────────────────────────────────
-- ClassroomLens Pro — Billing (Stripe: Pay As You Go / Unlimited)
--
-- One row per user, created automatically on signup with plan='trial'.
-- IMPORTANT: this table is intentionally read-only to the client (grant
-- select only). Every write — trial-count increments, plan changes,
-- Stripe IDs — happens from the serverless functions in /api using the
-- Supabase SERVICE ROLE key, which bypasses RLS. If a user could write
-- this table with their own anon-key session, they could grant
-- themselves an unlimited plan for free by calling the REST API
-- directly. Do not add authenticated insert/update/delete grants here.
--
-- Run this once in your Supabase project (SQL Editor). Safe to re-run.
-- ─────────────────────────────────────────────────────────────────

create table if not exists public.billing_accounts (
  user_id                        uuid primary key references public.profiles(id) on delete cascade,
  plan                           text not null default 'trial' check (plan in ('trial','payg','unlimited')),
  subscription_status            text not null default 'none' check (subscription_status in ('none','active','past_due','canceled')),
  free_observations_used         int not null default 0,
  billing_period_observations    int not null default 0,
  has_seen_pricing_intro         boolean not null default false,
  stripe_customer_id             text,
  stripe_base_subscription_id    text, -- PAYG: $19.99/yr base fee subscription
  stripe_metered_subscription_id text, -- PAYG: $1.00/observation metered subscription
  stripe_metered_item_id         text, -- subscription item usage records attach to
  stripe_unlimited_subscription_id text, -- Unlimited: $39.99/yr subscription
  current_period_end             timestamptz,
  created_at                     timestamptz not null default now(),
  updated_at                     timestamptz not null default now()
);
alter table public.billing_accounts enable row level security;
grant select on public.billing_accounts to authenticated;

drop policy if exists "Users can view their own billing account" on public.billing_accounts;
create policy "Users can view their own billing account"
  on public.billing_accounts for select
  using (user_id = auth.uid());

-- Every new profile gets a trial billing account automatically.
create or replace function public.handle_new_billing_account()
returns trigger
language plpgsql security definer set search_path = public as $$
begin
  insert into public.billing_accounts (user_id) values (new.id)
  on conflict (user_id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_profile_created_billing on public.profiles;
create trigger on_profile_created_billing
  after insert on public.profiles
  for each row execute function public.handle_new_billing_account();

-- One-time backfill for accounts created before this migration existed.
insert into public.billing_accounts (user_id)
select id from public.profiles
on conflict (user_id) do nothing;

-- ─────────────────────────────────────────────────────────────────
-- ClassroomLens Pro — Free-trial abuse prevention
--
-- 1. Disposable email domains are rejected at signup via a BEFORE INSERT
--    trigger directly on auth.users. This is a plain Postgres trigger
--    (not Supabase's separate "Auth Hooks" feature) — RAISE EXCEPTION in
--    a BEFORE trigger aborts the whole insert, so the account is never
--    created and Supabase's signUp() call returns an error to the client.
--    This is the same mechanism already used for on_auth_user_created,
--    just BEFORE instead of AFTER and able to block instead of just react.
--
-- 2. billing_accounts.has_payment_method gates observation #2 onward on
--    having a card on file (added via a $0 Stripe Checkout "setup mode"
--    session) — observation #1 stays completely free with no card.
--
-- Run this once. Then separately run disposable_domains_seed.sql (a
-- large data-only file, ~8,200 rows) to populate the blocklist — kept
-- out of this file so it doesn't dominate every future diff/review here.
-- ─────────────────────────────────────────────────────────────────

create table if not exists public.disposable_email_domains (
  domain text primary key
);
-- No client grants at all — this table is only ever read from inside the
-- security-definer trigger function below, never queried directly by the
-- client (would leak the blocklist for zero benefit).

create or replace function public.reject_disposable_email()
returns trigger
language plpgsql security definer set search_path = public as $$
declare v_domain text;
begin
  v_domain := lower(split_part(new.email, '@', 2));
  if exists (select 1 from public.disposable_email_domains where domain = v_domain) then
    raise exception 'Please sign up with a permanent email address — disposable/temporary email domains are not accepted.';
  end if;
  return new;
end;
$$;

drop trigger if exists reject_disposable_email_trigger on auth.users;
create trigger reject_disposable_email_trigger
  before insert on auth.users
  for each row execute function public.reject_disposable_email();

-- ─────────────────────────────────────────────────────────────────
-- ClassroomLens Pro — Webhook debug log (temporary diagnostic aid)
--
-- Vercel's free-plan log retention is too short to catch a stripe-webhook
-- failure after the fact, so this gives the webhook handler somewhere
-- durable to record what happened on every billing_accounts write attempt:
-- whether it ran, what it wrote, or why it didn't. Query it any time via
-- the Supabase Table Editor or SQL Editor — no Vercel logs needed.
--
-- No grants to authenticated/anon at all — written only by the service-role
-- webhook handler, viewed only via the dashboard's own privileged connection
-- (which bypasses PostgREST/RLS entirely). Safe to `truncate` or `drop` this
-- table once the payment flow is confirmed working; it's not meant to be a
-- permanent audit log.
--
-- Run this once in your Supabase project (SQL Editor). Safe to re-run.
-- ─────────────────────────────────────────────────────────────────

create table if not exists public.webhook_debug_log (
  id         uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  stage      text not null,   -- 'missing_metadata' | 'billing_updated' | 'billing_update_failed'
  event_type text,            -- Stripe event type, e.g. 'checkout.session.completed'
  session_id text,            -- Stripe object id, for cross-referencing in the Stripe dashboard
  user_id    uuid,            -- resolved supabase_user_id, if any
  plan       text,            -- resolved plan, if any
  detail     jsonb            -- session metadata, the post-update billing_accounts row, or the error message
);
alter table public.webhook_debug_log enable row level security;

alter table public.billing_accounts add column if not exists has_payment_method boolean not null default false;
