-- Tabletop RPG engine — initial schema.
--
-- Design notes:
--  * This schema is the entire "backend": durable state lives here, RLS
--    enforces permissions (no app server validates anything), and Realtime
--    (Postgres Changes / Broadcast / Presence) drives multiplayer.
--  * High-frequency ephemeral data (live token dragging, cursors, dice tumble)
--    is NOT stored here — it travels over Broadcast. Only committed state lands
--    in these tables.

create extension if not exists "pgcrypto";

-- ───────────────────────────────────────────────────────────── enums ──
create type campaign_role as enum ('master', 'player');
create type asset_kind    as enum ('token', 'map', 'audio');
create type invite_status as enum ('pending', 'accepted', 'declined');

-- ─────────────────────────────────────────────────────────── profiles ──
-- Mirrors auth.users with an app-facing username (used for invite-by-username).
create table profiles (
  id           uuid primary key references auth.users (id) on delete cascade,
  username     text unique not null check (char_length(username) between 3 and 32),
  display_name text check (char_length(display_name) <= 64),
  created_at   timestamptz not null default now()
);

-- ────────────────────────────────────────────────────────── campaigns ──
create table campaigns (
  id         uuid primary key default gen_random_uuid(),
  name       text not null check (char_length(name) between 1 and 120),
  owner_id   uuid not null references profiles (id) on delete cascade,
  created_at timestamptz not null default now()
);

create table campaign_members (
  campaign_id uuid not null references campaigns (id) on delete cascade,
  user_id     uuid not null references profiles (id) on delete cascade,
  role        campaign_role not null default 'player',
  joined_at   timestamptz not null default now(),
  primary key (campaign_id, user_id)
);

create table campaign_invites (
  id              uuid primary key default gen_random_uuid(),
  campaign_id     uuid not null references campaigns (id) on delete cascade,
  invited_user_id uuid not null references profiles (id) on delete cascade,
  invited_by      uuid not null references profiles (id) on delete cascade,
  status          invite_status not null default 'pending',
  created_at      timestamptz not null default now(),
  unique (campaign_id, invited_user_id)
);

-- ───────────────────────────────────────────── helper functions (RLS) ──
-- SECURITY DEFINER so they bypass RLS and can't cause recursive policy eval.
create or replace function is_campaign_member(cid uuid)
returns boolean language sql security definer stable set search_path = public as $$
  select exists (
    select 1 from campaign_members m
    where m.campaign_id = cid and m.user_id = auth.uid()
  );
$$;

create or replace function is_campaign_master(cid uuid)
returns boolean language sql security definer stable set search_path = public as $$
  select exists (
    select 1 from campaign_members m
    where m.campaign_id = cid and m.user_id = auth.uid() and m.role = 'master'
  );
$$;

-- ───────────────────────────────────────────────────────────── assets ──
-- Metadata for files in Supabase Storage (the bytes live in a bucket, cached
-- offline by clients on first download). Scoped per campaign, reusable.
create table assets (
  id           uuid primary key default gen_random_uuid(),
  campaign_id  uuid not null references campaigns (id) on delete cascade,
  kind         asset_kind not null,
  storage_path text not null,
  filename     text not null,
  mime         text,
  checksum     text,
  created_at   timestamptz not null default now()
);

-- ─────────────────────────────────────────────────────────────── maps ──
create table maps (
  id          uuid primary key default gen_random_uuid(),
  campaign_id uuid not null references campaigns (id) on delete cascade,
  name        text not null,
  asset_id    uuid references assets (id) on delete set null,
  width       integer,
  height      integer,
  grid        jsonb not null default '{}'::jsonb,
  created_at  timestamptz not null default now()
);

-- ─────────────────────────────────────────────────────────── chapters ──
-- The episodes / canvases of a campaign. Switching the active chapter drags
-- every online player along (driven by a session UPDATE + Postgres Changes).
create table chapters (
  id          uuid primary key default gen_random_uuid(),
  campaign_id uuid not null references campaigns (id) on delete cascade,
  name        text not null check (char_length(name) between 1 and 120),
  order_index integer not null default 0,
  map_id      uuid references maps (id) on delete set null,
  effects     jsonb not null default '{}'::jsonb, -- color grading / canvas fx
  created_at  timestamptz not null default now()
);

-- ────────────────────────────────────────────────────────────── tokens ──
create table tokens (
  id           uuid primary key default gen_random_uuid(),
  chapter_id   uuid not null references chapters (id) on delete cascade,
  asset_id     uuid references assets (id) on delete set null,
  x            double precision not null default 0,
  y            double precision not null default 0,
  z            double precision not null default 0, -- reserved for 3D tokens
  rotation     double precision not null default 0,
  scale        double precision not null default 1,
  is_hidden    boolean not null default false,
  pos_locked   boolean not null default false,
  not_clickable boolean not null default false,
  light        jsonb, -- { color, intensity, distance } or null
  created_at   timestamptz not null default now()
);

-- Players (besides the master) allowed to move/control a given token.
create table token_controllers (
  token_id uuid not null references tokens (id) on delete cascade,
  user_id  uuid not null references profiles (id) on delete cascade,
  primary key (token_id, user_id)
);

-- ───────────────────────────────────────────────────────────── sessions ──
-- The multiplayer state of a campaign. One per campaign.
create table sessions (
  id                 uuid primary key default gen_random_uuid(),
  campaign_id        uuid not null unique references campaigns (id) on delete cascade,
  current_chapter_id uuid references chapters (id) on delete set null,
  is_active          boolean not null default false,
  turn_order         jsonb not null default '[]'::jsonb, -- ordered participant ids
  current_turn_index integer not null default 0,
  started_at         timestamptz
);

-- Append-only action log → powers undo/redo of session/token actions.
create table session_events (
  id         bigint generated always as identity primary key,
  session_id uuid not null references sessions (id) on delete cascade,
  actor_id   uuid references profiles (id) on delete set null,
  type       text not null,
  payload    jsonb not null default '{}'::jsonb,
  inverse    jsonb, -- enough info to undo this event
  undone     boolean not null default false,
  created_at timestamptz not null default now()
);

-- ───────────────────────────────────────────────────────── audio / pad ──
create table audio_tracks (
  id          uuid primary key default gen_random_uuid(),
  campaign_id uuid not null references campaigns (id) on delete cascade,
  asset_id    uuid not null references assets (id) on delete cascade,
  label       text not null,
  loop        boolean not null default false,
  volume      double precision not null default 1 check (volume between 0 and 1),
  color       text,
  order_index integer not null default 0,
  created_at  timestamptz not null default now()
);

-- ───────────────────────────────────────────────── indexes for lookups ──
create index on campaign_members (user_id);
create index on campaign_invites (invited_user_id);
create index on chapters (campaign_id);
create index on tokens (chapter_id);
create index on session_events (session_id, id);
create index on audio_tracks (campaign_id);
