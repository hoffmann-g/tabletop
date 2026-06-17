import { createWriteStream, mkdirSync, readdirSync, rmSync, type WriteStream } from 'node:fs'
import { join } from 'node:path'
import { app } from 'electron'

export type LogLevel = 'debug' | 'info' | 'warn' | 'error'
export type LogSource = 'main' | 'renderer'

/** How many past run logs to keep before pruning the oldest. */
const MAX_RUNS = 20

let stream: WriteStream | null = null
let logFilePath = ''

/** `logs/` lives at the project root in dev (app path = repo root). */
function logsDir(): string {
  return join(app.getAppPath(), 'logs')
}

/** Trim old run files so the folder doesn't grow unbounded. */
function pruneOldLogs(dir: string): void {
  try {
    const files = readdirSync(dir)
      .filter((f) => f.endsWith('.log'))
      .sort() // ISO-timestamp names sort chronologically
    for (const f of files.slice(0, Math.max(0, files.length - MAX_RUNS + 1))) {
      rmSync(join(dir, f), { force: true })
    }
  } catch {
    // best-effort; never block startup on pruning
  }
}

/**
 * Opens a fresh log file for this app initialization. Call once, early in the
 * main process. Each launch gets its own timestamped file in `logs/`.
 */
export function initLogger(): void {
  const dir = logsDir()
  mkdirSync(dir, { recursive: true })
  pruneOldLogs(dir)

  const stamp = new Date().toISOString().replace(/[:.]/g, '-')
  logFilePath = join(dir, `${stamp}.log`)
  stream = createWriteStream(logFilePath, { flags: 'a' })

  // Route crashes into the log so a failed launch leaves a trace.
  process.on('uncaughtException', (err) => log('error', 'main', 'uncaughtException', err))
  process.on('unhandledRejection', (reason) => log('error', 'main', 'unhandledRejection', reason))

  log('info', 'main', `=== app start === pid=${process.pid} version=${app.getVersion()}`)
  log('info', 'main', `log file: ${logFilePath}`)
}

function format(value: unknown): string {
  if (value instanceof Error) return value.stack ?? `${value.name}: ${value.message}`
  if (typeof value === 'string') return value
  try {
    return JSON.stringify(value)
  } catch {
    return String(value)
  }
}

/** Writes one line to the run log (and mirrors to the console). */
export function log(level: LogLevel, source: LogSource, ...parts: unknown[]): void {
  const line = `[${new Date().toISOString()}] [${level.toUpperCase()}] [${source}] ${parts
    .map(format)
    .join(' ')}`
  stream?.write(line + '\n')
  // eslint-disable-next-line no-console
  ;(level === 'error' ? console.error : console.log)(line)
}

export function getLogFilePath(): string {
  return logFilePath
}

/** Flush + close the stream on shutdown. */
export function closeLogger(): void {
  log('info', 'main', '=== app quit ===')
  stream?.end()
  stream = null
}
