import { DISCORD } from './DiscordLink'
import { PROOF_UI } from '../proofs'
import MarkEdge from './MarkEdge'
import { useState } from 'react'
import { AnimatePresence, motion } from 'motion/react'
import { usePack, SITES } from '../lang'
import { CHARACTERS, INNER_UI } from '../characters'
import { PRESETS } from '../settings'

export function Burger({ open, onClick }) {
  const { UI } = usePack()
  return (
    <button className={`burger ${open ? 'is-open' : ''}`} onClick={onClick} aria-label={open ? UI.menu.close : UI.menu.open} aria-expanded={open}>
      <span /><span /><span />
    </button>
  )
}

const list = { show: { transition: { staggerChildren: 0.045, delayChildren: 0.25 } } }
const item = {
  hidden: { opacity: 0, x: 40, filter: 'blur(6px)' },
  show: { opacity: 1, x: 0, filter: 'blur(0px)', transition: { type: 'spring', stiffness: 220, damping: 24 } },
}

export default function Menu({ open, view, go, settings, switchSite, playFilm }) {
  const { SECTIONS, UI } = usePack()
  const M = UI.menu
  const groups = [...new Set(SECTIONS.map((x) => x.group))]
  const [tab, setTab] = useState('nav')
  const { s, update, applyPreset, reset } = settings
  return (
    <AnimatePresence>
      {open && (
        <motion.aside
          className="menu"
          initial={{ clipPath: 'circle(0% at calc(100% - 44px) 40px)' }}
          animate={{ clipPath: 'circle(160% at calc(100% - 44px) 40px)' }}
          exit={{ clipPath: 'circle(0% at calc(100% - 44px) 40px)' }}
          transition={{ duration: 0.75, ease: [0.7, 0, 0.2, 1] }}
        >
          <div className="menu-inner">
            <div className="tabs" role="tablist">
              {[['nav', M.explore], ['look', M.customize]].map(([k, label]) => (
                <button key={k} role="tab" aria-selected={tab === k} className={tab === k ? 'on' : ''} onClick={() => setTab(k)}>
                  {label}
                  {tab === k && <motion.span layoutId="tabline" className="tabline" />}
                </button>
              ))}
            </div>

            <AnimatePresence mode="wait">
              {tab === 'nav' ? (
                <motion.div key="nav" initial="hidden" animate="show" exit={{ opacity: 0, y: 10 }} variants={list} className="menu-nav">
                  <motion.button variants={item} className={`menu-home ${view === 'map' ? 'on' : ''}`} onClick={() => go('map')}>
                    <span>◎</span> {M.map}
                  </motion.button>
                  <motion.button variants={item} className={`menu-home ${view === 'chain' ? 'on' : ''}`} onClick={() => go('chain')}>
                    <span>⟶</span> {PROOF_UI[UI.lang].chain.menu}
                  </motion.button>
                  <motion.button variants={item} className={`menu-home ${view === 'descent' ? 'on' : ''}`} onClick={() => go('descent')}>
                    <span>↓</span> {UI.lang === 'ru' ? 'Спуск сквозь сны' : 'The descent'}
                  </motion.button>
                  <motion.button variants={item} className={`menu-home ${view === 'chaos' ? 'on' : ''}`} onClick={() => go('chaos')}>
                    <span>✳</span> {UI.lang === 'ru' ? 'Хаос · 混沌' : 'Chaos · 混沌'}
                  </motion.button>
                  <motion.button variants={item} className="menu-home" onClick={playFilm}>
                    <span>▸</span> {UI.lang === 'ru' ? 'Вступительный фильм' : 'Opening film'}
                  </motion.button>
                  {groups.map((g) => (
                    <div key={g} className="menu-group">
                      <motion.p variants={item} className="menu-group-name">{g}</motion.p>
                      {SECTIONS.filter((x) => x.group === g).map((x) => (
                        <motion.button key={x.id} variants={item} className={`menu-link ${view === x.id ? 'on' : ''}`} onClick={() => go(x.id)}>
                          <MarkEdge seed={Number(x.num) + 71} spikes={2} />
                          <span className="menu-num">{x.num}</span>
                          <span className="menu-title">{x.title}</span>
                          <span className="menu-short">{x.short}</span>
                        </motion.button>
                      ))}
                    </div>
                  ))}
                  <div className="menu-group">
                    <motion.p variants={item} className="menu-group-name">{INNER_UI[UI.lang].eyebrow}</motion.p>
                    <motion.button variants={item} className={`menu-link ${view === 'inner' ? 'on' : ''}`} onClick={() => go('inner')}>
                      <MarkEdge seed={140} spikes={2} />
                      <span className="menu-num">∞</span>
                      <span className="menu-title">{INNER_UI[UI.lang].title}</span>
                      <span className="menu-short">{CHARACTERS.map((c) => c.name[UI.lang]).join(' · ')}</span>
                    </motion.button>
                    {CHARACTERS.map((c, i) => (
                      <motion.button key={c.id} variants={item} className={`menu-link ${view === `c-${c.id}` ? 'on' : ''}`} onClick={() => go(`c-${c.id}`)}>
                        <MarkEdge seed={141 + i} spikes={2} />
                        <span className="menu-num">{['I', 'II', 'III', 'IV'][i]}</span>
                        <span className="menu-title">{c.name[UI.lang]}</span>
                        <span className="menu-short">{c.title[UI.lang]}</span>
                      </motion.button>
                    ))}
                    <motion.a variants={item} className="menu-link menu-dc" href={DISCORD} target="_blank" rel="noopener noreferrer">
                      <span className="menu-num">↗</span>
                      <span className="menu-title">Discord</span>
                      <span className="menu-short">{UI.lang === 'ru' ? 'Сервер · ВСБ, АЦФ и лор' : 'Server · VSB, ACF and lore'}</span>
                    </motion.a>
                  </div>
                </motion.div>
              ) : (
                <motion.div key="look" initial="hidden" animate="show" exit={{ opacity: 0, y: 10 }} variants={list} className="menu-look">
                  <motion.p variants={item} className="menu-group-name">{M.mode}</motion.p>
                  <motion.div variants={item} className="modes">
                    {SITES.map(([id, name, lang]) => (
                      <button key={id} className={`mode-btn ${s.site === id ? 'on' : ''}`} onClick={() => switchSite(id)} aria-pressed={s.site === id}>
                        <MarkEdge seed={id.length * 7 + 2} spikes={3} />
                        <span className="mode-check" aria-hidden="true" />
                        <b>{name}</b>
                        <small>{lang}</small>
                      </button>
                    ))}
                  </motion.div>

                  <motion.p variants={item} className="menu-group-name">{M.palette}</motion.p>
                  <motion.div variants={item} className="swatches">
                    {Object.entries(PRESETS).map(([id, p]) => (
                      <button key={id} className={`swatch ${s.preset === id ? 'on' : ''}`} onClick={() => applyPreset(id)}>
                        <span className="swatch-dot" style={{ background: `radial-gradient(circle at 35% 30%, #fff, ${p.chrome} 38%, ${p.fog} 75%, #030306), linear-gradient(${p.seam}, ${p.seam})`, boxShadow: `inset 0 -3px 0 ${p.seam}` }} />
                        {p.name}
                      </button>
                    ))}
                  </motion.div>

                  <motion.p variants={item} className="menu-group-name">{M.own}</motion.p>
                  <motion.div variants={item} className="pickers">
                    {['chrome', 'seam', 'fog'].map((k) => [k, M.pickers[k]]).map(([k, label]) => (
                      <label key={k} className="picker">
                        <input type="color" value={s[k] || '#ffc870'} onChange={(e) => update({ [k]: e.target.value, preset: 'custom' })} />
                        <span>{label}</span>
                      </label>
                    ))}
                  </motion.div>
                  <motion.div variants={item} className="seg">
                    <span>{M.panels}</span>
                    {['dark', 'light'].map((m) => (
                      <button key={m} className={s.mode === m ? 'on' : ''} onClick={() => update({ mode: m })}>{M[m]}</button>
                    ))}
                  </motion.div>

                  <motion.p variants={item} className="menu-group-name">{M.comfort}</motion.p>
                  <motion.div variants={item} className="seg">
                    <span>{M.text}</span>
                    {[[0.92, 'S'], [1, 'M'], [1.12, 'L']].map(([v, l]) => (
                      <button key={l} className={s.text === v ? 'on' : ''} onClick={() => update({ text: v })}>{l}</button>
                    ))}
                  </motion.div>
                  <motion.label variants={item} className="toggle">
                    <input type="checkbox" checked={s.motion} onChange={(e) => update({ motion: e.target.checked })} />
                    <span className="knob" /> {M.anim}
                  </motion.label>
                  <motion.label variants={item} className="toggle">
                    <input type="checkbox" checked={s.grain} onChange={(e) => update({ grain: e.target.checked })} />
                    <span className="knob" /> {M.grain}
                  </motion.label>
                  <motion.button variants={item} className="reset" onClick={reset}>{M.reset}</motion.button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </motion.aside>
      )}
    </AnimatePresence>
  )
}
