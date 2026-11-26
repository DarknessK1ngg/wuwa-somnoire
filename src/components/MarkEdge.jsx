import { useMemo } from 'react'
import { edgePath, SPIKE } from '../mark'

// Decoration for cards: aura sweep, HUD corners and a Mark line that spikes on hover.
export default function MarkEdge({ seed = 1, spikes = 3 }) {
  const d = useMemo(() => edgePath(seed, spikes), [seed, spikes])
  return (
    <>
      <span className="mk-sweep" aria-hidden="true" />
      <span className="mk-corners" aria-hidden="true" />
      <svg className="mk-edge" viewBox="0 0 1000 40" preserveAspectRatio="none" aria-hidden="true"><path d={d} /></svg>
    </>
  )
}

export function MarkBadge({ n }) {
  return (
    <span className="mk-badge">
      <svg viewBox="0 0 40 100" aria-hidden="true"><path d={SPIKE} /></svg>
      <b>{n}</b>
    </span>
  )
}

// Long divider under section headers.
export function MarkRule({ seed = 7 }) {
  const d = useMemo(() => edgePath(seed, 6, 19), [seed])
  return (
    <svg className="mk-rule" viewBox="0 0 1000 40" preserveAspectRatio="none" aria-hidden="true"><path d={d} /></svg>
  )
}
