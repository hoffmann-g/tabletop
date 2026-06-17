import { supabase } from '@infra/supabase'
import { logger } from '@infra/logger'
import type { CampaignRole } from '@models/domain'

export interface CampaignMember {
  userId: string
  username: string
  role: CampaignRole
}

interface MemberRow {
  user_id: string
  role: CampaignRole
  profiles: { username: string } | null
}

/** Members of a campaign with their usernames (for the master's roster). */
export async function listMembers(campaignId: string): Promise<CampaignMember[]> {
  const { data, error } = await supabase
    .from('campaign_members')
    .select('user_id, role, profiles(username)')
    .eq('campaign_id', campaignId)
  if (error) {
    logger.error('listMembers failed', error.message)
    throw error
  }
  return (data as unknown as MemberRow[]).map((r) => ({
    userId: r.user_id,
    username: r.profiles?.username ?? '(unknown)',
    role: r.role
  }))
}
