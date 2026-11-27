import { useEffect, useRef, useState } from 'react'
import { bus } from '../bus'
import { usePack } from '../lang'

// Shooting stars across the whole site. Click one in flight to catch it: it bursts into sparks
// and the catch is counted (kept in this browser).
const KEY = 'somnoire-stars'

export default function Stars({ on }) {
  const cv = useRef()
  const { UI } = usePack()
  const [count, setCount] = useState(() => { try { return +localStorage.getItem(KEY) || 0 } catch { return 0 } })
  const [toast, setToast] = useState(0)

  useEffect(() => {
    if (!on) return
    const c = cv.current, ctx = c.getContext('2d')
    let W = 0, H = 0, dpr = 1
    const fit = () => {
      dpr = Math.min(2, devicePixelRatio || 1)
      W = innerWidth; H = innerHeight
      c.width = W * dpr; c.height = H * dpr
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
    }
    fit()
    addEventListener('resize', fit)

    let stars = [], sparks = [], next = performance.now() + 2500 + Math.random() * 3000, raf, last = performance.now()
    const spawn = () => {
      const dir = Math.random() < 0.5 ? 1 : -1
      const ang = (0.32 + Math.random() * 0.3) * (dir > 0 ? 1 : -1)
      const sp = 650 + Math.random() * 500
      stars.push({
        x: dir > 0 ? Math.random() * W * 0.6 : W * 0.4 + Math.random() * W * 0.6,
        y: -20 + Math.random() * H * 0.25,
        vx: Math.cos(ang) * sp * dir, vy: Math.abs(Math.sin(ang)) * sp,
        len: 120 + Math.random() * 120, life: 0,
      })
    }
    const seam = () => getComputedStyle(document.documentElement).getPropertyValue('--seam').trim() || '#ffc870'

    const onDown = (e) => {
      for (let i = stars.length - 1; i >= 0; i--) {
        const s = stars[i]
        const v = Math.hypot(s.vx, s.vy), ux = s.vx / v, uy = s.vy / v
        // distance from the click to the star's head and its trail
        const px = e.clientX - s.x, py = e.clientY - s.y
        const along = Math.max(-s.len, Math.min(0, px * ux + py * uy))
        const d = Math.hypot(px - along * ux, py - along * uy)
        if (d < 42) {
          const col = seam()
          for (let k = 0; k < 46; k++) {
            const a = Math.random() * Math.PI * 2, r = 80 + Math.random() * 320
            sparks.push({ x: s.x, y: s.y, vx: Math.cos(a) * r + s.vx * 0.15, vy: Math.sin(a) * r + s.vy * 0.15, life: 1, col: k % 3 ? '#ffffff' : col })
          }
          stars.splice(i, 1)
          bus.sfx('catch')
          setCount((n) => { const m = n + 1; try { localStorage.setItem(KEY, m) } catch {} return m })
          setToast(Date.now())
          return
        }
      }
    }
    addEventListener('pointerdown', onDown)

    const tick = (now) => {
      const dt = Math.min(0.05, (now - last) / 1000)
      last = now
      if (now > next) { spawn(); next = now + 3500 + Math.random() * 6000 }
      ctx.clearRect(0, 0, W, H)
      for (let i = stars.length - 1; i >= 0; i--) {
        const s = stars[i]
        s.x += s.vx * dt; s.y += s.vy * dt; s.life += dt
        const v = Math.hypot(s.vx, s.vy), tx = s.x - (s.vx / v) * s.len, ty = s.y - (s.vy / v) * s.len
        const g = ctx.createLinearGradient(s.x, s.y, tx, ty)
        g.addColorStop(0, 'rgba(255,255,255,0.95)')
        g.addColorStop(0.15, 'rgba(225,232,255,0.45)')
        g.addColorStop(1, 'rgba(225,232,255,0)')
        ctx.strokeStyle = g
        ctx.lineWidth = 1.4
        ctx.lineCap = 'round'
        ctx.beginPath(); ctx.moveTo(tx, ty); ctx.lineTo(s.x, s.y); ctx.stroke()
        ctx.fillStyle = 'rgba(255,255,255,0.9)'
        ctx.beginPath(); ctx.arc(s.x, s.y, 1.6, 0, Math.PI * 2); ctx.fill()
        if (s.x < -300 || s.x > W + 300 || s.y > H + 300) stars.splice(i, 1)
      }
      for (let i = sparks.length - 1; i >= 0; i--) {
        const p = sparks[i]
        p.vx *= 0.96; p.vy = p.vy * 0.96 + 260 * dt
        p.x += p.vx * dt; p.y += p.vy * dt
        p.life -= dt * 1.1
        if (p.life <= 0) { sparks.splice(i, 1); continue }
        ctx.globalAlpha = p.life
        ctx.fillStyle = p.col
        ctx.fillRect(p.x - 1, p.y - 1, 2, 2)
      }
      ctx.globalAlpha = 1
      raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    return () => { cancelAnimationFrame(raf); removeEventListener('resize', fit); removeEventListener('pointerdown', onDown) }
  }, [on])

  useEffect(() => {
    if (!toast) return
    const t = setTimeout(() => setToast(0), 2600)
    return () => clearTimeout(t)
  }, [toast])

  if (!on) return null
  return (
    <>
      <canvas ref={cv} className="stars" aria-hidden="true" />
      <div className={`stars-toast ${toast ? 'on' : ''}`} aria-live="polite">
        ✦ {UI.lang === 'ru' ? 'Поймано звёзд' : 'Stars caught'} · <b>{count}</b>
      </div>
    </>
  )
}
