/**
 * Ephemeral realtime events sent over Supabase Broadcast — these never hit the
 * database. High-frequency, fire-and-forget; durable state is persisted
 * separately (see domain.ts) and the final committed value is written once an
 * interaction ends (e.g. on drag end).
 */

export interface TokenMoveEvent {
  type: 'token:move'
  tokenId: string
  x: number
  y: number
  /** Sender id, so a client can ignore echoes of its own broadcasts. */
  by: string
}

export interface CursorEvent {
  type: 'cursor'
  by: string
  x: number
  y: number
}

export interface DiceRollEvent {
  type: 'dice:roll'
  by: string
  notation: string
  results: number[]
  total: number
  /** Shared seed so every client renders the same 3D tumble. */
  seed: number
}

export interface PlaybackEvent {
  type: 'audio:play' | 'audio:stop'
  trackId: string
  by: string
}

export type BroadcastEvent = TokenMoveEvent | CursorEvent | DiceRollEvent | PlaybackEvent

/** Presence payload tracking who is online in a session. */
export interface PresenceState {
  userId: string
  username: string
  role: 'master' | 'player'
}
