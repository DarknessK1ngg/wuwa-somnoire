// Procedural scenery: a pale planet, Tacetite spires, floating shards, Tacet Fields
// and gold-lit cracks. Everything is drawn from code, so it is original art and
// tiles seamlessly on the x axis for endless panning.
// Each layer returns [body, glow, rift]: rift is a depth mask for the Tacet Field
// interiors, which the shader turns into living light.

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

function canvas(w = TW, h = TH) {
  const c = document.createElement('canvas')
  c.width = w; c.height = h
  return [c, c.getContext('2d')]
}

// Draw something at x, and again one tile left/right if it crosses the seam.
function wrap(x, margin, fn) {
  fn(x)
  if (x - margin < 0) fn(x + TW)
  if (x + margin > TW) fn(x - TW)
}

// ---------- Surface texture: soft blotches and fine grit ----------
let NOISE = null
function noise() {
  if (NOISE) return NOISE
  const r = rng(5)
  // coarse blotches: tiny canvas scaled up smoothly (wraps on x by repeating the first column)
  const cw = 65, ch = 32
  const [s, sx] = canvas(cw, ch)
  const img = sx.createImageData(cw, ch)
  for (let y = 0; y < ch; y++) {
    for (let x = 0; x < cw; x++) {
      const v = x === cw - 1 ? img.data[(y * cw) * 4 + 3] : Math.floor(r() * 255)
      const i = (y * cw + x) * 4
      img.data[i] = img.data[i + 1] = img.data[i + 2] = 0
      img.data[i + 3] = v
    }
  }
  sx.putImageData(img, 0, 0)
  const [coarse, cx] = canvas()
  cx.imageSmoothingEnabled = true
  cx.imageSmoothingQuality = 'high'
  cx.drawImage(s, 0, 0, cw - 1, ch, 0, 0, TW, TH)
  // fine grit: a tileable pattern
  const [f, fx] = canvas(256, 256)
  const fi = fx.createImageData(256, 256)
  for (let i = 0; i < 256 * 256; i++) {
    const light = r() > 0.5
    fi.data[i * 4] = fi.data[i * 4 + 1] = fi.data[i * 4 + 2] = light ? 255 : 0
    fi.data[i * 4 + 3] = Math.floor(r() * (light ? 36 : 60))
  }
  fx.putImageData(fi, 0, 0)
  NOISE = { coarse, fine: f }
  return NOISE
}

// Rock texture over everything already drawn on ctx (keeps the alpha it has).
function texture(ctx, coarse = 0.55, fine = 1) {
  const n = noise()
  ctx.save()
  ctx.globalCompositeOperation = 'source-atop'
  ctx.globalAlpha = coarse
  ctx.drawImage(n.coarse, 0, 0)
  ctx.globalAlpha = fine
  ctx.fillStyle = ctx.createPattern(n.fine, 'repeat')
  ctx.fillRect(0, 0, TW, TH)
  ctx.restore()
}

// ---------- Cracks of light: jagged, thin, branching ----------
function crackPath(ctx, r, x, y, len, dir, segs, out) {
  ctx.moveTo(x, y)
  let a = dir
  const seg = len / segs
  for (let i = 0; i < segs; i++) {
    a += (r() - 0.5) * 1.15
    a = dir + Math.max(-0.9, Math.min(0.9, a - dir))
    const l = seg * (0.6 + r() * 0.8)
    x += Math.cos(a) * l
    y += Math.sin(a) * l
    ctx.lineTo(x, y)
    if (out) out.push([x, y, a])
  }
}

function crack(glow, r, x, y, len, dir, segs, w = 1) {
  const seed = Math.floor(r() * 1e9)
  const pts = []
  const draw = (lw, blur, alpha, collect) => {
    const rr = rng(seed)
    glow.beginPath()
    crackPath(glow, rr, x, y, len, dir, segs, collect ? pts : null)
    // branches
    const br = rng(seed + 9)
    const nb = 1 + Math.floor(br() * 3)
    for (let b = 0; b < nb; b++) {
      const p = pts[Math.floor(br() * pts.length)] || [x, y, dir]
      crackPath(glow, br, p[0], p[1], len * (0.2 + br() * 0.3), p[2] + (br() > 0.5 ? 1 : -1) * (0.5 + br() * 0.7), 4, null)
    }
    glow.lineWidth = lw
    glow.shadowBlur = blur
    glow.shadowColor = 'rgba(255,255,255,1)'
    glow.strokeStyle = `rgba(255,255,255,${alpha})`
    glow.lineJoin = 'miter'
    glow.lineCap = 'round'
    glow.stroke()
    glow.shadowBlur = 0
  }
  draw(w * 0.6, 0, 0, true) // collect points only
  draw(w * 2.2, 22, 0.16)
  draw(w * 0.9, 6, 0.6)
  draw(w * 0.45, 0, 1)
}

