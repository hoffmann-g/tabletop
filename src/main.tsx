import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { App } from '@ui/App'
import { logger, installErrorHandlers } from '@infra/logger'
import './styles.css'

installErrorHandlers()

/** Which view to mount, read from the window URL hash (`#view=<view>`). */
function currentView(): string {
  const params = new URLSearchParams(window.location.hash.slice(1))
  return params.get('view') ?? 'main'
}

const view = currentView()
logger.info(`renderer mounted view=${view}`)

const root = document.getElementById('root')
if (!root) throw new Error('Root element #root not found')

createRoot(root).render(
  <StrictMode>
    <App view={view} />
  </StrictMode>
)
