import { BrowserWindow } from 'electron'
import { createWindow, type WindowOptions } from './createWindow'
import { log } from '../logger'

/**
 * Tracks open windows so a given detachable panel is only spawned once and can
 * be focused if already open. The main table view lives under the `main` key.
 */
const windows = new Map<string, BrowserWindow>()

export function openWindow(key: string, opts: WindowOptions): BrowserWindow {
  const existing = windows.get(key)
  if (existing && !existing.isDestroyed()) {
    existing.focus()
    return existing
  }

  const win = createWindow(opts)
  windows.set(key, win)
  log('info', 'main', `window opened key=${key} view=${opts.view}`)
  win.on('closed', () => {
    windows.delete(key)
    log('info', 'main', `window closed key=${key}`)
  })
  win.webContents.on('render-process-gone', (_e, details) =>
    log('error', 'main', `renderer gone key=${key} reason=${details.reason}`)
  )
  return win
}

export function getMainWindow(): BrowserWindow | undefined {
  const win = windows.get('main')
  return win && !win.isDestroyed() ? win : undefined
}

export function hasWindows(): boolean {
  return [...windows.values()].some((w) => !w.isDestroyed())
}
