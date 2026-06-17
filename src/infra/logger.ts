type LogLevel = 'debug' | 'info' | 'warn' | 'error'

/**
 * Renderer-side logger. Forwards every line to the main process so it lands in
 * the per-run file in `logs/`, and mirrors to the devtools console.
 */
function emit(level: LogLevel, parts: unknown[]): void {
  window.tabletop?.log(level, parts)
  const console_ = level === 'error' ? console.error : level === 'warn' ? console.warn : console.log
  console_('[renderer]', ...parts)
}

export const logger = {
  debug: (...parts: unknown[]) => emit('debug', parts),
  info: (...parts: unknown[]) => emit('info', parts),
  warn: (...parts: unknown[]) => emit('warn', parts),
  error: (...parts: unknown[]) => emit('error', parts)
}

/** Wire global error hooks once, at renderer startup. */
export function installErrorHandlers(): void {
  window.addEventListener('error', (e) =>
    logger.error('window.onerror', e.message, e.filename ? `${e.filename}:${e.lineno}` : '')
  )
  window.addEventListener('unhandledrejection', (e) =>
    logger.error('unhandledrejection', e.reason)
  )
}
