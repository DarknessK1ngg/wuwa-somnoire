import { useState } from 'react'
import { AnimatePresence, motion } from 'motion/react'
import { SECTIONS } from '../content'
import { PRESETS } from '../settings'

const groups = [...new Set(SECTIONS.map((s) => s.group))]

export function Burger({ open, onClick }) {
  return (
    <button className={`burger ${open ? 'is-open' : ''}`} onClick={onClick} aria-label={open ? 'Close menu' : 'Open menu'} aria-expanded={open}>
      <span /><span /><span />
    </button>
  )
}

const list = { show: { transition: { staggerChildren: 0.045, delayChildren: 0.25 } } }
const item = {
  hidden: { opacity: 0, x: 40, filter: 'blur(6px)' },
  show: { opacity: 1, x: 0, filter: 'blur(0px)', transition: { type: 'spring', stiffness: 220, damping: 24 } },
}

export default function Menu({ open, view, go, settings }) {
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
              {[['nav', 'Explore'], ['look', 'Customize']].map(([k, label]) => (
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
                    <span>◎</span> The map
                  </motion.button>
                  {groups.map((g) => (
                    <div key={g} className="menu-group">
                      <motion.p variants={item} className="menu-group-name">{g}</motion.p>
                      {SECTIONS.filter((x) => x.group === g).map((x) => (
                        <motion.button key={x.id} variants={item} className={`menu-link ${view === x.id ? 'on' : ''}`} onClick={() => go(x.id)}>
                          <span className="menu-num">{x.num}</span>
                          <span className="menu-title">{x.title}</span>
                          <span className="menu-short">{x.short}</span>
                        </motion.button>
                      ))}
                    </div>
                  ))}
                </motion.div>
              ) : (
                <motion.div key="look" initial="hidden" animate="show" exit={{ opacity: 0, y: 10 }} variants={list} className="menu-look">
                  <motion.p variants={item} className="menu-group-name">Palette</motion.p>
                  <motion.div variants={item} className="swatches">
                    {Object.entries(PRESETS).map(([id, p]) => (
                      <button key={id} className={`swatch ${s.preset === id ? 'on' : ''}`} onClick={() => applyPreset(id)}>
                        <span className="swatch-dot" style={{ background: `conic-gradient(from 200deg, ${p.c1}, ${p.c2}, ${p.c3}, ${p.c1})` }} />
                        {p.name}
                      </button>
                    ))}
                  </motion.div>

                  <motion.p variants={item} className="menu-group-name">Your own colors</motion.p>
                  <motion.div variants={item} className="pickers">
                    {[['c1', 'Wave'], ['c2', 'Glow'], ['c3', 'Depth'], ['accent', 'Accent']].map(([k, label]) => (
                      <label key={k} className="picker">
                        <input type="color" value={s[k]} onChange={(e) => update({ [k]: e.target.value, preset: 'custom' })} />
                        <span>{label}</span>
                      </label>
                    ))}
                  </motion.div>
                  <motion.div variants={item} className="seg">
                    <span>Panels</span>
                    {['dark', 'light'].map((m) => (
                      <button key={m} className={s.mode === m ? 'on' : ''} onClick={() => update({ mode: m })}>{m}</button>
                    ))}
                  </motion.div>

                  <motion.p variants={item} className="menu-group-name">Comfort</motion.p>
                  <motion.div variants={item} className="seg">
                    <span>Text size</span>
                    {[[0.92, 'S'], [1, 'M'], [1.12, 'L']].map(([v, l]) => (
                      <button key={l} className={s.text === v ? 'on' : ''} onClick={() => update({ text: v })}>{l}</button>
                    ))}
                  </motion.div>
                  <motion.label variants={item} className="toggle">
                    <input type="checkbox" checked={s.motion} onChange={(e) => update({ motion: e.target.checked })} />
                    <span className="knob" /> Animations
                  </motion.label>
                  <motion.label variants={item} className="toggle">
                    <input type="checkbox" checked={s.grain} onChange={(e) => update({ grain: e.target.checked })} />
                    <span className="knob" /> Film grain
                  </motion.label>
                  <motion.button variants={item} className="reset" onClick={reset}>Reset to default</motion.button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </motion.aside>
      )}
    </AnimatePresence>
  )
}
