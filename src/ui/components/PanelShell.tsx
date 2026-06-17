import type { ReactNode } from 'react'

/** Common chrome for a detachable panel window: title bar + body. */
export function PanelShell({
  title,
  children
}: {
  title: string
  children: ReactNode
}): JSX.Element {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <header
        style={{
          padding: '8px 12px',
          borderBottom: '1px solid var(--border)',
          fontWeight: 600,
          // Lets the frameless floating window be dragged by its title bar.
          // @ts-expect-error -- Electron-specific CSS property.
          WebkitAppRegion: 'drag'
        }}
      >
        {title}
      </header>
      <div style={{ flex: 1, padding: 12, overflow: 'auto' }}>{children}</div>
    </div>
  )
}
