-- Salon-specific additions on top of the initial schema:
--   * public page details of the business
--   * service categories defined by each business
--   * which services each staff member performs
--   * read-only function for the public booking page (no table access for `anon`)

-- ---------------------------------------------------------------------------
-- Public page details
-- ---------------------------------------------------------------------------

alter table public.businesses
  add column description text,
  add column address text,
  -- Instagram handle without "@".
  add column instagram text,
  -- WhatsApp number in international format, digits only.
  add column whatsapp text check (whatsapp ~ '^[0-9]+$'),
  add column cover_url text;

-- ---------------------------------------------------------------------------
-- Service categories
-- ---------------------------------------------------------------------------

create table public.service_categories (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.businesses (id) on delete cascade,
  name text not null,
  -- Order in which categories are listed, lowest first.
  position integer not null default 0,
  created_at timestamptz not null default now(),
  -- Target of the composite foreign key that keeps a service in a category of its own business.
  unique (id, business_id)
);

create index service_categories_business_id_idx
  on public.service_categories (business_id, position);

-- Both tables are still empty, so the column can be required from the start.
alter table public.services
  add column category_id uuid not null,
  add constraint services_category_fkey
    foreign key (category_id, business_id)
    references public.service_categories (id, business_id)
    on delete restrict;

create index services_category_id_idx on public.services (category_id);

-- ---------------------------------------------------------------------------
-- Services each staff member performs
-- ---------------------------------------------------------------------------

alter table public.staff add constraint staff_id_business_id_key unique (id, business_id);
alter table public.services add constraint services_id_business_id_key unique (id, business_id);

create table public.staff_services (
  staff_id uuid not null,
  service_id uuid not null,
  business_id uuid not null references public.businesses (id) on delete cascade,
  primary key (staff_id, service_id),
  -- Composite keys: staff member and service must belong to the same business.
  foreign key (staff_id, business_id)
    references public.staff (id, business_id) on delete cascade,
  foreign key (service_id, business_id)
    references public.services (id, business_id) on delete cascade
);

create index staff_services_service_id_idx on public.staff_services (service_id);
create index staff_services_business_id_idx on public.staff_services (business_id);

-- ---------------------------------------------------------------------------
-- Row Level Security: members read, owner manages (same rules as staff and services).
-- ---------------------------------------------------------------------------

alter table public.service_categories enable row level security;
alter table public.staff_services enable row level security;

create policy service_categories_select on public.service_categories
  for select to authenticated
  using (business_id = (select public.current_business_id()));

create policy service_categories_insert on public.service_categories
  for insert to authenticated
  with check (business_id = (select public.current_business_id()) and (select public.is_business_owner()));

create policy service_categories_update on public.service_categories
  for update to authenticated
  using (business_id = (select public.current_business_id()) and (select public.is_business_owner()))
  with check (business_id = (select public.current_business_id()));

create policy service_categories_delete on public.service_categories
  for delete to authenticated
  using (business_id = (select public.current_business_id()) and (select public.is_business_owner()));

create policy staff_services_select on public.staff_services
  for select to authenticated
  using (business_id = (select public.current_business_id()));

create policy staff_services_insert on public.staff_services
  for insert to authenticated
  with check (business_id = (select public.current_business_id()) and (select public.is_business_owner()));

create policy staff_services_delete on public.staff_services
  for delete to authenticated
  using (business_id = (select public.current_business_id()) and (select public.is_business_owner()));

-- ---------------------------------------------------------------------------
-- Public booking page
-- ---------------------------------------------------------------------------
-- The front end talks to Supabase directly, so the public page reads through
-- this function instead of the tables. It exposes only what the page shows:
-- the business, its categories with active services, the active services and
-- the active staff with the services they perform. Returns null for an unknown slug.

-- security definer: `anon` has no policies on the tables it reads.
create function public.get_public_business(p_slug text)
returns jsonb
language sql
stable
security definer
set search_path = ''
as $$
  select jsonb_build_object(
    'slug', b.slug,
    'name', b.name,
    'description', b.description,
    'logo_url', b.logo_url,
    'cover_url', b.cover_url,
    'color', b.color,
    'address', b.address,
    'instagram', b.instagram,
    'whatsapp', b.whatsapp,
    'cancel_hours', b.cancel_hours,
    'hold_minutes', b.hold_minutes,
    'categories', coalesce((
      select jsonb_agg(
        jsonb_build_object('id', c.id, 'name', c.name)
        order by c.position, c.name
      )
      from public.service_categories c
      where c.business_id = b.id
        and exists (
          select 1 from public.services s
          where s.category_id = c.id and s.active
        )
    ), '[]'::jsonb),
    'services', coalesce((
      select jsonb_agg(
        jsonb_build_object(
          'id', s.id,
          'category_id', s.category_id,
          'name', s.name,
          'duration_min', s.duration_min,
          'price', s.price,
          'deposit_type', s.deposit_type,
          'deposit_value', s.deposit_value
        )
        order by c.position, c.name, s.created_at, s.name
      )
      from public.services s
      join public.service_categories c on c.id = s.category_id
      where s.business_id = b.id and s.active
    ), '[]'::jsonb),
    'staff', coalesce((
      select jsonb_agg(
        jsonb_build_object(
          'id', st.id,
          'name', st.name,
          'service_ids', coalesce((
            select jsonb_agg(ss.service_id)
            from public.staff_services ss
            join public.services s on s.id = ss.service_id
            where ss.staff_id = st.id and s.active
          ), '[]'::jsonb)
        )
        order by st.name
      )
      from public.staff st
      where st.business_id = b.id and st.active
    ), '[]'::jsonb)
  )
  from public.businesses b
  where b.slug = p_slug
$$;

revoke execute on function public.get_public_business(text) from public;
grant execute on function public.get_public_business(text) to anon, authenticated;
