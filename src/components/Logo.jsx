import { motion } from 'motion/react'

// Original mark: three nested arched doors inside a ring. Each door sits inside the last.
export default function Logo({ size = 40, draw = false }) {
  const p = (d, i) => (
    <motion.path
      key={i}
      d={d}
      fill="none"
      stroke="currentColor"
      strokeWidth={i === 0 ? 2.2 : 1.8}
      strokeLinecap="round"
      strokeLinejoin="round"
      initial={draw ? { pathLength: 0, opacity: 0 } : false}
      animate={draw ? { pathLength: 1, opacity: 1 } : undefined}
      transition={{ duration: 1.4, delay: 0.15 + i * 0.25, ease: [0.65, 0, 0.35, 1] }}
    />
  )
  return (
    <svg width={size} height={size} viewBox="0 0 64 64" className="logo" aria-hidden="true">
      {p('M32 4a28 28 0 1 1 0 56a28 28 0 1 1 0-56', 0)}
      {p('M19 50V27a13 13 0 0 1 26 0v23', 1)}
      {p('M24.5 50V31a7.5 7.5 0 0 1 15 0v19', 2)}
      {p('M29 50V35a3 3 0 0 1 6 0v15', 3)}
      {p('M14 50h36', 4)}
      <motion.circle
        cx="32" cy="16" r="1.8" fill="currentColor"
        initial={draw ? { scale: 0 } : false}
        animate={draw ? { scale: 1 } : undefined}
        transition={{ delay: 1.5, type: 'spring', stiffness: 300, damping: 12 }}
      />
    </svg>
  )
}
