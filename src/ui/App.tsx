import { MainApp } from '@ui/MainApp'
import { SoundboardPanel } from '@ui/views/SoundboardPanel'
import { AssetsPanel } from '@ui/views/AssetsPanel'
import { DiceTrayPanel } from '@ui/views/DiceTrayPanel'

export interface AppProps {
  /** Which view this window should render (set per-window by the main process). */
  view: string
}

/**
 * Root router. Each detachable panel is its own OS window mounting the same
 * bundle with a different `view`, so the switch here is the whole "routing".
 */
export function App({ view }: AppProps): JSX.Element {
  switch (view) {
    case 'soundboard':
      return <SoundboardPanel />
    case 'assets':
      return <AssetsPanel />
    case 'dice':
      return <DiceTrayPanel />
    case 'main':
    default:
      return <MainApp />
  }
}
