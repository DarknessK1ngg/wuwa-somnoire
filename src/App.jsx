import { useEffect, useState } from 'react'
import { AnimatePresence, MotionConfig, motion } from 'motion/react'
import Background from './components/Background'
import Intro, { Shockwave } from './components/Intro'
import WaveMap from './components/WaveMap'
import Section from './components/Section'
import Menu, { Burger } from './components/Menu'
import Logo from './components/Logo'
import { SECTIONS } from './content'
import { LangCtx, PACKS } from './lang'
import { shockAt } from './bus'
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
    setTimeout(() => go('map'), 700)
    setTimeout(() => setRipple(null), 2200)
  }

  const site = settings.s.site === 'acf' ? 'acf' : 'vsb'
  const pack = PACKS[site]
  useEffect(() => {
    document.documentElement.lang = pack.UI.lang
    document.title = pack.UI.title
  }, [pack])

  // Switching mode "reboots" the site: flash, then the intro plays again in the other language.
  const [reboot, setReboot] = useState(0)
  const switchSite = (id) => {
    if (id === site) return
    setMenu(false)
    shockAt(innerWidth / 2, innerHeight / 2)
    setReboot(Date.now())
    setTimeout(() => {
      settings.update({ site: id })
      go('intro')
    }, 520)
    setTimeout(() => setReboot(0), 1400)
  }

  const shot = view === 'intro' ? 'intro' : view === 'map' ? 'map' : 'section'

  return (
    <LangCtx.Provider value={pack}>
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
              <span>{pack.UI.brand[0]} <i>{pack.UI.brand[1]}</i></span>
            </motion.button>
          )}
        </AnimatePresence>
        <Burger open={menu} onClick={() => setMenu((m) => !m)} />
      </header>

      <Menu open={menu} view={view} go={go} settings={settings} switchSite={switchSite} />

      <main>
        <AnimatePresence mode="wait">
          {view === 'intro' && <Intro key={`intro-${site}`} onExplore={explore} />}
          {view === 'map' && <WaveMap key="map" go={go} />}
          {view !== 'intro' && view !== 'map' && <Section key={`${site}-${view}`} id={view} go={go} settings={settings} />}
        </AnimatePresence>
      </main>

      {ripple && <Shockwave key={ripple.k} x={ripple.x} y={ripple.y} size={1.2} />}

      {view !== 'intro' && (
        <footer className="foot">
          {pack.UI.foot}
        </footer>
      )}
      {reboot !== 0 && (
        <div key={reboot} className="reboot" aria-hidden="true"><span className="reboot-line" /></div>
      )}
    </MotionConfig>
    </LangCtx.Provider>
  )
}
