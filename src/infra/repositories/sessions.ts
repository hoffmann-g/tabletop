import { supabase } from '@infra/supabase'
import { logger } from '@infra/logger'
import type { Session } from '@models/domain'

interface SessionRow {
  id: string
  campaign_id: string
  current_chapter_id: string | null
  is_active: boolean
  turn_order: string[]
  current_turn_index: number
  started_at: string | null
}

const COLS = 'id, campaign_id, current_chapter_id, is_active, turn_order, current_turn_index, started_at'

function mapSession(row: SessionRow): Session {
  return {
    id: row.id,
    campaignId: row.campaign_id,
    currentChapterId: row.current_chapter_id,
    isActive: row.is_active,
    turnOrder: row.turn_order ?? [],
    currentTurnIndex: row.current_turn_index,
    startedAt: row.started_at
  }
}

/** The (single) session of a campaign. Created by a trigger at campaign creation. */
export async function getSession(campaignId: string): Promise<Session | null> {
  const { data, error } = await supabase
    .from('sessions')
    .select(COLS)
    .eq('campaign_id', campaignId)
    .maybeSingle()
  if (error) {
    logger.error('getSession failed', error.message)
    throw error
  }
  return data ? mapSession(data as SessionRow) : null
}

/**
 * Master sets the active chapter every connected player is locked to. Passing
 * null returns players to the "no chapter selected" screen. RLS restricts this
 * to the campaign master.
 */
export async function setCurrentChapter(
  sessionId: string,
  chapterId: string | null
): Promise<void> {
  const { error } = await supabase
    .from('sessions')
    .update({ current_chapter_id: chapterId })
    .eq('id', sessionId)
  if (error) {
    logger.error('setCurrentChapter failed', error.message)
    throw error
  }
  logger.info('session chapter set', sessionId, chapterId ?? 'null')
}
