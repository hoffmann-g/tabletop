import { supabase } from '@infra/supabase'
import { logger } from '@infra/logger'

/** A pending invite shown in the invitee's list, with the campaign name. */
export interface PendingInvite {
  id: string
  campaignId: string
  campaignName: string
  createdAt: string
}

interface InviteRow {
  id: string
  campaign_id: string
  created_at: string
  campaigns: { name: string } | null
}

/** A pending invite as seen by the master, with the invited username. */
export interface CampaignInvite {
  id: string
  username: string
}

interface CampaignInviteRow {
  id: string
  profiles: { username: string } | null
}

/** Pending invites for a campaign (master roster: "invited, not yet joined"). */
export async function listCampaignInvites(campaignId: string): Promise<CampaignInvite[]> {
  const { data, error } = await supabase
    .from('campaign_invites')
    .select('id, profiles!invited_user_id(username)')
    .eq('campaign_id', campaignId)
    .eq('status', 'pending')
  if (error) {
    logger.error('listCampaignInvites failed', error.message)
    throw error
  }
  return (data as unknown as CampaignInviteRow[]).map((r) => ({
    id: r.id,
    username: r.profiles?.username ?? '(unknown)'
  }))
}

/** Pending invites addressed to the given user (RLS also scopes to them). */
export async function listMyInvites(userId: string): Promise<PendingInvite[]> {
  const { data, error } = await supabase
    .from('campaign_invites')
    .select('id, campaign_id, created_at, campaigns(name)')
    .eq('invited_user_id', userId)
    .eq('status', 'pending')
    .order('created_at', { ascending: false })
  if (error) {
    logger.error('listMyInvites failed', error.message)
    throw error
  }
  return (data as unknown as InviteRow[]).map((r) => ({
    id: r.id,
    campaignId: r.campaign_id,
    campaignName: r.campaigns?.name ?? '(campaign)',
    createdAt: r.created_at
  }))
}

/**
 * Invites a player by username. Only a master can do this (enforced by RLS);
 * throws a friendly error if the username doesn't exist.
 */
export async function inviteByUsername(
  campaignId: string,
  inviterId: string,
  username: string
): Promise<void> {
  const normalized = username.trim().toLowerCase()
  const { data: profile, error: lookupError } = await supabase
    .from('profiles')
    .select('id')
    .eq('username', normalized)
    .maybeSingle()
  if (lookupError) {
    logger.error('inviteByUsername lookup failed', lookupError.message)
    throw lookupError
  }
  if (!profile) throw new Error(`User "${normalized}" not found`)
  const targetId = (profile as { id: string }).id

  // Already in the campaign? Nothing to invite.
  const { data: member } = await supabase
    .from('campaign_members')
    .select('user_id')
    .eq('campaign_id', campaignId)
    .eq('user_id', targetId)
    .maybeSingle()
  if (member) throw new Error('This user is already in the campaign')

  // Upsert on (campaign_id, invited_user_id): re-invites after a decline simply
  // reset the existing row back to pending instead of hitting the unique index.
  const { error } = await supabase.from('campaign_invites').upsert(
    {
      campaign_id: campaignId,
      invited_user_id: targetId,
      invited_by: inviterId,
      status: 'pending'
    },
    { onConflict: 'campaign_id,invited_user_id' }
  )
  if (error) {
    logger.error('inviteByUsername failed', error.message)
    throw error
  }
  logger.info('invite sent', campaignId, normalized)
}

/** Accepts an invite: joins the campaign as a player and marks it accepted. */
export async function acceptInvite(invite: PendingInvite, userId: string): Promise<void> {
  const { error: joinError } = await supabase
    .from('campaign_members')
    .insert({ campaign_id: invite.campaignId, user_id: userId, role: 'player' })
  if (joinError) {
    logger.error('acceptInvite join failed', joinError.message)
    throw joinError
  }
  const { error } = await supabase
    .from('campaign_invites')
    .update({ status: 'accepted' })
    .eq('id', invite.id)
  if (error) {
    logger.error('acceptInvite update failed', error.message)
    throw error
  }
  logger.info('invite accepted', invite.campaignId)
}

export async function declineInvite(inviteId: string): Promise<void> {
  const { error } = await supabase
    .from('campaign_invites')
    .update({ status: 'declined' })
    .eq('id', inviteId)
  if (error) {
    logger.error('declineInvite failed', error.message)
    throw error
  }
  logger.info('invite declined', inviteId)
}