// ---------- Sky: pale planet with rings, halo and faint orbit lines ----------
function sky() {
  const [c, ctx] = canvas()
  const [g, gx] = canvas()
  const r = rng(11)
  for (let i = 0; i < 26; i++) {
    const x = r() * TW, y = r() * TH * 0.7, rad = 120 + r() * 380, a = 0.03 + r() * 0.05
    wrap(x, rad, (xx) => {
      const gr = ctx.createRadialGradient(xx, y, 0, xx, y, rad)
      gr.addColorStop(0, `rgba(200,195,230,${a})`)
      gr.addColorStop(1, 'rgba(200,195,230,0)')
      ctx.fillStyle = gr
      ctx.fillRect(xx - rad, y - rad, rad * 2, rad * 2)
    })
  }
  const cx = TW * 0.66, cy = TH * 0.26, R = 175
  ctx.strokeStyle = 'rgba(235,230,255,0.06)'
  ctx.lineWidth = 1
  for (let i = 0; i < 5; i++) { ctx.beginPath(); ctx.arc(cx, cy, R * (1.9 + i * 0.75), 0, Math.PI * 2); ctx.stroke() }
  const halo = ctx.createRadialGradient(cx, cy, R * 0.8, cx, cy, R * 3)
  halo.addColorStop(0, 'rgba(235,232,255,0.32)')
  halo.addColorStop(0.35, 'rgba(210,205,245,0.09)')
  halo.addColorStop(1, 'rgba(210,205,245,0)')
  ctx.fillStyle = halo
  ctx.fillRect(cx - R * 3, cy - R * 3, R * 6, R * 6)
  const ring = (front) => {
    ctx.save(); ctx.translate(cx, cy); ctx.rotate(-0.28)
    for (let k = 0; k < 26; k++) {
      const rk = 1.7 + k * 0.03
      ctx.beginPath()
      ctx.ellipse(0, 0, R * rk, R * rk * 0.2, 0, front ? 0 : Math.PI, front ? Math.PI : Math.PI * 2)
      ctx.strokeStyle = `rgba(240,236,255,${(0.04 + 0.16 * Math.abs(Math.sin(k * 1.9)) * (k < 20 ? 1 : 0.3)).toFixed(3)})`
      ctx.lineWidth = 1.1
      ctx.stroke()
    }
    ctx.restore()
  }
  ring(false)
  ctx.save()
  ctx.beginPath(); ctx.arc(cx, cy, R, 0, Math.PI * 2); ctx.clip()
  const body = ctx.createRadialGradient(cx - R * 0.4, cy - R * 0.45, R * 0.1, cx, cy, R * 1.05)
  body.addColorStop(0, '#ecebf2'); body.addColorStop(0.6, '#a19bb3'); body.addColorStop(1, '#3a3550')
  ctx.fillStyle = body
  ctx.fillRect(cx - R, cy - R, R * 2, R * 2)
  // maria and craters with rims
  for (let i = 0; i < 16; i++) {
    const a = r() * Math.PI * 2, d = Math.sqrt(r()) * R * 0.8, br = 30 + r() * 70
    const x = cx + Math.cos(a) * d, y = cy + Math.sin(a) * d
    const m = ctx.createRadialGradient(x, y, 0, x, y, br)
    m.addColorStop(0, `rgba(70,62,96,${0.1 + r() * 0.14})`); m.addColorStop(1, 'rgba(70,62,96,0)')
    ctx.fillStyle = m; ctx.fillRect(x - br, y - br, br * 2, br * 2)
  }
  for (let i = 0; i < 90; i++) {
    const a = r() * Math.PI * 2, d = Math.sqrt(r()) * R, cr = 1.5 + Math.pow(r(), 2.4) * 14
    const x = cx + Math.cos(a) * d, y = cy + Math.sin(a) * d
    ctx.fillStyle = `rgba(36,30,56,${0.06 + r() * 0.1})`
    ctx.beginPath(); ctx.arc(x + cr * 0.15, y + cr * 0.15, cr, 0, Math.PI * 2); ctx.fill()
    ctx.strokeStyle = 'rgba(255,255,255,0.08)'
    ctx.lineWidth = 0.8
    ctx.beginPath(); ctx.arc(x, y, cr, Math.PI * 1.05, Math.PI * 1.75); ctx.stroke()
  }
  const n = noise()
  ctx.globalAlpha = 0.35; ctx.drawImage(n.coarse, cx - R * 2, cy - R * 2, R * 6, R * 6)
  ctx.globalAlpha = 0.7; ctx.fillStyle = ctx.createPattern(n.fine, 'repeat'); ctx.fillRect(cx - R, cy - R, R * 2, R * 2)
  ctx.globalAlpha = 1
  const term = ctx.createLinearGradient(cx + R * 0.6, cy - R * 0.7, cx - R * 0.8, cy + R * 0.9)
  term.addColorStop(0, 'rgba(8,6,18,0)'); term.addColorStop(0.55, 'rgba(8,6,18,0.28)'); term.addColorStop(1, 'rgba(8,6,18,0.9)')
  ctx.fillStyle = term
  ctx.fillRect(cx - R, cy - R, R * 2, R * 2)
  ctx.restore()
  // atmosphere rim
  ctx.strokeStyle = 'rgba(230,228,255,0.35)'
  ctx.lineWidth = 2
  ctx.beginPath(); ctx.arc(cx, cy, R, Math.PI * 1.0, Math.PI * 1.85); ctx.stroke()
  for (let i = 0; i < 3; i++) crack(gx, r, cx - R * 0.5 + r() * R, cy - R * 0.6 + r() * R * 1.2, 60 + r() * 90, r() * Math.PI * 2, 9, 0.9)
  ring(true)
  for (let i = 0; i < 260; i++) {
    ctx.fillStyle = `rgba(255,255,255,${0.15 + r() * 0.55})`
    ctx.fillRect(r() * TW, r() * TH * 0.62, 1 + (r() > 0.93), 1 + (r() > 0.93))
  }
  return [c, g, canvas()[0]]
}

