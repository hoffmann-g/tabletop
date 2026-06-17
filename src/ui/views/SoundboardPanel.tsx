import { PanelShell } from '@ui/components/PanelShell'

/**
 * Detachable soundboard. Triggering a pad will Broadcast a play/stop event so
 * every client plays in sync; the audio file itself comes from Storage (cached
 * offline). Wired up once the audio infra lands.
 */
export function SoundboardPanel(): JSX.Element {
  return (
    <PanelShell title="Soundboard">
      <p style={{ opacity: 0.6 }}>The campaign's audio pads will appear here.</p>
    </PanelShell>
  )
}
