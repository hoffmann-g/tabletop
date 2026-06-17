import { useEffect, useState } from 'react'
import { useAuth } from '@ui/auth/AuthProvider'
import { signOut } from '@infra/auth'
import {
  listCampaigns,
  createCampaign,
  renameCampaign,
  deleteCampaign
} from '@infra/repositories/campaigns'
import {
  listMyInvites,
  acceptInvite,
  declineInvite,
  type PendingInvite
} from '@infra/repositories/invites'
import { subscribeToTable } from '@infra/realtime'
import type { Campaign } from '@models/domain'
import { TextPromptModal } from '@ui/components/TextPromptModal'
import { ListRow } from '@ui/components/ListRow'
import { CenteredCard } from '@ui/components/CenteredCard'

type Dialog = { kind: 'create' } | { kind: 'rename'; campaign: Campaign } | null

export function CampaignsScreen({
  onOpenCampaign
}: {
  onOpenCampaign: (id: string, name: string, isMaster: boolean) => void
}): JSX.Element {
  const { user, profile } = useAuth()
  const [campaigns, setCampaigns] = useState<Campaign[]>([])
  const [invites, setInvites] = useState<PendingInvite[]>([])
  const [loading, setLoading] = useState(true)
  const [dialog, setDialog] = useState<Dialog>(null)

  async function refresh(): Promise<void> {
    const [c, i] = await Promise.all([
      listCampaigns(),
      user ? listMyInvites(user.id) : Promise.resolve([])
    ])
    setCampaigns(c)
    setInvites(i)
    setLoading(false)
  }

  useEffect(() => {
    void refresh()
  }, [])

  // Live invites: re-fetch when a row addressed to this user changes (RLS scopes
  // the events to their own invites).
  useEffect(() => {
    if (!user) return
    return subscribeToTable('campaign_invites', `invited_user_id=eq.${user.id}`, () => {
      void refresh()
    })
  }, [user?.id])

  return (
    <CenteredCard>
      <header style={header}>
        <strong>Campaigns</strong>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <span style={{ opacity: 0.6 }}>@{profile?.username}</span>
          <button onClick={() => void signOut()} style={{ background: 'transparent' }}>
            Sign out
          </button>
        </div>
      </header>

      <div style={{ flex: 1, overflow: 'auto', padding: 16 }}>
        {invites.length > 0 && (
          <div style={inviteBox}>
            <strong style={{ fontSize: 13 }}>Pending invites</strong>
            {invites.map((inv) => (
              <div key={inv.id} style={inviteRow}>
                <span>{inv.campaignName}</span>
                <span style={{ display: 'flex', gap: 6 }}>
                  <button
                    style={{ background: 'var(--accent)' }}
                    onClick={async () => {
                      if (user) await acceptInvite(inv, user.id)
                      await refresh()
                    }}
                  >
                    Accept
                  </button>
                  <button
                    style={{ background: 'transparent' }}
                    onClick={async () => {
                      await declineInvite(inv.id)
                      await refresh()
                    }}
                  >
                    Decline
                  </button>
                </span>
              </div>
            ))}
          </div>
        )}

        <button style={{ background: 'var(--accent)' }} onClick={() => setDialog({ kind: 'create' })}>
          + New campaign
        </button>

        {loading ? (
          <p style={{ opacity: 0.6 }}>Loading…</p>
        ) : campaigns.length === 0 ? (
          <p style={{ opacity: 0.6 }}>No campaigns yet. Create your first one!</p>
        ) : (
          <div style={{ marginTop: 16, display: 'flex', flexDirection: 'column', gap: 8 }}>
            {campaigns.map((c) => (
              <ListRow
                key={c.id}
                title={c.name}
                subtitle={user?.id === c.ownerId ? 'master' : 'player'}
                onOpen={() => onOpenCampaign(c.id, c.name, user?.id === c.ownerId)}
                onRename={
                  user?.id === c.ownerId
                    ? () => setDialog({ kind: 'rename', campaign: c })
                    : undefined
                }
                onDelete={
                  user?.id === c.ownerId
                    ? async () => {
                        await deleteCampaign(c.id)
                        await refresh()
                      }
                    : undefined
                }
              />
            ))}
          </div>
        )}
      </div>

      {dialog?.kind === 'create' && (
        <TextPromptModal
          title="New campaign"
          confirmLabel="Create"
          onCancel={() => setDialog(null)}
          onConfirm={async (name) => {
            if (user) await createCampaign(name, user.id)
            setDialog(null)
            await refresh()
          }}
        />
      )}
      {dialog?.kind === 'rename' && (
        <TextPromptModal
          title="Rename campaign"
          confirmLabel="Save"
          initialValue={dialog.campaign.name}
          onCancel={() => setDialog(null)}
          onConfirm={async (name) => {
            await renameCampaign(dialog.campaign.id, name)
            setDialog(null)
            await refresh()
          }}
        />
      )}
    </CenteredCard>
  )
}

const header: React.CSSProperties = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  padding: '10px 16px',
  borderBottom: '1px solid var(--border)'
}
const inviteBox: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: 8,
  marginBottom: 16,
  padding: 12,
  background: 'var(--panel)',
  border: '1px solid var(--accent)',
  borderRadius: 8
}
const inviteRow: React.CSSProperties = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center'
}
