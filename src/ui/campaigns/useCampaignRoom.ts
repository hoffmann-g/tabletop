import { useEffect, useRef, useState } from 'react'
import type { RealtimeChannel } from '@supabase/supabase-js'
import { supabase } from '@infra/supabase'
import { subscribeToTable } from '@infra/realtime'
import { getSession } from '@infra/repositories/sessions'
import type { Session } from '@models/domain'
import type { PresenceState } from '@models/realtime'

/**
 * Live state of being "in" a campaign:
 *  - `session`: the campaign's session row, kept in sync via Postgres Changes so
 *    players follow the master's active-chapter switches.
 *  - `present`: who is currently online in the room, via Realtime Presence.
 */
export function useCampaignRoom(
  campaignId: string,
  me: PresenceState
): { session: Session | null; present: PresenceState[]; masterPresent: boolean } {
  const [session, setSession] = useState<Session | null>(null)
  const [present, setPresent] = useState<PresenceState[]>([])
  const meRef = useRef(me)
  meRef.current = me

  useEffect(() => {
    let cancelled = false
    const reload = (): void => {
      void getSession(campaignId).then((s) => {
        if (!cancelled) setSession(s)
      })
    }
    reload()
    const unsubSession = subscribeToTable('sessions', `campaign_id=eq.${campaignId}`, reload)

    const channel: RealtimeChannel = supabase.channel(`room:${campaignId}`, {
      config: { presence: { key: meRef.current.userId } }
    })
    channel.on('presence', { event: 'sync' }, () => {
      const state = channel.presenceState<PresenceState>()
      // Dedupe by userId — a user with multiple windows appears once.
      const byUser = new Map<string, PresenceState>()
      for (const metas of Object.values(state)) {
        for (const p of metas) byUser.set(p.userId, { userId: p.userId, username: p.username, role: p.role })
      }
      setPresent([...byUser.values()])
    })
    channel.subscribe((status) => {
      if (status === 'SUBSCRIBED') void channel.track(meRef.current)
    })

    return () => {
      cancelled = true
      unsubSession()
      void supabase.removeChannel(channel)
    }
  }, [campaignId])

  // The session is only "live" while a master is online. This is the source of
  // truth for stopping the session — it self-heals on a master crash, since
  // players can't write is_active (RLS) and presence simply drops.
  const masterPresent = present.some((p) => p.role === 'master')

  return { session, present, masterPresent }
}
