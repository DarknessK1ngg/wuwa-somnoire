import { useEffect, useRef } from 'react'

// A cursor trail that belongs to the character on screen:
// Hiyuki leaves frost crystals, Denia a drifting void smoke, Aemeath small signal sparks.
function crystal(ctx, r) {
  ctx.beginPath()
  for (let k = 0; k < 6; k++) {
    const a = (k * Math.PI) / 3
    ctx.moveTo(0, 0); ctx.lineTo(Math.cos(a) * r, Math.sin(a) * r)
    const bx = Math.cos(a) * r * 0.55, by = Math.sin(a) * r * 0.55
    ctx.moveTo(bx, by); ctx.lineTo(bx + Math.cos(a + 0.7) * r * 0.3, by + Math.sin(a + 0.7) * r * 0.3)
    ctx.moveTo(bx, by); ctx.lineTo(bx + Math.cos(a - 0.7) * r * 0.3, by + Math.sin(a - 0.7) * r * 0.3)
  }
  ctx.stroke()
}

export default function Trail({ id }) {
  const cv = useRef()
  useEffect(() => {
    if (document.documentElement.dataset.motion === 'off') return
    const c = cv.current, ctx = c.getContext('2d')
    let W, H
    const fit = () => {
      const dpr = Math.min(2, devicePixelRatio || 1)
      W = innerWidth; H = innerHeight
      c.width = W * dpr; c.height = H * dpr
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
    }
    fit()
    addEventListener('resize', fit)
    const ps = []
    let lx = null, ly = null, raf, last = performance.now()
    const onMove = (e) => {
      const x = e.clientX, y = e.clientY
      const d = lx == null ? 0 : Math.hypot(x - lx, y - ly)
      const n = Math.min(4, Math.floor(d / 14) + (Math.random() < 0.3 ? 1 : 0))
      for (let i = 0; i < n; i++) {
        const f = (i + 1) / (n + 1)
        const px = lx == null ? x : lx + (x - lx) * f, py = ly == null ? y : ly + (y - ly) * f
        if (id === 'hiyuki') ps.push({ x: px + (Math.random() - 0.5) * 10, y: py + (Math.random() - 0.5) * 10, vx: (Math.random() - 0.5) * 10, vy: 8 + Math.random() * 16, r: 3 + Math.random() * 6, a: Math.random() * 6, va: (Math.random() - 0.5) * 1.5, life: 1, dec: 0.55 + Math.random() * 0.4 })
        if (id === 'denia') ps.push({ x: px, y: py, vx: (Math.random() - 0.5) * 18, vy: -6 - Math.random() * 14, r: 6 + Math.random() * 10, life: 1, dec: 0.7 + Math.random() * 0.4 })
        if (id === 'aemeath') ps.push({ x: px + (Math.random() - 0.5) * 14, y: py + (Math.random() - 0.5) * 14, vx: (Math.random() - 0.5) * 60, vy: (Math.random() - 0.5) * 60, r: 1.5 + Math.random() * 2.5, hue: Math.random() < 0.5, life: 1, dec: 1.4 + Math.random() })
      }
      lx = x; ly = y
    }
    addEventListener('pointermove', onMove, { passive: true })
    const tick = (now) => {
      const dt = Math.min(0.05, (now - last) / 1000)
      last = now
      ctx.clearRect(0, 0, W, H)
      for (let i = ps.length - 1; i >= 0; i--) {
        const p = ps[i]
        p.life -= dt * p.dec
        if (p.life <= 0) { ps.splice(i, 1); continue }
        p.x += p.vx * dt; p.y += p.vy * dt
        if (id === 'hiyuki') {
          p.a += p.va * dt
          ctx.save(); ctx.translate(p.x, p.y); ctx.rotate(p.a)
          ctx.strokeStyle = `rgba(226, 244, 255, ${0.9 * p.life})`
          ctx.lineWidth = 0.9
          ctx.shadowColor = 'rgba(159, 216, 255, 0.9)'; ctx.shadowBlur = 6
          crystal(ctx, p.r * (0.6 + 0.4 * p.life))
          ctx.restore()
        } else if (id === 'denia') {
          const r = p.r * (2.2 - p.life)
          const g = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, r)
          g.addColorStop(0, `rgba(12, 6, 24, ${0.55 * p.life})`)
          g.addColorStop(0.6, `rgba(120, 80, 200, ${0.12 * p.life})`)
          g.addColorStop(1, 'rgba(120, 80, 200, 0)')
          ctx.fillStyle = g
          ctx.beginPath(); ctx.arc(p.x, p.y, r, 0, Math.PI * 2); ctx.fill()
        } else {
          if (Math.random() < 0.15) { p.x += (Math.random() - 0.5) * 8 }
          ctx.fillStyle = p.hue ? `rgba(127, 242, 230, ${p.life})` : `rgba(255, 179, 217, ${p.life})`
          ctx.fillRect(p.x, p.y, p.r * 2, p.r * 0.6)
        }
      }
      raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    return () => { cancelAnimationFrame(raf); removeEventListener('resize', fit); removeEventListener('pointermove', onMove) }
  }, [id])
  return <canvas ref={cv} className={`trail trail-${id}`} aria-hidden="true" />
}
