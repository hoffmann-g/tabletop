import { supabase } from '@infra/supabase'
import { logger } from '@infra/logger'
import type { Chapter } from '@models/domain'

interface ChapterRow {
  id: string
  campaign_id: string
  name: string
  order_index: number
  map_id: string | null
  effects: Record<string, unknown>
  created_at: string
}

const COLS = 'id, campaign_id, name, order_index, map_id, effects, created_at'

function mapChapter(row: ChapterRow): Chapter {
  return {
    id: row.id,
    campaignId: row.campaign_id,
    name: row.name,
    orderIndex: row.order_index,
    mapId: row.map_id,
    effects: row.effects ?? {},
    createdAt: row.created_at
  }
}

/** Fetches a single chapter by id (used to render the locked player canvas). */
export async function getChapter(id: string): Promise<Chapter | null> {
  const { data, error } = await supabase.from('chapters').select(COLS).eq('id', id).maybeSingle()
  if (error) {
    logger.error('getChapter failed', error.message)
    throw error
  }
  return data ? mapChapter(data as ChapterRow) : null
}

/** Lists the chapters (canvases) of a campaign, in display order. */
export async function listChapters(campaignId: string): Promise<Chapter[]> {
  const { data, error } = await supabase
    .from('chapters')
    .select(COLS)
    .eq('campaign_id', campaignId)
    .order('order_index', { ascending: true })
  if (error) {
    logger.error('listChapters failed', error.message)
    throw error
  }
  return (data as ChapterRow[]).map(mapChapter)
}

export async function createChapter(
  campaignId: string,
  name: string,
  orderIndex: number
): Promise<Chapter> {
  const { data, error } = await supabase
    .from('chapters')
    .insert({ campaign_id: campaignId, name, order_index: orderIndex })
    .select(COLS)
    .single()
  if (error) {
    logger.error('createChapter failed', error.message)
    throw error
  }
  logger.info('chapter created', campaignId, name)
  return mapChapter(data as ChapterRow)
}

export async function renameChapter(id: string, name: string): Promise<void> {
  const { error } = await supabase.from('chapters').update({ name }).eq('id', id)
  if (error) {
    logger.error('renameChapter failed', error.message)
    throw error
  }
  logger.info('chapter renamed', id, name)
}

export async function deleteChapter(id: string): Promise<void> {
  const { error } = await supabase.from('chapters').delete().eq('id', id)
  if (error) {
    logger.error('deleteChapter failed', error.message)
    throw error
  }
  logger.info('chapter deleted', id)
}
