import { useEffect, useState } from 'react'
import { useAuth } from '@ui/auth/AuthProvider'
import { useCampaignRoom } from '@ui/campaigns/useCampaignRoom'
import { setCurrentChapter } from '@infra/repositories/sessions'
import { getChapter } from '@infra/repositories/chapters'
import { MasterControlRoom } from '@ui/campaigns/MasterControlRoom'
import { PlayerWaitingRoom } from '@ui/campaigns/PlayerWaitingRoom'
import { ChapterCanvas } from '@ui/canvas-view/ChapterCanvas'

/**
 * Orchestrates being inside a campaign. Holds the live session + presence for
 * the whole stay (so the master's presence survives navigating in/out of a
 * chapter) and routes by role + the session's active chapter:
 *
 *  - active chapter set → both roles see its canvas (player locked, master can close)
 *  - no active chapter, master → control room (chapters, roster, invite)
 *  - no active chapter, player → "no chapter selected"
 */
export function CampaignRoom({
  campaignId,
  campaignName,
  isMaster,
  onLeave
}: {
  campaignId: string
  campaignName: string
  isMaster: boolean
  onLeave: () => void
}): JSX.Element {
  const { user, profile } = useAuth()
  const me = {
    userId: user?.id ?? '',
    username: profile?.username ?? '',
    role: (isMaster ? 'master' : 'player') as 'master' | 'player'
  }
  const { session, present, masterPresent } = useCampaignRoom(campaignId, me)
  const currentChapterId = session?.currentChapterId ?? null
  const [chapterName, setChapterName] = useState<string>('…')

  useEffect(() => {
    if (!currentChapterId) return
    void getChapter(currentChapterId).then((c) => setChapterName(c?.name ?? '(chapter)'))
  }, [currentChapterId])

  // Master leaving cleanly stops the session (clears the active chapter).
  async function leave(): Promise<void> {
    if (isMaster && session && currentChapterId) {
      await setCurrentChapter(session.id, null).catch(() => {})
    }
    onLeave()
  }

  if (!session) {
    return <div style={center}>Connecting…</div>
  }

  if (isMaster) {
    // Master in a chapter → canvas; otherwise the control room.
    if (currentChapterId) {
      return (
        <ChapterCanvas
          chapterName={chapterName}
          onClose={() => void setCurrentChapter(session.id, null)}
          onLeave={() => void leave()}
        />
      )
    }
    return (
      <MasterControlRoom
        campaignId={campaignId}
        campaignName={campaignName}
        present={present}
        onSelectChapter={(chapterId) => void setCurrentChapter(session.id, chapterId)}
        onLeave={() => void leave()}
      />
    )
  }

  // Player: locked to the active chapter — but only while the master is online.
  // No master ⇒ the session is stopped, so they wait regardless of the DB value.
  if (currentChapterId && masterPresent) {
    return <ChapterCanvas chapterName={chapterName} onLeave={onLeave} />
  }
  return (
    <PlayerWaitingRoom
      campaignName={campaignName}
      reason={masterPresent ? 'no-chapter' : 'master-offline'}
      onLeave={onLeave}
    />
  )
}

const center: React.CSSProperties = { height: '100%', display: 'grid', placeItems: 'center' }
