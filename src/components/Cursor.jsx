import { useEffect, useRef } from 'react'

// A thin ring that follows the pointer with a little lag and changes shape with what it is over:
// buttons and links pull it in like a magnet, quotes get corner brackets, spikes on the map get a crosshair,
// the hero Mark gets a grab hint. Mouse only; touch screens keep their normal behaviour.
export default function Cursor() {
  const ring = useRef(), dot = useRef()
  useEffect(() => {
    if (!matchMedia('(pointer: fine)').matches) return
    document.documentElement.classList.add('has-cursor')
    let x = innerWidth / 2, y = innerHeight / 2, rx = x, ry = y, w = 34, h = 34, tw = 34, th = 34, mode = '', target = null, raf, down = false
    const move = (e) => { x = e.clientX; y = e.clientY; dot.current.style.transform = `translate(${x}px, ${y}px)` }
    const over = (e) => {
      const t = e.target
      const a = t.closest?.('input, textarea')
      const spike = t.closest?.('.wn, .rift-hit, .wn-rift, .icard, .br')
      const link = t.closest?.('a, button, [role="button"], .swatch, label')
      const quote = t.closest?.('.quote, .chain-proof, .sr-row, .descent-cap')
      const hero = t.closest?.('.hero')
      target = null
      if (a) mode = 'text'
      else if (spike) mode = 'aim'
      else if (link) { mode = 'link'; target = link }
      else if (quote) mode = 'quote'
      else if (hero) mode = 'grab'
      else mode = ''
      ring.current.dataset.mode = mode
    }
    const dn = () => { down = true; ring.current.classList.add('down') }
    const up = () => { down = false; ring.current.classList.remove('down') }
    const leave = () => { ring.current.style.opacity = 0; dot.current.style.opacity = 0 }
    const enter = () => { ring.current.style.opacity = ''; dot.current.style.opacity = '' }
    const tick = () => {
      let cx = x, cy = y
      tw = th = mode === 'aim' ? 54 : mode === 'quote' ? 46 : mode === 'grab' ? 58 : 34
      if (mode === 'link' && target) {
        const r = target.getBoundingClientRect()
        if (r.width < 260 && r.height < 90) {
          // magnet: sit around the button, pulled slightly toward the pointer
          cx = r.left + r.width / 2 + (x - (r.left + r.width / 2)) * 0.25
          cy = r.top + r.height / 2 + (y - (r.top + r.height / 2)) * 0.25
          tw = r.width + 16; th = r.height + 12
        } else { tw = th = 48 }
      }
      if (down) { tw *= 0.85; th *= 0.85 }
      rx += (cx - rx) * 0.2; ry += (cy - ry) * 0.2
      w += (tw - w) * 0.2; h += (th - h) * 0.2
      const el = ring.current
      el.style.transform = `translate(${rx - w / 2}px, ${ry - h / 2}px)`
      el.style.width = `${w}px`; el.style.height = `${h}px`
      raf = requestAnimationFrame(tick)
    }
    addEventListener('pointermove', move, { passive: true })
    addEventListener('pointerover', over, { passive: true })
    addEventListener('pointerdown', dn)
    addEventListener('pointerup', up)
    document.addEventListener('mouseleave', leave)
    document.addEventListener('mouseenter', enter)
    raf = requestAnimationFrame(tick)
    return () => {
      document.documentElement.classList.remove('has-cursor')
      cancelAnimationFrame(raf)
      removeEventListener('pointermove', move); removeEventListener('pointerover', over)
      removeEventListener('pointerdown', dn); removeEventListener('pointerup', up)
      document.removeEventListener('mouseleave', leave); document.removeEventListener('mouseenter', enter)
    }
  }, [])
  return (
    <>
      <div ref={ring} className="cur-ring" aria-hidden="true"><i /><i /><i /><i /><b /></div>
      <div ref={dot} className="cur-dot" aria-hidden="true" />
    </>
  )
}
