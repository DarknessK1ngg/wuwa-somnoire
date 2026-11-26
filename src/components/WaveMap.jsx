import { useEffect, useMemo, useRef, useState } from 'react'
import { motion } from 'motion/react'
import { WAVE } from '../content'
import { usePack } from '../lang'
import { profile } from '../mark'
import { bus } from '../bus'
import { INNER_UI } from '../characters'

const SP = 520 // world distance between section spikes
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

export default function WaveMap({ go, dive }) {
  const { SECTIONS, UI } = usePack()
  const IU = INNER_UI[UI.lang]
  const byId = useMemo(() => Object.fromEntries(SECTIONS.map((x) => [x.id, x])), [SECTIONS])
  const wrap = useRef(), cv = useRef(), layer = useRef(), tilt = useRef(), view = useRef(), edgeL = useRef(), edgeR = useRef()
  const els = useRef({})
  const nodes = useMemo(makeNodes, [])
  const st = useRef({ open: 0, force: false, aura: '#ffc870', off: 0, mx: null, my: null, drag: null, target: null, hover: null, touch: false, W: 0, H: 0, k: 1, accent: '#7ff2e6', parts: [] })
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
    const readAccent = () => { const cs = getComputedStyle(document.documentElement); s.accent = cs.getPropertyValue('--accent').trim() || '#7ff2e6'; s.aura = cs.getPropertyValue('--aura').trim() || '#ffc870' }
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

      // Hover boost; aiming at the centre core slowly opens the Mark
      for (const n of nodes) n.boost += ((s.hover === n.id || (n.x === 0 && s.hover === 'rift') ? 1.22 : 1) - n.boost) * Math.min(1, dt * 8)
      const want = s.hover === 'rift' || s.force ? 1 : 0
      s.open += (want - s.open) * Math.min(1, dt * (want ? 1.1 : 2.6))
      const o = s.open * s.open * (3 - 2 * s.open)
      wrap.current.style.setProperty('--open', o.toFixed(3))

      // Draw the Mark
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
      ctx.clearRect(0, 0, W, H)
      const scaled = nodes.map((n) => {
        const g = n.x === 0 ? o : 0
        return { ...n, up: n.up * k * 1.12 * (1 + 0.2 * g), down: n.down * k * 1.12 * (1 + 0.2 * g), w: n.w * Math.max(0.75, k) * 1.12 * (1 + 0.3 * g) }
      })
      const top = [], bot = []
      for (let sx = -4; sx <= W + 4; sx += 2) {
        const wx = sx + s.off - W / 2
        const [u, d] = profile(wx, scaled, t, null, k * 1.45, 2.6 * Math.max(0.7, k))
        top.push(u)
        bot.push(d)
      }
      const mark = new Path2D()
      for (let i = 0; i < top.length; i++) mark.lineTo(-4 + i * 2, base - top[i])
      for (let i = bot.length - 1; i >= 0; i--) mark.lineTo(-4 + i * 2, base + bot[i])
      mark.closePath()
      // wide soft glow, faint chromatic fringe, then the crisp body
      ctx.save()
      ctx.shadowColor = s.accent
      ctx.shadowBlur = 70
      ctx.fillStyle = 'rgba(255,255,255,0.35)'
      ctx.fill(mark)
      ctx.restore()
      ctx.save()
      ctx.globalCompositeOperation = 'lighter'
      ctx.translate(-1.6, 0); ctx.fillStyle = 'rgba(255,70,140,0.32)'; ctx.fill(mark)
      ctx.translate(3.2, 0); ctx.fillStyle = 'rgba(70,220,255,0.32)'; ctx.fill(mark)
      ctx.restore()
      ctx.shadowColor = s.accent
      ctx.shadowBlur = 18
      ctx.fillStyle = 'rgba(255,255,255,0.97)'
      ctx.fill(mark)
      ctx.shadowBlur = 0

      // The opening: aiming at the core splits the whole Mark open from the centre outward.
      // Inside lies a golden hollow with the same waveform repeated inward without end.
      if (o > 0.01) {
        const cx = -s.off + W / 2
        const rad = (60 + W * 0.95) * o
        const n = top.length
        const ti = new Float32Array(n), bi = new Float32Array(n)
        let maxT = 6
        for (let i = 0; i < n; i++) {
          const d = Math.abs(-4 + i * 2 - cx)
          let f = Math.min(1, Math.max(0, (rad - d) / 240))
          f = f * f * (3 - 2 * f)
          ti[i] = Math.max(0, top[i] - 3.2) * f
          bi[i] = Math.max(0, bot[i] - 3.2) * f
          if (ti[i] > maxT) maxT = ti[i]
          if (bi[i] > maxT) maxT = bi[i]
        }
        const hollow = (sc) => {
          const h = new Path2D()
          for (let i = 0; i < n; i++) h.lineTo(-4 + i * 2, base - ti[i] * sc)
          for (let i = n - 1; i >= 0; i--) h.lineTo(-4 + i * 2, base + bi[i] * sc)
          h.closePath()
          return h
        }
        const inner = hollow(1)
        const gr = ctx.createLinearGradient(0, base - maxT, 0, base + maxT)
        gr.addColorStop(0, '#4a2304'); gr.addColorStop(0.28, s.aura); gr.addColorStop(0.5, '#fff0c4'); gr.addColorStop(0.72, s.aura); gr.addColorStop(1, '#4a2304')
        ctx.save()
        ctx.shadowColor = s.aura
        ctx.shadowBlur = 46 * o
        ctx.fillStyle = gr
        ctx.fill(inner)
        ctx.restore()
        ctx.save()
        ctx.clip(inner)
        // the recursion: the hollow contains itself, again and again, drifting inward
        const N = 9
        for (let j = 0; j < N; j++) {
          const ph = (t * 0.28 + j / N) % 1
          const sc = 1 - ph
          ctx.lineWidth = 0.8 + 2.4 * sc
          ctx.strokeStyle = `rgba(90, 44, 2, ${(0.72 * sc * o).toFixed(3)})`
          ctx.stroke(hollow(sc))
        }
        // bright seam along the baseline and a hot core at the centre
        const seam = ctx.createLinearGradient(cx - rad, 0, cx + rad, 0)
        seam.addColorStop(0, 'rgba(255,255,255,0)'); seam.addColorStop(0.5, 'rgba(255,252,236,0.95)'); seam.addColorStop(1, 'rgba(255,255,255,0)')
        ctx.fillStyle = seam
        ctx.fillRect(cx - rad, base - 1.5, rad * 2, 3)
        const core = ctx.createRadialGradient(cx, base, 0, cx, base, 30 + 90 * o)
        core.addColorStop(0, 'rgba(255,250,230,0.9)'); core.addColorStop(1, 'rgba(255,250,230,0)')
        ctx.fillStyle = core
        ctx.fillRect(cx - 140, base - 140, 280, 280)
        ctx.restore()
        ctx.lineWidth = 2
        ctx.strokeStyle = `rgba(20, 12, 4, ${(0.85 * o).toFixed(3)})`
        ctx.stroke(inner)
        // thorns along the rim, like the edge of a Tacet Field
        ctx.fillStyle = `rgba(14, 10, 20, ${(0.92 * o).toFixed(3)})`
        for (let i = 3; i < n - 3; i += 9) {
          const x = -4 + i * 2
          for (const [hgt, dir] of [[ti[i], -1], [bi[i], 1]]) {
            if (hgt < 9) continue
            const y0 = base + dir * hgt
            const len = (4 + 8 * Math.abs(Math.sin(i * 1.7 + dir))) * Math.min(1, hgt / 30)
            const lean = Math.sin(i * 0.9) * 3
            ctx.beginPath()
            ctx.moveTo(x - 3, y0)
            ctx.lineTo(x + lean, y0 + dir * len)
            ctx.lineTo(x + 3, y0)
            ctx.closePath()
            ctx.fill()
          }
        }
        // golden motes escaping through the seam
        if (motionOn()) {
          for (let q = 0; q < 2; q++) {
            if (Math.random() > 0.7 * o) continue
            const sx = cx + (Math.random() - 0.5) * rad * 1.6
            const i = Math.round((sx + 4) / 2)
            if (i < 0 || i >= n || ti[i] < 6) continue
            const up = Math.random() < 0.5
            s.parts.push({ wx: sx + s.off - W / 2, y: up ? -ti[i] * 0.5 : bi[i] * 0.5, vy: (up ? -1 : 1) * (25 + Math.random() * 45), life: 0, max: 1 + Math.random() * 1.6, r: 0.8 + Math.random() * 1.8, gold: true })
          }
        }
      }

      // Remnant motes rising from the Mark
      if (motionOn() && s.parts.length < 140 && Math.random() < 0.6) {
        const sx = Math.random() * W
        const wx = sx + s.off - W / 2
        const [u, d] = profile(wx, scaled, t, null, k * 1.45, 2.6 * Math.max(0.7, k))
        const upSide = Math.random() < 0.6
        s.parts.push({ wx, y: upSide ? -u : d, vy: (upSide ? -1 : 1) * (12 + Math.random() * 30), life: 0, max: 1.5 + Math.random() * 2.5, r: 0.6 + Math.random() * 1.6 })
      }
      s.parts = s.parts.filter((p) => {
        ctx.fillStyle = p.gold ? s.aura : s.accent
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
  const enterRift = (e) => {
    const r = e.currentTarget.parentElement.querySelector('.rift-core').getBoundingClientRect()
    const x = r.left + r.width / 2, y = r.top + r.height / 2
    if (s.open > 0.7) { dive(x, y, 'inner'); return }
    s.force = true
    s.target = 0
    setTimeout(() => dive(x, y, 'inner'), 700)
  }
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
            {nodes.map((n) => {
              const sec = byId[n.id]
              if (WAVE[n.id] === 0) {
                return (
                  <div
                    key={n.id}
                    ref={(el) => { els.current[n.id] = el }}
                    className="wn wn-up wn-core wn-rift"
                    style={{ left: n.x, '--amp': n.up * 1.12 }}
                  >
                    <button
                      className="wn-hit rift-hit"
                      onPointerEnter={() => { s.hover = 'rift' }}
                      onPointerLeave={() => { if (s.hover === 'rift') s.hover = null }}
                      onFocus={() => { s.hover = 'rift'; s.target = 0 }}
                      onBlur={() => { if (s.hover === 'rift') s.hover = null }}
                      onClick={enterRift}
                      aria-label={`${IU.gate}: ${UI.map.coreHint}`}
                    />
                    <span className="wn-ray" />
                    <span className="spike-core rift-core" aria-hidden="true" />
                    <button className="wn-tag wn-tag-btn" onClick={() => go(n.id)} aria-label={`${sec.title}: ${sec.short}`}>
                      <span className="wn-num">{sec.num}</span>
                      <b>{UI.map.core}</b>
                      <small>{UI.map.coreShort}</small>
                      <em className="rift-hint">{UI.map.coreHint}</em>
                    </button>
                  </div>
                )
              }
              return (
                <button
                  key={n.id}
                  ref={(el) => { els.current[n.id] = el }}
                  className={`wn ${n.above ? 'wn-up' : 'wn-down'} ${WAVE[n.id] === 0 ? 'wn-core' : ''}`}
                  style={{ left: n.x, '--amp': (n.above ? n.up : n.down) * 1.12 }}
                  onPointerEnter={() => { s.hover = n.id }}
                  onPointerLeave={() => { if (s.hover === n.id) s.hover = null }}
                  onFocus={() => { s.hover = n.id; s.target = n.x }}
                  onBlur={() => { if (s.hover === n.id) s.hover = null }}
                  onClick={() => go(n.id)}
                  aria-label={`${sec.title}: ${sec.short}`}
                >
                  <span className="wn-hit" />
                  <span className="wn-ray" />
                  <span className="spike-core" aria-hidden="true" />
                  <span className="wn-tag">
                    <span className="wn-num">{sec.num}</span>
                    <b>{WAVE[n.id] === 0 ? UI.map.core : sec.title}</b>
                    <small>{WAVE[n.id] === 0 ? UI.map.coreShort : sec.short}</small>
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
        <p className="eyebrow wave-eyebrow">{UI.map.eyebrow}</p>
        <p className="wave-hint">
          {touch ? UI.map.hintTouch : UI.map.hintMouse}
        </p>
        <div className="mini" aria-label={UI.map.mini}>
          <span className="mini-line" />
          <span className="mini-view" ref={view} />
          {ORDER.map((id) => (
            <button
              key={id}
              className={`mini-dot ${WAVE[id] === 0 ? 'mini-core' : ''}`}
              style={{ left: `${((WAVE[id] * SP - (MIN - 600)) / span) * 100}%` }}
              onClick={() => { s.target = WAVE[id] * SP }}
              title={byId[id].title}
              aria-label={`${UI.map.travel} ${byId[id].title}`}
            />
          ))}
        </div>
      </footer>
    </motion.section>
  )
}
