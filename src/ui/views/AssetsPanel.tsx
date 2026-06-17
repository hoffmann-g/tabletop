import { PanelShell } from '@ui/components/PanelShell'

/**
 * Detachable asset library (tokens/maps). The master uploads here; assets are
 * stored in Supabase Storage and cached offline on first download.
 */
export function AssetsPanel(): JSX.Element {
  return (
    <PanelShell title="Assets">
      <p style={{ opacity: 0.6 }}>The campaign's tokens and maps will appear here.</p>
    </PanelShell>
  )
}
