import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App'
import '@fontsource/cormorant-garamond/300.css'
import '@fontsource/cormorant-garamond/400.css'
import '@fontsource/cormorant-garamond/500.css'
import '@fontsource/cormorant-garamond/600.css'
import '@fontsource/cormorant-garamond/700.css'
import '@fontsource/cormorant-garamond/300-italic.css'
import '@fontsource/cormorant-garamond/500-italic.css'
import '@fontsource/cormorant-garamond/600-italic.css'
import '@fontsource/manrope/200.css'
import '@fontsource/manrope/300.css'
import '@fontsource/manrope/400.css'
import '@fontsource/manrope/500.css'
import '@fontsource/manrope/600.css'
import '@fontsource/manrope/700.css'
import '@fontsource/jetbrains-mono/400.css'
import '@fontsource/jetbrains-mono/500.css'
import './styles.css'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)

// Hide the boot screen once fonts are in and the first frames are painted (never longer than 4 s).
const boot = document.getElementById('boot')
if (boot) {
  const hide = () => { boot.classList.add('gone'); setTimeout(() => boot.remove(), 900) }
  const fonts = document.fonts?.ready ?? Promise.resolve()
  Promise.race([fonts, new Promise((r) => setTimeout(r, 4000))]).then(() => requestAnimationFrame(() => requestAnimationFrame(hide)))
}
