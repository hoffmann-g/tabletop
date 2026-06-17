import { useEffect, useState } from 'react'
import {
  listChapters,
  createChapter,
  renameChapter,
  deleteChapter
} from '@infra/repositories/chapters'
import { inviteByUsername, listCampaignInvites, type CampaignInvite } from '@infra/repositories/invites'
import { subscribeToTable } from '@infra/realtime'
import { useAuth } from '@ui/auth/AuthProvider'
import type { Chapter } from '@models/domain'
import type { PresenceState } from '@models/realtime'
import { TextPromptModal } from '@ui/components/TextPromptModal'
import { ListRow } from '@ui/components/ListRow'
import { CenteredCard } from '@ui/components/CenteredCard'

type Dialog =
  | { kind: 'create' }
  | { kind: 'rename'; chapter: Chapter }
  | { kind: 'invite' }
  | null

/**
 * The master's control room (shown when no chapter is active): manage chapters,
 * invite players, and see who is connected vs invited. Opening a chapter makes
 * it the session's active chapter — every connected player follows.
 */
export function MasterControlRoom({
  campaignId,
  campaignName,
  present,
  onSelectChapter,
  onLeave
}: {
  campaignId: string
  campaignName: string
  present: PresenceState[]
  onSelectChapter: (chapterId: string) => void
  onLeave: () => void
}): JSX.Element {
  const { user } = useAuth()
  const [chapters, setChapters] = useState<Chapter[]>([])
  const [pending, setPending] = useState<CampaignInvite[]>([])
  const [loading, setLoading] = useState(true)
  const [dialog, setDialog] = useState<Dialog>(null)
  const [inviting, setInviting] = useState(false)
  const [inviteMsg, setInviteMsg] = useState<string | null>(null)

  async function refresh(): Promise<void> {
    const [ch, inv] = await Promise.all([listChapters(campaignId), listCampaignInvites(campaignId)])
    setChapters(ch)
    setPending(inv)
    setLoading(false)
  }

  useEffect(() => {
    void refresh()
  }, [campaignId])

  // Keep the "invited" list live as players accept / get invited.
  useEffect(() => {
    return subscribeToTable('campaign_invites', `campaign_id=eq.${campaignId}`, () => {
      void listCampaignInvites(campaignId).then(setPending)
    })
  }, [campaignId])

  return (
    <CenteredCard>
      <header style={header}>
        <strong>{campaignName}</strong>
        <button onClick={onLeave} style={{ background: 'transparent' }}>
          Leave
        </button>
      </header>

      <div style={{ flex: 1, overflow: 'auto', padding: 16, display: 'flex', flexDirection: 'column', gap: 16 }}>
        {/* Connected vs invited */}
        <div style={rosterBox}>
          <strong style={{ fontSize: 13 }}>Connected ({present.length})</strong>
          {present.length === 0 ? (
            <span style={{ opacity: 0.5, fontSize: 13 }}>Nobody online</span>
          ) : (
            present.map((p) => (
              <div key={p.userId} style={rosterRow}>
                <span>● @{p.username}</span>
                <span style={{ opacity: 0.5, fontSize: 12 }}>{p.role}</span>
              </div>
            ))
          )}
          {pending.length > 0 && (
            <>
              <strong style={{ fontSize: 13, marginTop: 8 }}>Invited (pending)</strong>
              {pending.map((inv) => (
                <div key={inv.id} style={rosterRow}>
                  <span style={{ opacity: 0.7 }}>○ @{inv.username}</span>
                  <span style={{ opacity: 0.4, fontSize: 12 }}>not joined</span>
                </div>
              ))}
            </>
          )}
          <button style={{ marginTop: 8 }} onClick={() => setDialog({ kind: 'invite' })}>
            + Invite player
          </button>
          {inviteMsg && <span style={{ color: 'var(--accent)', fontSize: 13 }}>{inviteMsg}</span>}
        </div>

        {/* Chapters */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <strong style={{ fontSize: 13 }}>Chapters</strong>
            <button style={{ background: 'var(--accent)' }} onClick={() => setDialog({ kind: 'create' })}>
              + New chapter
            </button>
          </div>
          {loading ? (
            <p style={{ opacity: 0.6 }}>Loading…</p>
          ) : chapters.length === 0 ? (
            <p style={{ opacity: 0.6 }}>No chapters yet. Create your first canvas!</p>
          ) : (
            chapters.map((ch) => (
              <ListRow
                key={ch.id}
                title={ch.name}
                subtitle="open for everyone"
                onOpen={() => onSelectChapter(ch.id)}
                onRename={() => setDialog({ kind: 'rename', chapter: ch })}
                onDelete={async () => {
                  await deleteChapter(ch.id)
                  await refresh()
                }}
              />
            ))
          )}
        </div>
      </div>

      {dialog?.kind === 'create' && (
        <TextPromptModal
          title="New chapter"
          confirmLabel="Create"
          onCancel={() => setDialog(null)}
          onConfirm={async (name) => {
            await createChapter(campaignId, name, chapters.length)
            setDialog(null)
            await refresh()
          }}
        />
      )}
      {dialog?.kind === 'rename' && (
        <TextPromptModal
          title="Rename chapter"
          confirmLabel="Save"
          initialValue={dialog.chapter.name}
          onCancel={() => setDialog(null)}
          onConfirm={async (name) => {
            await renameChapter(dialog.chapter.id, name)
            setDialog(null)
            await refresh()
          }}
        />
      )}
      {dialog?.kind === 'invite' && (
        <TextPromptModal
          title="Invite player by username"
          confirmLabel="Invite"
          onCancel={() => setDialog(null)}
          onConfirm={async (username) => {
            if (!user || inviting) return
            setInviting(true)
            setInviteMsg(null)
            try {
              await inviteByUsername(campaignId, user.id, username)
              setInviteMsg(`Invite sent to @${username}`)
              setDialog(null)
              await refresh()
            } catch (err) {
              setInviteMsg(err instanceof Error ? err.message : 'Failed to send invite')
            } finally {
              setInviting(false)
            }
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
const rosterBox: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: 6,
  padding: 12,
  background: 'var(--panel)',
  border: '1px solid var(--border)',
  borderRadius: 8
}
const rosterRow: React.CSSProperties = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center'
}
