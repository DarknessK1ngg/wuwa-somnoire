import { useEffect, useState } from 'react'
import { AnimatePresence, MotionConfig, motion } from 'motion/react'
import Background from './components/Background'
import Intro, { Ripple } from './components/Intro'
import TreeMap from './components/TreeMap'
import Section from './components/Section'
import Menu, { Burger } from './components/Menu'
import Logo from './components/Logo'
import { SECTIONS } from './content'
import { useSettings } from './settings'

const parse = () => {
  const h = decodeURIComponent(location.hash.slice(1))
  if (h === 'map') return 'map'
  if (SECTIONS.some((s) => s.id === h)) return h
  return 'intro'
}

export default function App() {
  const [view, setView] = useState(parse)
  const [menu, setMenu] = useState(false)
  const [ripple, setRipple] = useState(null)
  const settings = useSettings()

  useEffect(() => {
    const f = () => setView(parse())
    addEventListener('hashchange', f)
    return () => removeEventListener('hashchange', f)
  }, [])

  useEffect(() => {
    const onKey = (e) => e.key === 'Escape' && setMenu(false)
    addEventListener('keydown', onKey)
    return () => removeEventListener('keydown', onKey)
  }, [])

  const go = (v) => {
    setMenu(false)
    if (v === 'intro') history.pushState(null, '', location.pathname)
    else if (location.hash.slice(1) !== v) location.hash = v
    setView(v)
    window.scrollTo({ top: 0, behavior: 'instant' })
  }

  const explore = (x, y) => {
    setRipple({ x, y, k: Date.now() })
    setTimeout(() => go('map'), 650)
    setTimeout(() => setRipple(null), 1800)
  }

  const shot = view === 'intro' ? 'intro' : view === 'map' ? 'map' : 'section'

  return (
    <MotionConfig reducedMotion={settings.s.motion ? 'never' : 'always'}>
      <Background shot={shot} s={settings.s} />

      <header className={`topbar ${view === 'intro' ? 'topbar-intro' : ''}`}>
        <AnimatePresence>
          {view !== 'intro' && (
            <motion.button
              className="brand"
              onClick={() => go('map')}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
            >
              <Logo size={30} />
              <span>Somnoire <i>Dossier</i></span>
            </motion.button>
          )}
        </AnimatePresence>
        <Burger open={menu} onClick={() => setMenu((m) => !m)} />
      </header>

      <Menu open={menu} view={view} go={go} settings={settings} />

      <main>
        <AnimatePresence mode="wait">
          {view === 'intro' && <Intro key="intro" onExplore={explore} />}
          {view === 'map' && <TreeMap key="map" go={go} />}
          {view !== 'intro' && view !== 'map' && <Section key={view} id={view} go={go} settings={settings} />}
        </AnimatePresence>
      </main>

      {ripple && <Ripple key={ripple.k} x={ripple.x} y={ripple.y} />}

      {view !== 'intro' && (
        <footer className="foot">
          Fan analysis for VS Battles. Not affiliated with Kuro Games. Game text © Kuro Games.
        </footer>
      )}
    </MotionConfig>
  )
}
