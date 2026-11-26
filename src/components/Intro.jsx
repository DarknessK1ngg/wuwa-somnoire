import { useEffect, useMemo, useRef, useState } from 'react'
import { motion } from 'motion/react'
import { markPath } from '../mark'

const ease = [0.2, 0.75, 0.1, 1]
const BURST = 1.05 // seconds until the Mark bursts open

function Word({ text, start }) {
  return (
    <span className="word">
      {[...text].map((ch, i) => (
        <motion.span
          key={i}
          className="ch"
          initial={{ opacity: 0, y: '0.6em', rotateX: -70, filter: 'blur(14px)' }}
          animate={{ opacity: 1, y: 0, rotateX: 0, filter: 'blur(0px)' }}
          transition={{ delay: start + i * 0.05, duration: 1, ease }}
        >
          {ch}
        </motion.span>
      ))}
    </span>
  )
}

// Animates the screen-warp filter: heavy distortion before the burst, a spike at the burst, then calm.
function useWarp(disp, turb) {
  useEffect(() => {
    let raf
    const t0 = performance.now()
    const tick = (now) => {
      const t = (now - t0) / 1000
      const s = t < BURST
        ? 18 + 30 * (t / BURST) + 14 * Math.sin(t * 40) * Math.random()
        : 90 * Math.exp(-(t - BURST) * 3.2)
      disp.current?.setAttribute('scale', s.toFixed(1))
      turb.current?.setAttribute('baseFrequency', `${(0.002 + 0.004 * Math.random()).toFixed(4)} ${(0.06 + 0.12 * Math.random()).toFixed(3)}`)
      if (t < BURST + 2.2) raf = requestAnimationFrame(tick)
      else disp.current?.setAttribute('scale', '0')
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [])
}

export function Shockwave({ x, y, size = 1, delay = 0 }) {
  const d = delay
  return (
    <div className="shock" style={{ '--x': `${x}px`, '--y': `${y}px` }} aria-hidden="true">
      <motion.span className="sw-flash" initial={{ scale: 0, opacity: 0.95 }} animate={{ scale: 14 * size, opacity: 0 }} transition={{ delay: d, duration: 0.9, ease: [0.2, 0.8, 0.2, 1] }} />
      <motion.span className="sw-lens" initial={{ scale: 0.1, opacity: 1 }} animate={{ scale: 34 * size, opacity: 0 }} transition={{ delay: d, duration: 1.6, ease: [0.12, 0.8, 0.3, 1] }} />
      <div className="sw-tilt">
        {[0, 1, 2].map((i) => (
          <motion.span
            key={i}
            className="sw-disc"
            initial={{ scale: 0.05, opacity: 0.9 }}
            animate={{ scale: (30 + i * 10) * size, opacity: 0 }}
            transition={{ delay: d + i * 0.12, duration: 1.7, ease: [0.12, 0.8, 0.3, 1] }}
          />
        ))}
      </div>
      {[0, 1].map((i) => (
        <motion.span
          key={i}
          className="sw-ring"
          initial={{ scale: 0.1, opacity: 1 }}
          animate={{ scale: (26 + i * 12) * size, opacity: 0 }}
          transition={{ delay: d + 0.05 + i * 0.16, duration: 1.4, ease: [0.16, 0.8, 0.3, 1] }}
        />
      ))}
    </div>
  )
}

export default function Intro({ onExplore }) {
  const path = useMemo(() => markPath(600), [])
  const disp = useRef(), turb = useRef(), markRef = useRef()
  const [leaving, setLeaving] = useState(false)
  const [burstAt, setBurstAt] = useState(null)
  useWarp(disp, turb)

  useEffect(() => {
    const id = setTimeout(() => {
      const r = markRef.current?.getBoundingClientRect()
      if (r) setBurstAt({ x: r.left + r.width / 2, y: r.top + r.height / 2 })
    }, BURST * 1000)
    return () => clearTimeout(id)
  }, [])

  const tot = BURST + 0.7
  return (
    <motion.section
      className="intro"
      exit={{ opacity: 0, scale: 1.08, filter: 'blur(16px)' }}
      transition={{ duration: 0.7, ease }}
    >
      <svg width="0" height="0" style={{ position: 'absolute' }} aria-hidden="true">
        <filter id="warp" x="-10%" y="-10%" width="120%" height="120%">
          <feTurbulence ref={turb} type="fractalNoise" baseFrequency="0.003 0.1" numOctaves="2" seed="7" />
          <feDisplacementMap ref={disp} in="SourceGraphic" scale="30" xChannelSelector="R" yChannelSelector="G" />
        </filter>
        <filter id="markglow" x="-20%" y="-200%" width="140%" height="500%">
          <feGaussianBlur stdDeviation="6" result="b" />
          <feMerge><feMergeNode in="b" /><feMergeNode in="SourceGraphic" /></feMerge>
        </filter>
      </svg>

      {/* Darkness that lifts after the burst */}
      <motion.div className="intro-dark" initial={{ opacity: 1 }} animate={{ opacity: 0 }} transition={{ delay: BURST + 0.5, duration: 1.6, ease: 'easeOut' }} />
      <div className="glitch" aria-hidden="true">
        {[12, 27, 41, 58, 66, 79, 88].map((t, i) => <span key={i} style={{ top: `${t}%`, animationDelay: `${i * 0.07}s` }} />)}
      </div>
      <div className="scan" aria-hidden="true" />

      <div className="intro-warp" style={{ filter: 'url(#warp)' }}>
        <motion.div
          ref={markRef}
          className={`mark ${leaving ? 'mark-leave' : ''}`}
          initial={{ scaleX: 0.002, scaleY: 0, opacity: 0 }}
          animate={{ scaleX: [0.002, 0.002, 1.08, 1], scaleY: [0, 0.6, 1.35, 1], opacity: [0, 1, 1, 1] }}
          transition={{ duration: tot, times: [0, BURST / tot - 0.05, 0.86, 1], ease: 'easeOut' }}
        >
          <svg viewBox="-600 -230 1200 460" className="mark-svg" aria-hidden="true">
            <motion.path d={path} className="mark-r" initial={{ x: -26, opacity: 0.9 }} animate={{ x: [-26, -26, 0], opacity: [0.9, 0.9, 0] }} transition={{ duration: BURST + 1.2, times: [0, 0.6, 1] }} />
            <motion.path d={path} className="mark-c" initial={{ x: 26, opacity: 0.9 }} animate={{ x: [26, 26, 0], opacity: [0.9, 0.9, 0] }} transition={{ duration: BURST + 1.2, times: [0, 0.6, 1] }} />
            <path d={path} className="mark-w" filter="url(#markglow)" />
          </svg>
        </motion.div>

        <h1 className="intro-title" aria-label="Wuthering Waves">
          <Word text="Wuthering" start={BURST + 0.55} />
          <Word text="Waves" start={BURST + 0.95} />
        </h1>
      </div>

      <motion.p
        className="intro-sub"
        initial={{ opacity: 0, letterSpacing: '0.6em' }}
        animate={{ opacity: 1, letterSpacing: '0.26em' }}
        transition={{ delay: BURST + 1.5, duration: 1.3, ease }}
      >
        <span>VS Battles</span> <span className="dot" /> <span>the Somnoire dossier</span>
      </motion.p>

      <motion.div className="intro-tiers" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: BURST + 1.85, duration: 0.9, ease }}>
        <span>High 1-B</span>
        <i />
        <span>Low 1-A</span>
      </motion.div>

      <motion.button
        className="explore"
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: BURST + 2.1, type: 'spring', stiffness: 160, damping: 16 }}
        whileHover={{ scale: 1.06 }}
        whileTap={{ scale: 0.94 }}
        onClick={(e) => {
          if (leaving) return
          setLeaving(true)
          const r = e.currentTarget.getBoundingClientRect()
          onExplore(r.left + r.width / 2, r.top + r.height / 2)
        }}
      >
        <span className="explore-ring" />
        <span className="explore-label">Explore</span>
      </motion.button>

      <motion.p className="intro-foot" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: BURST + 2.8, duration: 1 }}>
        Every line quoted from the game files, in the original Chinese
      </motion.p>

      {burstAt && <Shockwave x={burstAt.x} y={burstAt.y} size={0.8} />}
    </motion.section>
  )
}
