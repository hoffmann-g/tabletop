import type { ReactNode } from 'react'

/**
 * Centers its content as a squarish card in the middle of the window.
 * Shared by the campaigns and chapters screens so they don't sprawl full-screen.
 */
export function CenteredCard({ children }: { children: ReactNode }): JSX.Element {
  return (
    <div style={wrap}>
      <div style={card}>{children}</div>
    </div>
  )
}

const wrap: React.CSSProperties = {
  height: '100%',
  display: 'grid',
  placeItems: 'center',
  padding: 24
}
const card: React.CSSProperties = {
  width: 'min(560px, 100%)',
  height: 'min(600px, 100%)',
  display: 'flex',
  flexDirection: 'column',
  background: 'var(--bg)',
  border: '1px solid var(--border)',
  borderRadius: 14,
  overflow: 'hidden',
  boxShadow: '0 12px 48px rgba(0, 0, 0, 0.45)'
}
