import { useState, type FormEvent } from 'react'

/**
 * Small modal asking for a single text value. Electron has no window.prompt, so
 * create/rename flows use this instead.
 */
export function TextPromptModal({
  title,
  initialValue = '',
  confirmLabel = 'OK',
  onConfirm,
  onCancel
}: {
  title: string
  initialValue?: string
  confirmLabel?: string
  onConfirm: (value: string) => void
  onCancel: () => void
}): JSX.Element {
  const [value, setValue] = useState(initialValue)

  function submit(e: FormEvent): void {
    e.preventDefault()
    const trimmed = value.trim()
    if (trimmed) onConfirm(trimmed)
  }

  return (
    <div style={backdrop} onClick={onCancel}>
      <form style={modal} onClick={(e) => e.stopPropagation()} onSubmit={submit}>
        <h3 style={{ margin: 0 }}>{title}</h3>
        {/* eslint-disable-next-line jsx-a11y/no-autofocus */}
        <input
          autoFocus
          style={input}
          value={value}
          onChange={(e) => setValue(e.target.value)}
        />
        <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
          <button type="button" onClick={onCancel} style={{ background: 'transparent' }}>
            Cancel
          </button>
          <button type="submit" style={{ background: 'var(--accent)' }}>
            {confirmLabel}
          </button>
        </div>
      </form>
    </div>
  )
}

const backdrop: React.CSSProperties = {
  position: 'fixed',
  inset: 0,
  background: 'rgba(0,0,0,0.5)',
  display: 'grid',
  placeItems: 'center',
  zIndex: 100
}
const modal: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: 12,
  width: 320,
  padding: 20,
  background: 'var(--panel)',
  border: '1px solid var(--border)',
  borderRadius: 12
}
const input: React.CSSProperties = {
  font: 'inherit',
  color: 'var(--text)',
  background: 'var(--bg)',
  border: '1px solid var(--border)',
  borderRadius: 6,
  padding: '8px 10px'
}
