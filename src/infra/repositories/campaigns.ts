import { supabase } from '@infra/supabase'
import { logger } from '@infra/logger'
import type { Campaign } from '@models/domain'

interface CampaignRow {
  id: string
  name: string
  owner_id: string
  created_at: string
}

const COLS = 'id, name, owner_id, created_at'

function mapCampaign(row: CampaignRow): Campaign {
  return { id: row.id, name: row.name, ownerId: row.owner_id, createdAt: row.created_at }
}

/** Lists campaigns the current user belongs to (RLS scopes this automatically). */
export async function listCampaigns(): Promise<Campaign[]> {
  const { data, error } = await supabase
    .from('campaigns')
    .select(COLS)
    .order('created_at', { ascending: false })
  if (error) {
    logger.error('listCampaigns failed', error.message)
    throw error
  }
  return (data as CampaignRow[]).map(mapCampaign)
}

/** Creates a campaign; the DB trigger makes the owner a master and opens its session. */
export async function createCampaign(name: string, ownerId: string): Promise<Campaign> {
  const { data, error } = await supabase
    .from('campaigns')
    .insert({ name, owner_id: ownerId })
    .select(COLS)
    .single()
  if (error) {
    logger.error('createCampaign failed', error.message)
    throw error
  }
  logger.info('campaign created', name)
  return mapCampaign(data as CampaignRow)
}

export async function renameCampaign(id: string, name: string): Promise<void> {
  const { error } = await supabase.from('campaigns').update({ name }).eq('id', id)
  if (error) {
    logger.error('renameCampaign failed', error.message)
    throw error
  }
  logger.info('campaign renamed', id, name)
}

export async function deleteCampaign(id: string): Promise<void> {
  const { error } = await supabase.from('campaigns').delete().eq('id', id)
  if (error) {
    logger.error('deleteCampaign failed', error.message)
    throw error
  }
  logger.info('campaign deleted', id)
}
