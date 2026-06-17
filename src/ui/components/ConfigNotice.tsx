/** Shown when Supabase env vars are missing, instead of crashing the renderer. */
export function ConfigNotice(): JSX.Element {
  return (
    <div style={{ height: '100%', display: 'grid', placeItems: 'center', padding: 24 }}>
      <div
        style={{
          maxWidth: 480,
          padding: 24,
          background: 'var(--panel)',
          border: '1px solid var(--border)',
          borderRadius: 12,
          lineHeight: 1.6
        }}
      >
        <h2 style={{ marginTop: 0 }}>Supabase not configured</h2>
        <ol style={{ paddingLeft: 18, margin: 0 }}>
          <li>
            <code>cp .env.example .env</code>
          </li>
          <li>
            Fill <code>VITE_SUPABASE_URL</code> and <code>VITE_SUPABASE_ANON_KEY</code> from your
            Supabase project (Dashboard → Project Settings → API)
          </li>
          <li>Restart the app</li>
        </ol>
      </div>
    </div>
  )
}
