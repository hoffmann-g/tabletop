import { contextBridge, ipcRenderer } from 'electron'

type LogLevel = 'debug' | 'info' | 'warn' | 'error'

/**
 * Safe bridge exposed to the renderer as `window.tabletop`.
 * Keep this surface small — only what the UI genuinely needs from the OS.
 */
const api = {
  /** Pop a panel out into its own floating OS window. */
  openPanel: (key: string, view: string): Promise<void> =>
    ipcRenderer.invoke('window:open-panel', key, view),
  focusMain: (): Promise<void> => ipcRenderer.invoke('window:focus-main'),
  /** Forward a renderer log line into the per-run log file in the main process. */
  log: (level: LogLevel, parts: unknown[]): void => ipcRenderer.send('log:write', level, parts)
}

contextBridge.exposeInMainWorld('tabletop', api)

export type TabletopApi = typeof api
