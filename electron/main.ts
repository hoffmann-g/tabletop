import { app, ipcMain, Menu } from 'electron'
import { openWindow, getMainWindow, hasWindows } from './windows/manager'
import { initLogger, closeLogger, log, type LogLevel } from './logger'

function bootstrap(): void {
  openWindow('main', { view: 'main', width: 1440, height: 900 })
}

/**
 * Renderer asks the main process to pop a panel out into its own OS window.
 * `key` dedupes (one soundboard window, one asset list, etc).
 */
ipcMain.handle('window:open-panel', (_evt, key: string, view: string) => {
  log('info', 'main', `open-panel key=${key} view=${view}`)
  openWindow(key, { view, width: 420, height: 640, floating: true })
})

ipcMain.handle('window:focus-main', () => {
  getMainWindow()?.focus()
})

// Renderer windows forward their logs here so everything lands in one run file.
ipcMain.on('log:write', (_evt, level: LogLevel, parts: unknown[]) => {
  log(level, 'renderer', ...parts)
})

// Single instance — focus the existing main window instead of launching twice.
if (!app.requestSingleInstanceLock()) {
  app.quit()
} else {
  app.on('second-instance', () => {
    const main = getMainWindow()
    if (main) {
      if (main.isMinimized()) main.restore()
      main.focus()
    }
  })

  initLogger()

  // Hide the native menu bar (File / Edit / View / Window).
  Menu.setApplicationMenu(null)

  app.whenReady().then(() => {
    bootstrap()

    app.on('activate', () => {
      // macOS: re-create a window when the dock icon is clicked and none are open.
      if (!hasWindows()) bootstrap()
    })
  })

  app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') app.quit()
  })

  app.on('will-quit', closeLogger)
}
