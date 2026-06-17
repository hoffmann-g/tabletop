import { PanelShell } from '@ui/components/PanelShell'

/**
 * Detachable dice tray. Rolling computes a result + seed and Broadcasts it so
 * everyone renders the same 3D tumble on the main canvas.
 */
export function DiceTrayPanel(): JSX.Element {
  return (
    <PanelShell title="Dice">
      <p style={{ opacity: 0.6 }}>Dice notation (e.g. 2d6+3) and roll history will appear here.</p>
    </PanelShell>
  )
}
