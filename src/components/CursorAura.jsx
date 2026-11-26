import { useEffect, useRef } from 'react'

// A soft aura that trails the cursor and swells over anything clickable.
// Also feeds --mx/--my to the card under the cursor for a spotlight.
const CARDS = '.quote, .rule, .objection, .vcard, .steps button, .term, .pager button, .menu-link, .flowr-step, .abil li, .mode-btn, .icard'

export default function CursorAura() {
  const ring = useRef(), dot = useRef()
  useEffect(() => {
    if (matchMedia('(pointer: coarse)').matches) return
    let x = innerWidth / 2, y = innerHeight / 2, rx = x, ry = y, big = 0, tb = 0, raf, shown = false
    const move = (e) => {
      x = e.clientX; y = e.clientY
      if (!shown) { shown = true; ring.current.style.opacity = 1; dot.current.style.opacity = 1 }
      const t = e.target instanceof Element ? e.target : null
      tb = t && t.closest('a, button, [role="tab"], input, label') ? 1 : 0
      const card = t && t.closest(CARDS)
      if (card) {
        const r = card.getBoundingClientRect()
        card.style.setProperty('--mx', `${x - r.left}px`)
        card.style.setProperty('--my', `${y - r.top}px`)
      }
    }
    const leave = () => { shown = false; ring.current.style.opacity = 0; dot.current.style.opacity = 0 }
    const tick = () => {
      rx += (x - rx) * 0.18; ry += (y - ry) * 0.18; big += (tb - big) * 0.15
      ring.current.style.transform = `translate3d(${rx}px, ${ry}px, 0) scale(${1 + big * 0.9})`
      dot.current.style.transform = `translate3d(${x}px, ${y}px, 0)`
      raf = requestAnimationFrame(tick)
    }
    addEventListener('pointermove', move, { passive: true })
    document.addEventListener('pointerleave', leave)
    raf = requestAnimationFrame(tick)
    return () => { removeEventListener('pointermove', move); document.removeEventListener('pointerleave', leave); cancelAnimationFrame(raf) }
  }, [])
  return (
    <>
      <div className="cursor-ring" ref={ring} aria-hidden="true" />
      <div className="cursor-dot" ref={dot} aria-hidden="true" />
    </>
  )
}
