// Procedural scenery: a shattered pale planet, Tacetite spires, floating shards and
// gold-lit cracks. Everything is drawn from code, so it is original art and
// tiles seamlessly on the x axis for endless panning.

export const TW = 2048
export const TH = 1024

function rng(seed) {
  let a = seed >>> 0
  return () => {
    a |= 0; a = (a + 0x6d2b79f5) | 0
    let t = Math.imul(a ^ (a >>> 15), 1 | a)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

function canvas() {
  const c = document.createElement('canvas')
  c.width = TW; c.height = TH
  return [c, c.getContext('2d')]
}

// Draw something at x, and again one tile left/right if it crosses the seam.
function wrap(x, margin, fn) {
  fn(x)
  if (x - margin < 0) fn(x + TW)
  if (x + margin > TW) fn(x - TW)
}

function crackPath(ctx, r, x, y, len, dir, segs) {
  ctx.beginPath()
  ctx.moveTo(x, y)
  let a = dir
  for (let i = 0; i < segs; i++) {
    a += (r() - 0.5) * 0.75
    if (i % 2) a += (r() - 0.5) * 0.9 // sharp kink
    x += Math.cos(a) * len / segs
    y += Math.sin(a) * len / segs
    ctx.lineTo(x, y)
  }
}

// Glowing crack: thin bright core on the body, soft halo on the glow map.
function crack(body, glow, r, x, y, len, dir, segs, w = 1.4) {
  const seed = Math.floor(r() * 1e9)
  const draw = (ctx, lw, blur, alpha) => {
    const rr = rng(seed)
    crackPath(ctx, rr, x, y, len, dir, segs)
    ctx.lineWidth = lw
    ctx.shadowBlur = blur
    ctx.shadowColor = 'rgba(255,255,255,1)'
    ctx.strokeStyle = `rgba(255,255,255,${alpha})`
    ctx.lineJoin = 'round'
    ctx.lineCap = 'round'
    ctx.stroke()
    ctx.shadowBlur = 0
  }
  if (body) draw(body, w * 0.7, 0, 0.0) // body stays dark; light comes from glow
  draw(glow, w * 1.6, 28, 0.32)
  draw(glow, w * 0.9, 10, 0.8)
  draw(glow, w * 0.45, 2, 1)
}

// ---------- Sky: pale planet with rings, halo and faint orbit lines ----------
function sky() {
  const [c, ctx] = canvas()
  const [g, gx] = canvas()
  const r = rng(11)
  // haze
  for (let i = 0; i < 26; i++) {
    const x = r() * TW, y = r() * TH * 0.7, rad = 120 + r() * 380
    wrap(x, rad, (xx) => {
      const gr = ctx.createRadialGradient(xx, y, 0, xx, y, rad)
      gr.addColorStop(0, `rgba(200,195,230,${0.03 + r() * 0.05})`)
      gr.addColorStop(1, 'rgba(200,195,230,0)')
      ctx.fillStyle = gr
      ctx.fillRect(xx - rad, y - rad, rad * 2, rad * 2)
    })
  }
  const cx = TW * 0.66, cy = TH * 0.26, R = 175
  // orbit lines
  ctx.strokeStyle = 'rgba(235,230,255,0.07)'
  ctx.lineWidth = 1.2
  for (let i = 0; i < 5; i++) { ctx.beginPath(); ctx.arc(cx, cy, R * (1.9 + i * 0.75), 0, Math.PI * 2); ctx.stroke() }
  // halo
  const halo = ctx.createRadialGradient(cx, cy, R * 0.8, cx, cy, R * 3)
  halo.addColorStop(0, 'rgba(235,232,255,0.35)')
  halo.addColorStop(0.35, 'rgba(210,205,245,0.10)')
  halo.addColorStop(1, 'rgba(210,205,245,0)')
  ctx.fillStyle = halo
  ctx.fillRect(cx - R * 3, cy - R * 3, R * 6, R * 6)
  const ring = (front) => {
    ctx.save(); ctx.translate(cx, cy); ctx.rotate(-0.28)
    for (const [k, a, lw] of [[2.15, 0.34, 3], [2.4, 0.16, 1.5], [1.75, 0.2, 1]]) {
      ctx.beginPath()
      ctx.ellipse(0, 0, R * k, R * k * 0.2, 0, front ? 0 : Math.PI, front ? Math.PI : Math.PI * 2)
      ctx.strokeStyle = `rgba(240,236,255,${a})`
      ctx.lineWidth = lw
      ctx.stroke()
    }
    ctx.restore()
  }
  ring(false)
  // planet body
  ctx.save()
  ctx.beginPath(); ctx.arc(cx, cy, R, 0, Math.PI * 2); ctx.clip()
  const body = ctx.createRadialGradient(cx - R * 0.4, cy - R * 0.45, R * 0.1, cx, cy, R * 1.05)
  body.addColorStop(0, '#e9e7f0'); body.addColorStop(0.6, '#9d97b0'); body.addColorStop(1, '#3a3550')
  ctx.fillStyle = body
  ctx.fillRect(cx - R, cy - R, R * 2, R * 2)
  for (let i = 0; i < 14; i++) {
    const a = r() * Math.PI * 2, d = Math.sqrt(r()) * R * 0.8, br = 30 + r() * 70
    const x = cx + Math.cos(a) * d, y = cy + Math.sin(a) * d
    const m = ctx.createRadialGradient(x, y, 0, x, y, br)
    m.addColorStop(0, `rgba(70,62,96,${0.08 + r() * 0.12})`); m.addColorStop(1, 'rgba(70,62,96,0)')
    ctx.fillStyle = m; ctx.fillRect(x - br, y - br, br * 2, br * 2)
  }
  for (let i = 0; i < 70; i++) {
    const a = r() * Math.PI * 2, d = Math.sqrt(r()) * R, cr = 1.5 + Math.pow(r(), 2) * 12
    const x = cx + Math.cos(a) * d, y = cy + Math.sin(a) * d
    ctx.fillStyle = `rgba(40,34,62,${0.04 + r() * 0.08})`
    ctx.beginPath(); ctx.arc(x, y, cr, 0, Math.PI * 2); ctx.fill()
    ctx.fillStyle = 'rgba(255,255,255,0.04)'
    ctx.beginPath(); ctx.arc(x - cr * 0.25, y - cr * 0.25, cr * 0.6, 0, Math.PI * 2); ctx.fill()
  }
  const term = ctx.createLinearGradient(cx + R * 0.6, cy - R * 0.7, cx - R * 0.8, cy + R * 0.9)
  term.addColorStop(0, 'rgba(8,6,18,0)'); term.addColorStop(0.55, 'rgba(8,6,18,0.25)'); term.addColorStop(1, 'rgba(8,6,18,0.85)')
  ctx.fillStyle = term
  ctx.fillRect(cx - R, cy - R, R * 2, R * 2)
  ctx.restore()
  // a fault line of light across the planet
  for (let i = 0; i < 4; i++) crack(null, gx, r, cx - R * 0.5 + r() * R, cy - R * 0.6 + r() * R * 1.2, 60 + r() * 90, r() * Math.PI * 2, 7, 1.2)
  ring(true)
  // stars
  for (let i = 0; i < 260; i++) {
    ctx.fillStyle = `rgba(255,255,255,${0.15 + r() * 0.55})`
    ctx.fillRect(r() * TW, r() * TH * 0.62, 1 + (r() > 0.93), 1 + (r() > 0.93))
  }
  return [c, g]
}

// Tacetite spire silhouette polygon (base at y0, pointing up).
function spire(ctx, r, x, y0, h, w, lean) {
  const steps = 5 + Math.floor(r() * 5)
  const L = [], Rr = []
  for (let i = 0; i <= steps; i++) {
    const t = i / steps
    const yy = y0 - h * t
    const half = (w / 2) * Math.pow(1 - t, 0.85)
    const jag = (r() - 0.5) * w * 0.25 * (1 - t)
    L.push([x + lean * h * t - half + jag, yy + (r() - 0.5) * 10])
    Rr.push([x + lean * h * t + half + jag * 0.5, yy + (r() - 0.5) * 10])
  }
  const tip = [x + lean * h, y0 - h - 18 - r() * 30]
  ctx.beginPath()
  ctx.moveTo(L[0][0], y0 + 4)
  L.forEach(([a, b]) => ctx.lineTo(a, b))
  ctx.lineTo(tip[0], tip[1])
  Rr.slice().reverse().forEach(([a, b]) => ctx.lineTo(a, b))
  ctx.lineTo(Rr[0][0], y0 + 4)
  ctx.closePath()
  return { L, Rr, tip }
}


// A Tacet Field: a tall glowing rift in the ground, rimmed with dark thorns.
function tacetField(ctx, gx, r, x, y0, h, w) {
  const lensPath = (c, sc) => {
    c.beginPath()
    c.moveTo(x, y0 - h * sc)
    c.quadraticCurveTo(x + w * 2 * sc, y0 - h * 0.45 * sc, x + w * 0.25, y0)
    c.lineTo(x - w * 0.25, y0)
    c.quadraticCurveTo(x - w * 2 * sc, y0 - h * 0.45 * sc, x, y0 - h * sc)
    c.closePath()
  }
  // dark thorny shell
  ctx.fillStyle = '#0b0910'
  for (let i = 0; i < 26; i++) {
    const t = i / 25
    const yy = y0 - h * 1.06 * t
    const half = w * 1.25 * Math.sin(Math.PI * Math.min(1, t * 1.05)) + 3
    for (const side of [-1, 1]) {
      const len = (10 + r() * 28) * (1 - t * 0.45)
      ctx.beginPath()
      ctx.moveTo(x + side * half * 0.6, yy + 5)
      ctx.lineTo(x + side * (half + len), yy - 4 - r() * 8)
      ctx.lineTo(x + side * half * 0.6, yy - 5)
      ctx.closePath()
      ctx.fill()
    }
  }
  ctx.beginPath()
  ctx.ellipse(x, y0 - h * 0.5, w * 1.35, h * 0.56, 0, 0, Math.PI * 2)
  ctx.fill()
  // golden interior, with grain lines
  const g = ctx.createLinearGradient(x - w, 0, x + w, 0)
  g.addColorStop(0, '#7a4208'); g.addColorStop(0.3, '#f2b04a'); g.addColorStop(0.5, '#ffe9b0'); g.addColorStop(0.7, '#f2b04a'); g.addColorStop(1, '#7a4208')
  lensPath(ctx, 1); ctx.fillStyle = g; ctx.fill()
  ctx.strokeStyle = 'rgba(110, 58, 6, 0.55)'
  for (let i = 1; i < 6; i++) { ctx.lineWidth = 1.2; lensPath(ctx, 1 - i * 0.15); ctx.stroke() }
  // glow
  gx.save()
  gx.shadowColor = 'rgba(255,255,255,1)'
  gx.shadowBlur = 40
  lensPath(gx, 0.85); gx.fillStyle = 'rgba(255,255,255,0.32)'; gx.fill()
  gx.shadowBlur = 90
  gx.fillStyle = 'rgba(255,255,255,0.14)'; gx.fill()
  gx.restore()
}

// A dead, twisted tree.
function deadTree(ctx, r, x, y, len, ang, wid, depth) {
  if (depth === 0 || len < 4) return
  const x2 = x + Math.cos(ang) * len, y2 = y + Math.sin(ang) * len
  ctx.lineWidth = wid
  ctx.lineCap = 'round'
  ctx.beginPath()
  ctx.moveTo(x, y)
  ctx.quadraticCurveTo(x + Math.cos(ang + 0.4) * len * 0.5, y + Math.sin(ang + 0.4) * len * 0.5, x2, y2)
  ctx.stroke()
  const k = 2 + (r() > 0.6 ? 1 : 0)
  for (let i = 0; i < k; i++) deadTree(ctx, r, x2, y2, len * (0.55 + r() * 0.25), ang + (r() - 0.5) * 1.4, wid * 0.62, depth - 1)
}

// Pale weathered boulders.
function boulder(ctx, r, x, y, s) {
  const k = 7
  const pts = []
  for (let i = 0; i < k; i++) {
    const a = Math.PI + (i / (k - 1)) * Math.PI
    pts.push([x + Math.cos(a) * s * (0.8 + r() * 0.4), y + Math.sin(a) * s * (0.55 + r() * 0.35)])
  }
  const g = ctx.createLinearGradient(x, y - s, x, y)
  g.addColorStop(0, '#c9cbd6'); g.addColorStop(1, '#5d6070')
  ctx.fillStyle = g
  ctx.beginPath(); pts.forEach(([a, b], i) => (i ? ctx.lineTo(a, b) : ctx.moveTo(a, b))); ctx.closePath(); ctx.fill()
  ctx.strokeStyle = 'rgba(30,30,40,0.5)'; ctx.lineWidth = 1; ctx.stroke()
}

// ---------- Far ridge: rows of hazy spires ----------
function far() {
  const [c, ctx] = canvas()
  const [g, gx] = canvas()
  const r = rng(23)
  const base = TH * 0.8
  for (let i = 0; i < 90; i++) {
    const x = r() * TW, h = 40 + Math.pow(r(), 2.2) * 340, w = 14 + r() * 50, lean = (r() - 0.5) * 0.35
    wrap(x, w + h * 0.3, (xx) => {
      const rr = rng(i * 77 + 5)
      const gr = ctx.createLinearGradient(0, base - h, 0, base)
      gr.addColorStop(0, '#2a2638'); gr.addColorStop(1, '#0e0c15')
      ctx.fillStyle = gr
      spire(ctx, rr, xx, base, h, w, lean)
      ctx.fill()
    })
    if (r() > 0.8) wrap(x, 80, (xx) => crack(null, gx, rng(i), xx, base - 4, h * 0.6, -Math.PI / 2, 6, 1))
  }
  ctx.fillStyle = '#0e0c15'
  ctx.fillRect(0, base, TW, TH - base)
  for (const fx of [0.18, 0.63]) {
    const seed = Math.floor(fx * 1e6)
    wrap(fx * TW, 120, (xx) => tacetField(ctx, gx, rng(seed), xx, base + 2, 120 + fx * 60, 16 + fx * 8))
  }
  const fog = ctx.createLinearGradient(0, base - 160, 0, TH)
  fog.addColorStop(0, 'rgba(150,145,170,0)'); fog.addColorStop(0.45, 'rgba(150,145,170,0.16)'); fog.addColorStop(1, 'rgba(70,66,90,0.4)')
  ctx.globalCompositeOperation = 'source-atop'
  ctx.fillStyle = fog
  ctx.fillRect(0, 0, TW, TH)
  ctx.globalCompositeOperation = 'source-over'
  return [c, g]
}

// ---------- Mid: floating Tacetite shards with gold cracks ----------
function shard(ctx, gx, r, x, y, s) {
  const k = 7 + Math.floor(r() * 4)
  const pts = []
  for (let i = 0; i < k; i++) {
    const a = (i / k) * Math.PI * 2 + (r() - 0.5) * 0.5
    let rad = s * (0.6 + r() * 0.5)
    let yy = Math.sin(a) * rad
    if (yy > 0) yy *= 1.5 + r() * 0.8 // pointed underside
    pts.push([x + Math.cos(a) * rad, y + yy * 0.8])
  }
  const gr = ctx.createLinearGradient(x, y - s, x, y + s * 1.4)
  gr.addColorStop(0, '#2c2838'); gr.addColorStop(0.35, '#0b0a12'); gr.addColorStop(1, '#050409')
  ctx.fillStyle = gr
  ctx.beginPath(); pts.forEach(([a, b], i) => (i ? ctx.lineTo(a, b) : ctx.moveTo(a, b))); ctx.closePath(); ctx.fill()
  ctx.strokeStyle = 'rgba(210,205,240,0.16)'; ctx.lineWidth = 1.2; ctx.stroke()
  // lit top facet
  ctx.fillStyle = 'rgba(220,215,245,0.06)'
  ctx.beginPath(); ctx.moveTo(pts[0][0], pts[0][1]); for (let i = 1; i < Math.ceil(k / 2) + 1; i++) ctx.lineTo(pts[k - i][0], pts[k - i][1]); ctx.lineTo(x, y); ctx.closePath(); ctx.fill()
  const n = 1 + Math.floor(r() * 2)
  for (let i = 0; i < n; i++) crack(null, gx, r, x + (r() - 0.5) * s * 0.6, y + (r() - 0.3) * s * 0.5, s * (0.6 + r()), r() * Math.PI * 2, 6, 1.3)
  // debris
  for (let i = 0; i < 6; i++) {
    const dx = x + (r() - 0.5) * s * 3, dy = y + (r() - 0.5) * s * 2.2, ds = 2 + r() * 6
    ctx.fillStyle = '#0a0911'
    ctx.beginPath(); ctx.moveTo(dx, dy - ds); ctx.lineTo(dx + ds * 0.8, dy); ctx.lineTo(dx, dy + ds * 1.3); ctx.lineTo(dx - ds * 0.7, dy); ctx.closePath(); ctx.fill()
  }
}
function mid() {
  const [c, ctx] = canvas()
  const [g, gx] = canvas()
  const r = rng(37)
  const spots = [0.06, 0.19, 0.3, 0.45, 0.57, 0.71, 0.84, 0.95]
  spots.forEach((fx, i) => {
    const x = fx * TW + (r() - 0.5) * 80, y = TH * (0.16 + r() * 0.36), s = 28 + Math.pow(r(), 1.5) * 110
    const seed = Math.floor(r() * 1e9)
    wrap(x, s * 3, (xx) => shard(ctx, gx, rng(seed), xx, y, s))
  })
  return [c, g]
}

// ---------- Near: tall black spires, veins of light, a glowing ground fault ----------
function near() {
  const [c, ctx] = canvas()
  const [g, gx] = canvas()
  const r = rng(51)
  const base = TH * 0.93
  const xs = []
  for (let i = 0; i < 16; i++) xs.push((i / 16) * TW + (r() - 0.5) * 90)
  xs.forEach((x, i) => {
    const big = r() > 0.55
    const h = big ? 330 + r() * 330 : 120 + r() * 200
    const w = big ? 80 + r() * 90 : 40 + r() * 60
    const lean = (r() - 0.5) * 0.3
    const seed = Math.floor(r() * 1e9)
    wrap(x, w + h * 0.2, (xx) => {
      const rr = rng(seed)
      const gr = ctx.createLinearGradient(xx - w, 0, xx + w, 0)
      gr.addColorStop(0, '#0d0b14'); gr.addColorStop(0.5, '#050408'); gr.addColorStop(1, '#020203')
      ctx.fillStyle = gr
      const sp = spire(ctx, rr, xx, base, h, w, lean)
      ctx.fill()
      // rim light on the left edge
      ctx.strokeStyle = 'rgba(215,210,245,0.14)'
      ctx.lineWidth = 1.5
      ctx.beginPath(); sp.L.forEach(([a, b], j) => (j ? ctx.lineTo(a, b) : ctx.moveTo(a, b))); ctx.lineTo(sp.tip[0], sp.tip[1]); ctx.stroke()
      // facet
      ctx.fillStyle = 'rgba(200,195,235,0.04)'
      ctx.beginPath(); ctx.moveTo(sp.L[0][0], base); sp.L.forEach(([a, b]) => ctx.lineTo(a, b)); ctx.lineTo(sp.tip[0], sp.tip[1]); ctx.lineTo(xx + lean * h * 0.4, base); ctx.closePath(); ctx.fill()
      if (big) crack(null, gx, rng(seed + 1), xx + (rr() - 0.5) * w * 0.3, base - 6, h * (0.45 + rr() * 0.4), -Math.PI / 2 + lean, 9, 1.6)
    })
  })
  // ground
  const gg = ctx.createLinearGradient(0, base - 20, 0, TH)
  gg.addColorStop(0, '#07060c'); gg.addColorStop(1, '#010102')
  ctx.fillStyle = gg
  ctx.fillRect(0, base - 2, TW, TH - base + 2)
  // dead trees and pale boulders on the plain
  ctx.strokeStyle = '#08070c'
  for (const fx of [0.09, 0.34, 0.52, 0.8]) {
    const seed = Math.floor(fx * 1e6) + 7
    wrap(fx * TW, 260, (xx) => deadTree(ctx, rng(seed), xx, base, 70 + fx * 40, -Math.PI / 2 + (fx - 0.5) * 0.5, 9, 6))
  }
  for (let i = 0; i < 18; i++) {
    const x = r() * TW, sz = 12 + r() * 34, seed = Math.floor(r() * 1e9), by = base + 4 + r() * 4
    wrap(x, sz * 2, (xx) => boulder(ctx, rng(seed), xx, by, sz))
  }
  // one near Tacet Field
  wrap(TW * 0.72, 200, (xx) => tacetField(ctx, gx, rng(99), xx, base + 4, 240, 30))
  // ground faults of light
  for (let i = 0; i < 7; i++) {
    const x = r() * TW, len = 80 + r() * 200
    const seed = Math.floor(r() * 1e9)
    const y = base + 8 + r() * 40, dir = (r() > 0.5 ? 0 : Math.PI) + (r() - 0.5) * 0.3
    wrap(x, len, (xx) => crack(null, gx, rng(seed), xx, y, len, dir, 8, 1.8))
  }
  return [c, g]
}

export function buildScenery() {
  return { sky: sky(), far: far(), mid: mid(), near: near() }
}
