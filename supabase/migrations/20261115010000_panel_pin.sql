-- Provisional gate for the owner panel: a PIN per business, checked by the database.
-- It keeps customers out of the panel until real sign-in exists; it is not a
-- replacement for authentication and grants no access to any table.

create extension if not exists pgcrypto with schema extensions;

alter table public.businesses
  -- bcrypt hash of the PIN. Null means the panel cannot be opened with a PIN.
  add column panel_pin_hash text,
  add column panel_pin_failed_attempts integer not null default 0
    check (panel_pin_failed_attempts >= 0),
  -- While in the future, every attempt is rejected without checking the PIN.
  add column panel_pin_locked_until timestamptz;

-- Returns 'ok', 'wrong' or 'locked'. After 5 wrong attempts in a row the PIN
-- is locked for 15 minutes, so a short PIN cannot be guessed by brute force.
-- security definer: `anon` has no policies on public.businesses.
create function public.verify_panel_pin(p_slug text, p_pin text)
returns text
language plpgsql
volatile
security definer
set search_path = ''
as $$
declare
  c_max_attempts constant integer := 5;
  c_lock_duration constant interval := interval '15 minutes';
  v_business public.businesses%rowtype;
begin
  -- Row lock: concurrent attempts are counted one at a time.
  select * into v_business
  from public.businesses
  where slug = p_slug
  for update;

  if not found or v_business.panel_pin_hash is null then
    return 'wrong';
  end if;

  if v_business.panel_pin_locked_until > now() then
    return 'locked';
  end if;

  if v_business.panel_pin_hash = extensions.crypt(p_pin, v_business.panel_pin_hash) then
    update public.businesses
    set panel_pin_failed_attempts = 0, panel_pin_locked_until = null
    where id = v_business.id;
    return 'ok';
  end if;

  if v_business.panel_pin_failed_attempts + 1 >= c_max_attempts then
    update public.businesses
    set panel_pin_failed_attempts = 0,
        panel_pin_locked_until = now() + c_lock_duration
    where id = v_business.id;
    return 'locked';
  end if;

  update public.businesses
  set panel_pin_failed_attempts = panel_pin_failed_attempts + 1
  where id = v_business.id;
  return 'wrong';
end;
$$;

revoke execute on function public.verify_panel_pin(text, text) from public;
grant execute on function public.verify_panel_pin(text, text) to anon, authenticated;
