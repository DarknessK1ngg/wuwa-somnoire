import { useEffect, useState } from 'react'
import { AnimatePresence, MotionConfig, motion } from 'motion/react'
import Background from './components/Background'
import Hero from './components/Hero'
import WaveMap from './components/WaveMap'
import Section from './components/Section'
import Menu, { Burger } from './components/Menu'
import Logo from './components/Logo'
import InnerLayer from './components/InnerLayer'
import CharacterView from './components/CharacterView'
import Dive from './components/Dive'
import DiscordLink from './components/DiscordLink'
import Search, { SearchButton } from './components/Search'
import Chain from './components/Chain'
import Descent from './components/Descent'
import Chaos from './components/Chaos'
import Aleph from './components/Aleph'
import Film, { FILM_KEY } from './components/Film'
import Depth from './components/Depth'
import Stars from './components/Stars'
import Trail from './components/Trail'
import Cursor from './components/Cursor'
import { setSound } from './sound'
import { CHARACTERS, INNER_UI } from './characters'
import { SECTIONS } from './content'
import { LangCtx, PACKS } from './lang'
import { bus, shockAt } from './bus'
import { useSettings } from './settings'

const parse = () => {
  const h = decodeURIComponent(location.hash.slice(1))
  if (h === 'map' || h === 'inner' || h === 'chain' || h === 'descent' || h === 'chaos' || h === 'aleph') return h
  if (h.startsWith('c-') && CHARACTERS.some((c) => `c-${c.id}` === h)) return h
  if (SECTIONS.some((s) => s.id === h)) return h
  return 'intro'
}

export default function App() {
  const [view, setView] = useState(parse)
  const [menu, setMenu] = useState(false)
  const settings = useSettings()

  useEffect(() => {
    const f = () => setView(parse())
    addEventListener('hashchange', f)
    return () => removeEventListener('hashchange', f)
  }, [])

  const [search, setSearch] = useState(false)
  // the opening film: once per browser, only on the front page and with animations on
  const [film, setFilm] = useState(() => {
    try { return view === 'intro' && settings.s.motion && !localStorage.getItem(FILM_KEY) } catch { return false }
  })
  // sound must start from a click, so a saved "on" waits for the first interaction
  useEffect(() => {
    if (!settings.s.sound) { setSound(false); return }
    const start = () => setSound(true)
    if (navigator.userActivation?.hasBeenActive) start()
    else { addEventListener('pointerdown', start, { once: true }); return () => removeEventListener('pointerdown', start) }
  }, [settings.s.sound])
  useEffect(() => {
    const onKey = (e) => {
      if (e.key === 'Escape') setMenu(false)
      const typing = /INPUT|TEXTAREA/.test(document.activeElement?.tagName || '')
      if ((e.key.toLowerCase() === 'k' && (e.metaKey || e.ctrlKey)) || (e.key === '/' && !typing)) { e.preventDefault(); setMenu(false); setSearch(true) }
    }
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

  // the hero has already handed its Mark over, so the map takes over right away
  const explore = () => go('map')

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

  // Dive between layers: tunnel + decoding overlay, then the next view shows through.
  const [diving, setDiving] = useState(null)
  const dive = (x, y, to, short = false) => {
    if (diving) return
    shockAt(x, y)
    if (short) bus.sfx('iris')
    else if (view !== 'map') bus.sfx('whoosh')
    setDiving({ x, y, k: Date.now(), short })
    setTimeout(() => go(to), short ? 420 : 900)
    setTimeout(() => setDiving(null), short ? 1300 : 2100)
  }

  const shot = view === 'intro' ? 'intro' : view === 'map' ? 'map' : view === 'inner' ? 'inner' : view.startsWith('c-') ? 'char' : 'section'

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
        <div className="top-right">
          <button className={`snd-btn ${settings.s.sound ? 'on' : ''}`} onClick={() => settings.update({ sound: !settings.s.sound })}
            aria-label={settings.s.sound ? 'Sound off' : 'Sound on'} aria-pressed={!!settings.s.sound}>
            <span className="snd-bars" aria-hidden="true"><i /><i /><i /><i /></span>
          </button>
          <SearchButton onClick={() => { setMenu(false); setSearch(true); bus.sfx('search') }} />
          <DiscordLink />
          <Burger open={menu} onClick={() => setMenu((m) => !m)} />
        </div>
      </header>

      <Menu open={menu} view={view} go={go} settings={settings} switchSite={switchSite} playFilm={() => { setMenu(false); go('intro'); setFilm(true) }} />

      <main>
        <AnimatePresence mode="wait">
          {view === 'intro' && !film && <Hero key={`intro-${site}`} onExplore={explore} settings={settings} />}
          {view === 'map' && <WaveMap key="map" go={go} dive={dive} />}
          {view === 'inner' && <InnerLayer key={`inner-${site}`} open={(id, x, y) => dive(x, y, `c-${id}`, true)} surface={(x, y) => dive(x, y, 'map')} />}
          {view.startsWith('c-') && <CharacterView key={`${site}-${view}`} id={view.slice(2)} back={(x, y) => dive(x ?? innerWidth / 2, y ?? innerHeight / 2, 'inner', true)} openChar={(id, x, y) => dive(x ?? innerWidth / 2, y ?? innerHeight / 2, `c-${id}`, true)} />}
          {view === 'chain' && <Chain key={`chain-${site}`} go={go} />}
          {view === 'descent' && <Descent key={`descent-${site}`} go={go} />}
          {view === 'chaos' && <Chaos key={`chaos-${site}`} go={go} />}
          {view === 'aleph' && <Aleph key={`aleph-${site}`} go={go} />}
          {view !== 'intro' && view !== 'map' && view !== 'inner' && view !== 'chain' && view !== 'descent' && view !== 'chaos' && view !== 'aleph' && !view.startsWith('c-') && <Section key={`${site}-${view}`} id={view} go={go} settings={settings} />}
        </AnimatePresence>
      </main>

      <AnimatePresence>{view === 'intro' && film && <Film key="film" onDone={() => setFilm(false)} sound={settings.s.sound} toggleSound={() => settings.update({ sound: !settings.s.sound })} />}</AnimatePresence>
      <Stars on={settings.s.motion} />
      <Cursor />
      <Depth view={view} go={go} />
      {view.startsWith('c-') && <Trail key={view} id={view.slice(2)} />}
      <AnimatePresence>{search && <Search key="search" close={() => setSearch(false)} go={go} />}</AnimatePresence>
      {diving && <Dive key={diving.k} x={diving.x} y={diving.y} short={diving.short} label={INNER_UI[pack.UI.lang].decoding} />}

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
