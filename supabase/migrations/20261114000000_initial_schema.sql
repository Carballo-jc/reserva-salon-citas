-- Initial schema for the MVP: appointments with deposit (Mercado Pago).
-- Multi-tenant: every row hangs from a business; RLS scopes panel users to their own business.
-- Money is stored in ARS as integer cents. Timestamps are stored in UTC (timestamptz).

create extension if not exists btree_gist with schema extensions;

-- ---------------------------------------------------------------------------
-- Enums
-- ---------------------------------------------------------------------------

create type public.user_role as enum ('owner', 'staff');
create type public.deposit_type as enum ('percent', 'fixed');
create type public.appointment_status as enum (
  'pending_payment',
  'confirmed',
  'cancelled',
  'expired',
  'attended',
  'no_show'
);
create type public.appointment_source as enum ('web', 'manual');

-- ---------------------------------------------------------------------------
-- Tables
-- ---------------------------------------------------------------------------

create table public.businesses (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  name text not null,
  logo_url text,
  color text,
  timezone text not null default 'America/Argentina/Buenos_Aires',
  cancel_hours integer not null default 24 check (cancel_hours >= 0),
  hold_minutes integer not null default 15 check (hold_minutes > 0),
  created_at timestamptz not null default now()
);

-- Panel login. One row per Supabase Auth user.
create table public.users (
  id uuid primary key references auth.users (id) on delete cascade,
  business_id uuid not null references public.businesses (id) on delete cascade,
  email text not null,
  role public.user_role not null default 'owner',
  created_at timestamptz not null default now()
);

create index users_business_id_idx on public.users (business_id);

-- Professionals who take appointments.
create table public.staff (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.businesses (id) on delete cascade,
  name text not null,
  active boolean not null default true,
  created_at timestamptz not null default now()
);

create index staff_business_id_idx on public.staff (business_id);

create table public.services (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.businesses (id) on delete cascade,
  name text not null,
  duration_min integer not null check (duration_min > 0),
  price integer not null check (price >= 0),
  deposit_type public.deposit_type not null,
  deposit_value integer not null check (deposit_value >= 0),
  active boolean not null default true,
  created_at timestamptz not null default now(),
  constraint services_deposit_percent_range
    check (deposit_type <> 'percent' or deposit_value <= 100)
);

create index services_business_id_idx on public.services (business_id);

-- One row per time range, so a day can have breaks. weekday: 0 = Sunday .. 6 = Saturday.
create table public.availability (
  id uuid primary key default gen_random_uuid(),
  staff_id uuid not null references public.staff (id) on delete cascade,
  weekday smallint not null check (weekday between 0 and 6),
  start_time time not null,
  end_time time not null,
  check (end_time > start_time)
);

create index availability_staff_id_idx on public.availability (staff_id, weekday);

-- Blocks and holidays.
create table public.time_off (
  id uuid primary key default gen_random_uuid(),
  staff_id uuid not null references public.staff (id) on delete cascade,
  starts_at timestamptz not null,
  ends_at timestamptz not null,
  reason text,
  check (ends_at > starts_at)
);

create index time_off_staff_id_idx on public.time_off (staff_id, starts_at);

create table public.appointments (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.businesses (id) on delete cascade,
  staff_id uuid not null references public.staff (id) on delete restrict,
  service_id uuid not null references public.services (id) on delete restrict,
  customer_name text not null,
  customer_phone text not null,
  customer_email text,
  starts_at timestamptz not null,
  ends_at timestamptz not null,
  status public.appointment_status not null default 'pending_payment',
  deposit_amount integer not null default 0 check (deposit_amount >= 0),
  hold_expires_at timestamptz,
  cancel_token uuid not null unique default gen_random_uuid(),
  source public.appointment_source not null default 'web',
  created_at timestamptz not null default now(),
  check (ends_at > starts_at),
  -- Anti double booking: the same professional can never hold two active
  -- appointments that overlap, even if both are created at the same instant.
  constraint appointments_no_overlap
    exclude using gist (
      staff_id with =,
      tstzrange(starts_at, ends_at) with &&
    )
    where (status in ('pending_payment', 'confirmed'))
);

create index appointments_business_starts_at_idx
  on public.appointments (business_id, starts_at);

-- Used by the job that expires unpaid holds.
create index appointments_pending_hold_idx
  on public.appointments (hold_expires_at)
  where status = 'pending_payment';

create table public.payments (
  id uuid primary key default gen_random_uuid(),
  appointment_id uuid not null references public.appointments (id) on delete cascade,
  -- Unique so the Mercado Pago webhook can be processed idempotently.
  mp_payment_id text unique,
  mp_preference_id text,
  status text not null,
  amount integer not null check (amount >= 0),
  raw_json jsonb,
  created_at timestamptz not null default now()
);

create index payments_appointment_id_idx on public.payments (appointment_id);

-- OAuth tokens of each business. Tokens are stored encrypted by the app.
create table public.mp_accounts (
  business_id uuid primary key references public.businesses (id) on delete cascade,
  mp_user_id text not null,
  access_token text not null,
  refresh_token text not null,
  expires_at timestamptz not null
);

-- Monthly charge to the business.
create table public.subscriptions (
  business_id uuid primary key references public.businesses (id) on delete cascade,
  plan text not null check (plan in ('solo', 'equipo')),
  status text not null check (status in ('trialing', 'active', 'past_due', 'cancelled')),
  trial_ends_at timestamptz,
  mp_preapproval_id text
);

-- ---------------------------------------------------------------------------
-- Row Level Security
-- ---------------------------------------------------------------------------
-- Only panel users (role `authenticated`) get policies. The public booking
-- page, the Mercado Pago webhook and the scheduled jobs run on the server with
-- the service role, which bypasses RLS. `anon` has no access to any table.

