import { useMemo, useState } from 'react'
import { motion } from 'motion/react'
import { CHARACTERS, INNER_UI } from '../characters'
import { usePack } from '../lang'
import { profile } from '../mark'
import MarkEdge from './MarkEdge'

const W = 1200, H = 760, MY = 330
// spike under each character: x, which way the branch goes, card centre
const LAYOUT = [
  { x: 360, up: 150, down: 38, card: [150, 200], side: 'l' },
  { x: 600, up: 54, down: 90, card: [600, 580], side: 'b' },
  { x: 840, up: 150, down: 38, card: [1050, 200], side: 'r' },
]
const CW = 270, CHh = 340

function innerMark() {
  const nodes = LAYOUT.map((l) => ({ x: l.x - 600, up: l.up, down: l.down, w: 34 }))
  const env = (x) => Math.exp(-Math.pow(x / 520, 4))
  const top = [], bot = []
  for (let x = -600; x <= 600; x += 3) {
    const [u, d] = profile(x, nodes, 0, env, 0.55, 1.4)
    top.push(`${x + 600},${(MY - u).toFixed(1)}`)
    bot.push(`${x + 600},${(MY + d).toFixed(1)}`)
  }
  return `M${top.join('L')}L${bot.reverse().join('L')}Z`
}

function branch(l) {
  const [cx, cy] = l.card
  if (l.side === 'b') {
    const ty = MY + l.down
    return `M${l.x},${ty} C${l.x},${ty + 20} ${cx},${cy - CHh / 2 - 30} ${cx},${cy - CHh / 2 + 6}`
  }
  const ty = MY - l.up
  const ex = l.side === 'l' ? cx + CW / 2 - 6 : cx - CW / 2 + 6
  const dir = l.side === 'l' ? -1 : 1
  return `M${l.x},${ty} C${l.x},${ty - 90} ${ex - dir * 90},${cy} ${ex},${cy}`
}

export default function InnerLayer({ open, surface }) {
  const { UI } = usePack()
  const lang = UI.lang
  const IU = INNER_UI[lang]
  const mark = useMemo(innerMark, [])
  const [hover, setHover] = useState(null)

  return (
    <motion.section
      className="inner"
      initial={{ opacity: 0, scale: 1.12, filter: 'blur(14px)' }}
      animate={{ opacity: 1, scale: 1, filter: 'blur(0px)' }}
      exit={{ opacity: 0, scale: 0.92, filter: 'blur(12px)' }}
      transition={{ duration: 0.9, ease: [0.2, 0.75, 0.1, 1] }}
    >
      <header className="inner-head">
        <p className="eyebrow">{IU.eyebrow} · ∞</p>
        <h2>{IU.title}</h2>
      </header>

      <div className="inner-stage">
        <svg className="inner-svg" viewBox={`0 0 ${W} ${H}`} aria-hidden="true">
          <defs>
            <filter id="innerglow" x="-20%" y="-50%" width="140%" height="200%">
              <feGaussianBlur stdDeviation="5" result="b" />
              <feMerge><feMergeNode in="b" /><feMergeNode in="SourceGraphic" /></feMerge>
            </filter>
          </defs>
          {LAYOUT.map((l, i) => (
            <g key={i} className={`br ${hover === CHARACTERS[i].id ? 'on' : ''}`} style={{ '--hue': CHARACTERS[i].hue }}>
              <motion.path d={branch(l)} className="br-base" initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ delay: 0.5 + i * 0.15, duration: 1.1 }} />
              <path d={branch(l)} className="br-flow" />
            </g>
          ))}
          <motion.path
            d={mark}
            className="inner-mark"
            filter="url(#innerglow)"
            initial={{ scaleX: 0, opacity: 0 }}
            animate={{ scaleX: 1, opacity: 1 }}
            style={{ transformOrigin: '600px 330px' }}
            transition={{ duration: 1, ease: [0.2, 0.8, 0.1, 1] }}
          />
          {LAYOUT.map((l, i) => (
            <circle key={i} cx={l.x} cy={MY} r={hover === CHARACTERS[i].id ? 9 : 5} className="inner-core" style={{ '--hue': CHARACTERS[i].hue }} />
          ))}
        </svg>

        {CHARACTERS.map((ch, i) => {
          const [cx, cy] = LAYOUT[i].card
          return (
            <motion.button
              key={ch.id}
              className={`icard icard-${LAYOUT[i].side} ${hover === ch.id ? 'on' : ''}`}
              style={{
                '--hue': ch.hue,
                left: `${((cx - CW / 2) / W) * 100}%`,
                top: `${((cy - CHh / 2) / H) * 100}%`,
                width: `${(CW / W) * 100}%`,
                height: `${(CHh / H) * 100}%`,
              }}
              initial={{ opacity: 0, y: 30, scale: 0.9 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{ delay: 0.8 + i * 0.15, type: 'spring', stiffness: 140, damping: 18 }}
              onPointerEnter={() => setHover(ch.id)}
              onPointerLeave={() => setHover((h) => (h === ch.id ? null : h))}
              onFocus={() => setHover(ch.id)}
              onBlur={() => setHover(null)}
              onClick={(e) => open(ch.id, e.clientX || innerWidth / 2, e.clientY || innerHeight / 2)}
            >
              <span className="icard-frame">
                <img src={ch.art[0]} alt={ch.name[lang]} loading="eager" />
                <span className="icard-scan" />
              </span>
              <span className="icard-text">
                <small>{ch.pos[lang]}</small>
                <b>{ch.name[lang]} <span className="cn">{ch.cn}</span></b>
                <em>{ch.title[lang]}</em>
              </span>
              <MarkEdge seed={i + 81} spikes={3} />
            </motion.button>
          )
        })}
      </div>

      <footer className="inner-foot">
        <p className="wave-hint">{IU.hint}</p>
        <button className="surface" onClick={(e) => surface(e.clientX || innerWidth / 2, e.clientY || innerHeight / 2)}>{IU.surface}</button>
      </footer>
    </motion.section>
  )
}
