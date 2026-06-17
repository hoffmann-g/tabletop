import type { RealtimeChannel } from '@supabase/supabase-js'
import { supabase } from '@infra/supabase'
import type { BroadcastEvent, PresenceState } from '@models/realtime'

/**
 * Joins the realtime channel for a session, wiring the three Supabase
 * mechanisms to their correct use:
 *
 *  - Broadcast → ephemeral, high-frequency events (token drag, cursors, dice).
 *    Never touches the database.
 *  - Presence  → who is online in the session.
 *  - Postgres Changes → durable state (handled by `subscribeToTable`), the
 *    source of truth that feeds undo/redo.
 *
 * Returns the channel plus a `send`/`track` API and an `unsubscribe`.
 */
export function joinSessionChannel(
  sessionId: string,
  handlers: {
    onEvent?: (event: BroadcastEvent) => void
    onPresenceSync?: (state: Record<string, PresenceState[]>) => void
  }
): {
  channel: RealtimeChannel
  send: (event: BroadcastEvent) => void
  track: (state: PresenceState) => Promise<void>
  unsubscribe: () => void
} {
  const channel = supabase.channel(`session:${sessionId}`, {
    config: { broadcast: { self: false }, presence: { key: sessionId } }
  })

  if (handlers.onEvent) {
    channel.on('broadcast', { event: 'rt' }, ({ payload }) => {
      handlers.onEvent?.(payload as BroadcastEvent)
    })
  }

  if (handlers.onPresenceSync) {
    channel.on('presence', { event: 'sync' }, () => {
      handlers.onPresenceSync?.(
        channel.presenceState() as unknown as Record<string, PresenceState[]>
      )
    })
  }

  channel.subscribe()

  return {
    channel,
    send: (event) => {
      void channel.send({ type: 'broadcast', event: 'rt', payload: event })
    },
    track: (state) => channel.track(state) as unknown as Promise<void>,
    unsubscribe: () => {
      void supabase.removeChannel(channel)
    }
  }
}

/**
 * Subscribes to durable changes on a table scoped to a campaign/chapter. Use
 * this for state that must persist (token commits, chapter switches, turn
 * order) — NOT for live drag, which belongs on Broadcast above.
 */
export function subscribeToTable(
  table: string,
  filter: string,
  onChange: () => void
): () => void {
  const channel = supabase
    .channel(`db:${table}:${filter}`)
    .on('postgres_changes', { event: '*', schema: 'public', table, filter }, () => onChange())
    .subscribe()

  return () => {
    void supabase.removeChannel(channel)
  }
}
