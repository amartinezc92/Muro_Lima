-- ============================================================
-- El Muro de Lima · Schema SQL para Supabase
-- Ejecutar en: Supabase Dashboard → SQL Editor
-- ============================================================

-- Extensions
create extension if not exists "uuid-ossp";

-- ── Spaces ───────────────────────────────────────────────────
create table if not exists spaces (
  id                serial primary key,
  grid_position     varchar(4) not null unique,   -- e.g. "A1", "T15"
  zone              varchar(50),
  status            varchar(20) not null default 'available'
                    check (status in ('available', 'sold', 'pending')),
  tier              varchar(20) check (tier in ('basic', 'premium', 'ultra')),
  business_name     varchar(200),
  business_category varchar(100),
  image_url         text,
  description       varchar(50),
  destination_link  text,
  views             integer not null default 0,
  clicks            integer not null default 0,
  created_at        timestamptz not null default now(),
  expires_at        timestamptz
);

-- Populate 300 available spaces (A1..T15)
do $$
declare
  cols text[] := array['A','B','C','D','E','F','G','H','I','J','K','L','M','N','O','P','Q','R','S','T'];
  col  text;
  row  int;
begin
  foreach col in array cols loop
    for row in 1..15 loop
      insert into spaces (grid_position, status)
      values (col || row::text, 'available')
      on conflict (grid_position) do nothing;
    end loop;
  end loop;
end;
$$;

-- ── Purchases ────────────────────────────────────────────────
create table if not exists purchases (
  id                  serial primary key,
  space_id            int references spaces(id) on delete set null,
  email               varchar(200) not null,
  whatsapp            varchar(20),
  business_name       varchar(200) not null,
  category            varchar(100),
  image_url           text,
  destination_link    text,
  description         varchar(50),
  amount              decimal(10,2) not null,
  currency            varchar(3) not null default 'PEN',
  tier                varchar(20) check (tier in ('basic', 'premium', 'ultra')),
  status              varchar(20) not null default 'pending'
                      check (status in ('pending', 'completed', 'rejected')),
  stripe_session_id   varchar(200),
  payment_intent_id   varchar(200),
  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now()
);

-- ── Users (one per buyer) ────────────────────────────────────
create table if not exists users (
  id              serial primary key,
  email           varchar(200) unique not null,
  business_name   varchar(200),
  whatsapp        varchar(20),
  space_id        int references spaces(id) on delete set null,
  created_at      timestamptz not null default now()
);

-- ── Admin logs ───────────────────────────────────────────────
create table if not exists admin_logs (
  id         serial primary key,
  action     varchar(50) not null,
  space_id   int,
  details    text,
  created_at timestamptz not null default now()
);

-- ── RPC helpers ──────────────────────────────────────────────
create or replace function increment_space_views(space_id int)
returns void language sql as $$
  update spaces set views = views + 1 where id = space_id;
$$;

create or replace function increment_space_clicks(space_id int)
returns void language sql as $$
  update spaces set clicks = clicks + 1 where id = space_id;
$$;

-- Trigger: auto-update updated_at on purchases
create or replace function set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger purchases_updated_at
  before update on purchases
  for each row execute procedure set_updated_at();

-- ── Row Level Security ───────────────────────────────────────
alter table spaces    enable row level security;
alter table purchases enable row level security;
alter table users     enable row level security;
alter table admin_logs enable row level security;

-- Public can read spaces
create policy "spaces_public_read" on spaces for select using (true);

-- Authenticated users / service role can write
create policy "spaces_service_write" on spaces for all using (auth.role() = 'service_role');

-- Purchases: anyone can insert (webhook will update), service_role can do all
create policy "purchases_insert" on purchases for insert with check (true);
create policy "purchases_service_all" on purchases for all using (auth.role() = 'service_role');

-- Users: can only see their own record
create policy "users_own" on users for select using (email = auth.jwt() ->> 'email');
create policy "users_insert" on users for insert with check (true);
create policy "users_service_all" on users for all using (auth.role() = 'service_role');

-- ── Storage bucket ───────────────────────────────────────────
-- Run in Storage section of Supabase dashboard:
-- Create bucket named "spaces" with public access ON
