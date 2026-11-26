import { useEffect, useMemo, useRef, useState } from 'react'
import { motion } from 'motion/react'
import { SECTIONS, WAVE } from '../content'
import { profile } from '../mark'
import { bus } from '../bus'

const SP = 520 // world distance between section spikes
const byId = Object.fromEntries(SECTIONS.map((s) => [s.id, s]))
const ORDER = Object.entries(WAVE).sort((a, b) => a[1] - b[1]).map(([id]) => id)
const MIN = Math.min(...Object.values(WAVE)) * SP
const MAX = Math.max(...Object.values(WAVE)) * SP

function makeNodes() {
  return ORDER.map((id) => {
    const p = WAVE[id]
    const centre = p === 0
    const above = centre || Math.abs(p) % 2 === 1
    return {
      id, x: p * SP, above,
      up: centre ? 215 : above ? 165 : 80,
      down: centre ? 175 : above ? 70 : 160,
      w: centre ? 70 : 52,
      boost: 1,
    }
  })
}

export default function WaveMap({ go }) {
  const wrap = useRef(), cv = useRef(), layer = useRef(), tilt = useRef(), view = useRef(), edgeL = useRef(), edgeR = useRef()
  const els = useRef({})
  const nodes = useMemo(makeNodes, [])
  const st = useRef({ off: 0, mx: null, my: null, drag: null, target: null, hover: null, touch: false, W: 0, H: 0, k: 1, accent: '#7ff2e6', parts: [] })
  const [touch, setTouch] = useState(false)

  useEffect(() => {
    const s = st.current
    const c = cv.current
    const ctx = c.getContext('2d')
    const dpr = Math.min(2, window.devicePixelRatio || 1)
    const resize = () => {
      if (!wrap.current) return
      s.W = wrap.current.clientWidth
      s.H = wrap.current.clientHeight
      s.k = Math.min(1, s.H / 900, s.W / 700)
      c.width = s.W * dpr
      c.height = s.H * dpr
      c.style.width = s.W + 'px'
      c.style.height = s.H + 'px'
      wrap.current.style.setProperty('--k', s.k)
    }
    resize()
    const readAccent = () => { s.accent = getComputedStyle(document.documentElement).getPropertyValue('--accent').trim() || '#7ff2e6' }
    readAccent()
    const ro = new ResizeObserver(resize)
    ro.observe(wrap.current)
    const motionOn = () => document.documentElement.dataset.motion !== 'off'

    let raf, last = performance.now(), frame = 0
    const loop = (now) => {
      if (!layer.current || !wrap.current) return
      const dt = Math.min(0.05, (now - last) / 1000)
      last = now
      const t = motionOn() ? now / 1000 : 0
      frame++
      if (frame % 40 === 0) readAccent()
      const { W, H, k } = s
      const base = H * 0.55

      // Travel: toward the cursor's side, or toward a picked target.
      if (s.target != null) {
        s.off += (s.target - s.off) * Math.min(1, dt * 5)
        if (Math.abs(s.target - s.off) < 1) s.target = null
      } else if (s.mx != null && !s.drag && !s.touch) {
        const dx = s.mx - W / 2
        const dead = W * 0.16
        const a = Math.max(0, Math.abs(dx) - dead) / (W / 2 - dead)
        s.off += Math.sign(dx) * Math.pow(a, 1.6) * 1100 * dt
        edgeL.current.style.opacity = dx < 0 ? a : 0
        edgeR.current.style.opacity = dx > 0 ? a : 0
      }
      s.off = Math.max(MIN - 600, Math.min(MAX + 600, s.off))
      bus.pan = s.off

      // Hover boost
      for (const n of nodes) n.boost += ((s.hover === n.id ? 1.22 : 1) - n.boost) * Math.min(1, dt * 8)

      // Draw the Mark
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
      ctx.clearRect(0, 0, W, H)
      const scaled = nodes.map((n) => ({ ...n, up: n.up * k, down: n.down * k, w: n.w * Math.max(0.75, k) }))
      const top = [], bot = []
      for (let sx = -4; sx <= W + 4; sx += 2) {
        const wx = sx + s.off - W / 2
        const [u, d] = profile(wx, scaled, t, null, k)
        top.push(u)
        bot.push(d)
      }
      ctx.beginPath()
      for (let i = 0; i < top.length; i++) ctx.lineTo(-4 + i * 2, base - top[i])
      for (let i = bot.length - 1; i >= 0; i--) ctx.lineTo(-4 + i * 2, base + bot[i])
      ctx.closePath()
      ctx.shadowColor = s.accent
      ctx.shadowBlur = 26
      ctx.fillStyle = 'rgba(255,255,255,0.96)'
      ctx.fill()
      ctx.shadowBlur = 0

      // Remnant motes rising from the Mark
      if (motionOn() && s.parts.length < 140 && Math.random() < 0.6) {
        const sx = Math.random() * W
        const wx = sx + s.off - W / 2
        const [u, d] = profile(wx, scaled, t, null, k)
        const upSide = Math.random() < 0.6
        s.parts.push({ wx, y: upSide ? -u : d, vy: (upSide ? -1 : 1) * (12 + Math.random() * 30), life: 0, max: 1.5 + Math.random() * 2.5, r: 0.6 + Math.random() * 1.6 })
      }
      ctx.fillStyle = s.accent
      s.parts = s.parts.filter((p) => {
        p.life += dt
        p.y += p.vy * dt
        p.wx += Math.sin(p.life * 3 + p.r * 9) * 6 * dt
        const sx = p.wx - s.off + W / 2
        const a = Math.sin(Math.PI * Math.min(1, p.life / p.max))
        ctx.globalAlpha = a * 0.85
        ctx.beginPath()
        ctx.arc(sx, base + p.y, p.r, 0, Math.PI * 2)
        ctx.fill()
        return p.life < p.max && sx > -40 && sx < W + 40
      })
      ctx.globalAlpha = 1

      // Move the DOM layer with the Mark, reveal labels by proximity
      layer.current.style.transform = `translate3d(${W / 2 - s.off}px, ${base}px, 0)`
      const fx = s.mx != null && !s.touch ? s.mx : W / 2
      for (const n of nodes) {
        const el = els.current[n.id]
        if (!el) continue
        const sx = n.x - s.off + W / 2
        const near = Math.max(0, 1 - Math.abs(sx - fx) / (360 * Math.max(0.6, k)))
        el.style.setProperty('--near', (s.hover === n.id ? 1 : near).toFixed(3))
      }

      // Gentle 3D tilt toward the cursor
      if (s.mx != null && !s.touch && motionOn()) {
        const rx = ((s.my ?? H / 2) / H - 0.5) * -7
        const ry = (s.mx / W - 0.5) * 9
        tilt.current.style.transform = `rotateX(${rx.toFixed(2)}deg) rotateY(${ry.toFixed(2)}deg)`
      }

      // Minimap viewport
      const span = MAX - MIN + 1200
      view.current.style.left = `${(((s.off - W / 2) - (MIN - 600)) / span) * 100}%`
      view.current.style.width = `${(W / span) * 100}%`

      raf = requestAnimationFrame(loop)
    }
    raf = requestAnimationFrame(loop)

    const onKey = (e) => {
      if (e.key !== 'ArrowLeft' && e.key !== 'ArrowRight') return
      const cur = s.target ?? s.off
      const xs = nodes.map((n) => n.x)
      const nxt = e.key === 'ArrowRight' ? xs.find((x) => x > cur + 5) : [...xs].reverse().find((x) => x < cur - 5)
      if (nxt != null) s.target = nxt
    }
    addEventListener('keydown', onKey)
    return () => { cancelAnimationFrame(raf); ro.disconnect(); removeEventListener('keydown', onKey) }
  }, [nodes])

  const s = st.current
  const handlers = {
    onPointerMove: (e) => {
      if (e.pointerType === 'mouse') { s.touch = false; s.mx = e.clientX; s.my = e.clientY }
      if (s.drag) { s.off = s.drag.off - (e.clientX - s.drag.x); s.target = null }
    },
    onPointerDown: (e) => {
      if (e.pointerType !== 'mouse') { s.touch = true; setTouch(true) }
      if (e.pointerType !== 'mouse' || e.button === 1) s.drag = { x: e.clientX, off: s.off }
    },
    onPointerUp: () => { s.drag = null },
    onPointerCancel: () => { s.drag = null },
    onPointerLeave: (e) => { if (e.pointerType === 'mouse') s.mx = null; edgeL.current.style.opacity = 0; edgeR.current.style.opacity = 0 },
    onWheel: (e) => { s.target = null; s.off += (Math.abs(e.deltaX) > Math.abs(e.deltaY) ? e.deltaX : e.deltaY) * 0.9 },
  }

  const span = MAX - MIN + 1200
  return (
    <motion.section
      className="wave"
      ref={wrap}
      {...handlers}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0, scale: 0.97, filter: 'blur(10px)' }}
      transition={{ duration: 0.7 }}
    >

      <div className="wave-stage">
        <div className="wave-tilt" ref={tilt}>
          <motion.canvas ref={cv} className="wave-cv" initial={{ scaleX: 0.02, opacity: 0 }} animate={{ scaleX: 1, opacity: 1 }} transition={{ duration: 1.1, ease: [0.2, 0.8, 0.1, 1] }} />
          <div className="wave-layer" ref={layer}>
            {nodes.map((n, i) => {
              const sec = byId[n.id]
              return (
                <button
                  key={n.id}
                  ref={(el) => { els.current[n.id] = el }}
                  className={`wn ${n.above ? 'wn-up' : 'wn-down'} ${WAVE[n.id] === 0 ? 'wn-core' : ''}`}
                  style={{ left: n.x, '--amp': n.above ? n.up : n.down }}
                  onPointerEnter={() => { s.hover = n.id }}
                  onPointerLeave={() => { if (s.hover === n.id) s.hover = null }}
                  onFocus={() => { s.hover = n.id; s.target = n.x }}
                  onBlur={() => { if (s.hover === n.id) s.hover = null }}
                  onClick={() => go(n.id)}
                  aria-label={`${sec.title}: ${sec.short}`}
                >
                  <span className="wn-hit" />
                  <span className="wn-ray" />
                  <span className="wn-tag">
                    <span className="wn-num">{sec.num}</span>
                    <b>{WAVE[n.id] === 0 ? 'The Core' : sec.title}</b>
                    <small>{WAVE[n.id] === 0 ? 'Verdict: where it all lands' : sec.short}</small>
                  </span>
                </button>
              )
            })}
          </div>
        </div>
        <div className="edge edge-l" ref={edgeL}>‹</div>
        <div className="edge edge-r" ref={edgeR}>›</div>
      </div>

      <footer className="wave-foot">
        <p className="eyebrow wave-eyebrow">Follow the Mark · every spike opens a door</p>
        <p className="wave-hint">
          {touch ? 'Drag to travel along the Mark · tap a spike to enter' : 'Move toward an edge to travel · hover a spike · click to enter'}
        </p>
        <div className="mini" aria-label="Sections along the Mark">
          <span className="mini-line" />
          <span className="mini-view" ref={view} />
          {ORDER.map((id) => (
            <button
              key={id}
              className={`mini-dot ${WAVE[id] === 0 ? 'mini-core' : ''}`}
              style={{ left: `${((WAVE[id] * SP - (MIN - 600)) / span) * 100}%` }}
              onClick={() => { s.target = WAVE[id] * SP }}
              title={byId[id].title}
              aria-label={`Travel to ${byId[id].title}`}
            />
          ))}
        </div>
      </footer>
    </motion.section>
  )
}
