import { useState } from 'react'
import { isSupabaseConfigured } from '@infra/supabase'
import { AuthProvider, useAuth } from '@ui/auth/AuthProvider'
import { AuthScreen } from '@ui/auth/AuthScreen'
import { ConfigNotice } from '@ui/components/ConfigNotice'
import { CampaignsScreen } from '@ui/campaigns/CampaignsScreen'
import { CampaignRoom } from '@ui/campaigns/CampaignRoom'

/** In-window navigation. Detachable panels are separate windows (see App.tsx). */
export type Route =
  | { name: 'campaigns' }
  | { name: 'room'; campaignId: string; campaignName: string; isMaster: boolean }

/** The main window: auth gate + navigation between the campaigns list and a room. */
export function MainApp(): JSX.Element {
  if (!isSupabaseConfigured) return <ConfigNotice />
  return (
    <AuthProvider>
      <Gate />
    </AuthProvider>
  )
}

function Gate(): JSX.Element {
  const { user, profile, loading } = useAuth()
  const [route, setRoute] = useState<Route>({ name: 'campaigns' })

  if (loading) return <Centered>Loading…</Centered>
  if (!user || !profile) return <AuthScreen />

  if (route.name === 'room') {
    return (
      <CampaignRoom
        campaignId={route.campaignId}
        campaignName={route.campaignName}
        isMaster={route.isMaster}
        onLeave={() => setRoute({ name: 'campaigns' })}
      />
    )
  }

  return (
    <CampaignsScreen
      onOpenCampaign={(campaignId, campaignName, isMaster) =>
        setRoute({ name: 'room', campaignId, campaignName, isMaster })
      }
    />
  )
}

function Centered({ children }: { children: React.ReactNode }): JSX.Element {
  return <div style={{ height: '100%', display: 'grid', placeItems: 'center' }}>{children}</div>
}
