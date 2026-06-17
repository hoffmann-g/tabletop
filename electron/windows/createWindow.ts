import { resolve } from 'node:path'
import { BrowserWindow, shell } from 'electron'

const isDev = !!process.env['ELECTRON_RENDERER_URL']

export interface WindowOptions {
  /**
   * Which view the renderer should mount. The renderer reads this from the URL
   * hash (`#view=<view>`) to decide what to render — this is how detachable
   * panels (soundboard, asset list, dice tray) reuse the same bundle.
   */
  view: string
  width?: number
  height?: number
  /** Frameless + always-on-top is handy for floating tool panels. */
  floating?: boolean
}

/**
 * Creates a BrowserWindow pointing at the renderer, scoped to a given `view`.
 * Every detachable panel is a real OS window created through here.
 */
export function createWindow(opts: WindowOptions): BrowserWindow {
  const win = new BrowserWindow({
    width: opts.width ?? 1280,
    height: opts.height ?? 800,
    show: false,
    frame: !opts.floating,
    alwaysOnTop: opts.floating ?? false,
    backgroundColor: '#0b0b0f',
    webPreferences: {
      preload: resolve(__dirname, '../preload/preload.js'),
      sandbox: false,
      contextIsolation: true,
      nodeIntegration: false
    }
  })

  win.once('ready-to-show', () => win.show())

  // Open external links in the OS browser, never inside the app.
  win.webContents.setWindowOpenHandler(({ url }) => {
    void shell.openExternal(url)
    return { action: 'deny' }
  })

  const hash = `#view=${encodeURIComponent(opts.view)}`
  if (isDev) {
    void win.loadURL(`${process.env['ELECTRON_RENDERER_URL']}${hash}`)
  } else {
    void win.loadFile(resolve(__dirname, '../renderer/index.html'), {
      hash: `view=${encodeURIComponent(opts.view)}`
    })
  }

  return win
}
