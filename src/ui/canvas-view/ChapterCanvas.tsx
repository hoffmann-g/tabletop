import { Scene } from '@canvas/Scene'

/**
 * A chapter's canvas. Both roles see the same active chapter; the master can
 * close it (returns everyone to "no chapter selected"), players are locked to
 * it. Everyone has a Leave button to exit the campaign.
 */
export function ChapterCanvas({
  chapterName,
  onClose,
  onLeave
}: {
  chapterName: string
  /** Master-only: clear the active chapter for the whole session. */
  onClose?: () => void
  onLeave: () => void
}): JSX.Element {
  return (
    <div style={{ position: 'relative', height: '100%', width: '100%' }}>
      <Scene />

      <div style={toolbar}>
        {onClose && (
          <button onClick={onClose} title="Close chapter" style={{ background: 'transparent' }}>
            ✕
          </button>
        )}
        <strong style={{ marginRight: 8 }}>{chapterName}</strong>
        <button onClick={() => window.tabletop.openPanel('soundboard', 'soundboard')}>🎵</button>
        <button onClick={() => window.tabletop.openPanel('assets', 'assets')}>🗂️</button>
        <button onClick={() => window.tabletop.openPanel('dice', 'dice')}>🎲</button>
      </div>

      <button onClick={onLeave} style={leaveBtn}>
        Leave
      </button>
    </div>
  )
}

const toolbar: React.CSSProperties = {
  position: 'absolute',
  top: 12,
  left: 12,
  display: 'flex',
  gap: 8,
  alignItems: 'center',
  padding: 8,
  background: 'rgba(21,21,29,0.8)',
  border: '1px solid var(--border)',
  borderRadius: 8,
  backdropFilter: 'blur(6px)'
}
const leaveBtn: React.CSSProperties = {
  position: 'absolute',
  top: 12,
  right: 12,
  background: 'rgba(21,21,29,0.8)',
  backdropFilter: 'blur(6px)'
}
