# Tabletop

A tabletop RPG engine for playing with friends over LAN. Desktop app (Electron)
with a 3D canvas (Three.js / react-three-fiber) and a Supabase backend — no
custom API server: Supabase Postgres + Realtime + Auth + Storage, with
permissions enforced by Row-Level Security.

## Architecture

- **Electron** shell — each detachable panel (soundboard, assets, dice) is a
  real OS window (`electron/windows/`).
- **React + Three.js** renderer (`src/`) — `ui/`, `canvas/`, `models/`, `infra/`.
- **Supabase** is the whole backend. Multiplayer uses the right Realtime channel
  per data type:
  - **Broadcast** → ephemeral high-frequency events (live token drag, cursors,
    dice tumble). Never written to the DB.
  - **Presence** → who is online in a session.
  - **Postgres Changes** → durable state (committed token positions, chapter
    switches, turn order). The source of truth, and what powers undo/redo via
    the append-only `session_events` log.

Durable vs ephemeral is mirrored in the type layer: `src/models/domain.ts`
(persisted) vs `src/models/realtime.ts` (Broadcast).

## Prerequisites

- Node + pnpm. A hosted Supabase project (no local Docker — we use the hosted
  project for dev too).

## Setup

```bash
pnpm install
cp .env.example .env    # fill VITE_SUPABASE_URL + anon key from the dashboard
```

Apply the schema to your hosted project (one-time, then on every new migration):

```bash
pnpm db:login           # one-time, opens a browser
pnpm db:link            # links to the project ref (asks the DB password)
pnpm db:push            # pushes supabase/migrations/* to the hosted DB
```

In the dashboard, **Authentication → Providers → Email**, turn **off "Confirm
email"** for a friends-only project so signup logs in immediately.

## Run

```bash
pnpm dev               # launch the Electron app (dev server + hot reload)
pnpm build             # production build into out/
pnpm typecheck         # tsc on both node + web projects
```

## Database

- Schema: `supabase/migrations/*_init_schema.sql`
- RLS policies: `supabase/migrations/*_rls_policies.sql`
- `pnpm db:types` regenerates TS types from the linked DB.

## Multiplayer

Players just install, log in, and join via username invite — the publishable
key + URL are baked into the build, so there is no per-player configuration and
no LAN/Hamachi. A campaign is enterable only while its master is online
(Realtime Presence) and the session is active.
