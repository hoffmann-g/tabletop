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