-- security definer: reads public.users without triggering its own RLS policy.
create function public.current_business_id()
returns uuid
language sql
stable
security definer
set search_path = ''
as $$
  select business_id from public.users where id = (select auth.uid())
$$;

create function public.is_business_owner()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.users
    where id = (select auth.uid()) and role = 'owner'
  )
$$;

revoke execute on function public.current_business_id() from public, anon;
revoke execute on function public.is_business_owner() from public, anon;
grant execute on function public.current_business_id() to authenticated;
grant execute on function public.is_business_owner() to authenticated;

alter table public.businesses enable row level security;
alter table public.users enable row level security;
alter table public.staff enable row level security;
alter table public.services enable row level security;
alter table public.availability enable row level security;
alter table public.time_off enable row level security;
alter table public.appointments enable row level security;
alter table public.payments enable row level security;
alter table public.mp_accounts enable row level security;
alter table public.subscriptions enable row level security;

-- businesses: members read, owner updates. Creation happens on the server.
create policy businesses_select on public.businesses
  for select to authenticated
  using (id = (select public.current_business_id()));

create policy businesses_update on public.businesses
  for update to authenticated
  using (id = (select public.current_business_id()) and (select public.is_business_owner()))
  with check (id = (select public.current_business_id()));

-- users: members see who belongs to their business.
create policy users_select on public.users
  for select to authenticated
  using (business_id = (select public.current_business_id()));

-- staff and services: members read, owner manages.
create policy staff_select on public.staff
  for select to authenticated
  using (business_id = (select public.current_business_id()));

create policy staff_insert on public.staff
  for insert to authenticated
  with check (business_id = (select public.current_business_id()) and (select public.is_business_owner()));

create policy staff_update on public.staff
  for update to authenticated
  using (business_id = (select public.current_business_id()) and (select public.is_business_owner()))
  with check (business_id = (select public.current_business_id()));

create policy staff_delete on public.staff
  for delete to authenticated
  using (business_id = (select public.current_business_id()) and (select public.is_business_owner()));

create policy services_select on public.services
  for select to authenticated
  using (business_id = (select public.current_business_id()));

create policy services_insert on public.services
  for insert to authenticated
  with check (business_id = (select public.current_business_id()) and (select public.is_business_owner()));

create policy services_update on public.services
  for update to authenticated
  using (business_id = (select public.current_business_id()) and (select public.is_business_owner()))
  with check (business_id = (select public.current_business_id()));

create policy services_delete on public.services
  for delete to authenticated
  using (business_id = (select public.current_business_id()) and (select public.is_business_owner()));

-- availability and time_off: scoped through the staff row. Members read, owner manages.
create policy availability_select on public.availability
  for select to authenticated
  using (
    exists (
      select 1 from public.staff s
      where s.id = staff_id and s.business_id = (select public.current_business_id())
    )
  );

create policy availability_insert on public.availability
  for insert to authenticated
  with check (
    (select public.is_business_owner())
    and exists (
      select 1 from public.staff s
      where s.id = staff_id and s.business_id = (select public.current_business_id())
    )
  );

create policy availability_update on public.availability
  for update to authenticated
  using (
    (select public.is_business_owner())
    and exists (
      select 1 from public.staff s
      where s.id = staff_id and s.business_id = (select public.current_business_id())
    )
  )
  with check (
    exists (
      select 1 from public.staff s
      where s.id = staff_id and s.business_id = (select public.current_business_id())
    )
  );

create policy availability_delete on public.availability
  for delete to authenticated
  using (
    (select public.is_business_owner())
    and exists (
      select 1 from public.staff s
      where s.id = staff_id and s.business_id = (select public.current_business_id())
    )
  );

create policy time_off_select on public.time_off
  for select to authenticated
  using (
    exists (
      select 1 from public.staff s
      where s.id = staff_id and s.business_id = (select public.current_business_id())
    )
  );

create policy time_off_insert on public.time_off
  for insert to authenticated
  with check (
    (select public.is_business_owner())
    and exists (
      select 1 from public.staff s
      where s.id = staff_id and s.business_id = (select public.current_business_id())
    )
  );

create policy time_off_update on public.time_off
  for update to authenticated
  using (
    (select public.is_business_owner())
    and exists (
      select 1 from public.staff s
      where s.id = staff_id and s.business_id = (select public.current_business_id())
    )
  )
  with check (
    exists (
      select 1 from public.staff s
      where s.id = staff_id and s.business_id = (select public.current_business_id())
    )
  );

create policy time_off_delete on public.time_off
  for delete to authenticated
  using (
    (select public.is_business_owner())
    and exists (
      select 1 from public.staff s
      where s.id = staff_id and s.business_id = (select public.current_business_id())
    )
  );

-- appointments: any member reads, creates (manual appointment) and updates
-- (attended / no_show / cancel). No delete: appointments are cancelled, not removed.
create policy appointments_select on public.appointments
  for select to authenticated
  using (business_id = (select public.current_business_id()));

create policy appointments_insert on public.appointments
  for insert to authenticated
  with check (business_id = (select public.current_business_id()));

create policy appointments_update on public.appointments
  for update to authenticated
  using (business_id = (select public.current_business_id()))
  with check (business_id = (select public.current_business_id()));

-- payments: read only from the panel; rows are written by the webhook (service role).
create policy payments_select on public.payments
  for select to authenticated
  using (
    exists (
      select 1 from public.appointments a
      where a.id = appointment_id and a.business_id = (select public.current_business_id())
    )
  );

-- subscriptions: read only from the panel.
create policy subscriptions_select on public.subscriptions
  for select to authenticated
  using (business_id = (select public.current_business_id()));

-- mp_accounts: no policies on purpose. OAuth tokens are only reachable with the service role.
