import { useState, type FormEvent } from 'react'
import { join } from '@infra/auth'

/** Single gate: enter username + password to create an account or sign in. */
export function AuthScreen(): JSX.Element {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  async function onSubmit(e: FormEvent): Promise<void> {
    e.preventDefault()
    setError(null)
    setBusy(true)
    try {
      await join(username, password)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Authentication failed')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div style={wrap}>
      <form onSubmit={onSubmit} style={card}>
        <h1 style={{ margin: 0, fontSize: 22 }}>Tabletop</h1>
        <p style={{ marginTop: 0, opacity: 0.6 }}>Enter a username and password to join</p>

        <input
          style={input}
          placeholder="username"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          autoCapitalize="none"
          autoCorrect="off"
          minLength={3}
          required
        />
        <input
          style={input}
          type="password"
          placeholder="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          minLength={6}
          required
        />

        {error && <div style={{ color: '#ff6b6b', fontSize: 13 }}>{error}</div>}

        <button type="submit" disabled={busy} style={{ background: 'var(--accent)' }}>
          {busy ? '...' : 'Join'}
        </button>

        <p style={{ margin: 0, fontSize: 12, opacity: 0.5 }}>
          New username creates an account; an existing one signs you in.
        </p>
      </form>
    </div>
  )
}

const wrap: React.CSSProperties = {
  height: '100%',
  display: 'grid',
  placeItems: 'center'
}
const card: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: 10,
  width: 320,
  padding: 24,
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
