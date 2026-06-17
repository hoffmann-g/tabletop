import type { TabletopApi } from '../electron/preload'

declare global {
  interface Window {
    tabletop: TabletopApi
  }
}

export {}
