import { motion } from 'motion/react'
import Logo from './Logo'

const ease = [0.2, 0.75, 0.1, 1]

function Word({ text, start }) {
  return (
    <span className="word">
      {[...text].map((ch, i) => (
        <motion.span
          key={i}
          className="ch"
          initial={{ opacity: 0, y: '0.6em', rotateX: -70, filter: 'blur(14px)' }}
          animate={{ opacity: 1, y: 0, rotateX: 0, filter: 'blur(0px)' }}
          transition={{ delay: start + i * 0.055, duration: 1, ease }}
        >
          {ch}
        </motion.span>
      ))}
    </span>
  )
}

export default function Intro({ onExplore }) {
  return (
    <motion.section
      className="intro"
      exit={{ opacity: 0, scale: 1.12, filter: 'blur(18px)' }}
      transition={{ duration: 0.8, ease }}
    >
      <motion.div
        className="intro-logo"
        initial={{ opacity: 0, scale: 0.6 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 1.1, ease }}
      >
        <Logo size={76} draw />
      </motion.div>

      <h1 className="intro-title" aria-label="Wuthering Waves">
        <Word text="Wuthering" start={0.35} />
        <Word text="Waves" start={0.85} />
      </h1>

      <motion.p
        className="intro-sub"
        initial={{ opacity: 0, letterSpacing: '0.6em' }}
        animate={{ opacity: 1, letterSpacing: '0.26em' }}
        transition={{ delay: 1.5, duration: 1.4, ease }}
      >
        <span>VS Battles</span> <span className="dot" /> <span>the Somnoire dossier</span>
      </motion.p>

      <motion.div
        className="intro-tiers"
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 1.9, duration: 0.9, ease }}
      >
        <span>High 1-B</span>
        <i />
        <span>Low 1-A</span>
      </motion.div>

      <motion.button
        className="explore"
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 2.2, type: 'spring', stiffness: 160, damping: 16 }}
        whileHover={{ scale: 1.06 }}
        whileTap={{ scale: 0.94 }}
        onClick={(e) => {
          const r = e.currentTarget.getBoundingClientRect()
          onExplore(r.left + r.width / 2, r.top + r.height / 2)
        }}
      >
        <span className="explore-ring" />
        <span className="explore-label">Explore</span>
      </motion.button>

      <motion.p
        className="intro-foot"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 3, duration: 1 }}
      >
        Every line quoted from the game files, in the original Chinese
      </motion.p>
    </motion.section>
  )
}

export function Ripple({ x, y }) {
  return (
    <div className="ripple" style={{ '--x': `${x}px`, '--y': `${y}px` }} aria-hidden="true">
      {[0, 1, 2, 3, 4].map((i) => (
        <motion.span
          key={i}
          className="ring"
          initial={{ scale: 0, opacity: 0.9 }}
          animate={{ scale: 38 + i * 6, opacity: 0 }}
          transition={{ duration: 1.5, delay: i * 0.11, ease: [0.16, 0.8, 0.3, 1] }}
        />
      ))}
      <motion.span
        className="flash"
        initial={{ scale: 0, opacity: 0.85 }}
        animate={{ scale: 30, opacity: 0 }}
        transition={{ duration: 1.1, ease: [0.3, 0.7, 0.2, 1] }}
      />
    </div>
  )
}
