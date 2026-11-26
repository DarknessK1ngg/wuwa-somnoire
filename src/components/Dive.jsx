import { useEffect, useRef } from 'react'

const GLYPHS = '01ABCDEF0123456789夢境層索諾拉回音頻率心之集域虛質門載體無窮盡記錄'.split('')

// Full-screen "dive into the next layer": tunnel rings from the click point,
// then the layer is decoded as streams of code before the new view shows through.
export default function Dive({ x, y, label, short = false }) {
  const cv = useRef()
  useEffect(() => {
    const c = cv.current
    const ctx = c.getContext('2d')
    const dpr = Math.min(2, devicePixelRatio || 1)
    const W = innerWidth, H = innerHeight
    c.width = W * dpr; c.height = H * dpr
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
    const css = getComputedStyle(document.documentElement)
    const accent = css.getPropertyValue('--accent').trim() || '#7ff2e6'
    const aura = css.getPropertyValue('--aura').trim() || '#ffc870'
    const fs = W < 700 ? 13 : 16
    const cols = Math.ceil(W / fs)
    const drops = Array.from({ length: cols }, () => -Math.random() * H / fs * 1.2)
    const speed = Array.from({ length: cols }, () => 0.5 + Math.random() * 0.9)
    let raf
    const t0 = performance.now()
    const tick = (now) => {
      const t = (now - t0) / 1000
      ctx.fillStyle = 'rgba(2, 1, 7, 0.22)'
      ctx.fillRect(0, 0, W, H)
      ctx.font = `${fs}px "JetBrains Mono", monospace`
      for (let i = 0; i < cols; i++) {
        const yy = drops[i] * fs
        // columns near the dive point start first
        const dist = Math.abs(i * fs - x) / W
        if (t < dist * 0.5) continue
        const ch = GLYPHS[(Math.random() * GLYPHS.length) | 0]
        ctx.fillStyle = Math.random() < 0.08 ? aura : '#ffffff'
        ctx.globalAlpha = 0.95
        ctx.fillText(ch, i * fs, yy)
        ctx.fillStyle = accent
        ctx.globalAlpha = 0.55
        ctx.fillText(GLYPHS[(Math.random() * GLYPHS.length) | 0], i * fs, yy - fs)
        ctx.globalAlpha = 1
        drops[i] += speed[i] * (1.4 + t)
        if (yy > H && Math.random() > 0.95) drops[i] = 0
      }
      raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [x])

  return (
    <div className={`dive ${short ? 'dive-short' : ''}`} style={{ '--x': `${x}px`, '--y': `${y}px` }} aria-hidden="true">
      <div className="dive-tunnel">{[0, 1, 2, 3, 4].map((i) => <span key={i} style={{ animationDelay: `${i * 0.08}s` }} />)}</div>
      <canvas ref={cv} className="dive-code" />
      <div className="dive-label"><span>{label}</span><i /></div>
    </div>
  )
}
