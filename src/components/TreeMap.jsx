import { motion } from 'motion/react'
import { SECTIONS, TREE } from '../content'

const byId = Object.fromEntries(SECTIONS.map((s) => [s.id, s]))
const depth = (id) => (TREE[id].parent ? depth(TREE[id].parent) + 1 : 0)

function curve(a, b) {
  const y0 = a.y + 100, y1 = b.y - 34, m = (y0 + y1) / 2
  return `M${a.x} ${y0}C${a.x} ${m},${b.x} ${m},${b.x} ${y1}`
}

export default function TreeMap({ go }) {
  const ids = Object.keys(TREE)
  const links = ids.filter((id) => TREE[id].parent)
  return (
    <motion.section
      className="map"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0, scale: 0.96, filter: 'blur(10px)' }}
      transition={{ duration: 0.6 }}
    >
      <motion.header
        className="map-head"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5, duration: 0.8 }}
      >
        <p className="eyebrow">Choose a path</p>
        <h2>The Somnoire, branch by branch</h2>
        <p className="map-lead">Start at the verdict, or jump straight to the part you want to check.</p>
      </motion.header>

      <div className="tree">
        <svg viewBox="0 0 1000 800" className="tree-lines" aria-hidden="true">
          <defs>
            <linearGradient id="lineGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0" stopColor="var(--accent)" stopOpacity="0.9" />
              <stop offset="1" stopColor="var(--c2)" stopOpacity="0.5" />
            </linearGradient>
          </defs>
          {links.map((id, i) => {
            const d = curve(TREE[TREE[id].parent], TREE[id])
            return (
              <g key={id}>
                <motion.path
                  d={d}
                  stroke="url(#lineGrad)"
                  strokeWidth="1.6"
                  fill="none"
                  initial={{ pathLength: 0, opacity: 0 }}
                  animate={{ pathLength: 1, opacity: 1 }}
                  transition={{ delay: 0.7 + depth(id) * 0.35 + i * 0.04, duration: 0.9, ease: 'easeInOut' }}
                />
                <path d={d} className="flow" />
              </g>
            )
          })}
        </svg>

        {ids.map((id) => {
          const t = TREE[id]
          const s = byId[id]
          const dl = 0.55 + depth(id) * 0.35
          return (
            <motion.button
              key={id}
              className={`node node-d${depth(id)}`}
              style={{ left: `${t.x / 10}%`, top: `${(t.y / 800) * 100}%` }}
              initial={{ opacity: 0, scale: 0.3, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              transition={{ delay: dl + (t.x % 7) * 0.02, type: 'spring', stiffness: 180, damping: 15 }}
              whileHover={{ scale: 1.08 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => go(id)}
            >
              <span className="orb"><span className="orb-num">{s.num}</span></span>
              <span className="node-title">{s.title}</span>
              <span className="node-short">{s.short}</span>
            </motion.button>
          )
        })}
      </div>

      {/* Narrow screens: the same tree as a vertical path */}
      <ol className="tree-list">
        {SECTIONS.map((s, i) => (
          <motion.li
            key={s.id}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.4 + i * 0.07 }}
            style={{ '--indent': depth(s.id) }}
          >
            <button onClick={() => go(s.id)}>
              <span className="orb"><span className="orb-num">{s.num}</span></span>
              <span>
                <b>{s.title}</b>
                <small>{s.short}</small>
              </span>
            </button>
          </motion.li>
        ))}
      </ol>
    </motion.section>
  )
}