// Tacetite spire silhouette polygon (base at y0, pointing up).
function spire(ctx, r, x, y0, h, w, lean) {
  const steps = 6 + Math.floor(r() * 6)
  const L = [], Rr = []
  for (let i = 0; i <= steps; i++) {
    const t = i / steps
    const yy = y0 - h * t
    const half = (w / 2) * Math.pow(1 - t, 0.85)
    const jag = (r() - 0.5) * w * 0.3 * (1 - t)
    L.push([x + lean * h * t - half + jag, yy + (r() - 0.5) * 12])
    Rr.push([x + lean * h * t + half + jag * 0.5 + (r() - 0.5) * w * 0.12, yy + (r() - 0.5) * 12])
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

// Facets and strata inside a spire that has just been drawn (current path).
function facets(ctx, r, sp, x, y0, h, lean, strong = 1) {
  ctx.save()
  ctx.clip()
  // broad lit face on one side, shadow on the other
  const g = ctx.createLinearGradient(sp.L[0][0], 0, sp.Rr[0][0], 0)
  g.addColorStop(0, `rgba(190,192,225,${0.1 * strong})`); g.addColorStop(0.45, 'rgba(190,192,225,0)'); g.addColorStop(1, `rgba(0,0,0,${0.35 * strong})`)
  ctx.fillStyle = g
  ctx.fillRect(x - h, y0 - h - 60, h * 2, h + 80)
  // crystalline strata running toward the tip
  for (let i = 0; i < 9; i++) {
    const bx = sp.L[0][0] + (sp.Rr[0][0] - sp.L[0][0]) * r()
    ctx.beginPath()
    ctx.moveTo(bx, y0 + 4)
    ctx.lineTo(sp.tip[0] + (r() - 0.5) * 8, sp.tip[1] + h * (0.15 + r() * 0.5))
    ctx.strokeStyle = r() > 0.5 ? `rgba(210,212,240,${(0.04 + r() * 0.06) * strong})` : `rgba(0,0,0,${0.15 * strong})`
    ctx.lineWidth = 0.6 + r() * 2.2
    ctx.stroke()
  }
  ctx.restore()
}

// ---------- A Tacet Field: a crack in the ground full of light, rimmed with black crystal ----------
function tacetField(ctx, gx, rx, r, x, y0, h, w) {
  const cy = y0 - h * 0.46
  const lens = (c, sc) => {
    const top = cy - (cy - (y0 - h)) * sc
    const bot = cy + (y0 - cy) * sc
    c.beginPath()
    c.moveTo(x, top)
    c.bezierCurveTo(x + w * 1.25 * sc, top + h * 0.28 * sc, x + w * 1.1 * sc, bot - h * 0.08 * sc, x + w * 0.22 * sc, bot)
    c.lineTo(x - w * 0.22 * sc, bot)
    c.bezierCurveTo(x - w * 1.1 * sc, bot - h * 0.08 * sc, x - w * 1.25 * sc, top + h * 0.28 * sc, x, top)
    c.closePath()
  }
  // the mound it tears out of
  const mound = ctx.createRadialGradient(x, y0, 0, x, y0, w * 4)
  mound.addColorStop(0, 'rgba(6,5,10,1)'); mound.addColorStop(0.6, 'rgba(10,9,16,0.85)'); mound.addColorStop(1, 'rgba(10,9,16,0)')
  ctx.fillStyle = mound
  ctx.beginPath(); ctx.ellipse(x, y0, w * 4, h * 0.12, 0, Math.PI, 0); ctx.fill()

  // black crystal shards growing out of the rim: back row then front row
  const shard = (bx, by, ang, len, th, front) => {
    const ca = Math.cos(ang), sa = Math.sin(ang)
    const px = -sa, py = ca
    const kink = (r() - 0.5) * 0.35
    const mx = bx + Math.cos(ang + kink) * len * 0.55, my = by + Math.sin(ang + kink) * len * 0.55
    const tx = bx + ca * len, ty = by + sa * len
    ctx.beginPath()
    ctx.moveTo(bx + px * th, by + py * th)
    ctx.lineTo(mx + px * th * 0.55, my + py * th * 0.55)
    ctx.lineTo(tx, ty)
    ctx.lineTo(mx - px * th * 0.45, my - py * th * 0.45)
    ctx.lineTo(bx - px * th, by - py * th)
    ctx.closePath()
    const gr = ctx.createLinearGradient(bx, by, tx, ty)
    gr.addColorStop(0, front ? '#16131f' : '#0c0a12')
    gr.addColorStop(1, front ? '#07060b' : '#040307')
    ctx.fillStyle = gr
    ctx.fill()
    // lit upper edge
    ctx.beginPath()
    ctx.moveTo(bx + px * th, by + py * th)
    ctx.lineTo(mx + px * th * 0.55, my + py * th * 0.55)
    ctx.lineTo(tx, ty)
    ctx.strokeStyle = front ? 'rgba(205,210,240,0.22)' : 'rgba(205,210,240,0.1)'
    ctx.lineWidth = 0.9
    ctx.stroke()
    // warm bounce light from the rift on the inner half
    const gl = ctx.createLinearGradient(bx, by, mx, my)
    gl.addColorStop(0, 'rgba(255,190,90,0.28)'); gl.addColorStop(1, 'rgba(255,190,90,0)')
    ctx.fillStyle = gl
    ctx.fill()
  }
  for (const front of [false, true]) {
    const N = front ? 20 : 15
    for (let i = 0; i < N; i++) {
      const t = (i + r() * 0.6) / N
      const yy = y0 - h * 1.02 * t
      const half = w * 1.05 * Math.pow(Math.sin(Math.PI * Math.min(0.98, 0.08 + t * 0.95)), 0.7) + 3
      for (const side of [-1, 1]) {
        if (front && r() < 0.25) continue
        const up = (0.15 + r() * 0.75) * (front ? 1 : 0.8)
        const ang = side > 0 ? -up : Math.PI + up
        const len = (h * 0.36 * Math.pow(1 - t, 0.5) * (0.4 + r() * 0.8) + 12) * (front ? 0.75 : 1.1)
        shard(x + side * half * 0.7, yy, ang, len, 5 + r() * 9 * (1 - t * 0.55), front)
      }
    }
    if (!front) {
      // thick dark frame hugging the opening
      lens(ctx, 1.12); ctx.fillStyle = '#06050a'; ctx.fill()
    }
  }
  // the opening itself: dark amber base on the body, a stepped depth mask for the shader
  lens(ctx, 1); ctx.fillStyle = '#5c3108'; ctx.fill()
  rx.save()
  rx.globalCompositeOperation = 'lighter'
  const S = 28
  for (let i = 0; i < S; i++) {
    lens(rx, 1 - i / S)
    rx.fillStyle = `rgba(255,255,255,${(1 / S).toFixed(4)})`
    rx.fill()
  }
  rx.restore()
  // halo of light it throws on its surroundings
  gx.save()
  gx.shadowColor = 'rgba(255,255,255,1)'
  gx.shadowBlur = 60
  lens(gx, 0.9); gx.fillStyle = 'rgba(255,255,255,0.22)'; gx.fill()
  gx.shadowBlur = 140
  gx.fillStyle = 'rgba(255,255,255,0.1)'; gx.fill()
  gx.restore()
  const pool = gx.createRadialGradient(x, y0, 0, x, y0, w * 5)
  pool.addColorStop(0, 'rgba(255,255,255,0.35)'); pool.addColorStop(1, 'rgba(255,255,255,0)')
  gx.fillStyle = pool
  gx.beginPath(); gx.ellipse(x, y0, w * 5, h * 0.1, 0, 0, Math.PI * 2); gx.fill()
}

// A dead, twisted tree.
function deadTree(ctx, r, x, y, len, ang, wid, depth) {
  if (depth === 0 || len < 4) return
  const bend = (r() - 0.5) * 0.8
  const x2 = x + Math.cos(ang) * len, y2 = y + Math.sin(ang) * len
  ctx.lineWidth = wid
  ctx.lineCap = 'round'
  ctx.beginPath()
  ctx.moveTo(x, y)
  ctx.quadraticCurveTo(x + Math.cos(ang + bend) * len * 0.5, y + Math.sin(ang + bend) * len * 0.5, x2, y2)
  ctx.stroke()
  const k = 2 + (r() > 0.55 ? 1 : 0)
  for (let i = 0; i < k; i++) deadTree(ctx, r, x2, y2, len * (0.5 + r() * 0.3), ang + (r() - 0.5) * 1.5, wid * 0.6, depth - 1)
}

// Pale weathered boulders.
function boulder(ctx, r, x, y, s) {
  const k = 9
  const pts = []
  for (let i = 0; i < k; i++) {
    const a = Math.PI + (i / (k - 1)) * Math.PI
    pts.push([x + Math.cos(a) * s * (0.8 + r() * 0.4), y + Math.sin(a) * s * (0.5 + r() * 0.4)])
  }
  ctx.save()
  ctx.beginPath(); pts.forEach(([a, b], i) => (i ? ctx.lineTo(a, b) : ctx.moveTo(a, b))); ctx.closePath()
  const g = ctx.createLinearGradient(x - s, y - s, x + s * 0.6, y)
  g.addColorStop(0, '#d4d6e0'); g.addColorStop(0.5, '#8e91a1'); g.addColorStop(1, '#3a3c48')
  ctx.fillStyle = g
  ctx.fill()
  ctx.clip()
  ctx.strokeStyle = 'rgba(25,25,35,0.45)'
  for (let i = 0; i < 3; i++) {
    ctx.lineWidth = 0.8
    ctx.beginPath(); ctx.moveTo(x - s + r() * s * 2, y - s); ctx.lineTo(x - s + r() * s * 2, y); ctx.stroke()
  }
  ctx.restore()
  ctx.fillStyle = 'rgba(0,0,0,0.5)'
  ctx.beginPath(); ctx.ellipse(x + s * 0.2, y + 1, s * 1.1, 3, 0, 0, Math.PI * 2); ctx.fill()
}

// ---------- Far ridge: rows of hazy spires and distant Tacet Fields ----------
function far() {
  const [c, ctx] = canvas()
  const [g, gx] = canvas()
  const [f, fx] = canvas()
  const r = rng(23)
  const base = TH * 0.8
  for (let i = 0; i < 95; i++) {
    const x = r() * TW, h = 40 + Math.pow(r(), 2.2) * 340, w = 14 + r() * 50, lean = (r() - 0.5) * 0.35
    const seed = i * 77 + 5
    wrap(x, w + h * 0.3, (xx) => {
      const rr = rng(seed)
      const gr = ctx.createLinearGradient(0, base - h, 0, base)
      gr.addColorStop(0, '#2c2839'); gr.addColorStop(1, '#0e0c15')
      ctx.fillStyle = gr
      const sp = spire(ctx, rr, xx, base, h, w, lean)
      ctx.fill()
      facets(ctx, rr, sp, xx, base, h, lean, 0.6)
    })
    if (r() > 0.84) { const s2 = Math.floor(r() * 1e9); wrap(x, 80, (xx) => crack(gx, rng(s2), xx, base - 4, h * 0.6, -Math.PI / 2, 8, 0.8)) }
  }
  ctx.fillStyle = '#0e0c15'
  ctx.fillRect(0, base, TW, TH - base)
  texture(ctx, 0.5, 0.8)
  for (const fx0 of [0.18, 0.63]) {
    const seed = Math.floor(fx0 * 1e6)
    wrap(fx0 * TW, 160, (xx) => tacetField(ctx, gx, fx, rng(seed), xx, base + 2, 120 + fx0 * 60, 15 + fx0 * 8))
  }
  const fog = ctx.createLinearGradient(0, base - 160, 0, TH)
  fog.addColorStop(0, 'rgba(150,145,170,0)'); fog.addColorStop(0.45, 'rgba(150,145,170,0.16)'); fog.addColorStop(1, 'rgba(70,66,90,0.4)')
  ctx.globalCompositeOperation = 'source-atop'
  ctx.fillStyle = fog
  ctx.fillRect(0, 0, TW, TH)
  ctx.globalCompositeOperation = 'source-over'
  return [c, g, f]
}

// ---------- Mid: floating Tacetite shards with cracks of light ----------
function shard(ctx, gx, r, x, y, s) {
  const k = 8 + Math.floor(r() * 4)
  const pts = []
  for (let i = 0; i < k; i++) {
    const a = (i / k) * Math.PI * 2 + (r() - 0.5) * 0.5
    let rad = s * (0.6 + r() * 0.5)
    let yy = Math.sin(a) * rad
    if (yy > 0) yy *= 1.5 + r() * 0.8
    pts.push([x + Math.cos(a) * rad, y + yy * 0.8])
  }
  ctx.save()
  ctx.beginPath(); pts.forEach(([a, b], i) => (i ? ctx.lineTo(a, b) : ctx.moveTo(a, b))); ctx.closePath()
  const gr = ctx.createLinearGradient(x, y - s, x, y + s * 1.4)
  gr.addColorStop(0, '#34303f'); gr.addColorStop(0.35, '#0e0c15'); gr.addColorStop(1, '#050409')
  ctx.fillStyle = gr
  ctx.fill()
  ctx.strokeStyle = 'rgba(210,205,240,0.18)'; ctx.lineWidth = 1; ctx.stroke()
  ctx.clip()
  // facets: fan of planes from an inner point
  const fxp = x + (r() - 0.5) * s * 0.4, fyp = y - s * 0.1
  for (let i = 0; i < k; i++) {
    const [a1, b1] = pts[i], [a2, b2] = pts[(i + 1) % k]
    ctx.beginPath(); ctx.moveTo(fxp, fyp); ctx.lineTo(a1, b1); ctx.lineTo(a2, b2); ctx.closePath()
    ctx.fillStyle = `rgba(${r() > 0.5 ? '220,218,245' : '0,0,0'},${(0.03 + r() * 0.08).toFixed(3)})`
    ctx.fill()
  }
  ctx.restore()
  const n = 1 + Math.floor(r() * 2)
  for (let i = 0; i < n; i++) crack(gx, r, x + (r() - 0.5) * s * 0.6, y + (r() - 0.3) * s * 0.5, s * (0.6 + r() * 0.8), r() * Math.PI * 2, 8, 0.9)
  for (let i = 0; i < 7; i++) {
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
  spots.forEach((fxp) => {
    const x = fxp * TW + (r() - 0.5) * 80, y = TH * (0.16 + r() * 0.36), s = 28 + Math.pow(r(), 1.5) * 110
    const seed = Math.floor(r() * 1e9)
    wrap(x, s * 3, (xx) => shard(ctx, gx, rng(seed), xx, y, s))
  })
  texture(ctx, 0.4, 0.9)
  return [c, g, canvas()[0]]
}

// ---------- Near: tall black spires, a Tacet Field, dead trees, boulders ----------
function near() {
  const [c, ctx] = canvas()
  const [g, gx] = canvas()
  const [f, fx] = canvas()
  const r = rng(51)
  const base = TH * 0.93
  const xs = []
  for (let i = 0; i < 16; i++) xs.push((i / 16) * TW + (r() - 0.5) * 90)
  xs.forEach((x) => {
    const big = r() > 0.55
    const h = big ? 330 + r() * 330 : 120 + r() * 200
    const w = big ? 80 + r() * 90 : 40 + r() * 60
    const lean = (r() - 0.5) * 0.3
    const seed = Math.floor(r() * 1e9)
    const lit = r() > 0.6
    wrap(x, w + h * 0.2, (xx) => {
      const rr = rng(seed)
      const gr = ctx.createLinearGradient(xx - w, 0, xx + w, 0)
      gr.addColorStop(0, '#100e18'); gr.addColorStop(0.5, '#06050a'); gr.addColorStop(1, '#020203')
      ctx.fillStyle = gr
      const sp = spire(ctx, rr, xx, base, h, w, lean)
      ctx.fill()
      facets(ctx, rr, sp, xx, base, h, lean, 1)
      ctx.strokeStyle = 'rgba(215,212,245,0.16)'
      ctx.lineWidth = 1.2
      ctx.beginPath(); sp.L.forEach(([a, b], j) => (j ? ctx.lineTo(a, b) : ctx.moveTo(a, b))); ctx.lineTo(sp.tip[0], sp.tip[1]); ctx.stroke()
      if (big && lit) crack(gx, rng(seed + 1), xx + (rr() - 0.5) * w * 0.3, base - 6, h * (0.4 + rr() * 0.35), -Math.PI / 2 + lean, 12, 1.1)
    })
  })
  // ground
  const gg = ctx.createLinearGradient(0, base - 20, 0, TH)
  gg.addColorStop(0, '#0a0910'); gg.addColorStop(1, '#010102')
  ctx.fillStyle = gg
  ctx.fillRect(0, base - 2, TW, TH - base + 2)
  texture(ctx, 0.5, 1)
  // dead trees
  ctx.strokeStyle = '#07060b'
  for (const fx0 of [0.09, 0.34, 0.52, 0.86]) {
    const seed = Math.floor(fx0 * 1e6) + 7
    wrap(fx0 * TW, 260, (xx) => deadTree(ctx, rng(seed), xx, base, 70 + fx0 * 40, -Math.PI / 2 + (fx0 - 0.5) * 0.5, 9, 7))
  }
  // the near Tacet Field
  wrap(TW * 0.72, 260, (xx) => tacetField(ctx, gx, fx, rng(99), xx, base + 4, 250, 30))
  // boulders
  for (let i = 0; i < 20; i++) {
    const x = r() * TW, sz = 10 + r() * 34, seed = Math.floor(r() * 1e9), by = base + 4 + r() * 5
    wrap(x, sz * 2, (xx) => boulder(ctx, rng(seed), xx, by, sz))
  }
  // a few thin faults of light in the ground
  for (let i = 0; i < 5; i++) {
    const x = r() * TW, len = 80 + r() * 200
    const seed = Math.floor(r() * 1e9)
    const y = base + 10 + r() * 36, dir = (r() > 0.5 ? 0 : Math.PI) + (r() - 0.5) * 0.3
    wrap(x, len, (xx) => crack(gx, rng(seed), xx, y, len, dir, 10, 1))
  }
  return [c, g, f]
}

export function buildScenery() {
  return { sky: sky(), far: far(), mid: mid(), near: near() }
}
