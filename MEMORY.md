# Project Memory

Living record of the decisions behind this codebase — the *why*, not just the *what*.
For setup/run instructions see [README.md](README.md); for the original vision see [context.md](context.md).

## Locked architecture decisions (2026-06-17)

### Desktop shell: Electron (not Tauri)
The app is 3D-heavy — Three.js with colored token lights, shadows, and
post-processing color grading. On Linux (the dev machine, Manjaro), Tauri uses
**WebKitGTK**, historically the weakest webview for heavy WebGL → real rendering
risk. Electron bundles Chromium for consistent WebGL/WebGPU across platforms.
Larger bundle/RAM is irrelevant for a friends-only LAN tool.

### No separate backend — client ↔ Supabase directly
There is no custom API server. The client talks straight to **Supabase**
(Postgres + Realtime + Auth + Storage + RLS). The "backend" is:
migrations + RLS policies + realtime subscriptions. Justified because the master
is trusted (no anti-cheat need) and Supabase was already planned for production.

### Realtime: use the right channel per data type (critical)
- **Broadcast** → ephemeral, high-frequency events (live token drag, cursors,
  dice tumble). **Never** written to the DB.
- **Presence** → who is online in a session.
- **Postgres Changes** → durable, committed state (token final positions,
  chapter switches, turn order). Source of truth; feeds undo/redo via the
  append-only `session_events` log.

The committed value is written **once** when an interaction ends (e.g. on drag
end). Conflict resolution is last-write-wins — no CRDT. This split is mirrored in
the type layer: [`src/models/domain.ts`](src/models/domain.ts) (durable) vs
[`src/models/realtime.ts`](src/models/realtime.ts) (ephemeral).

### Supabase local + LAN now; production deploy deferred
The master runs local Supabase (Docker) and players connect to that host's LAN
IP (e.g. over Hamachi). Hosted-Supabase production deploy is intentionally
postponed.

## Stack & layout
- React 18 + TypeScript + Vite via **electron-vite**; pnpm.
- 3D: react-three-fiber + drei + postprocessing + rapier.
- Folders: `electron/` (main/preload/windows), `src/{ui,canvas,models,infra}`,
  `supabase/{migrations,config}`.
- Detachable panels (soundboard, assets, dice) are real OS windows — each a
  `BrowserWindow` mounting the same bundle with a different `#view=` hash.

## Status (done)

- **Backend**: hosted Supabase (project `sovcqvbplrirxlzbuzte`), schema + RLS via
  `supabase/migrations` (push with `pnpm db:push`). No local Docker.
- **Auth**: single `join(username, password)` — synthetic email
  `<username>@tabletop.local` under the hood; "Confirm email" is OFF in the
  dashboard (required for this).
- **Campaigns / chapters**: full CRUD. Rename/delete restricted to the master.
- **Invites**: by username, with re-invite-after-decline (upsert), and live via
  Realtime (Postgres Changes on `campaign_invites`).
- **Live session room** (`CampaignRoom` + `useCampaignRoom`):
  - Player is locked to `session.current_chapter_id` (master picks it); no chapter
    → "No chapter selected".
  - Presence shows connected vs invited in the master's control room.
  - **Session depends on the master**: `masterPresent` (Realtime Presence) gates
    the player — master offline ⇒ "Session paused". Self-healing on crash (players
    can't write `sessions` per RLS). Clean master leave clears the active chapter.
- **Logging**: per-launch file in `logs/` (see [[logging-preference]] memory).

## Next steps (roadmap)

1. **Canvas comes alive** (current focus):
   - Asset upload to Supabase **Storage** (tokens/maps/audio), metadata in `assets`.
   - Persist **tokens** per chapter (`tokens` table CRUD) and render them on the r3f canvas.
   - **Live token movement**: drag over **Broadcast** (ephemeral), commit final
     position with one `UPDATE` on drag-end (durable). Respect `pos_locked`,
     `is_hidden`, `not_clickable`, and per-token controllers.
2. **Offline asset cache**: download Storage assets to disk (Electron main), encrypted, on first session join.
3. **Dice**: 3D roll (rapier) synced via Broadcast `{notation, results, seed}`; persist to `dice_rolls`/session log.
4. **Soundboard / audio**: `audio_tracks` pad config + Broadcast play/stop so all clients play in sync.
5. **Turn order**: `session.turn_order` + `current_turn_index` UI; master reorders/skips. (`listMembers` repo already exists for the roster.)
6. **Color grading driven by session**: chapter `effects` jsonb → `ColorGrade` (black & white, moods) applied for everyone.
7. **Undo/redo**: append-only `session_events` log; apply inverse + broadcast reconcile.
8. **Master-offline polish**: presence drop on hard crash takes a few seconds (channel timeout); consider a heartbeat / shorter timeout if needed.
