/**
 * What a player sees when there's no live chapter to be in: either the master
 * hasn't opened one, or the master went offline (which stops the session).
 */
export function PlayerWaitingRoom({
  campaignName,
  reason,
  onLeave
}: {
  campaignName: string
  reason: 'no-chapter' | 'master-offline'
  onLeave: () => void
}): JSX.Element {
  const title = reason === 'master-offline' ? 'Session paused' : 'No chapter selected'
  const subtitle =
    reason === 'master-offline'
      ? 'The master is offline — waiting for them to return…'
      : 'Waiting for the master to open a chapter…'

  return (
    <div style={{ position: 'relative', height: '100%' }}>
      <button onClick={onLeave} style={leaveBtn}>
        Leave
      </button>
      <div style={{ height: '100%', display: 'grid', placeItems: 'center', textAlign: 'center' }}>
        <div>
          <div style={{ fontSize: 18, marginBottom: 8 }}>{campaignName}</div>
          <div style={{ opacity: 0.6 }}>{title}</div>
          <div style={{ opacity: 0.4, fontSize: 13, marginTop: 4 }}>{subtitle}</div>
        </div>
      </div>
    </div>
  )
}

const leaveBtn: React.CSSProperties = { position: 'absolute', top: 12, right: 12 }
